package com.devwonder.backend.service;

import com.devwonder.backend.dto.admin.AdminSettingsResponse;
import com.devwonder.backend.dto.admin.UpdateAdminSettingsRequest;
import com.devwonder.backend.entity.AdminSettings;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.AdminSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminSettingsService {

    private static final int DEFAULT_SESSION_TIMEOUT_MINUTES = 30;

    private final AdminSettingsRepository adminSettingsRepository;

    @Transactional
    public AdminSettingsResponse getSettings() {
        return toResponse(getOrCreateSettings());
    }

    @Transactional
    public AdminSettingsResponse updateSettings(UpdateAdminSettingsRequest request) {
        AdminSettings settings = getOrCreateSettings();
        if (request.emailConfirmation() != null) {
            settings.setEmailConfirmation(request.emailConfirmation());
        }
        if (request.sessionTimeoutMinutes() != null) {
            int timeout = request.sessionTimeoutMinutes();
            if (timeout < 5 || timeout > 480) {
                throw new BadRequestException("sessionTimeoutMinutes must be between 5 and 480");
            }
            settings.setSessionTimeoutMinutes(timeout);
        }
        if (request.orderAlerts() != null) {
            settings.setOrderAlerts(request.orderAlerts());
        }
        if (request.inventoryAlerts() != null) {
            settings.setInventoryAlerts(request.inventoryAlerts());
        }
        return toResponse(adminSettingsRepository.save(settings));
    }

    private AdminSettings getOrCreateSettings() {
        return adminSettingsRepository.findFirstByOrderByIdAsc().orElseGet(() -> {
            AdminSettings settings = new AdminSettings();
            settings.setEmailConfirmation(true);
            settings.setSessionTimeoutMinutes(DEFAULT_SESSION_TIMEOUT_MINUTES);
            settings.setOrderAlerts(true);
            settings.setInventoryAlerts(true);
            return adminSettingsRepository.save(settings);
        });
    }

    private AdminSettingsResponse toResponse(AdminSettings settings) {
        return new AdminSettingsResponse(
                settings.getId(),
                Boolean.TRUE.equals(settings.getEmailConfirmation()),
                settings.getSessionTimeoutMinutes() == null ? DEFAULT_SESSION_TIMEOUT_MINUTES : settings.getSessionTimeoutMinutes(),
                Boolean.TRUE.equals(settings.getOrderAlerts()),
                Boolean.TRUE.equals(settings.getInventoryAlerts()),
                settings.getCreatedAt(),
                settings.getUpdatedAt()
        );
    }
}
