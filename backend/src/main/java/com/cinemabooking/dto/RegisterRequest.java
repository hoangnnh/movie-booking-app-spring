package com.cinemabooking.dto;

public record RegisterRequest(
        String fullName,
        String email,
        String password
) {
}