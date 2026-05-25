package com.cinemabooking.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.frontend.base-url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendVerificationEmail(String toEmail, String token) {
        String link = baseUrl + "/api/auth/verify-email?token=" + token;
        sendEmail(toEmail,
                "🎬 Ticketor Account Verification",
                "Please click the following link to verify your email address:\n\n" + link +
                        "\n\nThis link will expire in 24 hours"
        );
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        sendEmail(toEmail,
                "🔐 Ticketor Password Reset",
                "Click the following link to reset your password:\n\n" + link +
                        "\n\nThis link will expire in 15 minutes.\n" +
                        "If you did not request this, please ignore this email."
        );
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
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
}
