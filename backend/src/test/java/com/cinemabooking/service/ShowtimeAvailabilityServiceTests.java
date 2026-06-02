package com.cinemabooking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.entity.Showtime;

class ShowtimeAvailabilityServiceTests {

    private final ShowtimeAvailabilityService showtimeAvailabilityService = new ShowtimeAvailabilityService();

    @Test
    void showtimeRemainsBookableWithinTenMinuteGracePeriod() {
        Showtime showtime = showtimeStartingAt(LocalDateTime.now().minusMinutes(9));

        assertThat(showtimeAvailabilityService.isExpired(showtime)).isFalse();
    }

    @Test
    void showtimeExpiresTenMinutesAfterStart() {
        Showtime showtime = showtimeStartingAt(LocalDateTime.now().minusMinutes(11));

        assertThat(showtimeAvailabilityService.isExpired(showtime)).isTrue();
        assertThatThrownBy(() -> showtimeAvailabilityService.requireBookable(showtime))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getReason()).contains("Please book another showtime instead");
                });
    }

    private Showtime showtimeStartingAt(LocalDateTime startTime) {
        Showtime showtime = new Showtime();
        showtime.setStartTime(startTime);
        return showtime;
    }
}
