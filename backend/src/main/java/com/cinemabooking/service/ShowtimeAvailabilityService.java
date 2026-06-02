package com.cinemabooking.service;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.entity.Showtime;

@Service
public class ShowtimeAvailabilityService {

    private static final int BOOKING_GRACE_PERIOD_MINUTES = 10;
    private static final String EXPIRED_SHOWTIME_MESSAGE =
            "This showtime has already started. Please book another showtime instead.";

    public boolean isExpired(Showtime showtime) {
        return showtime.getStartTime()
                .plusMinutes(BOOKING_GRACE_PERIOD_MINUTES)
                .isBefore(LocalDateTime.now());
    }

    public void requireBookable(Showtime showtime) {
        if (isExpired(showtime)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, EXPIRED_SHOWTIME_MESSAGE);
        }
    }
}
