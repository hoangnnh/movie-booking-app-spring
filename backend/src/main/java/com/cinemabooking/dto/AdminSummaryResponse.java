package com.cinemabooking.dto;

import java.math.BigDecimal;

public record AdminSummaryResponse(
        long movieCount,
        long userCount,
        long bookingCount,
        BigDecimal revenue,
        long showingNowMovieCount,
        long comingSoonMovieCount,
        long hiddenMovieCount
) {
}
