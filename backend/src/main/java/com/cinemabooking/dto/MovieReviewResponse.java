package com.cinemabooking.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record MovieReviewResponse(
        UUID id,
        UUID movieId,
        UUID userId,
        String reviewerName,
        String reviewerAvatarUrl,
        Integer score,
        String title,
        String body,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean currentUserReview
) {
}
