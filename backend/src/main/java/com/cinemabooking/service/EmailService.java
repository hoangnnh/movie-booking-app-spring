package com.cinemabooking.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.frontend.base-url}")
    private String frontendUrl;

    @Value("${app.email.from:}")
    private String fromEmail;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${app.email.provider:auto}")
    private String emailProvider;

    @Value("${app.email.resend.api-key:}")
    private String resendApiKey;

    @Value("${app.email.resend.base-url}")
    private String resendBaseUrl;

    @Value("${app.email.brevo.api-key:}")
    private String brevoApiKey;

    @Value("${app.email.brevo.base-url}")
    private String brevoBaseUrl;

    @Value("${app.email.console-fallback:false}")
    private boolean consoleFallback;

    @Value("${app.auth.verification-token-expiry-hours:24}")
    private long verificationTokenExpiryHours;

    public void sendVerificationEmail(String toEmail, String token) {
        String link = baseUrl + "/api/auth/verify-email?token=" + token;
        sendEmail(toEmail,
                "🎬 CinemaTick Account Verification",
                "Please click the following link to verify your email address:\n\n" + link +
                        "\n\nThis link will expire in " + verificationTokenExpiryHours + " hours"
        );
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        sendEmail(toEmail,
                "🔐 CinemaTick Password Reset",
                "Click the following link to reset your password:\n\n" + link +
                        "\n\nThis link will expire in 15 minutes.\n" +
                        "If you did not request this, please ignore this email."
        );
    }

    private void sendEmail(String to, String subject, String body) {
        if (isResendEnabled()) {
            sendWithResend(to, subject, body);
            return;
        }

        if (isBrevoEnabled()) {
            sendWithBrevo(to, subject, body);
            return;
        }

        if (isSmtpEnabled()) {
            sendWithSmtp(to, subject, body);
            return;
        }

        handleMissingEmailConfig(to, subject, body);
    }

    private boolean isResendEnabled() {
        return "resend".equalsIgnoreCase(emailProvider) ||
                ("auto".equalsIgnoreCase(emailProvider) && StringUtils.hasText(resendApiKey));
    }

    private boolean isSmtpEnabled() {
        return "smtp".equalsIgnoreCase(emailProvider) ||
                ("auto".equalsIgnoreCase(emailProvider) && StringUtils.hasText(smtpUsername));
    }

    private boolean isBrevoEnabled() {
        return "brevo".equalsIgnoreCase(emailProvider) ||
                ("auto".equalsIgnoreCase(emailProvider) && StringUtils.hasText(brevoApiKey));
    }

    private void sendWithResend(String to, String subject, String body) {
        if (!StringUtils.hasText(resendApiKey) || !StringUtils.hasText(fromEmail)) {
            handleMissingEmailConfig(to, subject, body);
            return;
        }

        try {
            RestClient.builder()
                    .baseUrl(resendBaseUrl)
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey)
                    .defaultHeader(HttpHeaders.USER_AGENT, "cinematick-backend/1.0")
                    .build()
                    .post()
                    .uri("/emails")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new ResendEmailRequest(
                            fromEmail,
                            new String[]{to},
                            subject,
                            toHtml(body),
                            body
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            log.warn(
                    "Resend email delivery failed. Status: {}, Response: {}",
                    ex.getStatusCode(),
                    ex.getResponseBodyAsString()
            );
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "Email delivery failed through Resend. Please check the backend logs for the Resend response.",
                    ex
            );
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "Email delivery failed through Resend. Please check the Resend API key, sender domain, and recipient settings.",
                    ex
            );
        }
    }

    private void sendWithSmtp(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(StringUtils.hasText(fromEmail) ? fromEmail : smtpUsername);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
        } catch (MailException ex) {
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "Email delivery is not configured correctly. Please check the server mail settings.",
                    ex
            );
        }
    }

    private void sendWithBrevo(String to, String subject, String body) {
        if (!StringUtils.hasText(brevoApiKey) || !StringUtils.hasText(fromEmail)) {
            handleMissingEmailConfig(to, subject, body);
            return;
        }

        EmailAddress sender = parseSender(fromEmail);

        try {
            RestClient.builder()
                    .baseUrl(brevoBaseUrl)
                    .defaultHeader("api-key", brevoApiKey)
                    .defaultHeader(HttpHeaders.USER_AGENT, "cinematick-backend/1.0")
                    .build()
                    .post()
                    .uri("/v3/smtp/email")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new BrevoEmailRequest(
                            sender,
                            new EmailAddress[]{new EmailAddress(to, null)},
                            subject,
                            toHtml(body),
                            body
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            log.warn(
                    "Brevo email delivery failed. Status: {}, Response: {}",
                    ex.getStatusCode(),
                    ex.getResponseBodyAsString()
            );
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "Email delivery failed through Brevo. Please check the backend logs for the Brevo response.",
                    ex
            );
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "Email delivery failed through Brevo. Please check the Brevo API key, sender, and recipient settings.",
                    ex
            );
        }
    }

    private void handleMissingEmailConfig(String to, String subject, String body) {
        if (consoleFallback) {
            log.warn(
                    "Email is not configured. Console fallback enabled. To: {}, Subject: {}, Body:\n{}",
                    to,
                    subject,
                    body
            );
            return;
        }

        throw new ResponseStatusException(
                SERVICE_UNAVAILABLE,
                "Email delivery is not configured correctly. Please check the server mail settings."
        );
    }

    private String toHtml(String body) {
        return "<p>" + body
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\n", "<br>")
                + "</p>";
    }

    private EmailAddress parseSender(String value) {
        String trimmedValue = value.trim();
        int openBracketIndex = trimmedValue.indexOf('<');
        int closeBracketIndex = trimmedValue.indexOf('>');

        if (openBracketIndex >= 0 && closeBracketIndex > openBracketIndex) {
            String name = trimmedValue.substring(0, openBracketIndex).trim();
            String email = trimmedValue.substring(openBracketIndex + 1, closeBracketIndex).trim();
            return new EmailAddress(email, name.isBlank() ? null : name);
        }

        return new EmailAddress(trimmedValue, null);
    }

    private record ResendEmailRequest(
            String from,
            String[] to,
            String subject,
            String html,
            String text
    ) {
    }

    private record BrevoEmailRequest(
            EmailAddress sender,
            EmailAddress[] to,
            String subject,
            String htmlContent,
            String textContent
    ) {
    }

    private record EmailAddress(
            String email,
            String name
    ) {
    }
}
