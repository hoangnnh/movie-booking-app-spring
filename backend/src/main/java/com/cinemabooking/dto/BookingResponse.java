package com.cinemabooking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        String status,
        BigDecimal totalAmount,
        BigDecimal ticketAmount,
        BigDecimal foodAmount,
        String paymentMethod,
        String paymentStatus,
        String paymentReference,
        UUID showtimeId,
        String movieTitle,
        LocalDateTime startTime,
        List<TicketResponse> tickets
) {
}
