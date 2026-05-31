package com.cinemabooking.service;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class MovieStatusPromotionScheduler {

    private final MovieStatusPromotionService movieStatusPromotionService;

    @EventListener(ApplicationReadyEvent.class)
    public void promoteReleasedMoviesOnStartup() {
        movieStatusPromotionService.promoteReleasedComingSoonMovies();
    }

    @Scheduled(cron = "${app.movie.status-promotion.cron:0 0 * * * *}")
    public void promoteReleasedMovies() {
        movieStatusPromotionService.promoteReleasedComingSoonMovies();
    }
}
