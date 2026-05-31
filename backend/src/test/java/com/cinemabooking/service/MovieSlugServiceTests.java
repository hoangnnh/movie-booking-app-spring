package com.cinemabooking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cinemabooking.entity.Movie;
import com.cinemabooking.repository.MovieRepository;

@ExtendWith(MockitoExtension.class)
class MovieSlugServiceTests {

    @Mock
    private MovieRepository movieRepository;

    @Test
    void ensureSlugCreatesReadableVietnameseSafeSlug() {
        MovieSlugService service = new MovieSlugService(movieRepository);
        Movie movie = new Movie();
        movie.setTitle("Điện Biên Phủ: The Movie");

        when(movieRepository.findBySlug("dien-bien-phu-the-movie")).thenReturn(Optional.empty());

        service.ensureSlug(movie);

        assertThat(movie.getSlug()).isEqualTo("dien-bien-phu-the-movie");
    }

    @Test
    void ensureSlugAddsNumericSuffixWhenTitleAlreadyExists() {
        MovieSlugService service = new MovieSlugService(movieRepository);
        Movie existingMovie = new Movie();
        existingMovie.setId(UUID.randomUUID());

        Movie movie = new Movie();
        movie.setTitle("Gohan");

        when(movieRepository.findBySlug("gohan")).thenReturn(Optional.of(existingMovie));
        when(movieRepository.findBySlug("gohan-2")).thenReturn(Optional.empty());

        service.ensureSlug(movie);

        assertThat(movie.getSlug()).isEqualTo("gohan-2");
    }
}
