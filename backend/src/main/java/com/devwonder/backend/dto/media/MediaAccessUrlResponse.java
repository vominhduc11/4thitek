package com.devwonder.backend.dto.media;

import java.time.Instant;

public record MediaAccessUrlResponse(
        Long mediaAssetId,
        String accessUrl,
        Instant expiresAt
) {
}
