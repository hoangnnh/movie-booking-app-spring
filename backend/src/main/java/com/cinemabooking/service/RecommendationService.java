package com.cinemabooking.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.ToDoubleFunction;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.ai.ContentBasedRecommendationEngine;
import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.entity.Booking;
import com.cinemabooking.entity.Favorite;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.enums.BookingStatus;
import com.cinemabooking.repository.BookingRepository;
import com.cinemabooking.repository.FavoriteRepository;
import com.cinemabooking.repository.MovieRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final MovieRepository movieRepository;
    private final FavoriteRepository favoriteRepository;
    private final BookingRepository bookingRepository;
    private final TmdbService tmdbService;
    private final ContentBasedRecommendationEngine recommendationEngine;

    @Transactional(readOnly = true)
    public List<MovieResponse> getRecommendationsForUser(UUID authenticatedUserId, UUID userId, Integer limit) {
        if (!authenticatedUserId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own recommendations");
        }

        int normalizedLimit = normalizeLimit(limit, 10);
        List<Movie> allMovies = movieRepository.findAllByOrderByCreatedAtDescTitleAsc();

        Map<UUID, Movie> seedMoviesById = new LinkedHashMap<>();

        favoriteRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(Favorite::getMovie)
                .forEach((movie) -> seedMoviesById.put(movie.getId(), movie));

        bookingRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                .filter((booking) -> booking.getStatus() == BookingStatus.CONFIRMED)
                .map(Booking::getShowtime)
                .map((showtime) -> showtime.getMovie())
                .forEach((movie) -> seedMoviesById.put(movie.getId(), movie));

        if (seedMoviesById.isEmpty()) {
            return rankMovies(
                    allMovies,
                    (movie) -> coldStartScore(movie),
                    normalizedLimit
            );
        }

        Set<UUID> excludedMovieIds = seedMoviesById.keySet();
        var profile = recommendationEngine.buildProfile(new ArrayList<>(seedMoviesById.values()));

        return rankMovies(
                allMovies.stream()
                        .filter((movie) -> !excludedMovieIds.contains(movie.getId()))
                        .toList(),
                (movie) -> recommendationEngine.scoreForUserProfile(movie, profile),
                normalizedLimit
        );
    }

    @Transactional(readOnly = true)
    public List<MovieResponse> getSimilarMovies(UUID movieId, Integer limit) {
        Movie sourceMovie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        int normalizedLimit = normalizeLimit(limit, 8);
        List<Movie> candidates = movieRepository.findAllByOrderByCreatedAtDescTitleAsc().stream()
                .filter((movie) -> !movie.getId().equals(movieId))
                .toList();

        return rankMovies(
                candidates,
                (movie) -> recommendationEngine.scoreSimilarMovie(sourceMovie, movie),
                normalizedLimit
        );
    }

    private List<MovieResponse> rankMovies(List<Movie> movies, ToDoubleFunction<Movie> scorer, int limit) {
        return movies.stream()
                .map((movie) -> Map.entry(movie, scorer.applyAsDouble(movie)))
                .filter((entry) -> entry.getValue() > 0)
                .sorted(Map.Entry.<Movie, Double>comparingByValue(Comparator.reverseOrder())
                        .thenComparing((left, right) -> compareRatings(right.getKey(), left.getKey()))
                        .thenComparing((left, right) -> compareReleaseDates(right.getKey(), left.getKey()))
                        .thenComparing((left, right) -> left.getKey().getTitle().compareToIgnoreCase(right.getKey().getTitle())))
                .limit(limit)
                .map(Map.Entry::getKey)
                .map(tmdbService::toStoredMovieResponse)
                .collect(Collectors.toList());
    }

    private double coldStartScore(Movie movie) {
        double score = movie.getRating() == null ? 0.0 : movie.getRating();
        if (movie.getReleaseDate() != null) {
            int recencyBoost = Math.max(0, 5 - Math.abs(java.time.LocalDate.now().getYear() - movie.getReleaseDate().getYear()));
            score += recencyBoost * 0.35;
        }
        return score;
    }

    private int normalizeLimit(Integer limit, int defaultValue) {
        if (limit == null) {
            return defaultValue;
        }

        return Math.max(1, Math.min(limit, 20));
    }

    private int compareRatings(Movie left, Movie right) {
        return Comparator.nullsLast(Double::compareTo).compare(left.getRating(), right.getRating());
    }

    private int compareReleaseDates(Movie left, Movie right) {
        return Comparator.nullsLast(java.time.LocalDate::compareTo).compare(left.getReleaseDate(), right.getReleaseDate());
    }
}
