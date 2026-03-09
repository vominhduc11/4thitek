package com.devwonder.backend.service.support;

import com.devwonder.backend.repository.AccountRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminIdentitySupport {

    private final AccountRepository accountRepository;

    public UniqueIdentity generateUniqueIdentity(String rawName, String suffix) {
        String base = slugify(rawName);
        if (base.isBlank()) {
            base = suffix;
        }
        String username = base;
        String email = base + "@internal.4thitek.local";
        int counter = 1;
        while (accountRepository.existsByUsername(username) || accountRepository.findByEmail(email).isPresent()) {
            username = base + counter;
            email = base + counter + "@internal.4thitek.local";
            counter++;
        }
        return new UniqueIdentity(username, email);
    }

    public record UniqueIdentity(String username, String email) {
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
