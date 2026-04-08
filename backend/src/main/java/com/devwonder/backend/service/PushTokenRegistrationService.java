package com.devwonder.backend.service;

import com.devwonder.backend.dto.dealer.RegisterPushTokenRequest;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.PushDeviceToken;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.PushDeviceTokenRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PushTokenRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(PushTokenRegistrationService.class);

    private final AccountRepository accountRepository;
    private final PushDeviceTokenRepository pushDeviceTokenRepository;

    @Transactional
    public void register(String username, RegisterPushTokenRequest request) {
        Account account = requireAccount(username);
        String token = normalizeRequired(request.token(), "token");
        PushDeviceToken deviceToken = pushDeviceTokenRepository.findByToken(token)
                .orElseGet(PushDeviceToken::new);
        deviceToken.setAccount(account);
        deviceToken.setToken(token);
        deviceToken.setPlatform(normalizeRequired(request.platform(), "platform").toUpperCase());
        deviceToken.setDeviceName(normalizeOptional(request.deviceName()));
        deviceToken.setAppVersion(normalizeOptional(request.appVersion()));
        deviceToken.setLanguageCode(normalizeOptional(request.languageCode()));
        deviceToken.setActive(Boolean.TRUE);
        deviceToken.setLastSeenAt(Instant.now());
        pushDeviceTokenRepository.save(deviceToken);
        log.info(
                "Push token registered: account={}, platform={}, token={}",
                account.getUsername(),
                deviceToken.getPlatform(),
                abbreviate(token)
        );
    }

    @Transactional
    public void unregister(String username, String rawToken) {
        Account account = requireAccount(username);
        String token = normalizeRequired(rawToken, "token");
        pushDeviceTokenRepository.findByAccountIdAndToken(account.getId(), token).ifPresent(deviceToken -> {
            deviceToken.setActive(Boolean.FALSE);
            deviceToken.setLastSeenAt(Instant.now());
            pushDeviceTokenRepository.save(deviceToken);
            log.info(
                    "Push token unregistered: account={}, token={}",
                    account.getUsername(),
                    abbreviate(token)
            );
        });
    }

    private Account requireAccount(String username) {
        return accountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
    }

    private String normalizeRequired(String value, String fieldName) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new BadRequestException(fieldName + " is required");
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String abbreviate(String token) {
        if (token == null || token.isBlank()) {
            return "(empty)";
        }
        if (token.length() <= 12) {
            return token;
        }
        return token.substring(0, 8) + "..." + token.substring(token.length() - 4);
    }
}
