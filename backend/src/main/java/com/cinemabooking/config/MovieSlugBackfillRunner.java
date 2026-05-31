package com.cinemabooking.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.cinemabooking.repository.MovieRepository;
import com.cinemabooking.service.MovieSlugService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class MovieSlugBackfillRunner implements CommandLineRunner {

    private final MovieRepository movieRepository;
    private final MovieSlugService movieSlugService;

    @Override
    @Transactional
    public void run(String... args) {
        movieRepository.findAll()
                .stream()
                .filter((movie) -> movie.getSlug() == null || movie.getSlug().isBlank())
                .forEach((movie) -> {
                    movieSlugService.ensureSlug(movie);
                    movieRepository.save(movie);
                });
    }
}
