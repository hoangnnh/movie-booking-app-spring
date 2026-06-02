package com.cinemabooking.dto;

import java.util.List;

public record NotificationSummaryResponse(
        List<NotificationResponse> notifications,
        long unreadCount
) {
}
