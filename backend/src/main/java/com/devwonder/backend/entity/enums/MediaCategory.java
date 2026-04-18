package com.devwonder.backend.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum MediaCategory {
    SUPPORT_TICKET,
    PAYMENT_PROOF,
    PRODUCT,
    BLOG,
    AVATAR,
    OTHER;

    @JsonValue
    public String toJson() {
        return switch (this) {
            case SUPPORT_TICKET -> "support_ticket";
            case PAYMENT_PROOF -> "payment_proof";
            case PRODUCT -> "product";
            case BLOG -> "blog";
            case AVATAR -> "avatar";
            case OTHER -> "other";
        };
    }

    @JsonCreator
    public static MediaCategory fromJson(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "support_ticket", "support-ticket", "supportticket", "support" -> SUPPORT_TICKET;
            case "payment_proof", "payment-proof", "paymentproof" -> PAYMENT_PROOF;
            case "product", "products" -> PRODUCT;
            case "blog", "blogs" -> BLOG;
            case "avatar", "avatars" -> AVATAR;
            case "other" -> OTHER;
            default -> throw new IllegalArgumentException("Unsupported media category: " + value);
        };
    }
}
