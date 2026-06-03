package com.cinemabooking.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.MovieReviewRequest;
import com.cinemabooking.dto.MovieReviewResponse;
import com.cinemabooking.dto.MovieReviewSummaryResponse;
import com.cinemabooking.dto.MovieReviewsResponse;
import com.cinemabooking.entity.AppUser;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.MovieReview;
import com.cinemabooking.repository.AppUserRepository;
import com.cinemabooking.repository.MovieRepository;
import com.cinemabooking.repository.MovieReviewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MovieReviewService {

    private final MovieRepository movieRepository;
    private final AppUserRepository appUserRepository;
    private final MovieReviewRepository movieReviewRepository;

    @Transactional(readOnly = true)
    public MovieReviewsResponse getMovieReviews(UUID movieId, UUID currentUserId) {
        ensureMovieExists(movieId);

        List<MovieReview> reviews = movieReviewRepository.findByMovie_IdOrderByCreatedAtDesc(movieId);

        return new MovieReviewsResponse(
                summarize(reviews),
                reviews.stream()
                        .map(review -> toResponse(review, currentUserId))
                        .toList()
        );
    }

    @Transactional
    public MovieReviewResponse saveReview(UUID movieId, UUID userId, MovieReviewRequest request) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        MovieReview review = movieReviewRepository.findByMovie_IdAndUser_Id(movieId, userId)
                .orElseGet(MovieReview::new);

        review.setMovie(movie);
        review.setUser(user);
        review.setScore(normalizeScore(request.score()));
        review.setTitle(requireText(request.title(), "Review title", 120));
        review.setBody(requireText(request.body(), "Review body", 2_000));

        return toResponse(movieReviewRepository.save(review), userId);
    }

    private void ensureMovieExists(UUID movieId) {
        if (!movieRepository.existsById(movieId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found");
        }
    }

    private MovieReviewSummaryResponse summarize(List<MovieReview> reviews) {
        long total = reviews.size();
        double average = total == 0
                ? 0.0
                : reviews.stream()
                        .mapToInt(MovieReview::getScore)
                        .average()
                        .orElse(0.0);

        long positive = reviews.stream().filter(review -> review.getScore() >= 8).count();
        long averageCount = reviews.stream()
                .filter(review -> review.getScore() >= 5 && review.getScore() < 8)
                .count();
        long negative = reviews.stream().filter(review -> review.getScore() < 5).count();

        return new MovieReviewSummaryResponse(total, average, positive, averageCount, negative);
    }

    private MovieReviewResponse toResponse(MovieReview review, UUID currentUserId) {
        AppUser user = review.getUser();
        UUID userId = user.getId();

        return new MovieReviewResponse(
                review.getId(),
                review.getMovie().getId(),
                userId,
                user.getFullName(),
                user.getAvatarUrl(),
                review.getScore(),
                review.getTitle(),
                review.getBody(),
                review.getCreatedAt(),
                review.getUpdatedAt(),
                currentUserId != null && currentUserId.equals(userId)
        );
    }

    private Integer normalizeScore(Integer score) {
        if (score == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review score is required");
        }

        if (score < 1 || score > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review score must be between 1 and 10");
        }

        return score;
    }

    private String requireText(String value, String label, int maxLength) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }

        String normalized = value.trim();

        if (normalized.length() > maxLength) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    label + " must be " + maxLength + " characters or fewer"
            );
        }

        return normalized;
    }
}
