package com.cinemabooking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.ProfileResponse;
import com.cinemabooking.dto.ChangePasswordRequest;
import com.cinemabooking.dto.ResetPasswordRequest;
import com.cinemabooking.dto.UpdateProfileRequest;
import com.cinemabooking.dto.UpdateAvatarRequest;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.enums.AuthProvider;
import com.cinemabooking.repository.AppUserRepository;
import com.cinemabooking.security.AuthenticatedUser;
import com.cinemabooking.security.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmailService emailService;

    private AuthService authService;
    private UUID userId;
    private AppUser user;
    private AuthenticatedUser authenticatedUser;

    @BeforeEach
    void setUp() {
        authService = new AuthService(appUserRepository, passwordEncoder, jwtService, emailService);
        userId = UUID.randomUUID();
        user = new AppUser();
        user.setId(userId);
        user.setFullName("Original Name");
        user.setEmail("user@example.com");
        user.setProvider(AuthProvider.LOCAL);
        authenticatedUser = new AuthenticatedUser(userId, user.getFullName(), user.getEmail(), "USER");
    }

    @Test
    void updateProfileNormalizesAndPersistsPersonalInformation() {
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(appUserRepository.save(user)).thenReturn(user);

        ProfileResponse response = authService.updateProfile(
                authenticatedUser,
                new UpdateProfileRequest(
                        "  Updated Name  ",
                        "  0522664260  ",
                        LocalDate.of(2005, 3, 26),
                        " female ",
                        "data:image/webp;base64,avatar"
                )
        );

        assertThat(response.fullName()).isEqualTo("Updated Name");
        assertThat(response.phoneNumber()).isEqualTo("0522664260");
        assertThat(response.dateOfBirth()).isEqualTo(LocalDate.of(2005, 3, 26));
        assertThat(response.gender()).isEqualTo("FEMALE");
        assertThat(response.avatarUrl()).isEqualTo("data:image/webp;base64,avatar");
        verify(appUserRepository).save(user);
    }

    @Test
    void updateProfileRejectsUnsupportedGenderBeforeSaving() {
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.updateProfile(
                authenticatedUser,
                new UpdateProfileRequest("Updated Name", "", null, "unsupported", null)
        ))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(appUserRepository, never()).save(any());
    }

    @Test
    void changePasswordVerifiesCurrentPasswordAndPersistsEncodedReplacement() {
        user.setPassword("encoded-old-password");
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-password", user.getPassword())).thenReturn(true);
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-new-password");

        authService.changePassword(
                authenticatedUser,
                new ChangePasswordRequest("old-password", "new-password", "new-password")
        );

        assertThat(user.getPassword()).isEqualTo("encoded-new-password");
        verify(appUserRepository).save(user);
    }

    @Test
    void changePasswordRejectsMismatchedConfirmationBeforeEncoding() {
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.changePassword(
                authenticatedUser,
                new ChangePasswordRequest("old-password", "new-password", "different-password")
        ))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(appUserRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void updateAvatarPersistsResizedImageDataUrl() {
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(appUserRepository.save(user)).thenReturn(user);

        ProfileResponse response = authService.updateAvatar(
                authenticatedUser,
                new UpdateAvatarRequest("data:image/webp;base64,avatar")
        );

        assertThat(response.avatarUrl()).isEqualTo("data:image/webp;base64,avatar");
        verify(appUserRepository).save(user);
    }

    @Test
    void resetPasswordRejectsWeakReplacementBeforeSaving() {
        assertThatThrownBy(() -> authService.resetPassword(
                new ResetPasswordRequest("valid-token", "short")
        ))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(appUserRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void resetPasswordEncodesValidReplacementAndClearsToken() {
        user.setResetPasswordToken("valid-token");
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(5));
        when(appUserRepository.findByResetPasswordToken("valid-token")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-new-password");

        authService.resetPassword(new ResetPasswordRequest("valid-token", "new-password"));

        assertThat(user.getPassword()).isEqualTo("encoded-new-password");
        assertThat(user.getResetPasswordToken()).isNull();
        assertThat(user.getResetTokenExpiry()).isNull();
        verify(appUserRepository).save(user);
    }

    @Test
    void verifyEmailRejectsExpiredToken() {
        user.setVerificationToken("expired-token");
        user.setVerificationTokenExpiry(LocalDateTime.now().minusMinutes(1));
        when(appUserRepository.findByVerificationToken("expired-token")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.verifyEmail("expired-token"))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(appUserRepository, never()).save(any());
    }
}
