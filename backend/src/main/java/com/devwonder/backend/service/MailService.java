package com.devwonder.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.io.UnsupportedEncodingException;
import lombok.RequiredArgsConstructor;
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
    private final AdminSettingsService adminSettingsService;

    public boolean isEnabled() {
        AdminSettingsService.EmailRuntimeSettings settings = adminSettingsService.getEmailSettings();
        return settings.enabled() && StringUtils.hasText(settings.from()) && mailSenderProvider.getIfAvailable() != null;
    }

    public void sendText(String to, String subject, String body) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        AdminSettingsService.EmailRuntimeSettings settings = adminSettingsService.getEmailSettings();
        if (!settings.enabled() || !StringUtils.hasText(settings.from()) || mailSender == null) {
            throw new IllegalStateException("Email service is not configured");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(new InternetAddress(settings.from(), settings.fromName(), StandardCharsets.UTF_8.name()));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException | MailException ex) {
            throw new RuntimeException("Failed to send email", ex);
        }
    }
}
