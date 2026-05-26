package com.cinemabooking.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinemabooking.dto.FavoriteStatusResponse;
import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.security.AuthenticatedUser;
import com.cinemabooking.service.FavoriteService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users/{userId}/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public List<MovieResponse> getFavorites(
            Authentication authentication,
            @PathVariable UUID userId
    ) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        return favoriteService.getFavorites(authenticatedUser.userId(), userId);
    }

    @GetMapping("/{movieId}")
    public FavoriteStatusResponse getFavoriteStatus(
            Authentication authentication,
            @PathVariable UUID userId,
            @PathVariable UUID movieId
    ) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        return favoriteService.getFavoriteStatus(authenticatedUser.userId(), userId, movieId);
    }

    @PostMapping("/{movieId}")
    public FavoriteStatusResponse addFavorite(
            Authentication authentication,
            @PathVariable UUID userId,
            @PathVariable UUID movieId
    ) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        return favoriteService.addFavorite(authenticatedUser.userId(), userId, movieId);
    }

    @DeleteMapping("/{movieId}")
    public FavoriteStatusResponse removeFavorite(
            Authentication authentication,
            @PathVariable UUID userId,
            @PathVariable UUID movieId
    ) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        return favoriteService.removeFavorite(authenticatedUser.userId(), userId, movieId);
    }
}
