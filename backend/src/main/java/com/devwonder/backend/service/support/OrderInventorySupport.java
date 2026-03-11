package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.CreateDealerOrderItemRequest;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.ProductRepository;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OrderInventorySupport {

    private final ProductRepository productRepository;

    public Map<Long, Product> lockProductsForRequests(Collection<CreateDealerOrderItemRequest> itemRequests) {
        Map<Long, Integer> requestedQuantities = new LinkedHashMap<>();
        if (itemRequests != null) {
            for (CreateDealerOrderItemRequest itemRequest : itemRequests) {
                if (itemRequest == null || itemRequest.productId() == null) {
                    continue;
                }
                requestedQuantities.merge(itemRequest.productId(), safeQuantity(itemRequest.quantity()), Integer::sum);
            }
        }
        return lockProducts(requestedQuantities.keySet());
    }

    public void reserveStock(Map<Long, Integer> requestedQuantities, Map<Long, Product> lockedProducts) {
        for (Map.Entry<Long, Integer> entry : requestedQuantities.entrySet()) {
            Product product = lockedProducts.get(entry.getKey());
            if (product == null) {
                throw new ResourceNotFoundException("Product not found");
            }
            int requestedQuantity = safeQuantity(entry.getValue());
            int availableStock = safeStock(product);
            if (requestedQuantity > availableStock) {
                throw new BadRequestException("Insufficient stock for product " + product.getName());
            }
            product.setStock(availableStock - requestedQuantity);
        }
    }

    public void restoreStock(Order order) {
        Map<Long, Integer> quantitiesToRestore = new LinkedHashMap<>();
        if (order != null && order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                if (item == null || item.getProduct() == null || item.getProduct().getId() == null) {
                    continue;
                }
                quantitiesToRestore.merge(item.getProduct().getId(), safeQuantity(item.getQuantity()), Integer::sum);
            }
        }
        if (quantitiesToRestore.isEmpty()) {
            return;
        }
        Map<Long, Product> lockedProducts = lockProducts(quantitiesToRestore.keySet());
        for (Map.Entry<Long, Integer> entry : quantitiesToRestore.entrySet()) {
            Product product = lockedProducts.get(entry.getKey());
            if (product == null) {
                continue;
            }
            product.setStock(safeStock(product) + safeQuantity(entry.getValue()));
        }
    }

    private Map<Long, Product> lockProducts(Collection<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }
        List<Product> lockedProducts = productRepository.findAllActiveByIdInForUpdate(productIds);
        Map<Long, Product> productsById = new LinkedHashMap<>();
        for (Product product : lockedProducts) {
            productsById.put(product.getId(), product);
        }
        if (productsById.size() != productIds.size()) {
            throw new ResourceNotFoundException("Product not found");
        }
        return productsById;
    }

    private int safeQuantity(Integer value) {
        return value == null ? 0 : Math.max(value, 0);
    }

    private int safeStock(Product product) {
        return product == null || product.getStock() == null ? 0 : Math.max(product.getStock(), 0);
    }
}
