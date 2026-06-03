package com.cinemabooking.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MovieAdvisorSuggestionResponse(
        UUID id,
        String title,
        String slug,
        String posterUrl,
        LocalDate releaseDate,
        Double rating,
        String ageRating,
        Integer durationMinutes,
        String displayStatus,
        List<String> genres,
        String reason
) {
}
