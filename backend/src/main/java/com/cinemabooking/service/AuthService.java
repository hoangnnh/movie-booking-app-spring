package com.cinemabooking.service;

import java.time.LocalDateTime;
import java.util.UUID;

import com.cinemabooking.dto.ResetPasswordRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.AuthResponse;
import com.cinemabooking.dto.ChangePasswordRequest;
import com.cinemabooking.dto.LoginRequest;
import com.cinemabooking.dto.ProfileResponse;
import com.cinemabooking.dto.RegisterRequest;
import com.cinemabooking.dto.UpdateProfileRequest;
import com.cinemabooking.dto.UpdateAvatarRequest;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.enums.AuthProvider;
import com.cinemabooking.enums.Role;
import com.cinemabooking.repository.AppUserRepository;
import com.cinemabooking.security.AuthenticatedUser;
import com.cinemabooking.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Value("${app.auth.verification-token-expiry-hours:24}")
    private long verificationTokenExpiryHours;

    @Transactional
    public void register(RegisterRequest request) {
        boolean emailExists = appUserRepository.findByEmail(request.email()).isPresent();
        if (emailExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        String verificationToken = UUID.randomUUID().toString();

        AppUser user = new AppUser();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(requirePassword(request.password(), "Password", 8)));
        user.setRole(Role.USER);
        user.setProvider(AuthProvider.LOCAL);
        user.setEmailVerified(false);
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiry(newVerificationTokenExpiry());

        appUserRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), verificationToken);
        // Không trả AuthResponse nữa — user phải verify email trước
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!user.isEmailVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Please verify your email before logging in");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return toAuthResponse(user);
    }

    public AuthResponse getCurrentUser(AuthenticatedUser authenticatedUser) {
        AppUser user = appUserRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        return toAuthResponse(user);
    }

    public ProfileResponse getProfile(AuthenticatedUser authenticatedUser) {
        return toProfileResponse(findCurrentUser(authenticatedUser));
    }

    @Transactional
    public ProfileResponse updateProfile(AuthenticatedUser authenticatedUser, UpdateProfileRequest request) {
        AppUser user = findCurrentUser(authenticatedUser);
        String fullName = normalizeRequired(request.fullName(), "Full name", 150);
        String phoneNumber = normalizeOptional(request.phoneNumber(), "Phone number", 30);
        String gender = normalizeGender(request.gender());
        String avatarUrl = normalizeAvatarUrl(request.avatarUrl());

        user.setFullName(fullName);
        user.setPhoneNumber(phoneNumber);
        user.setDateOfBirth(request.dateOfBirth());
        user.setGender(gender);
        user.setAvatarUrl(avatarUrl);

        return toProfileResponse(appUserRepository.save(user));
    }

    @Transactional
    public ProfileResponse updateAvatar(AuthenticatedUser authenticatedUser, UpdateAvatarRequest request) {
        AppUser user = findCurrentUser(authenticatedUser);
        user.setAvatarUrl(normalizeAvatarUrl(request.avatarUrl()));
        return toProfileResponse(appUserRepository.save(user));
    }

    @Transactional
    public void changePassword(AuthenticatedUser authenticatedUser, ChangePasswordRequest request) {
        AppUser user = findCurrentUser(authenticatedUser);

        if (user.getProvider() != AuthProvider.LOCAL) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password changes are unavailable for this account"
            );
        }

        String currentPassword = requirePassword(request.currentPassword(), "Current password", 1);
        String newPassword = requirePassword(request.newPassword(), "New password", 8);

        if (!newPassword.equals(request.confirmNewPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New passwords do not match");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        appUserRepository.save(user);
        notificationService.createPasswordChangedNotification(user);
    }

    public AuthResponse loginWithGoogle(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google account email is unavailable");
        }

        String fullName = oauth2User.getAttribute("name");

        AppUser user = appUserRepository.findByEmail(email)
                .orElseGet(() -> createGoogleUser(fullName, email));

        if (user.getFullName() == null || user.getFullName().isBlank()) {
            user.setFullName(resolveDisplayName(fullName, email));
            user = appUserRepository.save(user);
        }

        return toAuthResponse(user);
    }

    private AppUser createGoogleUser(String fullName, String email) {
        AppUser user = new AppUser();
        user.setFullName(resolveDisplayName(fullName, email));
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setRole(Role.USER);
        user.setProvider(AuthProvider.GOOGLE);
        user.setEmailVerified(true);
        return appUserRepository.save(user);
    }

    private String resolveDisplayName(String fullName, String email) {
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }

        int atIndex = email.indexOf("@");
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    }

    private AuthResponse toAuthResponse(AppUser user) {
        return new AuthResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getProvider().name(),
                user.getAvatarUrl(),
                jwtService.generateToken(user)
        );
    }

    private ProfileResponse toProfileResponse(AppUser user) {
        return new ProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getAvatarUrl(),
                user.getProvider().name()
        );
    }

    private AppUser findCurrentUser(AuthenticatedUser authenticatedUser) {
        return appUserRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private String normalizeRequired(String value, String fieldName, int maxLength) {
        String normalizedValue = value == null ? "" : value.trim();

        if (normalizedValue.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
        }

        if (normalizedValue.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is too long");
        }

        return normalizedValue;
    }

    private String normalizeOptional(String value, String fieldName, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalizedValue = value.trim();

        if (normalizedValue.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is too long");
        }

        return normalizedValue;
    }

    private String normalizeGender(String gender) {
        if (gender == null || gender.isBlank()) {
            return null;
        }

        String normalizedGender = gender.trim().toUpperCase();

        if (!normalizedGender.equals("MALE")
                && !normalizedGender.equals("FEMALE")
                && !normalizedGender.equals("OTHER")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gender is invalid");
        }

        return normalizedGender;
    }

    private String requirePassword(String value, String fieldName, int minLength) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
        }

        if (value.length() < minLength) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " must contain at least " + minLength + " characters"
            );
        }

        return value;
    }

    private String normalizeAvatarUrl(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return null;
        }

        if (avatarUrl.length() > 500_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile photo is too large");
        }

        if (!avatarUrl.startsWith("data:image/jpeg;base64,")
                && !avatarUrl.startsWith("data:image/png;base64,")
                && !avatarUrl.startsWith("data:image/webp;base64,")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile photo format is invalid");
        }

        return avatarUrl;
    }

    // ── Confirm email ─────────────────────────────────────────
    @Transactional
    public void verifyEmail(String token) {
        String verificationToken = normalizeRequired(token, "Verification token", 100);
        AppUser user = appUserRepository.findByVerificationToken(verificationToken)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid or expired verification token"));

        if (user.getVerificationTokenExpiry() == null
                || user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid or expired verification token");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        appUserRepository.save(user);
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Email not found"));

        if (user.getProvider() != AuthProvider.LOCAL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This account uses " + user.getProvider() + " login. Email verification is not available.");
        }

        if (user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already verified");
        }

        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiry(newVerificationTokenExpiry());
        appUserRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), verificationToken);
    }

    // ── Forgot password ────────────────────────────────────────
    @Transactional
    public void forgotPassword(String email) {
        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Email not found"));

        if (user.getProvider() != AuthProvider.LOCAL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This account uses " + user.getProvider() + " login. Password reset is not available.");
        }

        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        appUserRepository.save(user);

        emailService.sendPasswordResetEmail(email, token);
    }

    // ── Reset password ─────────────────────────────────────────
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String token = normalizeRequired(request.token(), "Reset token", 100);
        String newPassword = requirePassword(request.newPassword(), "New password", 8);

        AppUser user = appUserRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid reset token"));

        if (user.getResetTokenExpiry() == null ||
                user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetTokenExpiry(null);
        appUserRepository.save(user);
        notificationService.createPasswordChangedNotification(user);
    }

    private LocalDateTime newVerificationTokenExpiry() {
        return LocalDateTime.now().plusHours(verificationTokenExpiryHours);
    }
}
