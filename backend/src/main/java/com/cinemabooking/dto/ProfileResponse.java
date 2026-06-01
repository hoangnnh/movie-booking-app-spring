package com.cinemabooking.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ProfileResponse(
        UUID userId,
        String fullName,
        String email,
        String phoneNumber,
        LocalDate dateOfBirth,
        String gender,
        String avatarUrl,
        String provider
) {
}
