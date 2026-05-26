package com.cinemabooking.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String fullName,
        String email,
        String role,
        String provider,
        boolean emailVerified,
        LocalDateTime createdAt
) {
}
