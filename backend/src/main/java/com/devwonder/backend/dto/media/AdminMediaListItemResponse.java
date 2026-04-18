package com.devwonder.backend.dto.media;

import com.devwonder.backend.entity.enums.MediaCategory;
import com.devwonder.backend.entity.enums.MediaStatus;
import com.devwonder.backend.entity.enums.MediaType;
import java.time.Instant;

public record AdminMediaListItemResponse(
        Long id,
        String objectKey,
        String fileName,
        MediaType mediaType,
        String contentType,
        Long sizeBytes,
        MediaCategory category,
        MediaStatus status,
        Long ownerAccountId,
        String ownerName,
        Long uploadedByAccountId,
        String uploadedByName,
        Long linkedTicketId,
        String linkedTicketCode,
        String linkedDealerName,
        String downloadUrl,
        Instant createdAt,
        Instant finalizedAt,
        Instant deletedAt
) {
}
