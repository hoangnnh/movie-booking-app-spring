package com.cinemabooking.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.BookingResponse;
import com.cinemabooking.dto.BookingFoodItemRequest;
import com.cinemabooking.dto.BookingFoodItemResponse;
import com.cinemabooking.dto.CreateBookingRequest;
import com.cinemabooking.dto.PaymentCheckoutResponse;
import com.cinemabooking.dto.SeatStatusResponse;
import com.cinemabooking.dto.TicketResponse;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Booking;
import com.cinemabooking.entity.BookingFoodItem;
import com.cinemabooking.entity.FoodItem;
import com.cinemabooking.entity.Seat;
import com.cinemabooking.entity.Showtime;
import com.cinemabooking.entity.Ticket;
import com.cinemabooking.enums.BookingStatus;
import com.cinemabooking.enums.MovieDisplayStatus;
import com.cinemabooking.repository.AppUserRepository;
import com.cinemabooking.repository.BookingRepository;
import com.cinemabooking.repository.BookingFoodItemRepository;
import com.cinemabooking.repository.FoodItemRepository;
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
    private final FoodItemRepository foodItemRepository;
    private final BookingFoodItemRepository bookingFoodItemRepository;
    private final PaymentGatewayService paymentGatewayService;

    private static final Set<String> SUPPORTED_PAYMENT_METHODS = Set.of(
            "VNPAY_QR",
            "DEMO_CARD"
    );

    private static final String VNPAY_PAYMENT_METHOD = "VNPAY_QR";

    @Value("${app.booking.pending-payment-expiry-minutes:5}")
    private int pendingPaymentExpiryMinutes;

    @Transactional
    public List<SeatStatusResponse> getSeatStatuses(UUID showtimeId) {
        expireStaleBookings();

        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime not found"));

        if (showtime.getMovie().getDisplayStatus() != MovieDisplayStatus.SHOWING_NOW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This movie is not currently available for booking");
        }

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
    public PaymentCheckoutResponse createBooking(
            UUID authenticatedUserId,
            CreateBookingRequest request,
            String clientIpAddress
    ) {
        expireStaleBookings();

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

        if (showtime.getMovie().getDisplayStatus() != MovieDisplayStatus.SHOWING_NOW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This movie is not currently available for booking");
        }

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

        validateSeatSpacing(showtime, seats);

        BigDecimal ticketAmount = showtime.getPrice()
                .multiply(BigDecimal.valueOf(seats.size()));
        List<ValidatedFoodItem> validatedFoodItems = validateFoodItems(request.foodItems());
        BigDecimal foodAmount = validatedFoodItems.stream()
                .map(ValidatedFoodItem::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAmount = ticketAmount.add(foodAmount);
        String paymentMethod = normalizePaymentMethod(request.paymentMethod());

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setShowtime(showtime);
        booking.setStatus("DEMO_CARD".equals(paymentMethod) ? BookingStatus.CONFIRMED : BookingStatus.PENDING);
        booking.setTicketAmount(ticketAmount);
        booking.setFoodAmount(foodAmount);
        booking.setTotalAmount(totalAmount);
        booking.setPaymentMethod(paymentMethod);
        booking.setPaymentStatus("DEMO_CARD".equals(paymentMethod) ? "PAID" : "PENDING");
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

        for (ValidatedFoodItem validatedFoodItem : validatedFoodItems) {
            BookingFoodItem bookingFoodItem = new BookingFoodItem();
            bookingFoodItem.setBooking(booking);
            bookingFoodItem.setFoodItem(validatedFoodItem.foodItem());
            bookingFoodItem.setItemNameSnapshot(validatedFoodItem.foodItem().getName());
            bookingFoodItem.setUnitPriceSnapshot(validatedFoodItem.foodItem().getPrice());
            bookingFoodItem.setQuantity(validatedFoodItem.quantity());
            bookingFoodItem.setLineTotal(validatedFoodItem.lineTotal());

            bookingFoodItemRepository.save(bookingFoodItem);
        }

        BookingResponse bookingResponse = toBookingResponse(booking);

        if ("DEMO_CARD".equals(paymentMethod)) {
            return new PaymentCheckoutResponse(
                    bookingResponse,
                    "",
                    false,
                    "Demo card confirmed locally. Use VNPAY for sandbox gateway checkout."
            );
        }

        String checkoutUrl = paymentGatewayService.createCheckoutUrl(booking, clientIpAddress);
        return new PaymentCheckoutResponse(
                bookingResponse,
                checkoutUrl,
                true,
                "Redirect required to complete payment."
        );
    }

    @Transactional
    public List<BookingResponse> getBookingsByUser(UUID userId) {
        expireStaleBookings();

        return bookingRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toBookingResponse)
                .toList();
    }

    @Transactional
    public int expireStaleBookings() {
        return expireAbandonedPendingPayments() + expirePassedShowtimeBookings();
    }

    @Transactional
    public int expireAbandonedPendingPayments() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(pendingPaymentExpiryMinutes);
        List<UUID> bookingIds = bookingRepository.findAbandonedPendingPaymentBookingIds(
                BookingStatus.PENDING,
                VNPAY_PAYMENT_METHOD,
                cutoff
        );

        if (bookingIds.isEmpty()) {
            return 0;
        }

        ticketRepository.deleteByBooking_IdIn(bookingIds);
        return bookingRepository.markBookingsExpiredByIds(
                bookingIds,
                BookingStatus.EXPIRED,
                "FAILED"
        );
    }

    @Transactional
    public int expirePassedShowtimeBookings() {
        return bookingRepository.expirePassedShowtimeBookings(
                ACTIVE_BOOKING_STATUSES,
                BookingStatus.EXPIRED,
                LocalDateTime.now()
        );
    }

    @Transactional
    public void deleteBookingAsAdmin(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        ticketRepository.deleteByBooking_Id(booking.getId());
        bookingFoodItemRepository.deleteByBooking_Id(booking.getId());
        bookingRepository.delete(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingFoodItemResponse> getFoodItemsByBooking(UUID bookingId) {
        return bookingFoodItemRepository.findByBooking_IdOrderByCreatedAtAsc(bookingId)
                .stream()
                .map(this::toBookingFoodItemResponse)
                .toList();
    }

    @Transactional
    public BookingResponse confirmProviderPayment(String paymentReference) {
        Booking booking = bookingRepository.findByPaymentReference(paymentReference)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This booking can no longer be confirmed");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPaymentStatus("PAID");
        return toBookingResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse failProviderPayment(String paymentReference) {
        Booking booking = bookingRepository.findByPaymentReference(paymentReference)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            return toBookingResponse(booking);
        }

        booking.setStatus(BookingStatus.EXPIRED);
        booking.setPaymentStatus("FAILED");
        ticketRepository.deleteByBooking_Id(booking.getId());
        return toBookingResponse(bookingRepository.save(booking));
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

        List<BookingFoodItemResponse> foodItemResponses = getFoodItemsByBooking(booking.getId());

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
                ticketResponses,
                foodItemResponses
        );
    }

    private String formatSeatSummary(List<Seat> seats) {
        return seats.stream()
                .map(Seat::getLabel)
                .sorted()
                .reduce((left, right) -> left + ", " + right)
                .orElse("");
    }

    private BookingFoodItemResponse toBookingFoodItemResponse(BookingFoodItem item) {
        return new BookingFoodItemResponse(
                item.getFoodItem() == null ? null : item.getFoodItem().getId(),
                item.getItemNameSnapshot(),
                item.getUnitPriceSnapshot(),
                item.getQuantity(),
                item.getLineTotal()
        );
    }

    private void validateSeatSpacing(Showtime showtime, List<Seat> selectedSeats) {
        Set<UUID> selectedSeatIds = selectedSeats.stream()
                .map(Seat::getId)
                .collect(Collectors.toSet());
        Set<UUID> occupiedSeatIds = new HashSet<>();
        occupiedSeatIds.addAll(selectedSeatIds);
        ticketRepository.findByShowtime_IdAndBooking_StatusIn(showtime.getId(), ACTIVE_BOOKING_STATUSES)
                .forEach(ticket -> {
                    UUID bookedSeatId = ticket.getSeat().getId();
                    occupiedSeatIds.add(bookedSeatId);
                });

        Map<String, List<Seat>> seatsByRow = seatRepository.findByRoom_IdOrderByRowNameAscSeatNumberAsc(
                        showtime.getRoom().getId()
                )
                .stream()
                .collect(Collectors.groupingBy(Seat::getRowName));

        for (List<Seat> rowSeats : seatsByRow.values()) {
            List<Seat> sortedSeats = rowSeats.stream()
                    .sorted(Comparator.comparing(Seat::getSeatNumber))
                    .toList();

            int gapStart = -1;
            for (int index = 0; index <= sortedSeats.size(); index++) {
                boolean occupied = index == sortedSeats.size()
                        || occupiedSeatIds.contains(sortedSeats.get(index).getId());

                if (!occupied && gapStart == -1) {
                    gapStart = index;
                }

                if (occupied && gapStart != -1) {
                    int gapEnd = index - 1;
                    int gapLength = gapEnd - gapStart + 1;
                    Seat leftSeat = gapStart > 0 ? sortedSeats.get(gapStart - 1) : null;
                    Seat rightSeat = gapEnd + 1 < sortedSeats.size() ? sortedSeats.get(gapEnd + 1) : null;
                    boolean touchesSelectedSeat =
                            (leftSeat != null && selectedSeatIds.contains(leftSeat.getId()))
                                    || (rightSeat != null && selectedSeatIds.contains(rightSeat.getId()));

                    if (gapLength == 1 && touchesSelectedSeat) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Seat " + sortedSeats.get(gapStart).getLabel()
                                        + " cannot be left as a single empty seat next to your selection"
                        );
                    }

                    gapStart = -1;
                }
            }
        }
    }

    private List<ValidatedFoodItem> validateFoodItems(List<BookingFoodItemRequest> requestedItems) {
        if (requestedItems == null || requestedItems.isEmpty()) {
            return List.of();
        }

        Set<UUID> foodItemIds = new HashSet<>();
        for (BookingFoodItemRequest requestedItem : requestedItems) {
            if (requestedItem == null || requestedItem.foodItemId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Food item is invalid");
            }

            if (!foodItemIds.add(requestedItem.foodItemId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Food item cannot be repeated");
            }

            if (requestedItem.quantity() == null || requestedItem.quantity() < 1 || requestedItem.quantity() > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Food item quantity must be between 1 and 9");
            }
        }

        Map<UUID, FoodItem> activeFoodItems = foodItemRepository.findByIdInAndActiveTrue(foodItemIds)
                .stream()
                .collect(Collectors.toMap(FoodItem::getId, item -> item));

        if (activeFoodItems.size() != foodItemIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more food items are unavailable");
        }

        return requestedItems.stream()
                .map(requestedItem -> {
                    FoodItem foodItem = activeFoodItems.get(requestedItem.foodItemId());
                    BigDecimal lineTotal = foodItem.getPrice()
                            .multiply(BigDecimal.valueOf(requestedItem.quantity()));
                    return new ValidatedFoodItem(foodItem, requestedItem.quantity(), lineTotal);
                })
                .toList();
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

    private record ValidatedFoodItem(FoodItem foodItem, int quantity, BigDecimal lineTotal) {
    }
}
