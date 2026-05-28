package com.cinemabooking.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
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

    @Value("${payment.momo.enabled:false}")
    private boolean momoEnabled;

    @Value("${payment.momo.create-url:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String momoCreateUrl;

    @Value("${payment.momo.partner-code:}")
    private String momoPartnerCode;

    @Value("${payment.momo.access-key:}")
    private String momoAccessKey;

    @Value("${payment.momo.secret-key:}")
    private String momoSecretKey;

    public String createCheckoutUrl(Booking booking, String clientIpAddress) {
        String paymentMethod = booking.getPaymentMethod();

        if ("VNPAY_QR".equals(paymentMethod)) {
            return createVnpayCheckoutUrl(booking, clientIpAddress);
        }

        if ("MOMO_WALLET".equals(paymentMethod)) {
            return createMomoCheckoutUrl(booking);
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

    public boolean verifyMomoSignature(Map<String, String> params) {
        requireMomoConfig();
        String receivedSignature = params.get("signature");

        if (!StringUtils.hasText(receivedSignature)) {
            return false;
        }

        String rawData = String.join("&",
                "accessKey=" + value(params, "accessKey"),
                "amount=" + value(params, "amount"),
                "extraData=" + value(params, "extraData"),
                "message=" + value(params, "message"),
                "orderId=" + value(params, "orderId"),
                "orderInfo=" + value(params, "orderInfo"),
                "orderType=" + value(params, "orderType"),
                "partnerCode=" + value(params, "partnerCode"),
                "payType=" + value(params, "payType"),
                "requestId=" + value(params, "requestId"),
                "responseTime=" + value(params, "responseTime"),
                "resultCode=" + value(params, "resultCode"),
                "transId=" + value(params, "transId")
        );

        return receivedSignature.equalsIgnoreCase(hmacSha256(momoSecretKey, rawData));
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
        params.put("vnp_OrderInfo", "Ticketor booking " + booking.getId());
        params.put("vnp_OrderType", "billpayment");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", backendBaseUrl + "/api/payments/vnpay/return");
        params.put("vnp_IpAddr", StringUtils.hasText(clientIpAddress) ? clientIpAddress : "127.0.0.1");
        params.put("vnp_CreateDate", LocalDateTime.now().format(VNPAY_DATE_FORMAT));

        String signedData = toVnpaySignedData(params);
        String secureHash = hmacSha512(vnpayHashSecret, signedData);

        return vnpayPayUrl + "?" + signedData + "&vnp_SecureHash=" + secureHash;
    }

    private String createMomoCheckoutUrl(Booking booking) {
        requireMomoConfig();

        String requestId = booking.getPaymentReference();
        String orderId = booking.getPaymentReference();
        String amount = toPlainAmount(booking.getTotalAmount());
        String orderInfo = "Ticketor booking " + booking.getId();
        String redirectUrl = backendBaseUrl + "/api/payments/momo/return";
        String ipnUrl = backendBaseUrl + "/api/payments/momo/ipn";
        String requestType = "captureWallet";
        String extraData = "";

        String rawSignature = String.join("&",
                "accessKey=" + momoAccessKey,
                "amount=" + amount,
                "extraData=" + extraData,
                "ipnUrl=" + ipnUrl,
                "orderId=" + orderId,
                "orderInfo=" + orderInfo,
                "partnerCode=" + momoPartnerCode,
                "redirectUrl=" + redirectUrl,
                "requestId=" + requestId,
                "requestType=" + requestType
        );

        Map<String, String> body = new LinkedHashMap<>();
        body.put("partnerCode", momoPartnerCode);
        body.put("partnerName", "Ticketor");
        body.put("storeId", "Ticketor");
        body.put("requestId", requestId);
        body.put("amount", amount);
        body.put("orderId", orderId);
        body.put("orderInfo", orderInfo);
        body.put("redirectUrl", redirectUrl);
        body.put("ipnUrl", ipnUrl);
        body.put("lang", "vi");
        body.put("requestType", requestType);
        body.put("autoCapture", "true");
        body.put("extraData", extraData);
        body.put("signature", hmacSha256(momoSecretKey, rawSignature));

        Map<?, ?> response = RestClient.create()
                .post()
                .uri(momoCreateUrl)
                .body(body)
                .retrieve()
                .body(Map.class);

        Object payUrl = response == null ? null : response.get("payUrl");
        if (payUrl == null || payUrl.toString().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "MoMo did not return a checkout URL");
        }

        return payUrl.toString();
    }

    private void requireVnpayConfig() {
        if (!vnpayEnabled || !StringUtils.hasText(vnpayTmnCode) || !StringUtils.hasText(vnpayHashSecret)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "VNPAY sandbox is not configured. Set PAYMENT_VNPAY_ENABLED, PAYMENT_VNPAY_TMN_CODE, and PAYMENT_VNPAY_HASH_SECRET."
            );
        }
    }

    private void requireMomoConfig() {
        if (!momoEnabled
                || !StringUtils.hasText(momoPartnerCode)
                || !StringUtils.hasText(momoAccessKey)
                || !StringUtils.hasText(momoSecretKey)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "MoMo sandbox is not configured. Set PAYMENT_MOMO_ENABLED, PAYMENT_MOMO_PARTNER_CODE, PAYMENT_MOMO_ACCESS_KEY, and PAYMENT_MOMO_SECRET_KEY."
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

    private String toPlainAmount(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private String value(Map<String, String> params, String key) {
        return params.getOrDefault(key, "");
    }

    private String hmacSha512(String secret, String data) {
        return hmac("HmacSHA512", secret, data);
    }

    private String hmacSha256(String secret, String data) {
        return hmac("HmacSHA256", secret, data);
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
