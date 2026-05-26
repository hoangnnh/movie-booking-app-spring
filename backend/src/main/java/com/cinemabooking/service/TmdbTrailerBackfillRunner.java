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
public class TmdbTrailerBackfillRunner {

    private final TmdbService tmdbService;
    private final ConfigurableApplicationContext applicationContext;

    @Value("${app.tmdb.trailer-backfill.enabled:false}")
    private boolean backfillEnabled;

    @Value("${app.tmdb.trailer-backfill.exit-after-run:false}")
    private boolean exitAfterRun;

    @EventListener(ApplicationReadyEvent.class)
    public void runBackfill() {
        if (!backfillEnabled) {
            return;
        }

        TmdbService.TrailerBackfillResult result = tmdbService.backfillTrailersForStoredMovies();

        System.out.println("TMDB trailer backfill finished.");
        System.out.println("Scanned movies: " + result.scanned());
        System.out.println("Updated trailers: " + result.updated());
        System.out.println("Matched by title: " + result.matchedByTitle());
        System.out.println("Missing TMDB match: " + result.missingTmdbMatch());
        System.out.println("Missing trailer on TMDB: " + result.missingTrailer());

        if (exitAfterRun) {
            int exitCode = SpringApplication.exit(applicationContext, () -> 0);
            System.exit(exitCode);
        }
    }
}
