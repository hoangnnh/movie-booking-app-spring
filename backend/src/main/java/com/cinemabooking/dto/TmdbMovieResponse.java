package com.cinemabooking.dto;

import java.time.LocalDate;

public record TmdbMovieResponse(
        Integer tmdbId,
        String title,
        String overview,
        String posterUrl,
        LocalDate releaseDate,
        Double rating
) {
}
