package com.devwonder.backend.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum PaymentMethod {
    BANK_TRANSFER;

    @JsonCreator
    public static PaymentMethod fromValue(String rawValue) {
        if (rawValue == null) {
            return null;
        }
        String normalized = rawValue.trim().toUpperCase(Locale.ROOT);
        if ("BANK_TRANSFER".equals(normalized)) {
            return BANK_TRANSFER;
        }
        throw new IllegalArgumentException("Only BANK_TRANSFER is supported");
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}
