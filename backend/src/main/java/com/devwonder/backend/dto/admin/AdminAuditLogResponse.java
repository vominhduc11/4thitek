package com.devwonder.backend.dto.admin;

import java.time.Instant;

public record AdminAuditLogResponse(
        Long id,
        Instant createdAt,
        String actor,
        String actorRole,
        String action,
        String requestMethod,
        String requestPath,
        String entityType,
        String entityId,
        String ipAddress
) {
}
