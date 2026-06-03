package com.cinemabooking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminShowtimeResponse(
        UUID id,
        UUID movieId,
        String movieTitle,
        UUID roomId,
        String roomName,
        UUID cinemaId,
        String cinemaName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        BigDecimal price,
        long ticketCount
) {
}
