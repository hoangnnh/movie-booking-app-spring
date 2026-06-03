package com.cinemabooking.dto;

public record MovieReviewRequest(
        Integer score,
        String title,
        String body
) {
}
