package com.cinemabooking.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class TmdbAgeRatingBackfillRunner {

    private final TmdbService tmdbService;
    private final ConfigurableApplicationContext applicationContext;

    @Value("${app.tmdb.age-rating-backfill.enabled:false}")
    private boolean backfillEnabled;

    @Value("${app.tmdb.age-rating-backfill.exit-after-run:false}")
    private boolean exitAfterRun;

    @EventListener(ApplicationReadyEvent.class)
    public void runBackfill() {
        if (!backfillEnabled) {
            return;
        }

        int updatedCount = tmdbService.backfillAgeRatingsForStoredMovies();

        System.out.println("TMDB age-rating backfill finished.");
        System.out.println("Updated age ratings: " + updatedCount);

        if (exitAfterRun) {
            int exitCode = SpringApplication.exit(applicationContext, () -> 0);
            System.exit(exitCode);
        }
    }
}
