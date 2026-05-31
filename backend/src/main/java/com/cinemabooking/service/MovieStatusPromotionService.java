package com.cinemabooking.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cinemabooking.enums.MovieDisplayStatus;
import com.cinemabooking.repository.MovieRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MovieStatusPromotionService {

    private final MovieRepository movieRepository;

    @Transactional
    public int promoteReleasedComingSoonMovies() {
        return promoteReleasedComingSoonMovies(LocalDate.now());
    }

    @Transactional
    public int promoteReleasedComingSoonMovies(LocalDate today) {
        return movieRepository.promoteReleasedComingSoonMovies(
                MovieDisplayStatus.COMING_SOON,
                MovieDisplayStatus.SHOWING_NOW,
                today
        );
    }
}
