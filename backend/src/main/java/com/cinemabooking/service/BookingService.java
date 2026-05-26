package com.cinemabooking.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.BookingResponse;
import com.cinemabooking.dto.CreateBookingRequest;
import com.cinemabooking.dto.SeatStatusResponse;
import com.cinemabooking.dto.TicketResponse;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Booking;
import com.cinemabooking.entity.Seat;
import com.cinemabooking.entity.Showtime;
import com.cinemabooking.entity.Ticket;
import com.cinemabooking.enums.BookingStatus;
import com.cinemabooking.repository.AppUserRepository;
import com.cinemabooking.repository.BookingRepository;
import com.cinemabooking.repository.SeatRepository;
import com.cinemabooking.repository.ShowtimeRepository;
import com.cinemabooking.repository.TicketRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final Set<BookingStatus> ACTIVE_BOOKING_STATUSES = Set.of(
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED
    );

    private final AppUserRepository appUserRepository;
    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;

    private static final Set<String> SUPPORTED_PAYMENT_METHODS = Set.of(
            "VNPAY_QR",
            "MOMO_WALLET",
            "DEMO_CARD"
    );

    @Transactional(readOnly = true)
    public List<SeatStatusResponse> getSeatStatuses(UUID showtimeId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime not found"));

        List<Ticket> bookedTickets = ticketRepository.findByShowtime_IdAndBooking_StatusIn(
                showtimeId,
                ACTIVE_BOOKING_STATUSES
        );

        Set<UUID> bookedSeatIds = new HashSet<>();
        for (Ticket ticket : bookedTickets) {
            bookedSeatIds.add(ticket.getSeat().getId());
        }

        List<Seat> seats = seatRepository.findByRoom_IdOrderByRowNameAscSeatNumberAsc(
                showtime.getRoom().getId()
        );

        return seats.stream()
                .map(seat -> new SeatStatusResponse(
                        seat.getId(),
                        seat.getLabel(),
                        seat.getRowName(),
                        seat.getSeatNumber(),
                        bookedSeatIds.contains(seat.getId())
                ))
                .toList();
    }

    @Transactional
    public BookingResponse createBooking(UUID authenticatedUserId, CreateBookingRequest request) {
        if (request.seatIds() == null || request.seatIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one seat is required");
        }

        if (request.userId() != null && !request.userId().equals(authenticatedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only create bookings for yourself");
        }

        AppUser user = appUserRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Showtime showtime = showtimeRepository.findById(request.showtimeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime not found"));

        List<Seat> seats = seatRepository.findAllById(request.seatIds());

        if (seats.size() != request.seatIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more seats are invalid");
        }

        UUID showtimeRoomId = showtime.getRoom().getId();

        for (Seat seat : seats) {
            if (!seat.getRoom().getId().equals(showtimeRoomId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Seat " + seat.getLabel() + " does not belong to this showtime room"
                );
            }

            boolean alreadyBooked = ticketRepository.existsByShowtime_IdAndSeat_IdAndBooking_StatusIn(
                    showtime.getId(),
                    seat.getId(),
                    ACTIVE_BOOKING_STATUSES
            );

            if (alreadyBooked) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Seat " + seat.getLabel() + " is already booked"
                );
            }
        }

        BigDecimal ticketAmount = showtime.getPrice()
                .multiply(BigDecimal.valueOf(seats.size()));
        BigDecimal foodAmount = normalizeFoodAmount(request.foodAmount());
        BigDecimal totalAmount = ticketAmount.add(foodAmount);
        String paymentMethod = normalizePaymentMethod(request.paymentMethod());

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setShowtime(showtime);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setTicketAmount(ticketAmount);
        booking.setFoodAmount(foodAmount);
        booking.setTotalAmount(totalAmount);
        booking.setPaymentMethod(paymentMethod);
        booking.setPaymentStatus("PAID");
        booking.setPaymentReference(generatePaymentReference(paymentMethod));
        booking.setSeatSummary(formatSeatSummary(seats));

        bookingRepository.save(booking);

        for (Seat seat : seats) {
            Ticket ticket = new Ticket();
            ticket.setBooking(booking);
            ticket.setShowtime(showtime);
            ticket.setSeat(seat);
            ticket.setPrice(showtime.getPrice());
            ticket.setCode(generateTicketCode());

            ticketRepository.save(ticket);
        }

        return toBookingResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUser(UUID userId) {
        return bookingRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toBookingResponse)
                .toList();
    }

    @Transactional
    public BookingResponse cancelBooking(UUID authenticatedUserId, UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getUser().getId().equals(authenticatedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only cancel your own bookings");
        }

        return cancelBookingInternal(booking, false);
    }

    @Transactional
    public Booking cancelBookingAsAdmin(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        cancelBookingInternal(booking, true);
        return booking;
    }

    private BookingResponse toBookingResponse(Booking booking) {
        List<Ticket> tickets = ticketRepository.findByBooking_Id(booking.getId());

        List<TicketResponse> ticketResponses = tickets.stream()
                .map(ticket -> new TicketResponse(
                        ticket.getId(),
                        ticket.getSeat().getId(),
                        ticket.getSeat().getLabel(),
                        ticket.getPrice(),
                        ticket.getCode()
                ))
                .toList();

        return new BookingResponse(
                booking.getId(),
                booking.getStatus().name(),
                booking.getTotalAmount(),
                booking.getTicketAmount(),
                booking.getFoodAmount(),
                booking.getPaymentMethod(),
                booking.getPaymentStatus(),
                booking.getPaymentReference(),
                booking.getShowtime().getId(),
                booking.getShowtime().getMovie().getTitle(),
                booking.getShowtime().getMovie().getPosterUrl(),
                booking.getShowtime().getRoom().getCinema().getName(),
                booking.getShowtime().getRoom().getName(),
                booking.getShowtime().getStartTime(),
                booking.getCreatedAt(),
                booking.getSeatSummary(),
                ticketResponses
        );
    }

    private BookingResponse cancelBookingInternal(Booking booking, boolean allowPastShowtimeCancellation) {
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This booking has already been cancelled");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only confirmed bookings can be cancelled");
        }

        if (!allowPastShowtimeCancellation && !booking.getShowtime().getStartTime().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This booking can no longer be cancelled because the showtime has started"
            );
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setPaymentStatus("REFUNDED");
        ticketRepository.deleteByBooking_Id(booking.getId());
        return toBookingResponse(bookingRepository.save(booking));
    }

    private String formatSeatSummary(List<Seat> seats) {
        return seats.stream()
                .map(Seat::getLabel)
                .sorted()
                .reduce((left, right) -> left + ", " + right)
                .orElse("");
    }

    private BigDecimal normalizeFoodAmount(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }

        if (value.compareTo(BigDecimal.ZERO) < 0 || value.compareTo(BigDecimal.valueOf(5_000_000)) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Food amount is invalid");
        }

        return value;
    }

    private String normalizePaymentMethod(String value) {
        if (value == null || value.isBlank()) {
            return "DEMO_CARD";
        }

        String normalized = value.trim().toUpperCase();
        if (!SUPPORTED_PAYMENT_METHODS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment method is not supported");
        }

        return normalized;
    }

    private String generatePaymentReference(String paymentMethod) {
        return paymentMethod + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateTicketCode() {
        return "TICKET-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
