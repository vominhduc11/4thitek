package com.devwonder.backend.service;

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
    @Scheduled(fixedDelayString = "${app.inventory.alert-scan-interval-ms:3600000}")
    @Transactional
    public void scanExistingLowStockProducts() {
        List<Product> lowStockProducts = productRepository.findAllActiveBelowStock(
                InventoryAlertSupport.LOW_STOCK_THRESHOLD
        );
        if (lowStockProducts.isEmpty()) {
            return;
        }

        int productsRequiringAttention = 0;
        for (Product product : lowStockProducts) {
            if (inventoryAlertSupport.shouldSurfaceAttention(product, safeStock(product))) {
                productsRequiringAttention++;
            }
        }

        if (productsRequiringAttention > 0) {
            log.info(
                    "InventoryAlertSweepJob identified {} products requiring operational attention",
                    productsRequiringAttention
            );
        }
    }

    private int safeStock(Product product) {
        return product == null || product.getStock() == null ? 0 : Math.max(0, product.getStock());
    }
}
