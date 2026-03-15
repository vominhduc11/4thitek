package com.devwonder.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncMailService {

    private final MailService mailService;

    public boolean isEnabled() {
        return mailService.isEnabled();
    }

    @Async("mailTaskExecutor")
    public void sendText(String to, String subject, String body) {
        try {
            mailService.sendText(to, subject, body);
        } catch (RuntimeException ex) {
            log.warn("Failed to send async email to {}", to, ex);
        }
    }
}
