package com.cinemabooking.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cinemabooking.entity.Booking;

@Service
public class PaymentGatewayService {

    private static final DateTimeFormatter VNPAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Value("${app.base-url}")
    private String backendBaseUrl;

    @Value("${payment.vnpay.enabled:false}")
    private boolean vnpayEnabled;

    @Value("${payment.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpayPayUrl;

    @Value("${payment.vnpay.tmn-code:}")
    private String vnpayTmnCode;

    @Value("${payment.vnpay.hash-secret:}")
    private String vnpayHashSecret;

    public String createCheckoutUrl(Booking booking, String clientIpAddress) {
        String paymentMethod = booking.getPaymentMethod();

        if ("VNPAY_QR".equals(paymentMethod)) {
            return createVnpayCheckoutUrl(booking, clientIpAddress);
        }

        return "";
    }

    public boolean verifyVnpaySignature(Map<String, String> params) {
        requireVnpayConfig();
        String receivedHash = params.get("vnp_SecureHash");

        if (!StringUtils.hasText(receivedHash)) {
            return false;
        }

        Map<String, String> signedParams = new TreeMap<>(params);
        signedParams.remove("vnp_SecureHash");
        signedParams.remove("vnp_SecureHashType");

        String signedData = toVnpaySignedData(signedParams);
        return receivedHash.equalsIgnoreCase(hmacSha512(vnpayHashSecret, signedData));
    }

    private String createVnpayCheckoutUrl(Booking booking, String clientIpAddress) {
        requireVnpayConfig();

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnpayTmnCode);
        params.put("vnp_Amount", toVnpayAmount(booking.getTotalAmount()));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", booking.getPaymentReference());
        params.put("vnp_OrderInfo", "CinemaTick booking " + booking.getId());
        params.put("vnp_OrderType", "billpayment");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", backendBaseUrl + "/api/payments/vnpay/return");
        params.put("vnp_IpAddr", StringUtils.hasText(clientIpAddress) ? clientIpAddress : "127.0.0.1");
        LocalDateTime createdAt = LocalDateTime.now();
        params.put("vnp_CreateDate", createdAt.format(VNPAY_DATE_FORMAT));
        params.put("vnp_ExpireDate", createdAt.plusMinutes(15).format(VNPAY_DATE_FORMAT));

        String signedData = toVnpaySignedData(params);
        String secureHash = hmacSha512(vnpayHashSecret, signedData);

        return vnpayPayUrl + "?" + signedData + "&vnp_SecureHash=" + secureHash;
    }

    private void requireVnpayConfig() {
        if (!vnpayEnabled || !StringUtils.hasText(vnpayTmnCode) || !StringUtils.hasText(vnpayHashSecret)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "VNPAY sandbox is not configured. Set PAYMENT_VNPAY_ENABLED, PAYMENT_VNPAY_TMN_CODE, and PAYMENT_VNPAY_HASH_SECRET."
            );
        }
    }

    private String toVnpaySignedData(Map<String, String> params) {
        return params.entrySet()
                .stream()
                .filter((entry) -> StringUtils.hasText(entry.getValue()))
                .map((entry) -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .reduce((left, right) -> left + "&" + right)
                .orElse("");
    }

    private String toVnpayAmount(BigDecimal amount) {
        return amount
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .toPlainString();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String hmacSha512(String secret, String data) {
        return hmac("HmacSHA512", secret, data);
    }

    private String hmac(String algorithm, String secret, String data) {
        try {
            Mac mac = Mac.getInstance(algorithm);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), algorithm));
            byte[] digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(digest.length * 2);

            for (byte item : digest) {
                result.append(String.format("%02x", item));
            }

            return result.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot sign payment request", exception);
        }
    }
}
