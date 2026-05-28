package com.cinemabooking.controller;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @GetMapping("/momo/return")
    public ResponseEntity<Void> handleMomoReturn(@RequestParam Map<String, String> params) {
        BookingResponse booking = processMomoResult(params);
        return redirectToFrontend(booking);
    }

    @PostMapping("/momo/ipn")
    public Map<String, Object> handleMomoIpn(@RequestBody Map<String, Object> body) {
        BookingResponse booking = processMomoResult(toStringMap(body));
        return Map.of(
                "resultCode", 0,
                "message", "Confirm Success",
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

    private BookingResponse processMomoResult(Map<String, String> params) {
        if (!paymentGatewayService.verifyMomoSignature(params)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid MoMo signature");
        }

        String paymentReference = params.get("orderId");
        boolean success = "0".equals(params.get("resultCode"));

        return success
                ? bookingService.confirmProviderPayment(paymentReference)
                : bookingService.failProviderPayment(paymentReference);
    }

    private ResponseEntity<Void> redirectToFrontend(BookingResponse booking) {
        String paymentResult = "PAID".equals(booking.paymentStatus()) ? "success" : "failed";
        URI target = URI.create(
                frontendBaseUrl
                        + "/my-booking?payment="
                        + paymentResult
                        + "&bookingId="
                        + booking.id()
        );

        return ResponseEntity.status(HttpStatus.FOUND).location(target).build();
    }

    private Map<String, String> toStringMap(Map<String, Object> body) {
        Map<String, String> result = new HashMap<>();
        body.forEach((key, value) -> result.put(key, value == null ? "" : value.toString()));
        return result;
    }
}
