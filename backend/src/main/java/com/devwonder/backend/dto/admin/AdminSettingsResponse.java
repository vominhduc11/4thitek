package com.devwonder.backend.dto.admin;

import java.time.Instant;

public record AdminSettingsResponse(
        Long id,
        boolean emailConfirmation,
        int sessionTimeoutMinutes,
        boolean orderAlerts,
        boolean inventoryAlerts,
        Instant createdAt,
        Instant updatedAt
) {
}
