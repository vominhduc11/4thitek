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
        product.setStock(countAvailableStock(product.getId()));
        productRepository.save(product);
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
        for (Product product : productsById.values()) {
            product.setStock(countAvailableStock(product.getId()));
            toSave.add(product);
        }
        productRepository.saveAll(toSave);
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
}
