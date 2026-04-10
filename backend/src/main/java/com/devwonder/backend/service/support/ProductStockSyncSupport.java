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
        for (Product product : productsById.values()) {
            previousStocks.put(product.getId(), safeStock(product));
            product.setStock(countAvailableStock(product.getId()));
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
