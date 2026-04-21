package com.devwonder.backend.service.support;

import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.config.InventoryAlertProperties;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProductStockSyncSupport {

    private static final String INVENTORY_ALERT_TITLE = "SKU đã rơi vào ngưỡng tồn kho thấp";

    private final ProductRepository productRepository;
    private final ProductSerialRepository productSerialRepository;
    private final InventoryAlertSupport inventoryAlertSupport;
    private final AdminRepository adminRepository;
    private final NotifyRepository notifyRepository;
    private final InventoryAlertProperties inventoryAlertProperties;

    public int countAvailableStock(Long productId) {
        if (productId == null) {
            return 0;
        }
        long availableCount = productSerialRepository.countByProductIdAndDealerIsNullAndOrderIsNullAndStatus(
                productId,
                ProductSerialStatus.AVAILABLE
        );
        return Math.toIntExact(Math.max(0L, availableCount));
    }

    public Map<Long, Integer> countAvailableStocks(Collection<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Integer> availableStocks = new LinkedHashMap<>();
        for (Long productId : productIds) {
            if (productId != null) {
                availableStocks.put(productId, 0);
            }
        }
        if (availableStocks.isEmpty()) {
            return Map.of();
        }
        List<Long> filteredProductIds = new ArrayList<>(availableStocks.keySet());
        for (Object[] row : productSerialRepository.countAvailableGroupByProductIds(
                filteredProductIds,
                ProductSerialStatus.AVAILABLE
        )) {
            if (row == null || row.length < 2) {
                continue;
            }
            Object productIdValue = row[0];
            Object countValue = row[1];
            if (!(productIdValue instanceof Long productId) || !availableStocks.containsKey(productId)) {
                continue;
            }
            long availableCount = countValue instanceof Number number ? number.longValue() : 0L;
            availableStocks.put(productId, Math.toIntExact(Math.max(0L, availableCount)));
        }
        return availableStocks;
    }

    @CacheEvict(cacheNames = {
            CacheNames.PUBLIC_PRODUCTS,
            CacheNames.PUBLIC_PRODUCT_BY_ID,
            CacheNames.PUBLIC_PRODUCT_RELATED,
            CacheNames.PUBLIC_FEATURED_PRODUCTS,
            CacheNames.PUBLIC_HOMEPAGE_PRODUCTS
    }, allEntries = true)
    public void syncProductStock(Product product) {
        if (product == null || product.getId() == null) {
            return;
        }
        int previousStock = safeStock(product);
        int nextStock = countAvailableStock(product.getId());
        product.setStock(nextStock);
        productRepository.save(product);
        notifyAdminsOnEscalation(product, previousStock, nextStock);
    }

    @CacheEvict(cacheNames = {
            CacheNames.PUBLIC_PRODUCTS,
            CacheNames.PUBLIC_PRODUCT_BY_ID,
            CacheNames.PUBLIC_PRODUCT_RELATED,
            CacheNames.PUBLIC_FEATURED_PRODUCTS,
            CacheNames.PUBLIC_HOMEPAGE_PRODUCTS
    }, allEntries = true)
    public void syncProductStocks(Collection<Product> products) {
        if (products == null || products.isEmpty()) {
            return;
        }
        Map<Long, Product> productsById = new LinkedHashMap<>();
        for (Product product : products) {
            if (product == null || product.getId() == null) {
                continue;
            }
            productsById.put(product.getId(), product);
        }
        if (productsById.isEmpty()) {
            return;
        }
        Map<Long, Integer> previousStocks = new LinkedHashMap<>();
        for (Product product : productsById.values()) {
            previousStocks.put(product.getId(), safeStock(product));
        }
        List<Product> toSave = new ArrayList<>(productsById.size());
        Map<Long, Integer> availableStocks = countAvailableStocks(productsById.keySet());
        for (Product product : productsById.values()) {
            product.setStock(availableStocks.getOrDefault(product.getId(), 0));
            toSave.add(product);
        }
        productRepository.saveAll(toSave);
        for (Product product : toSave) {
            int previousStock = previousStocks.getOrDefault(product.getId(), 0);
            notifyAdminsOnEscalation(product, previousStock, safeStock(product));
        }
    }

    @CacheEvict(cacheNames = {
            CacheNames.PUBLIC_PRODUCTS,
            CacheNames.PUBLIC_PRODUCT_BY_ID,
            CacheNames.PUBLIC_PRODUCT_RELATED,
            CacheNames.PUBLIC_FEATURED_PRODUCTS,
            CacheNames.PUBLIC_HOMEPAGE_PRODUCTS
    }, allEntries = true)
    public void syncProductStocksByIds(Collection<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return;
        }
        List<Product> products = productRepository.findAllById(productIds);
        if (products.isEmpty()) {
            return;
        }
        syncProductStocks(products);
    }

    public void notifyAdminsForCurrentStock(Product product) {
        int stock = safeStock(product);
        if (!inventoryAlertSupport.shouldSurfaceAttention(product, stock)) {
            return;
        }
        createAdminAlerts(product, stock, true);
    }

    private void notifyAdminsOnEscalation(Product product, int previousStock, int nextStock) {
        if (!inventoryAlertSupport.didAttentionLevelEscalate(product, previousStock, nextStock)) {
            return;
        }
        createAdminAlerts(product, nextStock, true);
    }

    private void createAdminAlerts(Product product, int stock, boolean respectCooldown) {
        if (product == null || product.getId() == null) {
            return;
        }
        String deepLink = "/admin/products?inventoryAlert=" + resolveAlertLevel(stock) + "&productId=" + product.getId();
        String content = "Sản phẩm " + resolveProductLabel(product) + " hiện còn " + stock + " sản phẩm trong kho.";
        Instant cooldownBoundary = Instant.now().minus(Duration.ofHours(inventoryAlertProperties.alertCooldownHours()));

        for (Admin admin : adminRepository.findAll()) {
            if (!isActiveAdmin(admin) || admin.getId() == null) {
                continue;
            }
            if (respectCooldown
                    && notifyRepository.existsByAccountIdAndDeepLinkAndCreatedAtAfter(
                    admin.getId(),
                    deepLink,
                    cooldownBoundary
            )) {
                continue;
            }
            Notify notify = new Notify();
            notify.setAccount(admin);
            notify.setTitle(INVENTORY_ALERT_TITLE);
            notify.setContent(content);
            notify.setType(NotifyType.SYSTEM);
            notify.setLink("/admin/products/" + product.getId());
            notify.setDeepLink(deepLink);
            notify.setIsRead(false);
            notifyRepository.save(notify);
        }
    }

    private boolean isActiveAdmin(Admin admin) {
        return admin != null
                && (admin.getUserStatus() == null || admin.getUserStatus() == StaffUserStatus.ACTIVE);
    }

    private String resolveAlertLevel(int stock) {
        return stock < InventoryAlertSupport.URGENT_STOCK_THRESHOLD ? "urgent" : "low";
    }

    private String resolveProductLabel(Product product) {
        if (product == null) {
            return "không xác định";
        }
        if (product.getSku() != null && !product.getSku().isBlank()) {
            return product.getSku();
        }
        if (product.getName() != null && !product.getName().isBlank()) {
            return product.getName();
        }
        return "ID " + product.getId();
    }

    private int safeStock(Product product) {
        return product == null || product.getStock() == null ? 0 : Math.max(0, product.getStock());
    }
}
