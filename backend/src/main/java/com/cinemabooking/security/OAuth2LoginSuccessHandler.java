package com.cinemabooking.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.cinemabooking.dto.AuthResponse;
import com.cinemabooking.service.AuthService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;

    @Value("${app.frontend.oauth-success-url}")
    private String frontendSuccessUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        AuthResponse authResponse = authService.loginWithGoogle(oauth2User);

        String redirectUrl = UriComponentsBuilder
                .fromUriString(frontendSuccessUrl)
                .queryParam("token", authResponse.accessToken())
                .queryParam("userId", authResponse.userId())
                .queryParam("fullName", authResponse.fullName())
                .queryParam("email", authResponse.email())
                .queryParam("role", authResponse.role())
                .queryParam("provider", authResponse.provider())
                .encode()
                .build()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }
}
