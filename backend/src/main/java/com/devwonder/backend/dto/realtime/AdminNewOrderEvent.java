package com.devwonder.backend.dto.realtime;

import java.time.Instant;

public record AdminNewOrderEvent(
        Long orderId,
        String orderCode,
        Long dealerId,
        String dealerName,
        Instant createdAt
) {
}
