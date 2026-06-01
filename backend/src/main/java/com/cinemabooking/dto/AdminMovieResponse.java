package com.cinemabooking.dto;

import java.time.LocalDate;
import java.util.UUID;

public record AdminMovieResponse(
        UUID id,
        String title,
        String description,
        Integer durationMinutes,
        String posterUrl,
        String backdropUrl,
        LocalDate releaseDate,
        Double rating,
        String ageRating,
        String displayStatus
) {
}
