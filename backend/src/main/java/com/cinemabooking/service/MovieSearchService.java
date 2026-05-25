package com.cinemabooking.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.cinemabooking.dto.MovieAutocompleteResponse;
import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.repository.MovieRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MovieSearchService {

    private static final double TRIGRAM_SIMILARITY_THRESHOLD = 0.2d;
    private static final int DEFAULT_AUTOCOMPLETE_LIMIT = 6;

    private final MovieRepository movieRepository;
    private final TmdbService tmdbService;

    public List<MovieResponse> searchMovies(String rawQuery) {
        if (rawQuery == null || rawQuery.isBlank()) {
            return movieRepository.findAll()
                    .stream()
                    .sorted(Comparator.comparing(Movie::getTitle))
                    .map(tmdbService::toStoredMovieResponse)
                    .toList();
        }

        String trimmedQuery = rawQuery.trim();
        String tsQuery = MovieSearchQueryFormatter.buildPrefixTsQuery(trimmedQuery);
        String prefixPattern = MovieSearchQueryFormatter.buildPrefixLikePattern(trimmedQuery);

        if (tsQuery.isBlank()) {
            return List.of();
        }

        return movieRepository.searchByQuery(
                        trimmedQuery,
                        tsQuery,
                        prefixPattern,
                        TRIGRAM_SIMILARITY_THRESHOLD
                )
                .stream()
                .map(tmdbService::toStoredMovieResponse)
                .toList();
    }

    public List<MovieAutocompleteResponse> autocompleteMovies(String rawQuery, Integer limit) {
        if (rawQuery == null || rawQuery.isBlank()) {
            return List.of();
        }

        String trimmedQuery = rawQuery.trim();
        String tsQuery = MovieSearchQueryFormatter.buildPrefixTsQuery(trimmedQuery);

        if (tsQuery.isBlank()) {
            return List.of();
        }

        int maxResults = limit == null
                ? DEFAULT_AUTOCOMPLETE_LIMIT
                : Math.max(1, Math.min(limit, 10));

        return movieRepository.autocompleteByTitle(
                        trimmedQuery,
                        tsQuery,
                        MovieSearchQueryFormatter.buildPrefixLikePattern(trimmedQuery),
                        TRIGRAM_SIMILARITY_THRESHOLD,
                        PageRequest.of(0, maxResults)
                )
                .stream()
                .map(movie -> new MovieAutocompleteResponse(
                        movie.getId(),
                        movie.getTitle(),
                        movie.getPosterUrl(),
                        movie.getReleaseDate()
                ))
                .toList();
    }
}
