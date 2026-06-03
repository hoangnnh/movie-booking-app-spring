package com.cinemabooking.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminShowtimeBulkConflictResponse(
        UUID roomId,
        String roomName,
        String cinemaName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String reason
) {
}
