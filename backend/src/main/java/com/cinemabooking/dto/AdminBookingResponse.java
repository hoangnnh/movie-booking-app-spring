package com.cinemabooking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminBookingResponse(
        UUID id,
        String status,
        BigDecimal totalAmount,
        BigDecimal ticketAmount,
        BigDecimal foodAmount,
        String paymentMethod,
        String paymentStatus,
        String paymentReference,
        UUID userId,
        String userName,
        String userEmail,
        UUID showtimeId,
        String movieTitle,
        String cinemaName,
        String roomName,
        LocalDateTime startTime,
        LocalDateTime createdAt,
        List<TicketResponse> tickets
) {
}
