package com.cinemabooking.controller;

import java.net.URI;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.dto.BookingResponse;
import com.cinemabooking.service.BookingService;
import com.cinemabooking.service.PaymentGatewayService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final BookingService bookingService;
    private final PaymentGatewayService paymentGatewayService;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @GetMapping("/vnpay/return")
    public ResponseEntity<Void> handleVnpayReturn(@RequestParam Map<String, String> params) {
        BookingResponse booking = processVnpayResult(params);
        return redirectToFrontend(booking);
    }

    @GetMapping("/vnpay/ipn")
    public Map<String, String> handleVnpayIpn(@RequestParam Map<String, String> params) {
        BookingResponse booking = processVnpayResult(params);
        return Map.of(
                "RspCode", "00",
                "Message", "Confirm Success",
                "bookingId", booking.id().toString()
        );
    }

    private BookingResponse processVnpayResult(Map<String, String> params) {
        if (!paymentGatewayService.verifyVnpaySignature(params)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid VNPAY signature");
        }

        String paymentReference = params.get("vnp_TxnRef");
        boolean success = "00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.get("vnp_TransactionStatus"));

        return success
                ? bookingService.confirmProviderPayment(paymentReference)
                : bookingService.failProviderPayment(paymentReference);
    }

    private ResponseEntity<Void> redirectToFrontend(BookingResponse booking) {
        String paymentResult = switch (booking.paymentStatus()) {
            case "PAID" -> "success";
            case "PENDING" -> "pending";
            default -> "failed";
        };
        URI target = URI.create(
                frontendBaseUrl
                        + "/my-booking?payment="
                        + paymentResult
                        + "&bookingId="
                        + booking.id()
        );

        return ResponseEntity.status(HttpStatus.FOUND).location(target).build();
    }
}
