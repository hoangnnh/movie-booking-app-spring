package com.cinemabooking.dto;

import java.time.LocalDateTime;

public record AdminShowtimeCleanupRequest(
        String password,
        LocalDateTime before
) {
}
