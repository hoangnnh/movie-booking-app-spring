package com.cinemabooking.controller;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.MovieAutocompleteResponse;
import com.cinemabooking.dto.MovieListItemResponse;
import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.dto.PageResponse;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.enums.MovieDisplayStatus;
import com.cinemabooking.repository.MovieRepository;
import com.cinemabooking.service.MovieSearchService;
import com.cinemabooking.service.RecommendationService;
import com.cinemabooking.service.TmdbService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieRepository movieRepository;
    private final TmdbService tmdbService;
    private final MovieSearchService movieSearchService;
    private final RecommendationService recommendationService;

    @GetMapping
    public PageResponse<MovieListItemResponse> getMovies(
            @RequestParam(defaultValue = "SHOWING_NOW") String status,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String genre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return movieSearchService.searchMovies(parseDisplayStatus(status), query, genre, page, size);
    }

    @GetMapping("/now-playing")
    public List<MovieListItemResponse> getNowPlayingMovies(@RequestParam(defaultValue = "10") int limit) {
        return tmdbService.getNowPlayingMovies(limit);
    }

    @GetMapping("/trending/week")
    public List<MovieListItemResponse> getTrendingMoviesThisWeek(@RequestParam(defaultValue = "10") int limit) {
        return tmdbService.getTrendingMoviesThisWeek(limit);
    }

    @GetMapping("/coming-soon")
    public List<MovieListItemResponse> getComingSoonMovies(@RequestParam(defaultValue = "10") int limit) {
        return tmdbService.getComingSoonMovies(limit);
    }

    @GetMapping("/genres")
    public List<String> getGenres(@RequestParam(defaultValue = "SHOWING_NOW") String status) {
        return movieSearchService.getGenres(parseDisplayStatus(status));
    }

    @GetMapping("/autocomplete")
    public List<MovieAutocompleteResponse> autocompleteMovies(
            @RequestParam String query,
            @RequestParam(required = false) Integer limit
    ) {
        return movieSearchService.autocompleteMovies(query, limit);
    }

    @GetMapping("/by-actor")
    public List<MovieListItemResponse> getMoviesByActor(@RequestParam String actorName) {
        if (actorName == null || actorName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Actor name is required");
        }

        return movieRepository.findAllByActorName(actorName.trim())
                .stream()
                .sorted(Comparator.comparing(Movie::getTitle))
                .map(tmdbService::toMovieListItemResponse)
                .toList();
    }

    @GetMapping("/{reference}")
    public MovieResponse getMovieByReference(@PathVariable String reference) {
        Movie movie = findMovieByReference(reference);

        return tmdbService.toMovieDetailResponse(movie);
    }

    private Movie findMovieByReference(String reference) {
        String normalizedReference = reference.endsWith(".html")
                ? reference.substring(0, reference.length() - 5)
                : reference;

        try {
            UUID id = UUID.fromString(normalizedReference);
            return movieRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
        } catch (IllegalArgumentException exception) {
            return movieRepository.findBySlug(normalizedReference)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
        }
    }

    private MovieDisplayStatus parseDisplayStatus(String value) {
        try {
            return MovieDisplayStatus.valueOf(value.trim().toUpperCase());
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Movie status must be SHOWING_NOW, COMING_SOON, or HIDDEN"
            );
        }
    }

    @GetMapping("/{id}/similar")
    public List<MovieResponse> getSimilarMovies(
            @PathVariable UUID id,
            @RequestParam(required = false) Integer limit
    ) {
        return recommendationService.getSimilarMovies(id, limit);
    }
}
