package com.devwonder.backend.service.support;

import com.devwonder.backend.repository.AccountRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminIdentitySupport {

    private final AccountRepository accountRepository;

    public String generateUniqueUsername(String rawName, String suffix) {
        String base = slugify(rawName);
        if (base.isBlank()) {
            base = suffix;
        }
        String username = base;
        int counter = 1;
        while (accountRepository.existsByUsernameIgnoreCase(username)) {
            username = base + counter;
            counter++;
        }
        return username;
    }

    private String slugify(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return "";
        }
        String ascii = normalized.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", ".");
        ascii = ascii.replaceAll("^\\.+|\\.+$", "");
        return ascii;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
