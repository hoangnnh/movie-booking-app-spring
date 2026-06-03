package com.cinemabooking.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cinemabooking.ai.ContentBasedRecommendationEngine;
import com.cinemabooking.dto.MovieAdvisorRequest;
import com.cinemabooking.dto.MovieAdvisorResponse;
import com.cinemabooking.dto.MovieAdvisorSuggestionResponse;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.enums.MovieDisplayStatus;
import com.cinemabooking.repository.MovieRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MovieAdvisorService {

    private static final Map<String, Set<String>> GENRE_KEYWORDS = Map.ofEntries(
            Map.entry("Action", Set.of("action", "fight", "fighting", "battle", "explosive", "adrenaline")),
            Map.entry("Adventure", Set.of("adventure", "journey", "quest", "explore", "epic")),
            Map.entry("Animation", Set.of("animation", "animated", "cartoon", "kids", "children")),
            Map.entry("Comedy", Set.of("comedy", "funny", "laugh", "hilarious", "light")),
            Map.entry("Crime", Set.of("crime", "detective", "mystery", "investigation")),
            Map.entry("Drama", Set.of("drama", "emotional", "serious", "touching")),
            Map.entry("Family", Set.of("family", "parents", "kids", "children")),
            Map.entry("Fantasy", Set.of("fantasy", "magic", "magical")),
            Map.entry("Horror", Set.of("horror", "scary", "fear", "ghost", "haunted")),
            Map.entry("Romance", Set.of("romance", "romantic", "date", "couple", "love")),
            Map.entry("Science Fiction", Set.of("sci-fi", "scifi", "science fiction", "space", "future", "robot")),
            Map.entry("Thriller", Set.of("thriller", "suspense", "tense", "twist"))
    );

    private static final Set<String> FAMILY_SAFE_RATINGS = Set.of("P", "K", "T13");

    private final MovieRepository movieRepository;
    private final ContentBasedRecommendationEngine recommendationEngine;

    @Transactional(readOnly = true)
    public MovieAdvisorResponse advise(MovieAdvisorRequest request) {
        String normalizedMessage = normalize(request.message());
        AdvisorIntent intent = AdvisorIntent.from(normalizedMessage, request.currentMovieId());

        List<Movie> allMovies = movieRepository.findAllByOrderByCreatedAtDescTitleAsc();
        Movie currentMovie = findCurrentMovie(allMovies, request.currentMovieId());

        List<MovieAdvisorSuggestionResponse> suggestions = allMovies.stream()
                .filter((movie) -> movie.getDisplayStatus() != MovieDisplayStatus.HIDDEN)
                .filter((movie) -> currentMovie == null || !movie.getId().equals(currentMovie.getId()))
                .map((movie) -> new ScoredMovie(movie, scoreMovie(movie, currentMovie, intent)))
                .filter((scoredMovie) -> scoredMovie.score() > 0)
                .sorted(Comparator.comparingDouble(ScoredMovie::score).reversed()
                        .thenComparing((left, right) -> compareRatings(right.movie(), left.movie()))
                        .thenComparing((left, right) -> compareReleaseDates(right.movie(), left.movie()))
                        .thenComparing((scoredMovie) -> scoredMovie.movie().getTitle(), String.CASE_INSENSITIVE_ORDER))
                .limit(5)
                .map((scoredMovie) -> toSuggestion(scoredMovie.movie(), currentMovie, intent))
                .toList();

        if (suggestions.isEmpty()) {
            suggestions = allMovies.stream()
                    .filter((movie) -> movie.getDisplayStatus() == MovieDisplayStatus.SHOWING_NOW)
                    .sorted(Comparator.comparing(Movie::getRating, Comparator.nullsLast(Comparator.reverseOrder())))
                    .limit(5)
                    .map((movie) -> toSuggestion(movie, currentMovie, intent))
                    .toList();
        }

        return new MovieAdvisorResponse(
                buildReply(intent, suggestions),
                intent.detectedPreferences(),
                suggestions
        );
    }

    private double scoreMovie(Movie movie, Movie currentMovie, AdvisorIntent intent) {
        double score = 0.0;

        if (movie.getRating() != null) {
            score += recommendationEngine.normalizeRating(movie.getRating()) * 2.0;
        }

        if (movie.getReleaseDate() != null) {
            score += recommendationEngine.releaseFreshnessScore(movie.getReleaseDate()) * 0.8;
        }

        Set<String> movieGenres = movie.getGenres().stream()
                .map((genre) -> normalize(genre.getName()))
                .collect(Collectors.toSet());

        for (String genre : intent.genres()) {
            if (movieGenres.contains(normalize(genre))) {
                score += 4.0;
            }
        }

        if (currentMovie != null) {
            score += recommendationEngine.scoreSimilarMovie(currentMovie, movie) * 0.8;
        }

        if (intent.status() != null) {
            score += movie.getDisplayStatus() == intent.status() ? 2.0 : -2.0;
        } else if (movie.getDisplayStatus() == MovieDisplayStatus.SHOWING_NOW) {
            score += 0.8;
        }

        if (intent.maxDurationMinutes() != null && movie.getDurationMinutes() != null) {
            score += movie.getDurationMinutes() <= intent.maxDurationMinutes() ? 1.5 : -2.0;
        }

        if (intent.familyFriendly()) {
            score += FAMILY_SAFE_RATINGS.contains(normalizeAgeRating(movie.getAgeRating())) ? 2.0 : -2.0;
        }

        if (intent.minimumAgeRating() != null && movie.getAgeRating() != null) {
            score += normalizeAgeRating(movie.getAgeRating()).equals(intent.minimumAgeRating()) ? 1.5 : 0.0;
        }

        if (intent.genres().isEmpty()
                && intent.maxDurationMinutes() == null
                && intent.status() == null
                && !intent.familyFriendly()
                && currentMovie == null) {
            score += movie.getDisplayStatus() == MovieDisplayStatus.SHOWING_NOW ? 1.0 : 0.0;
        }

        return score;
    }

    private MovieAdvisorSuggestionResponse toSuggestion(Movie movie, Movie currentMovie, AdvisorIntent intent) {
        List<String> genres = movie.getGenres().stream()
                .map((genre) -> genre.getName())
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();

        return new MovieAdvisorSuggestionResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getSlug(),
                movie.getPosterUrl(),
                movie.getReleaseDate(),
                movie.getRating(),
                movie.getAgeRating(),
                movie.getDurationMinutes(),
                movie.getDisplayStatus().name(),
                genres,
                buildReason(movie, currentMovie, intent, genres)
        );
    }

    private String buildReason(Movie movie, Movie currentMovie, AdvisorIntent intent, List<String> genres) {
        List<String> reasons = new ArrayList<>();

        List<String> matchedGenres = genres.stream()
                .filter((genre) -> intent.genres().stream().anyMatch((wantedGenre) -> normalize(wantedGenre).equals(normalize(genre))))
                .toList();
        if (!matchedGenres.isEmpty()) {
            reasons.add("matches " + String.join(", ", matchedGenres));
        }

        if (currentMovie != null) {
            reasons.add("has a similar movie profile to " + currentMovie.getTitle());
        }

        if (intent.maxDurationMinutes() != null && movie.getDurationMinutes() != null && movie.getDurationMinutes() <= intent.maxDurationMinutes()) {
            reasons.add("fits your shorter runtime preference");
        }

        if (intent.familyFriendly() && FAMILY_SAFE_RATINGS.contains(normalizeAgeRating(movie.getAgeRating()))) {
            reasons.add("keeps the age rating family friendly");
        }

        if (movie.getRating() != null && movie.getRating() >= 7.0) {
            reasons.add("has a strong audience rating");
        }

        if (movie.getDisplayStatus() == MovieDisplayStatus.SHOWING_NOW) {
            reasons.add("is showing now");
        } else if (movie.getDisplayStatus() == MovieDisplayStatus.COMING_SOON) {
            reasons.add("is coming soon");
        }

        return reasons.isEmpty()
                ? "A balanced pick from the current catalog."
                : capitalizeSentence(String.join(", ", reasons) + ".");
    }

    private String buildReply(AdvisorIntent intent, List<MovieAdvisorSuggestionResponse> suggestions) {
        if (suggestions.isEmpty()) {
            return "I could not find a strong match in the current catalog. Try asking for a genre, mood, runtime, or age rating.";
        }

        String preferenceText = intent.detectedPreferences().isEmpty()
                ? "your request"
                : String.join(", ", intent.detectedPreferences());

        String leadTitle = suggestions.get(0).title();
        return "Based on " + preferenceText + ", I would start with " + leadTitle
                + ". I found " + suggestions.size() + " picks from the current CinemaTick catalog.";
    }

    private Movie findCurrentMovie(List<Movie> movies, UUID currentMovieId) {
        if (currentMovieId == null) {
            return null;
        }

        return movies.stream()
                .filter((movie) -> movie.getId().equals(currentMovieId))
                .findFirst()
                .orElse(null);
    }

    private int compareRatings(Movie left, Movie right) {
        return Comparator.nullsLast(Double::compareTo).compare(left.getRating(), right.getRating());
    }

    private int compareReleaseDates(Movie left, Movie right) {
        return Comparator.nullsLast(LocalDate::compareTo).compare(left.getReleaseDate(), right.getReleaseDate());
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeAgeRating(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String capitalizeSentence(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }

        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1);
    }

    private record ScoredMovie(Movie movie, double score) {
    }

    private record AdvisorIntent(
            Set<String> genres,
            Integer maxDurationMinutes,
            MovieDisplayStatus status,
            boolean familyFriendly,
            String minimumAgeRating,
            List<String> detectedPreferences
    ) {
        static AdvisorIntent from(String message, UUID currentMovieId) {
            Set<String> genres = detectGenres(message);
            Integer maxDurationMinutes = detectMaxDuration(message);
            MovieDisplayStatus status = detectStatus(message);
            boolean familyFriendly = containsAny(message, "family", "kids", "children", "parents", "safe");
            String ageRating = detectAgeRating(message);

            List<String> preferences = new ArrayList<>();
            if (!genres.isEmpty()) {
                preferences.add("genre: " + String.join(", ", genres));
            }
            if (maxDurationMinutes != null) {
                preferences.add("under " + maxDurationMinutes + " minutes");
            }
            if (status == MovieDisplayStatus.SHOWING_NOW) {
                preferences.add("showing now");
            } else if (status == MovieDisplayStatus.COMING_SOON) {
                preferences.add("coming soon");
            }
            if (familyFriendly) {
                preferences.add("family friendly");
            }
            if (ageRating != null) {
                preferences.add("age rating " + ageRating);
            }
            if (currentMovieId != null) {
                preferences.add("similar to the current movie");
            }

            return new AdvisorIntent(genres, maxDurationMinutes, status, familyFriendly, ageRating, preferences);
        }

        private static Set<String> detectGenres(String message) {
            Set<String> genres = new LinkedHashSet<>();
            GENRE_KEYWORDS.forEach((genre, keywords) -> {
                if (keywords.stream().anyMatch(message::contains)) {
                    genres.add(genre);
                }
            });
            return genres;
        }

        private static Integer detectMaxDuration(String message) {
            if (containsAny(message, "short", "quick", "not too long")) {
                return 120;
            }
            if (containsAny(message, "under 2 hours", "less than 2 hours", "below 2 hours")) {
                return 120;
            }
            if (containsAny(message, "under 90", "less than 90")) {
                return 90;
            }
            return null;
        }

        private static MovieDisplayStatus detectStatus(String message) {
            if (containsAny(message, "coming soon", "upcoming", "not released")) {
                return MovieDisplayStatus.COMING_SOON;
            }
            if (containsAny(message, "showing now", "now showing", "today", "tonight", "book now")) {
                return MovieDisplayStatus.SHOWING_NOW;
            }
            return null;
        }

        private static String detectAgeRating(String message) {
            for (String rating : List.of("T18", "T16", "T13", "P", "K")) {
                if (message.contains(rating.toLowerCase(Locale.ROOT))) {
                    return rating;
                }
            }
            return null;
        }

        private static boolean containsAny(String message, String... candidates) {
            for (String candidate : candidates) {
                if (message.contains(candidate)) {
                    return true;
                }
            }
            return false;
        }
    }
}
