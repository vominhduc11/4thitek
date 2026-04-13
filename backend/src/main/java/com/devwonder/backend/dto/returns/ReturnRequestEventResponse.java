package com.devwonder.backend.dto.returns;

import java.time.Instant;

public record ReturnRequestEventResponse(
        Long id,
        String eventType,
        String actor,
        String actorRole,
        String payloadJson,
        Instant createdAt
) {
}
