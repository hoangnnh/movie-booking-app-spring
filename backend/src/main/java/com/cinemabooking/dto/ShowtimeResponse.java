package com.cinemabooking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ShowtimeResponse(
        UUID id,
        UUID movieId,
        String movieTitle,
        UUID roomId,
        String roomName,
        String cinemaName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        BigDecimal price
) {
}