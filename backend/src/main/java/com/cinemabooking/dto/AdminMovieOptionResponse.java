package com.cinemabooking.dto;

import java.util.UUID;

public record AdminMovieOptionResponse(
        UUID id,
        String title,
        Integer durationMinutes,
        String displayStatus
) {
}
