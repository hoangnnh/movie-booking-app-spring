package com.cinemabooking.dto;

public record ResetPasswordRequest(String token, String newPassword) {
}
