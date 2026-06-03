package com.cinemabooking.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MovieAdvisorRequest(
        @NotBlank
        @Size(max = 500)
        String message,
        UUID currentMovieId
) {
}
