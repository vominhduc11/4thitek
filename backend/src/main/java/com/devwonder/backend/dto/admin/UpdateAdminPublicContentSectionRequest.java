package com.devwonder.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record UpdateAdminPublicContentSectionRequest(
        @NotBlank String locale,
        @NotBlank String payload,
        Boolean published
) {
}
