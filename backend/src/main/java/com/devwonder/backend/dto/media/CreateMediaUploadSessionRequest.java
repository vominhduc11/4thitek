package com.devwonder.backend.dto.media;

import com.devwonder.backend.entity.enums.MediaCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateMediaUploadSessionRequest(
        @NotBlank(message = "fileName is required")
        String fileName,
        @NotBlank(message = "contentType is required")
        String contentType,
        @NotNull(message = "sizeBytes is required")
        @Positive(message = "sizeBytes must be positive")
        Long sizeBytes,
        MediaCategory category
) {
}
