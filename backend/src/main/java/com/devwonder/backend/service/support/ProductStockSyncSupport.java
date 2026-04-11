package com.devwonder.backend.service.support;

import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
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

    private final ProductRepository productRepository;
    private final ProductSerialRepository productSerialRepository;
    private final InventoryAlertSupport inventoryAlertSupport;

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
        Product saved = productRepository.save(product);
        inventoryAlertSupport.notifyIfThresholdCrossed(saved, previousStock, nextStock);
    }

    @CacheEvict(cacheNames = {
            CacheNames.PUBLIC_PRODUCTS,
            CacheNames.PUBLIC_PRODUCT_BY_ID,
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
        List<Product> toSave = new ArrayList<>(productsById.size());
        Map<Long, Integer> previousStocks = new LinkedHashMap<>();
        Map<Long, Integer> availableStocks = countAvailableStocks(productsById.keySet());
        for (Product product : productsById.values()) {
            previousStocks.put(product.getId(), safeStock(product));
            product.setStock(availableStocks.getOrDefault(product.getId(), 0));
            toSave.add(product);
        }
        List<Product> savedProducts = productRepository.saveAll(toSave);
        for (Product savedProduct : savedProducts) {
            int previousStock = previousStocks.getOrDefault(savedProduct.getId(), 0);
            inventoryAlertSupport.notifyIfThresholdCrossed(savedProduct, previousStock, safeStock(savedProduct));
        }
    }

    @CacheEvict(cacheNames = {
            CacheNames.PUBLIC_PRODUCTS,
            CacheNames.PUBLIC_PRODUCT_BY_ID,
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

    private int safeStock(Product product) {
        return product == null || product.getStock() == null ? 0 : Math.max(0, product.getStock());
    }
}
