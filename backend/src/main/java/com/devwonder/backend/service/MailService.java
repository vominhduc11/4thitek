package com.devwonder.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.io.UnsupportedEncodingException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class MailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from:}")
    private String fromAddress;

    @Value("${app.mail.from-name:4ThiTek}")
    private String fromName;

    public boolean isEnabled() {
        return enabled && StringUtils.hasText(fromAddress) && mailSenderProvider.getIfAvailable() != null;
    }

    public void sendText(String to, String subject, String body) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (!isEnabled() || mailSender == null) {
            throw new IllegalStateException("Email service is not configured");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(new InternetAddress(fromAddress, fromName, StandardCharsets.UTF_8.name()));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException | MailException ex) {
            throw new RuntimeException("Failed to send email", ex);
        }
    }
}
