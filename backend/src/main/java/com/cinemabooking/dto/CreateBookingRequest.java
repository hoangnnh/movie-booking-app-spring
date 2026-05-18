package com.cinemabooking.dto;

import java.util.List;
import java.util.UUID;

public record CreateBookingRequest(
        UUID userId,
        UUID showtimeId,
        List<UUID> seatIds
) {
}