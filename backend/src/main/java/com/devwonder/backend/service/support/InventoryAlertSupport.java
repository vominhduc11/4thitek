package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.Product;
import com.devwonder.backend.service.AdminSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InventoryAlertSupport {

    public static final int LOW_STOCK_THRESHOLD = 10;
    public static final int URGENT_STOCK_THRESHOLD = 5;

    private final AdminSettingsService adminSettingsService;

    public boolean shouldSurfaceAttention(Product product, int stock) {
        if (!isEligibleProduct(product) || !adminSettingsService.getEffectiveSettings().inventoryAlerts()) {
            return false;
        }
        return AlertLevel.fromStock(stock) != AlertLevel.NONE;
    }

    public boolean didAttentionLevelEscalate(Product product, int previousStock, int nextStock) {
        if (!isEligibleProduct(product) || !adminSettingsService.getEffectiveSettings().inventoryAlerts()) {
            return false;
        }

        AlertLevel previousLevel = AlertLevel.fromStock(previousStock);
        AlertLevel nextLevel = AlertLevel.fromStock(nextStock);
        return nextLevel.isMoreSevereThan(previousLevel);
    }

    private boolean isEligibleProduct(Product product) {
        return product != null
                && product.getId() != null
                && !Boolean.TRUE.equals(product.getIsDeleted());
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
