package com.cinemabooking.dto;

public record LoginRequest(
        String email,
        String password
) {
}