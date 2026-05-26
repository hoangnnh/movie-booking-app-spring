package com.cinemabooking.controller;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

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

import com.cinemabooking.dto.AdminBookingResponse;
import com.cinemabooking.dto.AdminBookingStatusRequest;
import com.cinemabooking.dto.AdminMovieUpdateRequest;
import com.cinemabooking.dto.AdminSummaryResponse;
import com.cinemabooking.dto.AdminUserResponse;
import com.cinemabooking.dto.AdminUserRoleRequest;
import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.dto.TicketResponse;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Booking;
import com.cinemabooking.entity.Genre;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.Ticket;
import com.cinemabooking.enums.BookingStatus;
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
        BigDecimal revenue = bookingRepository.findAll()
                .stream()
                .filter((booking) -> booking.getStatus() == BookingStatus.CONFIRMED)
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AdminSummaryResponse(
                movieRepository.count(),
                appUserRepository.count(),
                bookingRepository.count(),
                revenue
        );
    }

    @GetMapping("/movies")
    public List<MovieResponse> getMovies(@RequestParam(required = false) String query) {
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase();

        return movieRepository.findAll()
                .stream()
                .filter((movie) ->
                        normalizedQuery.isBlank()
                                || movie.getTitle().toLowerCase().contains(normalizedQuery)
                                || (movie.getDescription() != null
                                && movie.getDescription().toLowerCase().contains(normalizedQuery))
                )
                .sorted(Comparator.comparing(Movie::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(tmdbService::toStoredMovieResponse)
                .toList();
    }

    @PatchMapping("/movies/{movieId}")
    @Transactional
    public MovieResponse updateMovie(
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

        return tmdbService.toStoredMovieResponse(movieRepository.save(movie));
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
    public List<AdminUserResponse> getUsers() {
        return appUserRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(AppUser::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
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
    public List<AdminBookingResponse> getBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toBookingResponse)
                .toList();
    }

    @PatchMapping("/bookings/{bookingId}/status")
    public AdminBookingResponse updateBookingStatus(
            @PathVariable UUID bookingId,
            @RequestBody AdminBookingStatusRequest request
    ) {
        BookingStatus nextStatus = parseBookingStatus(request.status());

        if (nextStatus == BookingStatus.CANCELLED) {
            return toBookingResponse(bookingService.cancelBookingAsAdmin(bookingId));
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cancelled bookings cannot be changed to another status"
            );
        }

        booking.setStatus(nextStatus);
        return toBookingResponse(bookingRepository.save(booking));
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

    private AdminBookingResponse toBookingResponse(Booking booking) {
        List<TicketResponse> tickets = ticketRepository.findByBooking_Id(booking.getId())
                .stream()
                .map(this::toTicketResponse)
                .toList();

        return new AdminBookingResponse(
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
                tickets
        );
    }

    private TicketResponse toTicketResponse(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getSeat().getId(),
                ticket.getSeat().getLabel(),
                ticket.getPrice(),
                ticket.getCode()
        );
    }

    private Role parseRole(String value) {
        try {
            return Role.valueOf(value.trim().toUpperCase());
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be USER or ADMIN");
        }
    }

    private BookingStatus parseBookingStatus(String value) {
        try {
            return BookingStatus.valueOf(value.trim().toUpperCase());
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be PENDING, CONFIRMED, CANCELLED, or EXPIRED"
            );
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
