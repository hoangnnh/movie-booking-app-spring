package com.cinemabooking.service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.Comparator;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.MovieCastMemberResponse;
import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.dto.TmdbImportResponse;
import com.cinemabooking.dto.TmdbMovieResponse;
import com.cinemabooking.dto.TmdbSearchResponse;
import com.cinemabooking.entity.Genre;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.MovieCastMember;
import com.cinemabooking.entity.MovieListEntry;
import com.cinemabooking.repository.GenreRepository;
import com.cinemabooking.repository.MovieListEntryRepository;
import com.cinemabooking.repository.MovieRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TmdbService {

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;
    private final ShowtimeSeedService showtimeSeedService;
    private final MovieListEntryRepository movieListEntryRepository;

    private static final String NOW_PLAYING_CATEGORY = "now_playing";
    private static final String TRENDING_WEEK_CATEGORY = "trending_week";

    @Value("${tmdb.api.base-url}")
    private String apiBaseUrl;

    @Value("${tmdb.api.image-base-url}")
    private String imageBaseUrl;

    @Value("${tmdb.api.read-access-token}")
    private String readAccessToken;

    @Value("${tmdb.api.region:VN}")
    private String region;

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

        Map<String, Object> detail = fetchMovieDetail(tmdbId, true);

        Movie movie = movieRepository.findByTmdbId(tmdbId)
                .orElseGet(Movie::new);

        movie.setTmdbId(tmdbId);
        movie.setTitle(stringValue(detail, "title", "Untitled Movie"));
        movie.setDescription(stringValue(detail, "overview", ""));
        movie.setDurationMinutes(intValue(detail, "runtime", 120));
        movie.setPosterUrl(imageUrl(stringValue(detail, "poster_path", "")));
        movie.setBackdropUrl(imageUrl(stringValue(detail, "backdrop_path", "")));
        movie.setReleaseDate(dateValue(stringValue(detail, "release_date", "")));
        movie.setRating(doubleValue(detail, "vote_average"));

        List<Map<String, Object>> genres = listValue(detail, "genres");
        movie.setGenres(new HashSet<>(genres.stream()
                .map((genreData) -> getOrCreateGenre(stringValue(genreData, "name", "Drama")))
                .toList()));
        addCastMembersIfMissing(movie, toCastMembers(movie, mapValue(detail, "credits")));

        Movie savedMovie = movieRepository.save(movie);
        showtimeSeedService.createShowtimesForMovieIfMissing(savedMovie);

        return toStoredMovieResponse(savedMovie);
    }

    @Transactional
    public TmdbImportResponse importMoviesByList(String list, int pages) {
        String normalizedList = normalizeListName(list);
        int requestedPages = Math.max(1, Math.min(pages, 5));

        List<Integer> tmdbIds = fetchMovieDataForCategory(normalizedList, requestedPages)
                .stream()
                .map((movieData) -> intValue(movieData, "id", null))
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        List<MovieResponse> importedMovies = tmdbIds.stream()
                .map(this::importMovie)
                .toList();

        replaceMovieListEntries(normalizedList, importedMovies);

        return new TmdbImportResponse(
                normalizedList,
                requestedPages,
                importedMovies.size(),
                importedMovies
        );
    }

    @Transactional
    public TmdbImportResponse syncMovieList(String list, int pages) {
        return importMoviesByList(list, pages);
    }

    @Transactional
    public List<MovieResponse> getNowPlayingMovies(int limit) {
        return getStoredMoviesByCategory(NOW_PLAYING_CATEGORY, limit);
    }

    @Transactional
    public List<MovieResponse> getTrendingMoviesThisWeek(int limit) {
        return getStoredMoviesByCategory(TRENDING_WEEK_CATEGORY, limit);
    }

    private List<Map<String, Object>> fetchMovieList(String list, int page) {
        Map<String, Object> body = tmdbClient()
                .get()
                .uri(uriBuilder -> {
                    uriBuilder
                            .path("/movie/{list}")
                            .queryParam("language", "en-US")
                            .queryParam("page", page);

                    if (region != null && !region.isBlank()) {
                        uriBuilder.queryParam("region", region.trim());
                    }

                    return uriBuilder.build(list);
                })
                .retrieve()
                .body(Map.class);

        return listValue(body, "results");
    }

    private List<Map<String, Object>> fetchTrendingMovies(String timeWindow) {
        Map<String, Object> body = tmdbClient()
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path("/trending/movie/{timeWindow}")
                        .queryParam("language", "en-US")
                        .build(timeWindow))
                .retrieve()
                .body(Map.class);

        return listValue(body, "results");
    }

    private List<MovieResponse> getStoredMoviesByCategory(String category, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));

        return movieListEntryRepository.findByCategoryOrderBySortOrderAsc(category)
                .stream()
                .limit(safeLimit)
                .map(MovieListEntry::getMovie)
                .map(this::toStoredMovieResponse)
                .toList();
    }

    private List<Map<String, Object>> fetchMovieDataForCategory(String category, int pages) {
        if (TRENDING_WEEK_CATEGORY.equals(category)) {
            return fetchTrendingMovies("week");
        }

        return java.util.stream.IntStream.rangeClosed(1, pages)
                .boxed()
                .flatMap((page) -> fetchMovieList(category, page).stream())
                .toList();
    }

    private void replaceMovieListEntries(String category, List<MovieResponse> movies) {
        movieListEntryRepository.deleteByCategory(category);

        for (int index = 0; index < movies.size(); index++) {
            MovieResponse movieResponse = movies.get(index);
            Movie movie = movieRepository.findById(movieResponse.id())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

            MovieListEntry entry = new MovieListEntry();
            entry.setCategory(category);
            entry.setMovie(movie);
            entry.setSortOrder(index);
            movieListEntryRepository.save(entry);
        }
    }

    private String normalizeListName(String list) {
        if (list == null || list.isBlank()) {
            return "now_playing";
        }

        String normalized = list.trim().toLowerCase().replace("-", "_");

        if (List.of("now_playing", "popular", "top_rated", "upcoming", TRENDING_WEEK_CATEGORY).contains(normalized)) {
            return normalized;
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "List must be one of: now_playing, popular, top_rated, upcoming, trending_week"
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

    public MovieResponse toStoredMovieResponse(Movie movie) {
        String posterUrl = firstNonBlank(movie.getPosterUrl());
        String backdropUrl = firstNonBlank(movie.getBackdropUrl());
        List<String> genres = movie.getGenres()
                .stream()
                .map(Genre::getName)
                .sorted()
                .toList();
        List<MovieCastMemberResponse> cast = movie.getCastMembers()
                .stream()
                .sorted(java.util.Comparator.comparing(MovieCastMember::getSortOrder))
                .map((member) -> new MovieCastMemberResponse(
                        member.getName(),
                        member.getRole(),
                        member.getImageUrl()
                ))
                .toList();

        return new MovieResponse(
                movie.getId(),
                movie.getTmdbId(),
                movie.getTitle(),
                movie.getDescription(),
                movie.getDurationMinutes(),
                posterUrl,
                backdropUrl,
                movie.getReleaseDate(),
                movie.getRating(),
                genres,
                cast
        );
    }

    public MovieResponse toMovieDetailResponse(Movie movie) {
        return toStoredMovieResponse(movie);
    }

    public void syncConfiguredLists(List<String> lists, int pages) {
        int requestedPages = Math.max(1, Math.min(pages, 5));

        lists.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter((value) -> !value.isBlank())
                .distinct()
                .forEach((list) -> {
                    try {
                        syncMovieList(list, requestedPages);
                    } catch (RuntimeException exception) {
                        System.out.println("Skipping TMDB sync for list '" + list + "': " + exception.getMessage());
                    }
                });
    }

    public int syncCastForStoredMovies() {
        if (readAccessToken == null || readAccessToken.isBlank()) {
            return 0;
        }

        int updatedCount = 0;

        List<Movie> movies = movieRepository.findAll()
                .stream()
                .filter((movie) -> movie.getTmdbId() != null)
                .sorted(Comparator.comparing(Movie::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        for (Movie movie : movies) {
            try {
                Map<String, Object> detail = fetchMovieDetail(movie.getTmdbId(), true);

                movie.setPosterUrl(firstNonBlank(
                        imageUrl(stringValue(detail, "poster_path", "")),
                        movie.getPosterUrl()
                ));
                movie.setBackdropUrl(firstNonBlank(
                        imageUrl(stringValue(detail, "backdrop_path", "")),
                        movie.getBackdropUrl()
                ));
                movie.setRating(doubleValue(detail, "vote_average"));
                addCastMembersIfMissing(movie, toCastMembers(movie, mapValue(detail, "credits")));
                movieRepository.save(movie);
                updatedCount++;
            } catch (RuntimeException exception) {
                System.out.println(
                        "Skipping TMDB cast sync for movie '" + movie.getTitle() + "': " + exception.getMessage()
                );
            }
        }

        return updatedCount;
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

    private Map<String, Object> fetchMovieDetail(Integer tmdbId, boolean includeCredits) {
        return tmdbClient()
                .get()
                .uri(uriBuilder -> {
                    uriBuilder.path("/movie/{tmdbId}")
                            .queryParam("language", "en-US");

                    if (includeCredits) {
                        uriBuilder.queryParam("append_to_response", "credits");
                    }

                    return uriBuilder.build(tmdbId);
                })
                .retrieve()
                .body(Map.class);
    }

    private Set<MovieCastMember> toCastMembers(Movie movie, Map<String, Object> credits) {
        List<Map<String, Object>> castData = listValue(credits, "cast");
        Set<MovieCastMember> castMembers = new LinkedHashSet<>();

        for (int index = 0; index < Math.min(castData.size(), 10); index++) {
            Map<String, Object> castMemberData = castData.get(index);

            MovieCastMember castMember = new MovieCastMember();
            castMember.setMovie(movie);
            castMember.setName(stringValue(castMemberData, "name", "Unknown"));
            castMember.setRole(stringValue(castMemberData, "character", ""));
            castMember.setImageUrl(imageUrl(stringValue(castMemberData, "profile_path", "")));
            castMember.setSortOrder(index);
            castMembers.add(castMember);
        }

        return castMembers;
    }

    private void addCastMembersIfMissing(Movie movie, Set<MovieCastMember> castMembers) {
        if (!movie.getCastMembers().isEmpty()) {
            return;
        }

        movie.getCastMembers().addAll(castMembers);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapValue(Map<String, Object> data, String key) {
        Object value = data == null ? null : data.get(key);

        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }

        return Map.of();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }

        return "";
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
