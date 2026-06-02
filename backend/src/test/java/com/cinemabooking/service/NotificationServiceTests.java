package com.cinemabooking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Booking;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.Notification;
import com.cinemabooking.entity.Showtime;
import com.cinemabooking.enums.BookingStatus;
import com.cinemabooking.repository.NotificationRepository;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTests {

    @Mock
    private NotificationRepository notificationRepository;

    private NotificationService notificationService;
    private AppUser user;
    private Booking booking;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository);

        user = new AppUser();
        user.setId(UUID.randomUUID());

        Movie movie = new Movie();
        movie.setTitle("Test Movie");
        movie.setPosterUrl("https://image.example/test-movie.jpg");

        Showtime showtime = new Showtime();
        showtime.setMovie(movie);

        booking = new Booking();
        booking.setUser(user);
        booking.setShowtime(showtime);
        booking.setSeatSummary("A1, A2");
    }

    @Test
    void createBookingNotificationWarnsAboutPendingPayment() {
        booking.setStatus(BookingStatus.PENDING);

        notificationService.createBookingNotification(booking);

        Notification notification = captureSavedNotification();
        assertThat(notification.getUser()).isEqualTo(user);
        assertThat(notification.getType()).isEqualTo("BOOKING_PENDING");
        assertThat(notification.getTitle()).isEqualTo("Payment pending");
        assertThat(notification.getMessage()).contains("Complete payment", "Test Movie", "A1, A2");
        assertThat(notification.getActionUrl()).isEqualTo("/my-booking");
    }

    @Test
    void createBookingNotificationConfirmsPaidTickets() {
        booking.setStatus(BookingStatus.CONFIRMED);

        notificationService.createBookingNotification(booking);

        Notification notification = captureSavedNotification();
        assertThat(notification.getType()).isEqualTo("BOOKING_CONFIRMED");
        assertThat(notification.getTitle()).isEqualTo("Booking confirmed");
        assertThat(notification.getMessage()).contains("confirmed", "Test Movie", "A1, A2");
        assertThat(notification.getImageUrl()).isEqualTo("https://image.example/test-movie.jpg");
    }

    private Notification captureSavedNotification() {
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        return captor.getValue();
    }
}
