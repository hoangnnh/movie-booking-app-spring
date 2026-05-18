package com.cinemabooking.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinemabooking.dto.BookingResponse;
import com.cinemabooking.dto.CreateBookingRequest;
import com.cinemabooking.service.BookingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/bookings")
    public BookingResponse createBooking(@RequestBody CreateBookingRequest request) {
        return bookingService.createBooking(request);
    }

    @GetMapping("/users/{userId}/bookings")
    public List<BookingResponse> getUserBookings(@PathVariable UUID userId) {
        return bookingService.getBookingsByUser(userId);
    }
}