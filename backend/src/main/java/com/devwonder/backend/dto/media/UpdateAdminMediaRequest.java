package com.devwonder.backend.dto.media;

public record UpdateAdminMediaRequest(
        String status,
        Boolean force,
        String reason
) {
}
