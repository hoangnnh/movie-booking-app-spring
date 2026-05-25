package com.cinemabooking.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class TmdbSyncScheduler {

    private final TmdbService tmdbService;

    @Value("${app.tmdb.sync.enabled:true}")
    private boolean syncEnabled;

    @Value("${app.tmdb.sync.lists:now_playing,popular,upcoming}")
    private String syncLists;

    @Value("${app.tmdb.sync.pages-per-list:2}")
    private int syncPagesPerList;

    @Value("${app.tmdb.sync.cast.enabled:true}")
    private boolean castSyncEnabled;

    @Value("${app.tmdb.sync.run-on-startup:true}")
    private boolean runOnStartup;

    @EventListener(ApplicationReadyEvent.class)
    public void runStartupSync() {
        if (!runOnStartup) {
            return;
        }

        runConfiguredSync();
    }

    @Scheduled(cron = "${app.tmdb.sync.cron:0 */30 * * * *}")
    public void syncMovies() {
        runConfiguredSync();
    }

    private void runConfiguredSync() {
        if (syncEnabled) {
            List<String> lists = Arrays.stream(syncLists.split(","))
                    .map(String::trim)
                    .filter((value) -> !value.isBlank())
                    .distinct()
                    .toList();

            if (!lists.isEmpty()) {
                tmdbService.syncConfiguredLists(lists, syncPagesPerList);
            }
        }

        if (castSyncEnabled) {
            tmdbService.syncCastForStoredMovies();
        }
    }
}
