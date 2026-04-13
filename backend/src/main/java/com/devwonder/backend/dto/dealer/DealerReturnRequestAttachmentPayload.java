package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.ReturnRequestAttachmentCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DealerReturnRequestAttachmentPayload(
        Long itemId,
        Long productSerialId,

        @NotBlank(message = "url is required")
        @Size(max = 2048, message = "url must be at most 2048 characters")
        String url,

        @Size(max = 255, message = "fileName must be at most 255 characters")
        String fileName,

        @NotNull(message = "category is required")
        ReturnRequestAttachmentCategory category
) {
}
