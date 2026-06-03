package com.cinemabooking.controller;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinemabooking.dto.MovieReviewRequest;
import com.cinemabooking.dto.MovieReviewResponse;
import com.cinemabooking.dto.MovieReviewsResponse;
import com.cinemabooking.security.AuthenticatedUser;
import com.cinemabooking.service.MovieReviewService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/movies/{movieId}/reviews")
@RequiredArgsConstructor
public class MovieReviewController {

    private final MovieReviewService movieReviewService;

    @GetMapping
    public MovieReviewsResponse getMovieReviews(
            Authentication authentication,
            @PathVariable UUID movieId
    ) {
        return movieReviewService.getMovieReviews(movieId, getAuthenticatedUserId(authentication));
    }

    @PostMapping
    public MovieReviewResponse saveReview(
            Authentication authentication,
            @PathVariable UUID movieId,
            @RequestBody MovieReviewRequest request
    ) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        return movieReviewService.saveReview(movieId, authenticatedUser.userId(), request);
    }

    private UUID getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            return null;
        }

        return authenticatedUser.userId();
    }
}
