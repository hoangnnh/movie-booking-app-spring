package com.cinemabooking.service;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.cinemabooking.dto.MovieAutocompleteResponse;
import com.cinemabooking.dto.MovieListItemResponse;
import com.cinemabooking.dto.PageResponse;
import com.cinemabooking.enums.MovieDisplayStatus;
import com.cinemabooking.repository.MovieRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MovieSearchService {

    private static final double TRIGRAM_SIMILARITY_THRESHOLD = 0.2d;
    private static final int DEFAULT_AUTOCOMPLETE_LIMIT = 6;

    private final MovieRepository movieRepository;
    private final TmdbService tmdbService;

    public PageResponse<MovieListItemResponse> searchMovies(
            MovieDisplayStatus displayStatus,
            String rawQuery,
            String rawGenre,
            int page,
            int size
    ) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        String genre = rawGenre == null ? "" : rawGenre.trim();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 48));
        PageRequest pageRequest = PageRequest.of(safePage, safeSize, catalogSort(displayStatus));

        return PageResponse.from(
                movieRepository.findCatalogMovies(displayStatus, query, genre, pageRequest),
                tmdbService::toMovieListItemResponse
        );
    }

    private Sort catalogSort(MovieDisplayStatus displayStatus) {
        if (displayStatus == MovieDisplayStatus.SHOWING_NOW) {
            return Sort.by(
                    Sort.Order.desc("releaseDate").nullsLast(),
                    Sort.Order.desc("createdAt"),
                    Sort.Order.asc("title")
            );
        }

        if (displayStatus == MovieDisplayStatus.COMING_SOON) {
            return Sort.by(
                    Sort.Order.asc("releaseDate").nullsLast(),
                    Sort.Order.desc("createdAt"),
                    Sort.Order.asc("title")
            );
        }

        return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("title"));
    }

    public List<String> getGenres(MovieDisplayStatus displayStatus) {
        return movieRepository.findGenreNamesByDisplayStatus(displayStatus);
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
