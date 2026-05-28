package com.cinemabooking.dto;

public record PaymentCheckoutResponse(
        BookingResponse booking,
        String checkoutUrl,
        boolean redirectRequired,
        String message
) {
}
