package com.cinemabooking.dto;

import java.util.List;

public record AdminShowtimeBulkResponse(
        int candidateCount,
        int createdCount,
        int conflictCount,
        List<AdminShowtimeBulkConflictResponse> conflicts
) {
}
