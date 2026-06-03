package com.cinemabooking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminShowtimeRequest(
        UUID movieId,
        UUID roomId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        BigDecimal price
) {
}
