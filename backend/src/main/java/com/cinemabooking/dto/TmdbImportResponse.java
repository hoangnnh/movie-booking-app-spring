package com.cinemabooking.dto;

import java.util.List;

public record TmdbImportResponse(
        String list,
        int requestedPages,
        int scannedPages,
        int importedCount,
        int createdCount,
        int updatedCount,
        List<MovieResponse> movies
) {
}
