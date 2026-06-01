package com.cinemabooking.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MovieResponse(
        UUID id,
        Integer tmdbId,
        String title,
        String slug,
        String description,
        Integer durationMinutes,
        String posterUrl,
        String backdropUrl,
        String trailerUrl,
        LocalDate releaseDate,
        Double rating,
        String ageRating,
        String displayStatus,
        List<String> genres,
        List<MovieCastMemberResponse> cast
) {
}
