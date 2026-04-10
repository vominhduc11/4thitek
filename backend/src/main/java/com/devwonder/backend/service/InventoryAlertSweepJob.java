package com.devwonder.backend.service;

import com.devwonder.backend.config.InventoryAlertProperties;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.service.support.InventoryAlertSupport;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class InventoryAlertSweepJob {

    private static final Logger log = LoggerFactory.getLogger(InventoryAlertSweepJob.class);

    private final ProductRepository productRepository;
    private final InventoryAlertSupport inventoryAlertSupport;
    private final InventoryAlertProperties inventoryAlertProperties;

    @Scheduled(fixedDelayString = "${app.inventory.alert-scan-interval-ms:3600000}")
    @Transactional
    public void scanExistingLowStockProducts() {
        List<Product> lowStockProducts = productRepository.findAllActiveBelowStock(
                InventoryAlertSupport.LOW_STOCK_THRESHOLD
        );
        if (lowStockProducts.isEmpty()) {
            return;
        }

        int createdNotifications = 0;
        for (Product product : lowStockProducts) {
            createdNotifications += inventoryAlertSupport.notifyIfStockRequiresAttention(
                    product,
                    safeStock(product)
            );
        }

        if (createdNotifications > 0) {
            log.info(
                    "InventoryAlertSweepJob created {} notifications across {} low-stock products (cooldown={}h)",
                    createdNotifications,
                    lowStockProducts.size(),
                    inventoryAlertProperties.alertCooldownHours()
            );
        }
    }

    private int safeStock(Product product) {
        return product == null || product.getStock() == null ? 0 : Math.max(0, product.getStock());
    }
}
