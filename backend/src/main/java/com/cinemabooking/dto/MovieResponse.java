package com.cinemabooking.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MovieResponse(
        UUID id,
        Integer tmdbId,
        String title,
        String description,
        Integer durationMinutes,
        String posterUrl,
        LocalDate releaseDate,
        List<String> genres
) {
}
