package com.devwonder.backend.service.support;

import com.devwonder.backend.config.InventoryAlertProperties;
import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.service.AdminSettingsService;
import com.devwonder.backend.service.NotificationService;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InventoryAlertSupport {

    public static final int LOW_STOCK_THRESHOLD = 10;
    public static final int URGENT_STOCK_THRESHOLD = 5;

    private final AdminRepository adminRepository;
    private final NotifyRepository notifyRepository;
    private final NotificationService notificationService;
    private final AppMessageSupport appMessageSupport;
    private final AdminSettingsService adminSettingsService;
    private final InventoryAlertProperties inventoryAlertProperties;

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
        String productLabel = firstNonBlank(product.getName(), product.getSku(), "SKU #" + product.getId());
        String productCode = firstNonBlank(product.getSku(), "PRODUCT-" + product.getId());
        String title = appMessageSupport.get(level.titleKey());
        String content = appMessageSupport.get(level.contentKey(), productLabel, productCode, stock);
        String link = "/products";
        String deepLink = buildDeepLink(product, level);
        Instant cooldownCutoff = Instant.now().minusSeconds(inventoryAlertProperties.alertCooldownHours() * 3600L);
        int createdNotifications = 0;

        for (Admin admin : adminRepository.findAll()) {
            if (admin == null || admin.getId() == null) {
                continue;
            }
            if (admin.getUserStatus() != null && admin.getUserStatus() != StaffUserStatus.ACTIVE) {
                continue;
            }
            if (notifyRepository.existsByAccountIdAndDeepLinkAndCreatedAtAfter(admin.getId(), deepLink, cooldownCutoff)) {
                continue;
            }
            notificationService.create(new CreateNotifyRequest(
                    admin.getId(),
                    title,
                    content,
                    NotifyType.SYSTEM,
                    link,
                    deepLink
            ));
            createdNotifications++;
        }

        return createdNotifications;
    }

    private String buildDeepLink(Product product, AlertLevel level) {
        return "/products?inventoryAlert=%s&productId=%d".formatted(level.name().toLowerCase(), product.getId());
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value == null) {
                continue;
            }
            String trimmed = value.trim();
            if (!trimmed.isEmpty()) {
                return trimmed;
            }
        }
        return "";
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

        String titleKey() {
            return this == URGENT
                    ? "notification.admin.inventory.urgent.title"
                    : "notification.admin.inventory.low.title";
        }

        String contentKey() {
            return this == URGENT
                    ? "notification.admin.inventory.urgent.content"
                    : "notification.admin.inventory.low.content";
        }
    }
}
