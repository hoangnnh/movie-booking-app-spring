package com.cinemabooking.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.AdminBulkDeleteRequest;
import com.cinemabooking.dto.AdminBookingListItemResponse;
import com.cinemabooking.dto.AdminMovieResponse;
import com.cinemabooking.dto.AdminMovieOptionResponse;
import com.cinemabooking.dto.AdminMovieUpdateRequest;
import com.cinemabooking.dto.AdminRoomOptionResponse;
import com.cinemabooking.dto.AdminShowtimeBulkConflictResponse;
import com.cinemabooking.dto.AdminShowtimeBulkRequest;
import com.cinemabooking.dto.AdminShowtimeBulkResponse;
import com.cinemabooking.dto.AdminShowtimeCleanupRequest;
import com.cinemabooking.dto.AdminShowtimeRequest;
import com.cinemabooking.dto.AdminShowtimeResponse;
import com.cinemabooking.dto.AdminSummaryResponse;
import com.cinemabooking.dto.AdminUserResponse;
import com.cinemabooking.dto.AdminUserRoleRequest;
import com.cinemabooking.dto.PageResponse;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Booking;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.Room;
import com.cinemabooking.entity.Showtime;
import com.cinemabooking.enums.AuthProvider;
import com.cinemabooking.enums.BookingStatus;
import com.cinemabooking.enums.MovieDisplayStatus;
import com.cinemabooking.enums.Role;
import com.cinemabooking.repository.AppUserRepository;
import com.cinemabooking.repository.BookingRepository;
import com.cinemabooking.repository.FavoriteRepository;
import com.cinemabooking.repository.MovieListEntryRepository;
import com.cinemabooking.repository.MovieRepository;
import com.cinemabooking.repository.RoomRepository;
import com.cinemabooking.repository.ShowtimeRepository;
import com.cinemabooking.repository.TicketRepository;
import com.cinemabooking.security.AuthenticatedUser;
import com.cinemabooking.service.BookingService;
import com.cinemabooking.service.TmdbService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final MovieRepository movieRepository;
    private final AppUserRepository appUserRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final ShowtimeRepository showtimeRepository;
    private final RoomRepository roomRepository;
    private final FavoriteRepository favoriteRepository;
    private final MovieListEntryRepository movieListEntryRepository;
    private final BookingService bookingService;
    private final TmdbService tmdbService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/summary")
    public AdminSummaryResponse getSummary() {
        bookingService.expireStaleBookings();

        return new AdminSummaryResponse(
                movieRepository.count(),
                appUserRepository.count(),
                bookingRepository.count(),
                bookingRepository.sumTotalAmountByStatus(BookingStatus.CONFIRMED),
                movieRepository.countByDisplayStatus(MovieDisplayStatus.SHOWING_NOW),
                movieRepository.countByDisplayStatus(MovieDisplayStatus.COMING_SOON),
                movieRepository.countByDisplayStatus(MovieDisplayStatus.HIDDEN)
        );
    }

    @GetMapping("/movies")
    public PageResponse<AdminMovieResponse> getMovies(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return PageResponse.from(
                movieRepository.findAdminMovies(normalizeQuery(query), pageRequest(page, size)),
                tmdbService::toAdminMovieResponse
        );
    }

    @PatchMapping("/movies/{movieId}")
    @Transactional
    public AdminMovieResponse updateMovie(
            @PathVariable UUID movieId,
            @RequestBody AdminMovieUpdateRequest request
    ) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        if (hasText(request.title())) {
            movie.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            movie.setDescription(request.description().trim());
        }
        if (request.durationMinutes() != null && request.durationMinutes() > 0) {
            movie.setDurationMinutes(request.durationMinutes());
        }
        if (request.posterUrl() != null) {
            movie.setPosterUrl(request.posterUrl().trim());
        }
        if (request.backdropUrl() != null) {
            movie.setBackdropUrl(request.backdropUrl().trim());
        }
        if (request.releaseDate() != null) {
            movie.setReleaseDate(request.releaseDate());
        }
        if (request.rating() != null) {
            movie.setRating(Math.max(0, Math.min(10, request.rating())));
        }
        if (hasText(request.ageRating())) {
            movie.setAgeRating(tmdbService.normalizeVietnameseAgeRating(request.ageRating()));
        }
        if (hasText(request.displayStatus())) {
            movie.setDisplayStatus(parseMovieDisplayStatus(request.displayStatus()));
        }

        return tmdbService.toAdminMovieResponse(movieRepository.save(movie));
    }

    @DeleteMapping("/movies/{movieId}")
    @Transactional
    public void deleteMovie(@PathVariable UUID movieId) {
        deleteMovieById(movieId);
    }

    @DeleteMapping("/movies/bulk")
    @Transactional
    public void deleteMovies(
            Authentication authentication,
            @RequestBody AdminBulkDeleteRequest request
    ) {
        verifyAdminPassword(authentication, request.password());
        requireIds(request.ids());
        request.ids().forEach(this::deleteMovieById);
    }

    @GetMapping("/users")
    public PageResponse<AdminUserResponse> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return PageResponse.from(appUserRepository.findAll(pageRequest(page, size)), this::toUserResponse);
    }

    @GetMapping("/users/recent")
    public List<AdminUserResponse> getRecentUsers() {
        return appUserRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toUserResponse)
                .toList();
    }

    @PatchMapping("/users/{userId}/role")
    public AdminUserResponse updateUserRole(
            @PathVariable UUID userId,
            @RequestBody AdminUserRoleRequest request
    ) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setRole(parseRole(request.role()));
        return toUserResponse(appUserRepository.save(user));
    }

    @DeleteMapping("/users/{userId}")
    @Transactional
    public void deleteUser(@PathVariable UUID userId) {
        deleteUserById(userId, null);
    }

    @DeleteMapping("/users/bulk")
    @Transactional
    public void deleteUsers(
            Authentication authentication,
            @RequestBody AdminBulkDeleteRequest request
    ) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        verifyAdminPassword(authentication, request.password());
        requireIds(request.ids());
        request.ids().forEach(userId -> deleteUserById(userId, authenticatedUser.userId()));
    }

    @GetMapping("/movie-options")
    public List<AdminMovieOptionResponse> getMovieOptions() {
        return movieRepository.findAllByOrderByCreatedAtDescTitleAsc()
                .stream()
                .filter(movie -> movie.getDisplayStatus() == MovieDisplayStatus.SHOWING_NOW)
                .map(movie -> new AdminMovieOptionResponse(
                        movie.getId(),
                        movie.getTitle(),
                        movie.getDurationMinutes(),
                        movie.getDisplayStatus().name()
                ))
                .toList();
    }

    @GetMapping("/rooms")
    public List<AdminRoomOptionResponse> getRooms() {
        return roomRepository.findAll(Sort.by("cinema.name").ascending().and(Sort.by("name").ascending()))
                .stream()
                .map(this::toRoomOptionResponse)
                .toList();
    }

    @GetMapping("/showtimes")
    public PageResponse<AdminShowtimeResponse> getShowtimes(
            @RequestParam(required = false) UUID movieId,
            @RequestParam(required = false) UUID cinemaId,
            @RequestParam(required = false) UUID roomId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "false") boolean includeExpired,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LocalDateTime fromTime = fromDate == null ? LocalDateTime.of(1970, 1, 1, 0, 0) : fromDate.atStartOfDay();
        LocalDateTime toTime = toDate == null ? LocalDateTime.of(3000, 12, 31, 23, 59, 59) : toDate.atTime(LocalTime.MAX);

        return PageResponse.from(
                showtimeRepository.findAdminShowtimes(
                        movieId,
                        movieId == null,
                        cinemaId,
                        cinemaId == null,
                        roomId,
                        roomId == null,
                        fromTime,
                        fromDate == null,
                        toTime,
                        toDate == null,
                        includeExpired,
                        PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)))
                ),
                this::toAdminShowtimeResponse
        );
    }

    @PostMapping("/showtimes")
    @Transactional
    public AdminShowtimeResponse createShowtime(@RequestBody AdminShowtimeRequest request) {
        Showtime showtime = new Showtime();
        applyShowtimeRequest(showtime, request);
        return toAdminShowtimeResponse(showtimeRepository.save(showtime));
    }

    @PatchMapping("/showtimes/{showtimeId}")
    @Transactional
    public AdminShowtimeResponse updateShowtime(
            @PathVariable UUID showtimeId,
            @RequestBody AdminShowtimeRequest request
    ) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime not found"));

        applyShowtimeRequest(showtime, request);
        return toAdminShowtimeResponse(showtimeRepository.save(showtime));
    }

    @DeleteMapping("/showtimes/{showtimeId}")
    @Transactional
    public void deleteShowtime(@PathVariable UUID showtimeId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime not found"));

        if (ticketRepository.countByShowtime_Id(showtimeId) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Showtime has booked tickets and cannot be deleted"
            );
        }

        showtimeRepository.delete(showtime);
    }

    @PostMapping("/showtimes/bulk")
    @Transactional
    public AdminShowtimeBulkResponse createShowtimesBulk(@RequestBody AdminShowtimeBulkRequest request) {
        return buildShowtimes(request);
    }

    @DeleteMapping("/showtimes/expired-unbooked")
    @Transactional
    public AdminShowtimeBulkResponse deleteExpiredUnbookedShowtimes(
            Authentication authentication,
            @RequestBody AdminShowtimeCleanupRequest request
    ) {
        verifyAdminPassword(authentication, request.password());
        LocalDateTime before = request.before() == null ? LocalDateTime.now() : request.before();
        int deletedCount = showtimeRepository.deleteExpiredUnbookedShowtimes(before);

        return new AdminShowtimeBulkResponse(deletedCount, deletedCount, 0, List.of());
    }

    @GetMapping("/bookings")
    public PageResponse<AdminBookingListItemResponse> getBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        bookingService.expireStaleBookings();

        return PageResponse.from(
                bookingRepository.findAllByOrderByCreatedAtDesc(pageRequest(page, size)),
                this::toBookingListItemResponse
        );
    }

    @GetMapping("/bookings/recent")
    public List<AdminBookingListItemResponse> getRecentBookings() {
        bookingService.expireStaleBookings();

        return bookingRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toBookingListItemResponse)
                .toList();
    }

    @DeleteMapping("/bookings/{bookingId}")
    public void deleteBooking(@PathVariable UUID bookingId) {
        bookingService.deleteBookingAsAdmin(bookingId);
    }

    @DeleteMapping("/bookings/bulk")
    @Transactional
    public void deleteBookings(
            Authentication authentication,
            @RequestBody AdminBulkDeleteRequest request
    ) {
        verifyAdminPassword(authentication, request.password());
        requireIds(request.ids());
        request.ids().forEach(bookingService::deleteBookingAsAdmin);
    }

    private AdminUserResponse toUserResponse(AppUser user) {
        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getProvider().name(),
                user.isEmailVerified(),
                user.getCreatedAt()
        );
    }

    private MovieDisplayStatus parseMovieDisplayStatus(String value) {
        try {
            return MovieDisplayStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Movie display status must be SHOWING_NOW, COMING_SOON, or HIDDEN"
            );
        }
    }

    private AdminBookingListItemResponse toBookingListItemResponse(Booking booking) {
        return new AdminBookingListItemResponse(
                booking.getId(),
                booking.getStatus().name(),
                booking.getTotalAmount(),
                booking.getTicketAmount(),
                booking.getFoodAmount(),
                booking.getPaymentMethod(),
                booking.getPaymentStatus(),
                booking.getPaymentReference(),
                booking.getUser().getId(),
                booking.getUser().getFullName(),
                booking.getUser().getEmail(),
                booking.getShowtime().getId(),
                booking.getShowtime().getMovie().getTitle(),
                booking.getShowtime().getRoom().getCinema().getName(),
                booking.getShowtime().getRoom().getName(),
                booking.getShowtime().getStartTime(),
                booking.getCreatedAt(),
                bookingService.getFoodItemsByBooking(booking.getId())
        );
    }

    private AdminShowtimeResponse toAdminShowtimeResponse(Showtime showtime) {
        return new AdminShowtimeResponse(
                showtime.getId(),
                showtime.getMovie().getId(),
                showtime.getMovie().getTitle(),
                showtime.getRoom().getId(),
                showtime.getRoom().getName(),
                showtime.getRoom().getCinema().getId(),
                showtime.getRoom().getCinema().getName(),
                showtime.getStartTime(),
                showtime.getEndTime(),
                showtime.getPrice(),
                ticketRepository.countByShowtime_Id(showtime.getId())
        );
    }

    private AdminRoomOptionResponse toRoomOptionResponse(Room room) {
        return new AdminRoomOptionResponse(
                room.getId(),
                room.getName(),
                room.getCinema().getId(),
                room.getCinema().getName()
        );
    }

    private void applyShowtimeRequest(Showtime showtime, AdminShowtimeRequest request) {
        Movie movie = movieRepository.findById(requireId(request.movieId(), "Movie"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
        Room room = roomRepository.findById(requireId(request.roomId(), "Room"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        LocalDateTime startTime = request.startTime();
        LocalDateTime endTime = request.endTime();
        BigDecimal price = request.price();

        if (startTime == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time is required");
        }
        if (endTime == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time is required");
        }
        if (!endTime.isAfter(startTime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be greater than 0");
        }

        UUID showtimeId = showtime.getId() == null
                ? new UUID(0L, 0L)
                : showtime.getId();

        if (showtimeRepository.countOverlappingRoomShowtimes(room.getId(), showtimeId, startTime, endTime) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Room already has a showtime in this time range"
            );
        }

        showtime.setMovie(movie);
        showtime.setRoom(room);
        showtime.setStartTime(startTime);
        showtime.setEndTime(endTime);
        showtime.setPrice(price);
    }

    private AdminShowtimeBulkResponse buildShowtimes(AdminShowtimeBulkRequest request) {
        Movie movie = movieRepository.findById(requireId(request.movieId(), "Movie"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
        List<UUID> roomIds = request.roomIds() == null ? List.of() : request.roomIds();
        List<LocalTime> startTimes = request.startTimes() == null ? List.of() : request.startTimes();
        LocalDate startDate = request.startDate();
        LocalDate endDate = request.endDate();
        BigDecimal price = request.price();

        if (roomIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one room");
        }
        if (startTimes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one start time");
        }
        if (startDate == null || endDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start date and end date are required");
        }
        if (endDate.isBefore(startDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date must be on or after start date");
        }
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be greater than 0");
        }

        List<Room> rooms = roomRepository.findAllById(roomIds);

        if (rooms.size() != new HashSet<>(roomIds).size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "One or more rooms were not found");
        }

        int durationMinutes = Math.max(1, movie.getDurationMinutes() == null ? 120 : movie.getDurationMinutes());
        int candidateCount = 0;
        int createdCount = 0;
        List<AdminShowtimeBulkConflictResponse> conflicts = new ArrayList<>();
        Set<String> batchSlots = new HashSet<>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            for (Room room : rooms) {
                for (LocalTime startTimeValue : startTimes) {
                    LocalDateTime startTime = LocalDateTime.of(date, startTimeValue);
                    LocalDateTime endTime = startTime.plusMinutes(durationMinutes);
                    candidateCount++;

                    String batchKey = room.getId() + "|" + startTime + "|" + endTime;

                    if (!batchSlots.add(batchKey)
                            || showtimeRepository.countOverlappingRoomShowtimes(
                                    room.getId(),
                                    new UUID(0L, 0L),
                                    startTime,
                                    endTime
                            ) > 0) {
                        conflicts.add(new AdminShowtimeBulkConflictResponse(
                                room.getId(),
                                room.getName(),
                                room.getCinema().getName(),
                                startTime,
                                endTime,
                                "Room already has a showtime in this range"
                        ));
                        continue;
                    }

                    if (!request.previewOnly()) {
                        Showtime showtime = new Showtime();
                        showtime.setMovie(movie);
                        showtime.setRoom(room);
                        showtime.setStartTime(startTime);
                        showtime.setEndTime(endTime);
                        showtime.setPrice(price);
                        showtimeRepository.save(showtime);
                        createdCount++;
                    }
                }
            }
        }

        return new AdminShowtimeBulkResponse(candidateCount, createdCount, conflicts.size(), conflicts);
    }

    private UUID requireId(UUID id, String label) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }

        return id;
    }

    private void deleteMovieById(UUID movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        if (ticketRepository.countByShowtime_Movie_Id(movieId) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Movie has booked tickets and cannot be deleted"
            );
        }

        movieListEntryRepository.deleteByMovie_Id(movieId);
        favoriteRepository.deleteByMovie_Id(movieId);
        showtimeRepository.deleteByMovie_Id(movieId);
        movie.getGenres().clear();
        movieRepository.delete(movie);
    }

    private void deleteUserById(UUID userId, UUID currentAdminId) {
        if (currentAdminId != null && currentAdminId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own admin account");
        }

        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (bookingRepository.countByUser_Id(userId) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "User has bookings and cannot be deleted"
            );
        }

        favoriteRepository.deleteByUser_Id(userId);
        appUserRepository.delete(user);
    }

    private void verifyAdminPassword(Authentication authentication, String password) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin sign in required");
        }

        AppUser admin = appUserRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin user not found"));

        if (admin.getProvider() != AuthProvider.LOCAL) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password confirmation is unavailable for this admin account"
            );
        }

        if (password == null || password.isBlank() || !passwordEncoder.matches(password, admin.getPassword())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin password is incorrect");
        }
    }

    private void requireIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one item");
        }
    }

    private Role parseRole(String value) {
        try {
            return Role.valueOf(value.trim().toUpperCase());
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be USER or ADMIN");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String normalizeQuery(String value) {
        return value == null ? "" : value.trim();
    }

    private PageRequest pageRequest(int page, int size) {
        return PageRequest.of(
                Math.max(0, page),
                Math.max(1, Math.min(size, 100)),
                Sort.by(Sort.Order.desc("createdAt"))
        );
    }
}
