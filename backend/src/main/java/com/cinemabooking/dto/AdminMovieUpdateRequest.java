package com.cinemabooking.dto;

import java.time.LocalDate;

public record AdminMovieUpdateRequest(
        String title,
        String description,
        Integer durationMinutes,
        String posterUrl,
        String backdropUrl,
        LocalDate releaseDate,
        Double rating
) {
}
