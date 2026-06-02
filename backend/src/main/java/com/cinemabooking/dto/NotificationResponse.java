package com.cinemabooking.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String message,
        String actionUrl,
        String imageUrl,
        boolean read,
        LocalDateTime createdAt
) {
}
