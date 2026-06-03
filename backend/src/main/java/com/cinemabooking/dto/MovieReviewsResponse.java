package com.cinemabooking.dto;

import java.util.List;

public record MovieReviewsResponse(
        MovieReviewSummaryResponse summary,
        List<MovieReviewResponse> reviews
) {
}
