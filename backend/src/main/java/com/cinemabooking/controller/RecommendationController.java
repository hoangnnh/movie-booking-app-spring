package com.cinemabooking.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.security.AuthenticatedUser;
import com.cinemabooking.service.RecommendationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users/{userId}/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public List<MovieResponse> getRecommendations(
            Authentication authentication,
            @PathVariable UUID userId,
            @RequestParam(required = false) Integer limit
    ) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        return recommendationService.getRecommendationsForUser(authenticatedUser.userId(), userId, limit);
    }
}
