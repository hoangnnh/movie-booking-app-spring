package com.cinemabooking.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MovieListItemResponse(
        UUID id,
        String title,
        String slug,
        Integer durationMinutes,
        String posterUrl,
        String trailerUrl,
        LocalDate releaseDate,
        Double rating,
        String ageRating,
        String displayStatus,
        List<String> genres
) {
}
