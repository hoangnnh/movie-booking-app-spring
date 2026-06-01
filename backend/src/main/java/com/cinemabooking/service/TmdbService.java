package com.cinemabooking.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.AdminMovieResponse;
import com.cinemabooking.dto.MovieCastMemberResponse;
import com.cinemabooking.dto.MovieListItemResponse;
import com.cinemabooking.dto.MovieResponse;
import com.cinemabooking.dto.TmdbImportResponse;
import com.cinemabooking.dto.TmdbMovieResponse;
import com.cinemabooking.dto.TmdbSearchResponse;
import com.cinemabooking.entity.Genre;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.MovieCastMember;
import com.cinemabooking.entity.MovieListEntry;
import com.cinemabooking.enums.MovieDisplayStatus;
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
    private final MovieSlugService movieSlugService;

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
                        .queryParam("region", region)
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
        return importMovieResult(tmdbId).movie();
    }

    @Transactional
    public ImportMovieResult importMovieResult(Integer tmdbId) {
        if (tmdbId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TMDB movie id is required");
        }

        Map<String, Object> detail = fetchMovieDetail(tmdbId, true, true);
        String title = stringValue(detail, "title", "Untitled Movie");

        Movie movie = movieRepository.findByTmdbId(tmdbId)
                .or(() -> movieRepository.findFirstByTitleIgnoreCaseOrderByCreatedAtAsc(title))
                .orElseGet(Movie::new);
        boolean existed = movie.getId() != null;

        movie.setTmdbId(tmdbId);
        movie.setTitle(title);
        movie.setDescription(stringValue(detail, "overview", ""));
        movie.setDurationMinutes(intValue(detail, "runtime", 120));
        movie.setPosterUrl(imageUrl(stringValue(detail, "poster_path", "")));
        movie.setBackdropUrl(imageUrl(stringValue(detail, "backdrop_path", "")));
        movie.setTrailerUrl(extractTrailerUrl(mapValue(detail, "videos")));
        movie.setReleaseDate(dateValue(stringValue(detail, "release_date", "")));
        movie.setRating(doubleValue(detail, "vote_average"));

        List<Map<String, Object>> genres = listValue(detail, "genres");
        movie.setGenres(new HashSet<>(genres.stream()
                .map((genreData) -> getOrCreateGenre(stringValue(genreData, "name", "Drama")))
                .toList()));
        addCastMembersIfMissing(movie, toCastMembers(movie, mapValue(detail, "credits")));
        movieSlugService.ensureSlug(movie);

        Movie savedMovie = movieRepository.save(movie);
        showtimeSeedService.createShowtimesForMovieIfMissing(savedMovie);

        return new ImportMovieResult(toStoredMovieResponse(savedMovie), existed ? ImportAction.UPDATED : ImportAction.CREATED);
    }

    @Transactional
    public TmdbImportResponse importMoviesByList(String list, int pages) {
        String normalizedList = normalizeListName(list);
        int requestedPages = Math.max(1, Math.min(pages, 5));
        int targetNewMovies = requestedPages * 20;
        int maxPagesToScan = Math.max(requestedPages, 10);
        int scannedPages = 0;
        List<ImportMovieResult> importResults = new ArrayList<>();
        Set<Integer> seenTmdbIds = new HashSet<>();

        for (int page = 1; page <= maxPagesToScan; page++) {
            List<Integer> tmdbIds = fetchMovieDataForCategoryPage(normalizedList, page).stream()
                    .map((movieData) -> intValue(movieData, "id", null))
                    .filter(Objects::nonNull)
                    .filter(seenTmdbIds::add)
                    .toList();

            if (tmdbIds.isEmpty()) {
                break;
            }

            scannedPages++;

            for (Integer tmdbId : tmdbIds) {
                ImportMovieResult result = importMovieResult(tmdbId);
                importResults.add(result);

                long createdCountSoFar = importResults.stream()
                        .filter((item) -> item.action() == ImportAction.CREATED)
                        .count();

                if (createdCountSoFar >= targetNewMovies) {
                    break;
                }
            }

            long createdCountSoFar = importResults.stream()
                    .filter((item) -> item.action() == ImportAction.CREATED)
                    .count();

            if (createdCountSoFar >= targetNewMovies) {
                break;
            }
        }

        List<MovieResponse> importedMovies = importResults.stream()
                .map(ImportMovieResult::movie)
                .toList();
        int createdCount = (int) importResults.stream()
                .filter((result) -> result.action() == ImportAction.CREATED)
                .count();
        int updatedCount = (int) importResults.stream()
                .filter((result) -> result.action() == ImportAction.UPDATED)
                .count();

        replaceMovieListEntries(normalizedList, importedMovies);

        return new TmdbImportResponse(
                normalizedList,
                requestedPages,
                scannedPages,
                importedMovies.size(),
                createdCount,
                updatedCount,
                importedMovies
        );
    }

    @Transactional
    public TmdbImportResponse syncMovieList(String list, int pages) {
        return importMoviesByList(list, pages);
    }

    @Transactional
    public List<MovieListItemResponse> getNowPlayingMovies(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));

        return movieRepository.findLatestReleasedByDisplayStatus(
                        MovieDisplayStatus.SHOWING_NOW,
                        PageRequest.of(0, safeLimit)
                )
                .stream()
                .map(this::toMovieListItemResponse)
                .toList();
    }

    @Transactional
    public List<MovieListItemResponse> getTrendingMoviesThisWeek(int limit) {
        return getStoredMoviesByCategory(TRENDING_WEEK_CATEGORY, limit);
    }

    @Transactional
    public List<MovieListItemResponse> getComingSoonMovies(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));

        return movieRepository.findEarliestUpcomingByDisplayStatus(
                        MovieDisplayStatus.COMING_SOON,
                        PageRequest.of(0, safeLimit)
                )
                .stream()
                .map(this::toMovieListItemResponse)
                .toList();
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

    private List<MovieListItemResponse> getStoredMoviesByCategory(String category, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));

        return movieListEntryRepository.findByCategoryOrderBySortOrderAsc(
                        category,
                        PageRequest.of(0, safeLimit)
                )
                .stream()
                .map(MovieListEntry::getMovie)
                .map(this::toMovieListItemResponse)
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

    private List<Map<String, Object>> fetchMovieDataForCategoryPage(String category, int page) {
        if (TRENDING_WEEK_CATEGORY.equals(category)) {
            return page == 1 ? fetchTrendingMovies("week") : List.of();
        }

        return fetchMovieList(category, page);
    }

    private void replaceMovieListEntries(String category, List<MovieResponse> movies) {
        movieListEntryRepository.deleteByCategory(category);
        movieListEntryRepository.flush();

        List<MovieResponse> uniqueMovies = movies.stream()
                .filter((movie) -> movie.id() != null)
                .collect(java.util.stream.Collectors.toMap(
                        MovieResponse::id,
                        java.util.function.Function.identity(),
                        (existing, duplicate) -> existing,
                        java.util.LinkedHashMap::new
                ))
                .values()
                .stream()
                .toList();

        for (int index = 0; index < uniqueMovies.size(); index++) {
            MovieResponse movieResponse = uniqueMovies.get(index);
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
        String normalizedName = normalizeGenreName(name);

        return genreRepository.findFirstByNameIgnoreCase(normalizedName)
                .orElseGet(() -> createGenre(normalizedName));
    }

    private Genre createGenre(String name) {
        try {
            Genre genre = new Genre();
            genre.setName(name);
            return genreRepository.saveAndFlush(genre);
        } catch (DataIntegrityViolationException exception) {
            return genreRepository.findFirstByNameIgnoreCase(name)
                    .orElseThrow(() -> exception);
        }
    }

    private String normalizeGenreName(String name) {
        if (name == null || name.isBlank()) {
            return "Drama";
        }

        return name.trim();
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
                movie.getSlug(),
                movie.getDescription(),
                movie.getDurationMinutes(),
                posterUrl,
                backdropUrl,
                firstNonBlank(movie.getTrailerUrl()),
                movie.getReleaseDate(),
                movie.getRating(),
                movie.getDisplayStatus() == null ? MovieDisplayStatus.HIDDEN.name() : movie.getDisplayStatus().name(),
                genres,
                cast
        );
    }

    public MovieListItemResponse toMovieListItemResponse(Movie movie) {
        return new MovieListItemResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getSlug(),
                movie.getDurationMinutes(),
                thumbnailUrl(movie.getPosterUrl(), "w342"),
                firstNonBlank(movie.getTrailerUrl()),
                movie.getReleaseDate(),
                movie.getRating(),
                movie.getDisplayStatus() == null ? MovieDisplayStatus.HIDDEN.name() : movie.getDisplayStatus().name(),
                movie.getGenres()
                        .stream()
                        .map(Genre::getName)
                        .sorted()
                        .toList()
        );
    }

    public AdminMovieResponse toAdminMovieResponse(Movie movie) {
        return new AdminMovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getDescription(),
                movie.getDurationMinutes(),
                firstNonBlank(movie.getPosterUrl()),
                firstNonBlank(movie.getBackdropUrl()),
                movie.getReleaseDate(),
                movie.getRating(),
                movie.getDisplayStatus() == null ? MovieDisplayStatus.HIDDEN.name() : movie.getDisplayStatus().name()
        );
    }

    public MovieResponse toMovieDetailResponse(Movie movie) {
        return toStoredMovieResponse(movie);
    }

    @Transactional
    public TrailerBackfillResult backfillTrailersForStoredMovies() {
        if (readAccessToken == null || readAccessToken.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "TMDB API token is not configured. Set TMDB_API_READ_ACCESS_TOKEN."
            );
        }

        int scanned = 0;
        int updated = 0;
        int matchedByTitle = 0;
        int missingTmdbMatch = 0;
        int missingTrailer = 0;

        List<Movie> movies = movieRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Movie::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        for (Movie movie : movies) {
            scanned++;

            Integer tmdbId = movie.getTmdbId();

            if (tmdbId == null) {
                tmdbId = findBestTmdbMatchId(movie);

                if (tmdbId == null) {
                    missingTmdbMatch++;
                    continue;
                }

                matchedByTitle++;
            }

            try {
                Map<String, Object> detail = fetchMovieDetail(tmdbId, false, true);
                String trailerUrl = extractTrailerUrl(mapValue(detail, "videos"));

                if (trailerUrl.isBlank()) {
                    missingTrailer++;
                    continue;
                }

                boolean changed = false;

                if (!tmdbId.equals(movie.getTmdbId())) {
                    movie.setTmdbId(tmdbId);
                    changed = true;
                }

                if (!trailerUrl.equals(firstNonBlank(movie.getTrailerUrl()))) {
                    movie.setTrailerUrl(trailerUrl);
                    changed = true;
                }

                if (changed) {
                    movieRepository.save(movie);
                    updated++;
                }
            } catch (RuntimeException exception) {
                System.out.println(
                        "Skipping trailer backfill for movie '" + movie.getTitle() + "': " + exception.getMessage()
                );
            }
        }

        return new TrailerBackfillResult(scanned, updated, matchedByTitle, missingTmdbMatch, missingTrailer);
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
                Map<String, Object> detail = fetchMovieDetail(movie.getTmdbId(), true, true);

                movie.setPosterUrl(firstNonBlank(
                        imageUrl(stringValue(detail, "poster_path", "")),
                        movie.getPosterUrl()
                ));
                movie.setBackdropUrl(firstNonBlank(
                        imageUrl(stringValue(detail, "backdrop_path", "")),
                        movie.getBackdropUrl()
                ));
                movie.setTrailerUrl(firstNonBlank(
                        extractTrailerUrl(mapValue(detail, "videos")),
                        movie.getTrailerUrl()
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

    private String thumbnailUrl(String url, String size) {
        return firstNonBlank(url).replaceFirst("/t/p/(?:original|w\\d+)/", "/t/p/" + size + "/");
    }

    private Integer findBestTmdbMatchId(Movie movie) {
        if (movie.getTitle() == null || movie.getTitle().isBlank()) {
            return null;
        }

        Map<String, Object> body = tmdbClient()
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search/movie")
                        .queryParam("query", movie.getTitle().trim())
                        .queryParam("include_adult", false)
                        .queryParam("language", "en-US")
                        .queryParam("page", 1)
                        .build())
                .retrieve()
                .body(Map.class);

        return listValue(body, "results")
                .stream()
                .filter((candidate) -> scoreMovieMatch(movie, candidate) > 0)
                .max(Comparator.comparingInt((candidate) -> scoreMovieMatch(movie, candidate)))
                .map((candidate) -> intValue(candidate, "id", null))
                .orElse(null);
    }

    private Map<String, Object> fetchMovieDetail(Integer tmdbId, boolean includeCredits, boolean includeVideos) {
        return tmdbClient()
                .get()
                .uri(uriBuilder -> {
                    uriBuilder.path("/movie/{tmdbId}")
                            .queryParam("language", "en-US");

                    StringBuilder appendToResponse = new StringBuilder();

                    if (includeCredits) {
                        appendToResponse.append("credits");
                    }

                    if (includeVideos) {
                        if (!appendToResponse.isEmpty()) {
                            appendToResponse.append(",");
                        }

                        appendToResponse.append("videos");
                    }

                    if (!appendToResponse.isEmpty()) {
                        uriBuilder.queryParam("append_to_response", appendToResponse.toString());
                    }

                    return uriBuilder.build(tmdbId);
                })
                .retrieve()
                .body(Map.class);
    }

    private String extractTrailerUrl(Map<String, Object> videos) {
        return listValue(videos, "results")
                .stream()
                .max(Comparator.comparingInt(this::scoreVideo))
                .map(this::toTrailerUrl)
                .filter((value) -> value != null && !value.isBlank())
                .orElse("");
    }

    private int scoreMovieMatch(Movie movie, Map<String, Object> candidate) {
        int score = 0;
        String movieTitle = normalizeTitle(movie.getTitle());
        String candidateTitle = normalizeTitle(stringValue(candidate, "title", ""));

        if (movieTitle.equals(candidateTitle)) {
            score += 150;
        } else if (candidateTitle.contains(movieTitle) || movieTitle.contains(candidateTitle)) {
            score += 80;
        }

        LocalDate candidateReleaseDate = dateValue(stringValue(candidate, "release_date", ""));

        if (movie.getReleaseDate() != null && candidateReleaseDate != null) {
            if (movie.getReleaseDate().getYear() == candidateReleaseDate.getYear()) {
                score += 40;
            }

            long dayDifference = Math.abs(movie.getReleaseDate().toEpochDay() - candidateReleaseDate.toEpochDay());

            if (dayDifference <= 31) {
                score += 20;
            }
        }

        return score;
    }

    private int scoreVideo(Map<String, Object> video) {
        int score = 0;
        String site = stringValue(video, "site", "");
        String type = stringValue(video, "type", "");

        if ("YouTube".equalsIgnoreCase(site)) {
            score += 100;
        } else if ("Vimeo".equalsIgnoreCase(site)) {
            score += 50;
        }

        if ("Trailer".equalsIgnoreCase(type)) {
            score += 40;
        } else if ("Teaser".equalsIgnoreCase(type)) {
            score += 20;
        }

        if (Boolean.TRUE.equals(video.get("official"))) {
            score += 20;
        }

        if (stringValue(video, "iso_639_1", "").equalsIgnoreCase("en")) {
            score += 10;
        }

        return score;
    }

    private String toTrailerUrl(Map<String, Object> video) {
        String key = stringValue(video, "key", "").trim();
        String site = stringValue(video, "site", "").trim();

        if (key.isBlank()) {
            return "";
        }

        if ("YouTube".equalsIgnoreCase(site)) {
            return "https://www.youtube.com/watch?v=" + key;
        }

        if ("Vimeo".equalsIgnoreCase(site)) {
            return "https://vimeo.com/" + key;
        }

        return "";
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

    private String normalizeTitle(String value) {
        if (value == null) {
            return "";
        }

        return value.toLowerCase()
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
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

    public record TrailerBackfillResult(
            int scanned,
            int updated,
            int matchedByTitle,
            int missingTmdbMatch,
            int missingTrailer
    ) {
    }

    public record ImportMovieResult(
            MovieResponse movie,
            ImportAction action
    ) {
    }

    public enum ImportAction {
        CREATED,
        UPDATED
    }
}
