package com.cinemabooking.dto;

import java.util.List;

public record TmdbImportResponse(
        String list,
        int requestedPages,
        int importedCount,
        List<MovieResponse> movies
) {
}
