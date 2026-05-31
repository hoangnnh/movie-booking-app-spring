package com.cinemabooking.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BookingExpiryScheduler {

    private final BookingService bookingService;

    @Scheduled(
            fixedDelayString = "${app.booking.expiry.interval-ms:60000}",
            initialDelayString = "${app.booking.expiry.initial-delay-ms:60000}"
    )
    public void expirePassedShowtimeBookings() {
        bookingService.expirePassedShowtimeBookings();
    }
}
