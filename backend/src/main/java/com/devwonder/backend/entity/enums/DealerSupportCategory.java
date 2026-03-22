package com.devwonder.backend.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum DealerSupportCategory {
    ORDER,
    WARRANTY,
    PRODUCT,
    PAYMENT,
    RETURN,
    OTHER;

    @JsonValue
    public String toJson() {
        return switch (this) {
            case ORDER -> "order";
            case WARRANTY -> "warranty";
            case PRODUCT -> "product";
            case PAYMENT -> "payment";
            case RETURN -> "returnOrder";
            case OTHER -> "other";
        };
    }

    @JsonCreator
    public static DealerSupportCategory fromJson(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "order" -> ORDER;
            case "warranty" -> WARRANTY;
            case "product" -> PRODUCT;
            case "payment" -> PAYMENT;
            case "returnorder", "return_order", "return-order", "return" -> RETURN;
            case "other" -> OTHER;
            default -> throw new IllegalArgumentException("Unsupported support category: " + value);
        };
    }
}
