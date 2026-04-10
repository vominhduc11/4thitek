package com.devwonder.backend.dto.admin;

import java.time.Instant;

public record AdminPublicContentSectionResponse(
        Long id,
        String section,
        String locale,
        String payload,
        boolean published,
        Instant createdAt,
        Instant updatedAt
) {
}
