package com.devwonder.backend.dto.media;

import com.devwonder.backend.entity.enums.MediaCategory;
import com.devwonder.backend.entity.enums.MediaLinkedEntityType;
import com.devwonder.backend.entity.enums.MediaStatus;
import com.devwonder.backend.entity.enums.MediaType;
import com.devwonder.backend.entity.enums.StorageProvider;
import java.time.Instant;

public record MediaAssetResponse(
        Long id,
        String objectKey,
        String originalFileName,
        String contentType,
        MediaType mediaType,
        MediaCategory category,
        Long sizeBytes,
        StorageProvider storageProvider,
        Long ownerAccountId,
        Long uploadedByAccountId,
        MediaStatus status,
        MediaLinkedEntityType linkedEntityType,
        Long linkedEntityId,
        String downloadUrl,
        String accessUrl,
        Instant createdAt,
        Instant finalizedAt,
        Instant deletedAt
) {
}
