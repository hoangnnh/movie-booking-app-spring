package com.cinemabooking.dto;

import java.time.LocalDate;

public record UpdateProfileRequest(
        String fullName,
        String phoneNumber,
        LocalDate dateOfBirth,
        String gender,
        String avatarUrl
) {
}
