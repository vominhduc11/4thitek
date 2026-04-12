package com.devwonder.backend.service.support;

import com.devwonder.backend.config.InventoryAlertProperties;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.service.AdminSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InventoryAlertSupport {

    public static final int LOW_STOCK_THRESHOLD = 10;
    public static final int URGENT_STOCK_THRESHOLD = 5;

    private final AdminRepository adminRepository;
    private final AdminSettingsService adminSettingsService;

    public void notifyIfThresholdCrossed(Product product, int previousStock, int nextStock) {
        if (product == null || product.getId() == null || Boolean.TRUE.equals(product.getIsDeleted())) {
            return;
        }
        if (!adminSettingsService.getEffectiveSettings().inventoryAlerts()) {
            return;
        }

        AlertLevel previousLevel = AlertLevel.fromStock(previousStock);
        AlertLevel nextLevel = AlertLevel.fromStock(nextStock);
        if (!nextLevel.isMoreSevereThan(previousLevel)) {
            return;
        }

        notifyAdmins(product, nextStock, nextLevel);
    }

    public int notifyIfStockRequiresAttention(Product product, int stock) {
        if (product == null || product.getId() == null || Boolean.TRUE.equals(product.getIsDeleted())) {
            return 0;
        }
        if (!adminSettingsService.getEffectiveSettings().inventoryAlerts()) {
            return 0;
        }

        AlertLevel level = AlertLevel.fromStock(stock);
        if (level == AlertLevel.NONE) {
            return 0;
        }

        return notifyAdmins(product, stock, level);
    }

    private int notifyAdmins(Product product, int stock, AlertLevel level) {
        int adminAttentionCount = 0;
        for (Admin admin : adminRepository.findAll()) {
            if (admin == null || admin.getId() == null) {
                continue;
            }
            if (admin.getUserStatus() != null && admin.getUserStatus() != StaffUserStatus.ACTIVE) {
                continue;
            }
            adminAttentionCount++;
        }
        return adminAttentionCount;
    }

    enum AlertLevel {
        NONE,
        LOW,
        URGENT;

        static AlertLevel fromStock(int stock) {
            if (stock < URGENT_STOCK_THRESHOLD) {
                return URGENT;
            }
            if (stock < LOW_STOCK_THRESHOLD) {
                return LOW;
            }
            return NONE;
        }

        boolean isMoreSevereThan(AlertLevel previous) {
            if (this == NONE) {
                return false;
            }
            if (previous == null) {
                return true;
            }
            return ordinal() > previous.ordinal();
        }
    }
}
