package com.cinemabooking.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.cinemabooking.entity.Movie;
import com.cinemabooking.repository.MovieRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MovieSlugService {

    private final MovieRepository movieRepository;

    public void ensureSlug(Movie movie) {
        if (movie == null || hasText(movie.getSlug())) {
            return;
        }

        String baseSlug = slugify(movie.getTitle());
        String candidate = baseSlug;
        int suffix = 2;

        while (slugBelongsToAnotherMovie(candidate, movie.getId())) {
            candidate = baseSlug + "-" + suffix;
            suffix++;
        }

        movie.setSlug(candidate);
    }

    private boolean slugBelongsToAnotherMovie(String slug, UUID movieId) {
        return movieRepository.findBySlug(slug)
                .map((existingMovie) -> movieId == null || !existingMovie.getId().equals(movieId))
                .orElse(false);
    }

    private String slugify(String value) {
        if (!hasText(value)) {
            return "movie";
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replace("đ", "d")
                .replace("Đ", "D")
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");

        return normalized.isBlank() ? "movie" : normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
