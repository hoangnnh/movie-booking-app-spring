package com.cinemabooking.dto;

import java.time.LocalDate;
import java.util.UUID;

public record MovieAutocompleteResponse(
        UUID id,
        String title,
        String posterUrl,
        LocalDate releaseDate
) {
}
