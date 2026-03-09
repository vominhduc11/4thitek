package com.devwonder.backend.dto.admin;

public record UpdateAdminSettingsRequest(
        Boolean emailConfirmation,
        Integer sessionTimeoutMinutes,
        Boolean orderAlerts,
        Boolean inventoryAlerts
) {
}
