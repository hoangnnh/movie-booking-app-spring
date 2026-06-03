package com.cinemabooking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cinemabooking.ai.ContentBasedRecommendationEngine;
import com.cinemabooking.dto.MovieAdvisorRequest;
import com.cinemabooking.dto.MovieAdvisorResponse;
import com.cinemabooking.entity.Genre;
import com.cinemabooking.entity.Movie;
import com.cinemabooking.enums.MovieDisplayStatus;
import com.cinemabooking.repository.MovieRepository;

@ExtendWith(MockitoExtension.class)
class MovieAdvisorServiceTests {

    @Mock
    private MovieRepository movieRepository;

    private MovieAdvisorService movieAdvisorService;

    @BeforeEach
    void setUp() {
        movieAdvisorService = new MovieAdvisorService(
                movieRepository,
                new ContentBasedRecommendationEngine()
        );
    }

    @Test
    void recommendsMoviesThatMatchNaturalLanguagePreferences() {
        Movie actionShort = movie("High Speed", "Action", 105, "T13", 8.1, MovieDisplayStatus.SHOWING_NOW);
        Movie dramaLong = movie("Long Goodbye", "Drama", 150, "T13", 9.0, MovieDisplayStatus.SHOWING_NOW);
        when(movieRepository.findAllByOrderByCreatedAtDescTitleAsc()).thenReturn(List.of(dramaLong, actionShort));

        MovieAdvisorResponse response = movieAdvisorService.advise(new MovieAdvisorRequest(
                "I want an action movie under 2 hours tonight",
                null
        ));

        assertThat(response.detectedPreferences()).contains("genre: Action", "under 120 minutes", "showing now");
        assertThat(response.suggestions()).isNotEmpty();
        assertThat(response.suggestions().getFirst().title()).isEqualTo("High Speed");
        assertThat(response.suggestions().getFirst().reason()).contains("Matches Action");
    }

    @Test
    void prefersFamilyFriendlyAgeRatingsForFamilyRequests() {
        Movie familyMovie = movie("Sunny Day", "Animation", 94, "T13", 7.2, MovieDisplayStatus.SHOWING_NOW);
        Movie matureMovie = movie("Late Night Fear", "Horror", 90, "T18", 8.9, MovieDisplayStatus.SHOWING_NOW);
        when(movieRepository.findAllByOrderByCreatedAtDescTitleAsc()).thenReturn(List.of(matureMovie, familyMovie));

        MovieAdvisorResponse response = movieAdvisorService.advise(new MovieAdvisorRequest(
                "What should I watch with my family and kids?",
                null
        ));

        assertThat(response.detectedPreferences()).contains("family friendly");
        assertThat(response.suggestions()).isNotEmpty();
        assertThat(response.suggestions().getFirst().title()).isEqualTo("Sunny Day");
        assertThat(response.suggestions().getFirst().reason()).contains("family friendly");
    }

    private Movie movie(
            String title,
            String genreName,
            int durationMinutes,
            String ageRating,
            double rating,
            MovieDisplayStatus displayStatus
    ) {
        Movie movie = new Movie();
        movie.setId(UUID.randomUUID());
        movie.setTitle(title);
        movie.setSlug(title.toLowerCase().replace(" ", "-"));
        movie.setDescription(title);
        movie.setDurationMinutes(durationMinutes);
        movie.setAgeRating(ageRating);
        movie.setRating(rating);
        movie.setReleaseDate(LocalDate.now().minusDays(7));
        movie.setDisplayStatus(displayStatus);

        Genre genre = new Genre();
        genre.setId(UUID.randomUUID());
        genre.setName(genreName);
        movie.getGenres().add(genre);

        return movie;
    }
}
