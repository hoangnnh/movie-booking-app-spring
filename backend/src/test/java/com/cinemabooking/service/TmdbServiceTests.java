package com.cinemabooking.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TmdbServiceTests {

    private final TmdbService tmdbService = new TmdbService(null, null, null, null, null);

    @Test
    void normalizesCommonCertificationsToVietnameseAgeLabels() {
        assertThat(tmdbService.normalizeVietnameseAgeRating("PG-13")).isEqualTo("T13");
        assertThat(tmdbService.normalizeVietnameseAgeRating("R")).isEqualTo("T16");
        assertThat(tmdbService.normalizeVietnameseAgeRating("NC-17")).isEqualTo("T18");
        assertThat(tmdbService.normalizeVietnameseAgeRating("T18")).isEqualTo("T18");
    }

    @Test
    void defaultsUnknownOrMissingCertificationToT13() {
        assertThat(tmdbService.normalizeVietnameseAgeRating(null)).isEqualTo("T13");
        assertThat(tmdbService.normalizeVietnameseAgeRating("")).isEqualTo("T13");
        assertThat(tmdbService.normalizeVietnameseAgeRating("PG")).isEqualTo("T13");
    }
}
