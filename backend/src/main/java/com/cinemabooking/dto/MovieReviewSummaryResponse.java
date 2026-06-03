package com.cinemabooking.dto;

public record MovieReviewSummaryResponse(
        long totalReviews,
        double averageScore,
        long positiveReviews,
        long averageReviews,
        long negativeReviews
) {
}
