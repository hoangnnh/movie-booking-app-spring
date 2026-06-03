package com.cinemabooking.dto;

import java.util.List;

public record MovieAdvisorResponse(
        String reply,
        List<String> detectedPreferences,
        List<MovieAdvisorSuggestionResponse> suggestions
) {
}
