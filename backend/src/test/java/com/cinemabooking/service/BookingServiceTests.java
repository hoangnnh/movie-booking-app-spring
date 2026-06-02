package com.cinemabooking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.CreateBookingRequest;
import com.cinemabooking.dto.BookingFoodItemRequest;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Booking;
import com.cinemabooking.entity.Cinema;
import com.cinemabooking.entity.FoodItem;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.Room;
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

@ExtendWith(MockitoExtension.class)
class BookingServiceTests {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private ShowtimeRepository showtimeRepository;

    @Mock
    private SeatRepository seatRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private FoodItemRepository foodItemRepository;

    @Mock
    private BookingFoodItemRepository bookingFoodItemRepository;

    @Mock
    private PaymentGatewayService paymentGatewayService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ShowtimeAvailabilityService showtimeAvailabilityService;

    @InjectMocks
    private BookingService bookingService;

    private UUID userId;
    private UUID showtimeId;
    private AppUser user;
    private Showtime showtime;
    private Seat seatB2;
    private Seat seatA1;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        showtimeId = UUID.randomUUID();

        user = new AppUser();
        user.setId(userId);
        user.setFullName("Test User");
        user.setEmail("test@example.com");

        Cinema cinema = new Cinema();
        cinema.setId(UUID.randomUUID());
        cinema.setName("Test Cinema");

        Room room = new Room();
        room.setId(UUID.randomUUID());
        room.setCinema(cinema);
        room.setName("Room 1");

        Movie movie = new Movie();
        movie.setId(UUID.randomUUID());
        movie.setTitle("Test Movie");
        movie.setDurationMinutes(120);
        movie.setDisplayStatus(MovieDisplayStatus.SHOWING_NOW);

        showtime = new Showtime();
        showtime.setId(showtimeId);
        showtime.setMovie(movie);
        showtime.setRoom(room);
        showtime.setStartTime(LocalDateTime.now().plusDays(1));
        showtime.setEndTime(LocalDateTime.now().plusDays(1).plusHours(2));
        showtime.setPrice(BigDecimal.valueOf(75_000));

        seatB2 = seat(room, "B", 2);
        seatA1 = seat(room, "A", 1);
    }

    @Test
    void createBookingConfirmsBookingWithSortedSeatSummaryAndTotals() {
        FoodItem popcorn = foodItem("Sweet Popcorn", 65_000);

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(showtimeRepository.findById(showtimeId)).thenReturn(Optional.of(showtime));
        when(seatRepository.findAllById(List.of(seatB2.getId(), seatA1.getId())))
                .thenReturn(List.of(seatB2, seatA1));
        when(ticketRepository.existsByShowtime_IdAndSeat_IdAndBooking_StatusIn(eq(showtimeId), any(), anySet()))
                .thenReturn(false);
        when(ticketRepository.findByShowtime_IdAndBooking_StatusIn(eq(showtimeId), anySet()))
                .thenReturn(List.of());
        when(seatRepository.findByRoom_IdOrderByRowNameAscSeatNumberAsc(showtime.getRoom().getId()))
                .thenReturn(List.of(seatA1, seatB2));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setId(UUID.randomUUID());
            return booking;
        });
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> {
            Ticket ticket = invocation.getArgument(0);
            ticket.setId(UUID.randomUUID());
            return ticket;
        });
        when(ticketRepository.findByBooking_Id(any())).thenReturn(List.of());
        when(foodItemRepository.findByIdInAndActiveTrue(any())).thenReturn(List.of(popcorn));
        when(bookingFoodItemRepository.findByBooking_IdOrderByCreatedAtAsc(any())).thenReturn(List.of());

        bookingService.createBooking(
                userId,
                new CreateBookingRequest(
                        userId,
                        showtimeId,
                        List.of(seatB2.getId(), seatA1.getId()),
                        List.of(new BookingFoodItemRequest(popcorn.getId(), 2)),
                        " demo_card "
                ),
                "127.0.0.1"
        );

        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        Booking savedBooking = bookingCaptor.getValue();

        assertThat(savedBooking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(savedBooking.getTicketAmount()).isEqualByComparingTo("150000");
        assertThat(savedBooking.getFoodAmount()).isEqualByComparingTo("130000");
        assertThat(savedBooking.getTotalAmount()).isEqualByComparingTo("280000");
        assertThat(savedBooking.getPaymentMethod()).isEqualTo("DEMO_CARD");
        assertThat(savedBooking.getSeatSummary()).isEqualTo("A1, B2");
        verify(ticketRepository, times(2)).save(any(Ticket.class));
        verify(bookingFoodItemRepository).save(any());
        verify(notificationService).createBookingNotification(savedBooking);
    }

    @Test
    void createBookingReleasesInactiveTicketRowsBeforeSavingReplacement() {
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(showtimeRepository.findById(showtimeId)).thenReturn(Optional.of(showtime));
        when(seatRepository.findAllById(List.of(seatA1.getId()))).thenReturn(List.of(seatA1));
        when(ticketRepository.existsByShowtime_IdAndSeat_IdAndBooking_StatusIn(eq(showtimeId), eq(seatA1.getId()), anySet()))
                .thenReturn(false);
        when(ticketRepository.findByShowtime_IdAndBooking_StatusIn(eq(showtimeId), anySet()))
                .thenReturn(List.of());
        when(seatRepository.findByRoom_IdOrderByRowNameAscSeatNumberAsc(showtime.getRoom().getId()))
                .thenReturn(List.of(seatA1));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setId(UUID.randomUUID());
            return booking;
        });
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> {
            Ticket ticket = invocation.getArgument(0);
            ticket.setId(UUID.randomUUID());
            return ticket;
        });
        when(ticketRepository.findByBooking_Id(any())).thenReturn(List.of());
        when(bookingFoodItemRepository.findByBooking_IdOrderByCreatedAtAsc(any())).thenReturn(List.of());

        bookingService.createBooking(
                userId,
                new CreateBookingRequest(userId, showtimeId, List.of(seatA1.getId()), List.of(), "DEMO_CARD"),
                "127.0.0.1"
        );

        InOrder ticketOperations = inOrder(ticketRepository);
        ticketOperations.verify(ticketRepository).deleteInactiveTicketsByShowtimeId(showtimeId, Set.of(
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED
        ));
        ticketOperations.verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    void createBookingRejectsAlreadyBookedSeatsBeforeSaving() {
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(showtimeRepository.findById(showtimeId)).thenReturn(Optional.of(showtime));
        when(seatRepository.findAllById(List.of(seatA1.getId()))).thenReturn(List.of(seatA1));
        when(ticketRepository.existsByShowtime_IdAndSeat_IdAndBooking_StatusIn(eq(showtimeId), eq(seatA1.getId()), anySet()))
                .thenReturn(true);

        assertThatThrownBy(() -> bookingService.createBooking(
                userId,
                new CreateBookingRequest(userId, showtimeId, List.of(seatA1.getId()), List.of(), "DEMO_CARD"),
                "127.0.0.1"
        ))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));

        verify(bookingRepository, never()).save(any());
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void createBookingRejectsInvalidFoodQuantityBeforeSaving() {
        FoodItem popcorn = foodItem("Sweet Popcorn", 65_000);

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(showtimeRepository.findById(showtimeId)).thenReturn(Optional.of(showtime));
        when(seatRepository.findAllById(List.of(seatA1.getId()))).thenReturn(List.of(seatA1));
        when(ticketRepository.existsByShowtime_IdAndSeat_IdAndBooking_StatusIn(eq(showtimeId), eq(seatA1.getId()), anySet()))
                .thenReturn(false);
        when(ticketRepository.findByShowtime_IdAndBooking_StatusIn(eq(showtimeId), anySet()))
                .thenReturn(List.of());
        when(seatRepository.findByRoom_IdOrderByRowNameAscSeatNumberAsc(showtime.getRoom().getId()))
                .thenReturn(List.of(seatA1));

        assertThatThrownBy(() -> bookingService.createBooking(
                userId,
                new CreateBookingRequest(
                        userId,
                        showtimeId,
                        List.of(seatA1.getId()),
                        List.of(new BookingFoodItemRequest(popcorn.getId(), 10)),
                        "DEMO_CARD"
                ),
                "127.0.0.1"
        ))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(bookingRepository, never()).save(any());
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void createBookingRejectsSelectionThatLeavesSingleSeatGap() {
        Seat seatA2 = seat(showtime.getRoom(), "A", 2);
        Seat seatA3 = seat(showtime.getRoom(), "A", 3);

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(showtimeRepository.findById(showtimeId)).thenReturn(Optional.of(showtime));
        when(seatRepository.findAllById(List.of(seatA1.getId(), seatA3.getId())))
                .thenReturn(List.of(seatA1, seatA3));
        when(ticketRepository.existsByShowtime_IdAndSeat_IdAndBooking_StatusIn(eq(showtimeId), any(), anySet()))
                .thenReturn(false);
        when(ticketRepository.findByShowtime_IdAndBooking_StatusIn(eq(showtimeId), anySet()))
                .thenReturn(List.of());
        when(seatRepository.findByRoom_IdOrderByRowNameAscSeatNumberAsc(showtime.getRoom().getId()))
                .thenReturn(List.of(seatA1, seatA2, seatA3));

        assertThatThrownBy(() -> bookingService.createBooking(
                userId,
                new CreateBookingRequest(
                        userId,
                        showtimeId,
                        List.of(seatA1.getId(), seatA3.getId()),
                        List.of(),
                        "DEMO_CARD"
                ),
                "127.0.0.1"
        ))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST))
                .hasMessageContaining("A2");

        verify(bookingRepository, never()).save(any());
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void createBookingRejectsSelectionThatLeavesSingleSeatNextToExistingBooking() {
        Seat seatA2 = seat(showtime.getRoom(), "A", 2);
        Seat seatA3 = seat(showtime.getRoom(), "A", 3);
        Seat seatA4 = seat(showtime.getRoom(), "A", 4);
        Seat seatA5 = seat(showtime.getRoom(), "A", 5);
        Ticket bookedTicket = ticket(seatA5);

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(showtimeRepository.findById(showtimeId)).thenReturn(Optional.of(showtime));
        when(seatRepository.findAllById(List.of(seatA3.getId()))).thenReturn(List.of(seatA3));
        when(ticketRepository.existsByShowtime_IdAndSeat_IdAndBooking_StatusIn(eq(showtimeId), eq(seatA3.getId()), anySet()))
                .thenReturn(false);
        when(ticketRepository.findByShowtime_IdAndBooking_StatusIn(eq(showtimeId), anySet()))
                .thenReturn(List.of(bookedTicket));
        when(seatRepository.findByRoom_IdOrderByRowNameAscSeatNumberAsc(showtime.getRoom().getId()))
                .thenReturn(List.of(seatA1, seatA2, seatA3, seatA4, seatA5));

        assertThatThrownBy(() -> bookingService.createBooking(
                userId,
                new CreateBookingRequest(
                        userId,
                        showtimeId,
                        List.of(seatA3.getId()),
                        List.of(),
                        "DEMO_CARD"
                ),
                "127.0.0.1"
        ))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST))
                .hasMessageContaining("A4");

        verify(bookingRepository, never()).save(any());
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void createBookingRejectsSelectionThatLeavesSingleSeatAtRowEdge() {
        Seat seatA2 = seat(showtime.getRoom(), "A", 2);
        Seat seatA3 = seat(showtime.getRoom(), "A", 3);
        Seat seatA4 = seat(showtime.getRoom(), "A", 4);

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(showtimeRepository.findById(showtimeId)).thenReturn(Optional.of(showtime));
        when(seatRepository.findAllById(List.of(seatA2.getId()))).thenReturn(List.of(seatA2));
        when(ticketRepository.existsByShowtime_IdAndSeat_IdAndBooking_StatusIn(eq(showtimeId), eq(seatA2.getId()), anySet()))
                .thenReturn(false);
        when(ticketRepository.findByShowtime_IdAndBooking_StatusIn(eq(showtimeId), anySet()))
                .thenReturn(List.of());
        when(seatRepository.findByRoom_IdOrderByRowNameAscSeatNumberAsc(showtime.getRoom().getId()))
                .thenReturn(List.of(seatA1, seatA2, seatA3, seatA4));

        assertThatThrownBy(() -> bookingService.createBooking(
                userId,
                new CreateBookingRequest(
                        userId,
                        showtimeId,
                        List.of(seatA2.getId()),
                        List.of(),
                        "DEMO_CARD"
                ),
                "127.0.0.1"
        ))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST))
                .hasMessageContaining("A1");

        verify(bookingRepository, never()).save(any());
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void getBookingsByUserBatchLoadsHistoryWithoutRunningExpirySweep() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setUser(user);
        booking.setShowtime(showtime);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setTotalAmount(BigDecimal.valueOf(75_000));
        booking.setTicketAmount(BigDecimal.valueOf(75_000));
        booking.setFoodAmount(BigDecimal.ZERO);
        booking.setSeatSummary("A1");

        Ticket ticket = ticket(seatA1);
        ticket.setBooking(booking);
        ticket.setPrice(BigDecimal.valueOf(75_000));
        ticket.setCode("TICKET-A1");

        when(bookingRepository.findByUser_IdOrderByCreatedAtDesc(userId)).thenReturn(List.of(booking));
        when(ticketRepository.findByBooking_IdIn(List.of(bookingId))).thenReturn(List.of(ticket));
        when(bookingFoodItemRepository.findByBooking_IdInOrderByCreatedAtAsc(List.of(bookingId)))
                .thenReturn(List.of());

        assertThat(bookingService.getBookingsByUser(userId)).hasSize(1);

        verify(ticketRepository).findByBooking_IdIn(List.of(bookingId));
        verify(bookingFoodItemRepository).findByBooking_IdInOrderByCreatedAtAsc(List.of(bookingId));
        verify(ticketRepository, never()).findByBooking_Id(any());
        verify(bookingFoodItemRepository, never()).findByBooking_IdOrderByCreatedAtAsc(any());
        verify(bookingRepository, never()).findAbandonedPendingPaymentBookingIds(any(), any(), any());
        verify(bookingRepository, never()).expirePassedShowtimeBookings(any(), any(), any());
    }

    @Test
    void expirePassedShowtimeBookingsMarksActiveBookingsAsExpired() {
        when(bookingRepository.expirePassedShowtimeBookings(
                anySet(),
                eq(BookingStatus.EXPIRED),
                any(LocalDateTime.class)
        )).thenReturn(2);

        assertThat(bookingService.expirePassedShowtimeBookings()).isEqualTo(2);

        verify(bookingRepository).expirePassedShowtimeBookings(
                anySet(),
                eq(BookingStatus.EXPIRED),
                any(LocalDateTime.class)
        );
    }

    @Test
    void expireAbandonedPendingPaymentsReleasesSeatsForStaleVnpayBookings() {
        UUID bookingId = UUID.randomUUID();

        when(bookingRepository.findAbandonedPendingPaymentBookingIds(
                eq(BookingStatus.PENDING),
                eq("VNPAY_QR"),
                any(LocalDateTime.class)
        )).thenReturn(List.of(bookingId));
        when(bookingRepository.markBookingsExpiredByIds(
                List.of(bookingId),
                BookingStatus.EXPIRED,
                "FAILED"
        )).thenReturn(1);

        assertThat(bookingService.expireAbandonedPendingPayments()).isEqualTo(1);

        verify(ticketRepository).deleteByBooking_IdIn(List.of(bookingId));
        verify(bookingRepository).markBookingsExpiredByIds(
                List.of(bookingId),
                BookingStatus.EXPIRED,
                "FAILED"
        );
    }

    @Test
    void expireAbandonedPendingPaymentsDoesNothingWhenNoStaleBookings() {
        when(bookingRepository.findAbandonedPendingPaymentBookingIds(
                eq(BookingStatus.PENDING),
                eq("VNPAY_QR"),
                any(LocalDateTime.class)
        )).thenReturn(List.of());

        assertThat(bookingService.expireAbandonedPendingPayments()).isZero();

        verify(ticketRepository, never()).deleteByBooking_IdIn(any());
        verify(bookingRepository, never()).markBookingsExpiredByIds(any(), any(), any());
    }

    private Seat seat(Room room, String rowName, int seatNumber) {
        Seat seat = new Seat();
        seat.setId(UUID.randomUUID());
        seat.setRoom(room);
        seat.setRowName(rowName);
        seat.setSeatNumber(seatNumber);
        return seat;
    }

    private Ticket ticket(Seat seat) {
        Ticket ticket = new Ticket();
        ticket.setId(UUID.randomUUID());
        ticket.setSeat(seat);
        ticket.setShowtime(showtime);
        return ticket;
    }

    private FoodItem foodItem(String name, long price) {
        FoodItem foodItem = new FoodItem();
        foodItem.setId(UUID.randomUUID());
        foodItem.setName(name);
        foodItem.setPrice(BigDecimal.valueOf(price));
        foodItem.setActive(true);
        return foodItem;
    }
}
