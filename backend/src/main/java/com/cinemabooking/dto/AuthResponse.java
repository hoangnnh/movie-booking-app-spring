package com.cinemabooking.dto;

import java.util.UUID;

public record AuthResponse(
        UUID userId,
        String fullName,
        String email,
        String role,
        String provider,
        String avatarUrl,
        String accessToken
) {
}
