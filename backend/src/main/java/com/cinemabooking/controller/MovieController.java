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
import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.repository.MovieRepository;
import com.cinemabooking.service.MovieSearchService;
import com.cinemabooking.service.TmdbService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieRepository movieRepository;
    private final TmdbService tmdbService;
    private final MovieSearchService movieSearchService;

    @GetMapping
    public List<MovieResponse> getAllMovies(@RequestParam(required = false) String query) {
        return movieSearchService.searchMovies(query);
    }

    @GetMapping("/now-playing")
    public List<MovieResponse> getNowPlayingMovies(@RequestParam(defaultValue = "10") int limit) {
        return tmdbService.getNowPlayingMovies(limit);
    }

    @GetMapping("/trending/week")
    public List<MovieResponse> getTrendingMoviesThisWeek(@RequestParam(defaultValue = "10") int limit) {
        return tmdbService.getTrendingMoviesThisWeek(limit);
    }

    @GetMapping("/autocomplete")
    public List<MovieAutocompleteResponse> autocompleteMovies(
            @RequestParam String query,
            @RequestParam(required = false) Integer limit
    ) {
        return movieSearchService.autocompleteMovies(query, limit);
    }

    @GetMapping("/by-actor")
    public List<MovieResponse> getMoviesByActor(@RequestParam String actorName) {
        if (actorName == null || actorName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Actor name is required");
        }

        return movieRepository.findAllByActorName(actorName.trim())
                .stream()
                .sorted(Comparator.comparing(Movie::getTitle))
                .map(tmdbService::toStoredMovieResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public MovieResponse getMovieById(@PathVariable UUID id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        return tmdbService.toMovieDetailResponse(movie);
    }
}
