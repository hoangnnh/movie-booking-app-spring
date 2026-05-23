package com.cinemabooking.service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.dto.TmdbImportResponse;
import com.cinemabooking.dto.TmdbMovieResponse;
import com.cinemabooking.dto.TmdbSearchResponse;
import com.cinemabooking.entity.Genre;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.repository.GenreRepository;
import com.cinemabooking.repository.MovieRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TmdbService {

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;

    @Value("${tmdb.api.base-url}")
    private String apiBaseUrl;

    @Value("${tmdb.api.image-base-url}")
    private String imageBaseUrl;

    @Value("${tmdb.api.read-access-token}")
    private String readAccessToken;

    public TmdbSearchResponse searchMovies(String query) {
        if (query == null || query.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search query is required");
        }

        Map<String, Object> body = tmdbClient()
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search/movie")
                        .queryParam("query", query)
                        .queryParam("include_adult", false)
                        .queryParam("language", "en-US")
                        .queryParam("page", 1)
                        .build())
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> results = listValue(body, "results");

        return new TmdbSearchResponse(
                results.stream()
                        .limit(12)
                        .map(this::toTmdbMovieResponse)
                        .toList()
        );
    }

    @Transactional
    public MovieResponse importMovie(Integer tmdbId) {
        if (tmdbId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TMDB movie id is required");
        }

        Map<String, Object> detail = tmdbClient()
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path("/movie/{tmdbId}")
                        .queryParam("language", "en-US")
                        .build(tmdbId))
                .retrieve()
                .body(Map.class);

        Movie movie = movieRepository.findByTmdbId(tmdbId)
                .orElseGet(Movie::new);

        movie.setTmdbId(tmdbId);
        movie.setTitle(stringValue(detail, "title", "Untitled Movie"));
        movie.setDescription(stringValue(detail, "overview", ""));
        movie.setDurationMinutes(intValue(detail, "runtime", 120));
        movie.setPosterUrl(imageUrl(stringValue(detail, "poster_path", "")));
        movie.setReleaseDate(dateValue(stringValue(detail, "release_date", "")));

        List<Map<String, Object>> genres = listValue(detail, "genres");
        movie.setGenres(new HashSet<>(genres.stream()
                .map((genreData) -> getOrCreateGenre(stringValue(genreData, "name", "Drama")))
                .toList()));

        return toMovieResponse(movieRepository.save(movie));
    }

    @Transactional
    public TmdbImportResponse importMoviesByList(String list, int pages) {
        String normalizedList = normalizeListName(list);
        int requestedPages = Math.max(1, Math.min(pages, 5));

        List<Integer> tmdbIds = java.util.stream.IntStream.rangeClosed(1, requestedPages)
                .boxed()
                .flatMap((page) -> fetchMovieList(normalizedList, page).stream())
                .map((movieData) -> intValue(movieData, "id", null))
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        List<MovieResponse> importedMovies = tmdbIds.stream()
                .map(this::importMovie)
                .toList();

        return new TmdbImportResponse(
                normalizedList,
                requestedPages,
                importedMovies.size(),
                importedMovies
        );
    }

    private List<Map<String, Object>> fetchMovieList(String list, int page) {
        Map<String, Object> body = tmdbClient()
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path("/movie/{list}")
                        .queryParam("language", "en-US")
                        .queryParam("page", page)
                        .build(list))
                .retrieve()
                .body(Map.class);

        return listValue(body, "results");
    }

    private String normalizeListName(String list) {
        if (list == null || list.isBlank()) {
            return "now_playing";
        }

        String normalized = list.trim().toLowerCase().replace("-", "_");

        if (List.of("now_playing", "popular", "top_rated", "upcoming").contains(normalized)) {
            return normalized;
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "List must be one of: now_playing, popular, top_rated, upcoming"
        );
    }

    private RestClient tmdbClient() {
        if (readAccessToken == null || readAccessToken.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "TMDB API token is not configured. Set TMDB_API_READ_ACCESS_TOKEN."
            );
        }

        return RestClient.builder()
                .baseUrl(apiBaseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + readAccessToken)
                .build();
    }

    private TmdbMovieResponse toTmdbMovieResponse(Map<String, Object> data) {
        return new TmdbMovieResponse(
                intValue(data, "id", null),
                stringValue(data, "title", "Untitled Movie"),
                stringValue(data, "overview", ""),
                imageUrl(stringValue(data, "poster_path", "")),
                dateValue(stringValue(data, "release_date", "")),
                doubleValue(data, "vote_average")
        );
    }

    private Genre getOrCreateGenre(String name) {
        return genreRepository.findByName(name)
                .orElseGet(() -> {
                    Genre genre = new Genre();
                    genre.setName(name);
                    return genreRepository.save(genre);
                });
    }

    private MovieResponse toMovieResponse(Movie movie) {
        List<String> genres = movie.getGenres()
                .stream()
                .map(Genre::getName)
                .sorted()
                .toList();

        return new MovieResponse(
                movie.getId(),
                movie.getTmdbId(),
                movie.getTitle(),
                movie.getDescription(),
                movie.getDurationMinutes(),
                movie.getPosterUrl(),
                movie.getReleaseDate(),
                genres
        );
    }

    private String imageUrl(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }

        if (path.startsWith("http")) {
            return path;
        }

        return imageBaseUrl + path;
    }

    private LocalDate dateValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return LocalDate.parse(value);
    }

    private String stringValue(Map<String, Object> data, String key, String fallback) {
        Object value = data == null ? null : data.get(key);
        return value == null ? fallback : value.toString();
    }

    private Integer intValue(Map<String, Object> data, String key, Integer fallback) {
        Object value = data == null ? null : data.get(key);

        if (value instanceof Number number) {
            return number.intValue();
        }

        return fallback;
    }

    private Double doubleValue(Map<String, Object> data, String key) {
        Object value = data == null ? null : data.get(key);

        if (value instanceof Number number) {
            return number.doubleValue();
        }

        return null;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> listValue(Map<String, Object> data, String key) {
        Object value = data == null ? null : data.get(key);

        if (value instanceof List<?> list) {
            return (List<Map<String, Object>>) list;
        }

        return List.of();
    }
}
