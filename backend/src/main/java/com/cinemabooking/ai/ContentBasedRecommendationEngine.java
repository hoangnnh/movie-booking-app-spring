package com.cinemabooking.ai;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.cinemabooking.entity.Movie;
import com.cinemabooking.entity.MovieCastMember;

@Component
public class ContentBasedRecommendationEngine {

    public double scoreForUserProfile(Movie candidate, RecommendationProfile profile) {
        double score = normalizeRating(candidate.getRating()) * 0.8;

        Set<String> candidateGenres = extractGenres(candidate);
        Set<String> candidateCast = extractCast(candidate);

        score += profileGenreAffinity(candidate, profile) * 1.8;
        score += profileCastAffinity(candidate, profile) * 1.2;

        if (!candidateGenres.isEmpty() && overlapCount(candidateGenres, profile.genreWeights().keySet()) >= 2) {
            score += 0.8;
        }

        score += profileDurationAffinity(candidate, profile);

        score += releaseFreshnessScore(candidate.getReleaseDate()) * 0.4;
        return score;
    }

    public double scoreSimilarMovie(Movie sourceMovie, Movie candidate) {
        double score = 0.0;

        Set<String> sourceGenres = extractGenres(sourceMovie);
        Set<String> candidateGenres = extractGenres(candidate);
        Set<String> sourceCast = extractCast(sourceMovie);
        Set<String> candidateCast = extractCast(candidate);

        score += jaccardSimilarity(sourceGenres, candidateGenres) * 5.0;
        score += jaccardSimilarity(sourceCast, candidateCast) * 3.0;

        if (sourceMovie.getDurationMinutes() != null && candidate.getDurationMinutes() != null) {
            int difference = Math.abs(sourceMovie.getDurationMinutes() - candidate.getDurationMinutes());
            score += Math.max(0, 1.2 - (difference / 80.0));
        }

        if (sourceMovie.getReleaseDate() != null && candidate.getReleaseDate() != null) {
            int yearDifference = Math.abs(sourceMovie.getReleaseDate().getYear() - candidate.getReleaseDate().getYear());
            score += Math.max(0, 1.0 - (yearDifference / 8.0));
        }

        if (sourceMovie.getRating() != null && candidate.getRating() != null) {
            score += Math.max(0, 1.0 - (Math.abs(sourceMovie.getRating() - candidate.getRating()) / 5.0));
        }

        return score;
    }

    public RecommendationProfile buildProfile(List<Movie> seedMovies) {
        Map<String, Double> genreWeights = new HashMap<>();
        Map<String, Double> castWeights = new HashMap<>();

        int durationSum = 0;
        int durationCount = 0;

        for (Movie movie : seedMovies) {
            for (String genre : extractGenres(movie)) {
                genreWeights.merge(genre, 1.0, Double::sum);
            }

            for (String castMember : extractCast(movie)) {
                castWeights.merge(castMember, 1.0, Double::sum);
            }

            if (movie.getDurationMinutes() != null && movie.getDurationMinutes() > 0) {
                durationSum += movie.getDurationMinutes();
                durationCount++;
            }
        }

        int averageDuration = durationCount == 0 ? 0 : Math.round((float) durationSum / durationCount);
        return new RecommendationProfile(genreWeights, castWeights, averageDuration);
    }

    public double normalizeRating(Double rating) {
        if (rating == null) {
            return 0.0;
        }

        return Math.max(0, Math.min(rating / 10.0, 1.0));
    }

    public double profileGenreAffinity(Movie candidate, RecommendationProfile profile) {
        return overlapScore(extractGenres(candidate), profile.genreWeights(), 1.0);
    }

    public double profileCastAffinity(Movie candidate, RecommendationProfile profile) {
        return overlapScore(extractCast(candidate), profile.castWeights(), 1.0);
    }

    public double profileDurationAffinity(Movie candidate, RecommendationProfile profile) {
        if (profile.averageDurationMinutes() <= 0 || candidate.getDurationMinutes() == null) {
            return 0.0;
        }

        int difference = Math.abs(candidate.getDurationMinutes() - profile.averageDurationMinutes());
        return Math.max(0, 1.0 - (difference / 90.0));
    }

    public double averageSimilarityToSeeds(Movie candidate, List<Movie> seedMovies) {
        if (seedMovies == null || seedMovies.isEmpty()) {
            return 0.0;
        }

        double total = 0.0;
        for (Movie seedMovie : seedMovies) {
            total += scoreSimilarMovie(seedMovie, candidate);
        }

        return total / seedMovies.size();
    }

    public double maxSimilarityToSeeds(Movie candidate, List<Movie> seedMovies) {
        if (seedMovies == null || seedMovies.isEmpty()) {
            return 0.0;
        }

        double max = 0.0;
        for (Movie seedMovie : seedMovies) {
            max = Math.max(max, scoreSimilarMovie(seedMovie, candidate));
        }

        return max;
    }

    private double overlapScore(Set<String> candidateValues, Map<String, Double> weights, double multiplier) {
        if (candidateValues.isEmpty() || weights.isEmpty()) {
            return 0.0;
        }

        double total = 0.0;
        for (String value : candidateValues) {
            total += weights.getOrDefault(value, 0.0);
        }

        return (total / Math.sqrt(candidateValues.size())) * multiplier;
    }

    private int overlapCount(Set<String> left, Set<String> right) {
        int count = 0;
        for (String value : left) {
            if (right.contains(value)) {
                count++;
            }
        }
        return count;
    }

    private double jaccardSimilarity(Set<String> left, Set<String> right) {
        if (left.isEmpty() || right.isEmpty()) {
            return 0.0;
        }

        Set<String> intersection = new HashSet<>(left);
        intersection.retainAll(right);

        Set<String> union = new HashSet<>(left);
        union.addAll(right);

        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    public double releaseFreshnessScore(LocalDate releaseDate) {
        if (releaseDate == null) {
            return 0.0;
        }

        int yearDifference = Math.abs(LocalDate.now().getYear() - releaseDate.getYear());
        return Math.max(0, 1.0 - (yearDifference / 12.0));
    }

    public Set<String> extractGenres(Movie movie) {
        Set<String> values = new HashSet<>();
        movie.getGenres().forEach((genre) -> values.add(normalize(genre.getName())));
        return values;
    }

    public Set<String> extractCast(Movie movie) {
        Set<String> values = new HashSet<>();
        movie.getCastMembers().stream()
                .sorted(java.util.Comparator.comparing(MovieCastMember::getSortOrder))
                .limit(5)
                .map(MovieCastMember::getName)
                .map(this::normalize)
                .forEach(values::add);
        return values;
    }

    public String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    public record RecommendationProfile(
            Map<String, Double> genreWeights,
            Map<String, Double> castWeights,
            int averageDurationMinutes
    ) {
    }
}
