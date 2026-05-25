package com.cinemabooking.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

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
                "🎬 Xác nhận tài khoản CineBook",
                "Vui lòng click vào link sau để xác nhận email:\n\n" + link +
                        "\n\nLink có hiệu lực trong 24 giờ."
        );
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        sendEmail(toEmail,
                "🔐 Đặt lại mật khẩu CineBook",
                "Click vào link sau để đặt lại mật khẩu:\n\n" + link +
                        "\n\nLink có hiệu lực trong 15 phút.\n" +
                        "Nếu bạn không yêu cầu, hãy bỏ qua email này."
        );
    }

    private void sendEmail(String to, String subject, String body) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        mailSender.send(msg);
    }
}