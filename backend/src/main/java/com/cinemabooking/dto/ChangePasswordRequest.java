package com.cinemabooking.dto;

public record ChangePasswordRequest(
        String currentPassword,
        String newPassword,
        String confirmNewPassword
) {
}
