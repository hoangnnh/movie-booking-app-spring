package com.cinemabooking.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TicketResponse(
        UUID id,
        UUID seatId,
        String seatLabel,
        BigDecimal price,
        String code
) {
}