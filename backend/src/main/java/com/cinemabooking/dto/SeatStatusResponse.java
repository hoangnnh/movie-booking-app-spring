package com.cinemabooking.dto;

import java.util.UUID;

public record SeatStatusResponse(
        UUID seatId,
        String label,
        String rowName,
        Integer seatNumber,
        boolean booked
) {
}