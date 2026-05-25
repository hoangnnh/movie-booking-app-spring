package com.cinemabooking.security;

import java.util.UUID;

public record AuthenticatedUser(
        UUID userId,
        String fullName,
        String email,
        String role
) {
    public boolean hasRole(String expectedRole) {
        return role != null && role.equalsIgnoreCase(expectedRole);
    }
}
