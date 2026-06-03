package com.cinemabooking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record AdminShowtimeBulkRequest(
        UUID movieId,
        List<UUID> roomIds,
        LocalDate startDate,
        LocalDate endDate,
        List<LocalTime> startTimes,
        BigDecimal price,
        boolean previewOnly
) {
}
