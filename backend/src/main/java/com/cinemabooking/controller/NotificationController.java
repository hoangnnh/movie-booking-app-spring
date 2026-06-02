package com.cinemabooking.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinemabooking.dto.NotificationResponse;
import com.cinemabooking.dto.NotificationSummaryResponse;
import com.cinemabooking.security.AuthenticatedUser;
import com.cinemabooking.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public NotificationSummaryResponse getNotifications(Authentication authentication) {
        return notificationService.getNotifications(currentUserId(authentication));
    }

    @PatchMapping("/{notificationId}/read")
    public NotificationResponse markRead(
            Authentication authentication,
            @PathVariable UUID notificationId
    ) {
        return notificationService.markRead(currentUserId(authentication), notificationId);
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        notificationService.markAllRead(currentUserId(authentication));
        return ResponseEntity.noContent().build();
    }

    private UUID currentUserId(Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        return authenticatedUser.userId();
    }
}
