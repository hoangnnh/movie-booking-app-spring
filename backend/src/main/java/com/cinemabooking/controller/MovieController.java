package com.cinemabooking.controller;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.entity.Genre;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.repository.MovieRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieRepository movieRepository;

    @GetMapping
    public List<MovieResponse> getAllMovies() {
        return movieRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Movie::getTitle))
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public MovieResponse getMovieById(@PathVariable UUID id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        return toResponse(movie);
    }

    private MovieResponse toResponse(Movie movie) {
        List<String> genres = movie.getGenres()
                .stream()
                .map(Genre::getName)
                .sorted()
                .toList();

        return new MovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getDescription(),
                movie.getDurationMinutes(),
                movie.getPosterUrl(),
                movie.getReleaseDate(),
                genres
        );
    }
}