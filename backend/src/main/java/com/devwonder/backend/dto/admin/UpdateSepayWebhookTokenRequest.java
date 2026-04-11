package com.devwonder.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record UpdateSepayWebhookTokenRequest(
        @NotBlank(message = "newWebhookToken must not be blank")
        String newWebhookToken
) {
}
