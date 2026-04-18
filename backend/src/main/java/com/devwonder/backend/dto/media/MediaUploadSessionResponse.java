package com.devwonder.backend.dto.media;

import java.time.Instant;
import java.util.Map;

public record MediaUploadSessionResponse(
        Long mediaAssetId,
        MediaUploadMethod uploadMethod,
        String uploadUrl,
        Map<String, String> uploadHeaders,
        Instant expiresAt
) {
}
