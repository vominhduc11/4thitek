package com.devwonder.backend.entity.enums;

import java.util.Arrays;

public enum FinancialSettlementType {
    CANCELLATION_REFUND,
    STALE_ORDER_REVIEW;

    public static FinancialSettlementType fromDatabaseValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Financial settlement type must not be blank");
        }
        return Arrays.stream(values())
                .filter(value -> value.name().equalsIgnoreCase(rawValue.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported financial settlement type: " + rawValue));
    }

    public static String requireValidDatabaseValue(String rawValue) {
        return fromDatabaseValue(rawValue).name();
    }
}
