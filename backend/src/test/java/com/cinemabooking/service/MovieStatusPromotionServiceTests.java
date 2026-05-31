package com.cinemabooking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cinemabooking.enums.MovieDisplayStatus;
import com.cinemabooking.repository.MovieRepository;

@ExtendWith(MockitoExtension.class)
class MovieStatusPromotionServiceTests {

    @Mock
    private MovieRepository movieRepository;

    @Test
    void promoteReleasedComingSoonMoviesOnlyMovesDueComingSoonMoviesToShowingNow() {
        MovieStatusPromotionService service = new MovieStatusPromotionService(movieRepository);
        LocalDate today = LocalDate.of(2026, 5, 31);

        when(movieRepository.promoteReleasedComingSoonMovies(
                MovieDisplayStatus.COMING_SOON,
                MovieDisplayStatus.SHOWING_NOW,
                today
        )).thenReturn(3);

        int promotedCount = service.promoteReleasedComingSoonMovies(today);

        assertThat(promotedCount).isEqualTo(3);
        verify(movieRepository).promoteReleasedComingSoonMovies(
                MovieDisplayStatus.COMING_SOON,
                MovieDisplayStatus.SHOWING_NOW,
                today
        );
    }
}
