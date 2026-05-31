package com.cinemabooking.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.cinemabooking.entity.Movie;
import com.cinemabooking.enums.MovieDisplayStatus;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MovieRepositoryTests {

    @Autowired
    private MovieRepository movieRepository;

    @Test
    void promoteReleasedComingSoonMoviesLeavesAdminControlledStatusesUntouched() {
        LocalDate today = LocalDate.of(2026, 5, 31);
        Movie dueToday = saveMovie("Due Today", today, MovieDisplayStatus.COMING_SOON);
        Movie overdue = saveMovie("Overdue", today.minusDays(1), MovieDisplayStatus.COMING_SOON);
        Movie future = saveMovie("Future", today.plusDays(1), MovieDisplayStatus.COMING_SOON);
        Movie noDate = saveMovie("No Date", null, MovieDisplayStatus.COMING_SOON);
        Movie hidden = saveMovie("Hidden", today, MovieDisplayStatus.HIDDEN);
        Movie showingNow = saveMovie("Showing Now", today, MovieDisplayStatus.SHOWING_NOW);

        int promotedCount = movieRepository.promoteReleasedComingSoonMovies(
                MovieDisplayStatus.COMING_SOON,
                MovieDisplayStatus.SHOWING_NOW,
                today
        );

        assertThat(promotedCount).isEqualTo(2);
        assertThat(movieRepository.findById(dueToday.getId()).orElseThrow().getDisplayStatus())
                .isEqualTo(MovieDisplayStatus.SHOWING_NOW);
        assertThat(movieRepository.findById(overdue.getId()).orElseThrow().getDisplayStatus())
                .isEqualTo(MovieDisplayStatus.SHOWING_NOW);
        assertThat(movieRepository.findById(future.getId()).orElseThrow().getDisplayStatus())
                .isEqualTo(MovieDisplayStatus.COMING_SOON);
        assertThat(movieRepository.findById(noDate.getId()).orElseThrow().getDisplayStatus())
                .isEqualTo(MovieDisplayStatus.COMING_SOON);
        assertThat(movieRepository.findById(hidden.getId()).orElseThrow().getDisplayStatus())
                .isEqualTo(MovieDisplayStatus.HIDDEN);
        assertThat(movieRepository.findById(showingNow.getId()).orElseThrow().getDisplayStatus())
                .isEqualTo(MovieDisplayStatus.SHOWING_NOW);
    }

    private Movie saveMovie(String title, LocalDate releaseDate, MovieDisplayStatus displayStatus) {
        Movie movie = new Movie();
        movie.setTitle(title);
        movie.setDurationMinutes(120);
        movie.setReleaseDate(releaseDate);
        movie.setDisplayStatus(displayStatus);
        return movieRepository.saveAndFlush(movie);
    }
}
