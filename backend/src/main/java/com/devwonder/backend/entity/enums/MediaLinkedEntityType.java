package com.devwonder.backend.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum MediaLinkedEntityType {
    SUPPORT_TICKET_MESSAGE,
    RETURN_REQUEST,
    PRODUCT,
    BLOG,
    OTHER;

    @JsonValue
    public String toJson() {
        return switch (this) {
            case SUPPORT_TICKET_MESSAGE -> "support_ticket_message";
            case RETURN_REQUEST -> "return_request";
            case PRODUCT -> "product";
            case BLOG -> "blog";
            case OTHER -> "other";
        };
    }

    @JsonCreator
    public static MediaLinkedEntityType fromJson(String value) {
        if (value == null) {
            return null;
        }
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "support_ticket_message", "support-ticket-message", "supportticketmessage" -> SUPPORT_TICKET_MESSAGE;
            case "return_request", "return-request", "returnrequest" -> RETURN_REQUEST;
            case "product", "products" -> PRODUCT;
            case "blog", "blogs" -> BLOG;
            case "other" -> OTHER;
            default -> throw new IllegalArgumentException("Unsupported media linked entity type: " + value);
        };
    }
}
