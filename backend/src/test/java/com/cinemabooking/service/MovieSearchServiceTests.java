package com.cinemabooking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.cinemabooking.enums.MovieDisplayStatus;
import com.cinemabooking.repository.MovieRepository;

@ExtendWith(MockitoExtension.class)
class MovieSearchServiceTests {

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private TmdbService tmdbService;

    @InjectMocks
    private MovieSearchService movieSearchService;

    @Test
    void showingNowCatalogSortsLatestReleaseFirst() {
        when(movieRepository.findCatalogMovies(
                eq(MovieDisplayStatus.SHOWING_NOW),
                eq(""),
                eq(""),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        movieSearchService.searchMovies(MovieDisplayStatus.SHOWING_NOW, "", "", 0, 48);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(movieRepository).findCatalogMovies(
                eq(MovieDisplayStatus.SHOWING_NOW),
                eq(""),
                eq(""),
                pageableCaptor.capture()
        );

        Sort sort = pageableCaptor.getValue().getSort();
        assertThat(sort.getOrderFor("releaseDate")).isEqualTo(Sort.Order.desc("releaseDate").nullsLast());
        assertThat(sort.getOrderFor("createdAt")).isEqualTo(Sort.Order.desc("createdAt"));
        assertThat(sort.getOrderFor("title")).isEqualTo(Sort.Order.asc("title"));
    }

    @Test
    void comingSoonCatalogSortsNearestReleaseFirst() {
        when(movieRepository.findCatalogMovies(
                eq(MovieDisplayStatus.COMING_SOON),
                eq(""),
                eq(""),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        movieSearchService.searchMovies(MovieDisplayStatus.COMING_SOON, "", "", 0, 48);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(movieRepository).findCatalogMovies(
                eq(MovieDisplayStatus.COMING_SOON),
                eq(""),
                eq(""),
                pageableCaptor.capture()
        );

        Sort sort = pageableCaptor.getValue().getSort();
        assertThat(sort.getOrderFor("releaseDate")).isEqualTo(Sort.Order.asc("releaseDate").nullsLast());
        assertThat(sort.getOrderFor("createdAt")).isEqualTo(Sort.Order.desc("createdAt"));
        assertThat(sort.getOrderFor("title")).isEqualTo(Sort.Order.asc("title"));
    }
}
