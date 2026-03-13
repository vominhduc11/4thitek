package com.devwonder.backend.service.support;

import com.devwonder.backend.exception.BadRequestException;
import java.util.Locale;
import java.util.regex.Pattern;

public final class AccountValidationSupport {

    private static final Pattern VIETNAM_PHONE_PATTERN = Pattern.compile("^0\\d{9}$");
    private static final Pattern HAS_UPPERCASE = Pattern.compile(".*[A-Z].*");
    private static final Pattern HAS_LOWERCASE = Pattern.compile(".*[a-z].*");
    private static final Pattern HAS_DIGIT = Pattern.compile(".*\\d.*");
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MIN_USERNAME_LENGTH = 3;
    private static final int MAX_USERNAME_LENGTH = 50;

    private AccountValidationSupport() {
    }

    public static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static String normalizeEmail(String value) {
        String normalized = normalize(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    public static void assertStrongPassword(String rawPassword, String fieldName) {
        String password = normalize(rawPassword);
        if (password == null
                || password.length() < MIN_PASSWORD_LENGTH
                || !HAS_UPPERCASE.matcher(password).matches()
                || !HAS_LOWERCASE.matcher(password).matches()
                || !HAS_DIGIT.matcher(password).matches()) {
            throw new BadRequestException(
                    fieldName + " must be at least 8 characters and include uppercase, lowercase, and a number"
            );
        }
    }

    public static void assertUsernameLength(String rawUsername, String fieldName) {
        String username = normalize(rawUsername);
        if (username == null) {
            throw new BadRequestException(fieldName + " is required");
        }
        if (username.length() < MIN_USERNAME_LENGTH || username.length() > MAX_USERNAME_LENGTH) {
            throw new BadRequestException(fieldName + " must be 3-50 characters");
        }
    }

    public static void assertVietnamPhone(String rawPhone, String fieldName) {
        String phone = normalize(rawPhone);
        if (phone == null) {
            throw new BadRequestException(fieldName + " is required");
        }
        if (!VIETNAM_PHONE_PATTERN.matcher(phone).matches()) {
            throw new BadRequestException(fieldName + " must be a valid 10-digit Vietnam number");
        }
    }

    public static void assertOptionalVietnamPhone(String rawPhone, String fieldName) {
        String phone = normalize(rawPhone);
        if (phone == null) {
            return;
        }
        if (!VIETNAM_PHONE_PATTERN.matcher(phone).matches()) {
            throw new BadRequestException(fieldName + " must be a valid 10-digit Vietnam number");
        }
    }
}
