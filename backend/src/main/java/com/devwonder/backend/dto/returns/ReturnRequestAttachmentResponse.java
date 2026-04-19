package com.devwonder.backend.dto.returns;

import com.devwonder.backend.entity.enums.ReturnRequestAttachmentCategory;

public record ReturnRequestAttachmentResponse(
        Long id,
        Long itemId,
        Long mediaAssetId,
        String url,
        String fileName,
        ReturnRequestAttachmentCategory category
) {
}
