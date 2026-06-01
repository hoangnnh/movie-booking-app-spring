package com.cinemabooking.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.AdminBookingListItemResponse;
import com.cinemabooking.dto.AdminMovieResponse;
import com.cinemabooking.dto.AdminMovieUpdateRequest;
import com.cinemabooking.dto.AdminSummaryResponse;
import com.cinemabooking.dto.AdminUserResponse;
import com.cinemabooking.dto.AdminUserRoleRequest;
import com.cinemabooking.dto.PageResponse;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Booking;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.enums.BookingStatus;
import com.cinemabooking.enums.MovieDisplayStatus;
import com.cinemabooking.enums.Role;
import com.cinemabooking.repository.AppUserRepository;
import com.cinemabooking.repository.BookingRepository;
import com.cinemabooking.repository.FavoriteRepository;
import com.cinemabooking.repository.MovieListEntryRepository;
import com.cinemabooking.repository.MovieRepository;
import com.cinemabooking.repository.ShowtimeRepository;
import com.cinemabooking.repository.TicketRepository;
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
    private final FavoriteRepository favoriteRepository;
    private final MovieListEntryRepository movieListEntryRepository;
    private final BookingService bookingService;
    private final TmdbService tmdbService;

    @GetMapping("/summary")
    public AdminSummaryResponse getSummary() {
        bookingService.expirePassedShowtimeBookings();

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
        if (hasText(request.displayStatus())) {
            movie.setDisplayStatus(parseMovieDisplayStatus(request.displayStatus()));
        }

        return tmdbService.toAdminMovieResponse(movieRepository.save(movie));
    }

    @DeleteMapping("/movies/{movieId}")
    @Transactional
    public void deleteMovie(@PathVariable UUID movieId) {
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

    @GetMapping("/bookings")
    public PageResponse<AdminBookingListItemResponse> getBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        bookingService.expirePassedShowtimeBookings();

        return PageResponse.from(
                bookingRepository.findAllByOrderByCreatedAtDesc(pageRequest(page, size)),
                this::toBookingListItemResponse
        );
    }

    @GetMapping("/bookings/recent")
    public List<AdminBookingListItemResponse> getRecentBookings() {
        bookingService.expirePassedShowtimeBookings();

        return bookingRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toBookingListItemResponse)
                .toList();
    }

    @DeleteMapping("/bookings/{bookingId}")
    public void deleteBooking(@PathVariable UUID bookingId) {
        bookingService.deleteBookingAsAdmin(bookingId);
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
