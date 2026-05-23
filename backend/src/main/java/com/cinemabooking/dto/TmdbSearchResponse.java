package com.cinemabooking.dto;

import java.util.List;

public record TmdbSearchResponse(
        List<TmdbMovieResponse> results
) {
}
