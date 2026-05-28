package com.cinemabooking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.CreateBookingRequest;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Booking;
import com.cinemabooking.entity.Cinema;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.Room;
import com.cinemabooking.entity.Seat;
import com.cinemabooking.entity.Showtime;
import com.cinemabooking.entity.Ticket;
import com.cinemabooking.enums.BookingStatus;
import com.cinemabooking.repository.AppUserRepository;
import com.cinemabooking.repository.BookingRepository;
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
    private PaymentGatewayService paymentGatewayService;

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

        bookingService.createBooking(
                userId,
                new CreateBookingRequest(
                        userId,
                        showtimeId,
                        List.of(seatB2.getId(), seatA1.getId()),
                        BigDecimal.valueOf(5_000),
                        " demo_card "
                ),
                "127.0.0.1"
        );

        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        Booking savedBooking = bookingCaptor.getValue();

        assertThat(savedBooking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(savedBooking.getTicketAmount()).isEqualByComparingTo("150000");
        assertThat(savedBooking.getFoodAmount()).isEqualByComparingTo("5000");
        assertThat(savedBooking.getTotalAmount()).isEqualByComparingTo("155000");
        assertThat(savedBooking.getPaymentMethod()).isEqualTo("DEMO_CARD");
        assertThat(savedBooking.getSeatSummary()).isEqualTo("A1, B2");
        verify(ticketRepository, times(2)).save(any(Ticket.class));
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
                new CreateBookingRequest(userId, showtimeId, List.of(seatA1.getId()), BigDecimal.ZERO, "DEMO_CARD"),
                "127.0.0.1"
        ))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));

        verify(bookingRepository, never()).save(any());
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void createBookingRejectsInvalidFoodAmountBeforeSaving() {
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
                new CreateBookingRequest(userId, showtimeId, List.of(seatA1.getId()), BigDecimal.valueOf(-1), "DEMO_CARD"),
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
                        BigDecimal.ZERO,
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
                        BigDecimal.ZERO,
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
                        BigDecimal.ZERO,
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
}
