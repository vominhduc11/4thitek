package com.devwonder.backend.dto.media;

import jakarta.validation.constraints.NotNull;

public record FinalizeMediaUploadRequest(
        @NotNull(message = "mediaAssetId is required")
        Long mediaAssetId
) {
}
