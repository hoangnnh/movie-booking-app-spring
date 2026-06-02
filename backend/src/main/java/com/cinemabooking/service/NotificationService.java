package com.cinemabooking.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.NotificationResponse;
import com.cinemabooking.dto.NotificationSummaryResponse;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Booking;
import com.cinemabooking.entity.Notification;
import com.cinemabooking.enums.BookingStatus;
import com.cinemabooking.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String MY_BOOKING_URL = "/my-booking";

    private final NotificationRepository notificationRepository;

    @Transactional
    public void createPasswordChangedNotification(AppUser user) {
        createNotification(
                user,
                "PASSWORD_CHANGED",
                "Password changed",
                "Your account password was changed successfully.",
                "/profile"
        );
    }

    @Transactional
    public void createBookingNotification(Booking booking) {
        boolean confirmed = booking.getStatus() == BookingStatus.CONFIRMED;
        String movieTitle = booking.getShowtime().getMovie().getTitle();
        String seats = booking.getSeatSummary();

        createNotification(
                booking.getUser(),
                confirmed ? "BOOKING_CONFIRMED" : "BOOKING_PENDING",
                confirmed ? "Booking confirmed" : "Payment pending",
                confirmed
                        ? "Your tickets for " + movieTitle + " are confirmed. Seats: " + seats + "."
                        : "Complete payment for " + movieTitle + " to keep your selected seats: " + seats + ".",
                MY_BOOKING_URL
        );
    }

    @Transactional(readOnly = true)
    public NotificationSummaryResponse getNotifications(UUID userId) {
        return new NotificationSummaryResponse(
                notificationRepository.findTop20ByUser_IdOrderByCreatedAtDesc(userId)
                        .stream()
                        .map(this::toResponse)
                        .toList(),
                notificationRepository.countByUser_IdAndReadFalse(userId)
        );
    }

    @Transactional
    public NotificationResponse markRead(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findByIdAndUser_Id(notificationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification = notificationRepository.save(notification);
        }

        return toResponse(notification);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    private void createNotification(AppUser user, String type, String title, String message, String actionUrl) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setActionUrl(actionUrl);
        notificationRepository.save(notification);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getActionUrl(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
