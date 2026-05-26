package com.cinemabooking.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateBookingRequest(
        UUID userId,
        UUID showtimeId,
        List<UUID> seatIds,
        BigDecimal foodAmount,
        String paymentMethod
) {
}
