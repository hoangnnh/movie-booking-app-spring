package com.cinemabooking.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.BookingResponse;
import com.cinemabooking.dto.CreateBookingRequest;
import com.cinemabooking.dto.PaymentCheckoutResponse;
import com.cinemabooking.security.AuthenticatedUser;
import com.cinemabooking.service.BookingService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/bookings")
    public PaymentCheckoutResponse createBooking(
            Authentication authentication,
            @RequestBody CreateBookingRequest request,
            HttpServletRequest httpRequest
    ) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        return bookingService.createBooking(authenticatedUser.userId(), request, resolveClientIp(httpRequest));
    }

    @GetMapping("/users/{userId}/bookings")
    public List<BookingResponse> getUserBookings(
            Authentication authentication,
            @PathVariable UUID userId
    ) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();

        if (!authenticatedUser.userId().equals(userId) && !authenticatedUser.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own bookings");
        }

        return bookingService.getBookingsByUser(userId);
    }

    @PatchMapping("/bookings/{bookingId}/cancel")
    public BookingResponse cancelBooking(
            Authentication authentication,
            @PathVariable UUID bookingId
    ) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        return bookingService.cancelBooking(authenticatedUser.userId(), bookingId);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}
