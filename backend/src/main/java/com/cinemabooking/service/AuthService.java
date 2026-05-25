package com.cinemabooking.service;

import java.time.LocalDateTime;
import java.util.UUID;

import com.cinemabooking.dto.ResetPasswordRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.AuthResponse;
import com.cinemabooking.dto.LoginRequest;
import com.cinemabooking.dto.RegisterRequest;
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
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        user.setProvider(AuthProvider.LOCAL);
        user.setEmailVerified(false);
        user.setVerificationToken(verificationToken);

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
                jwtService.generateToken(user)
        );
    }

    // Thêm dependency
    private final EmailService emailService;



    // ── Confirm email ─────────────────────────────────────────
    @Transactional
    public void verifyEmail(String token) {
        AppUser user = appUserRepository.findByVerificationToken(token)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid or expired verification token"));

        user.setEmailVerified(true);
        user.setVerificationToken(null);
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
        AppUser user = appUserRepository.findByResetPasswordToken(request.token())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid reset token"));

        if (user.getResetTokenExpiry() == null ||
                user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setResetPasswordToken(null);
        user.setResetTokenExpiry(null);
        appUserRepository.save(user);
    }
}
