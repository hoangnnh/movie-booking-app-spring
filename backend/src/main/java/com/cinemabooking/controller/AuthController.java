package com.cinemabooking.controller;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cinemabooking.dto.AuthResponse;
import com.cinemabooking.dto.AuthSettingsResponse;
import com.cinemabooking.dto.ForgotPasswordRequest;
import com.cinemabooking.dto.LoginRequest;
import com.cinemabooking.dto.MessageResponse;
import com.cinemabooking.dto.RegisterRequest;
import com.cinemabooking.dto.ResetPasswordRequest;
import com.cinemabooking.security.AuthenticatedUser;
import com.cinemabooking.service.AuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    @Value("${GOOGLE_CLIENT_SECRET:}")
    private String googleClientSecret;

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/settings")
    public AuthSettingsResponse settings() {
        return new AuthSettingsResponse(
                StringUtils.hasText(googleClientId) && StringUtils.hasText(googleClientSecret)
        );
    }

    @GetMapping("/me")
    public AuthResponse me(Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        return authService.getCurrentUser(authenticatedUser);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(
            @RequestParam String token,
            @Value("${app.frontend.base-url}") String frontendUrl) {
        authService.verifyEmail(token);
        return ResponseEntity.status(302)
                .location(URI.create(frontendUrl + "?verified=true"))
                .build();
    }

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(new MessageResponse(
                "Registration successful! Please check your email to verify your account."
        ));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<MessageResponse> resendVerification(@RequestBody ForgotPasswordRequest request) {
        authService.resendVerificationEmail(request.email());
        return ResponseEntity.ok(new MessageResponse("Verification email has been sent."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.ok(new MessageResponse("Password reset link has been sent to your email."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new MessageResponse("Password has been reset successfully."));
    }
}
