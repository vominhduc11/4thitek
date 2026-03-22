package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.CreateDealerOrderItemRequest;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.entity.ProductSerial;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OrderInventorySupport {

    private final ProductRepository productRepository;
    private final ProductSerialRepository productSerialRepository;

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

    public void reserveStock(Map<Long, Integer> requestedQuantities, Map<Long, Product> lockedProducts, Order order) {
        List<ProductSerial> toReserve = new ArrayList<>();
        List<Product> toUpdate = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : requestedQuantities.entrySet()) {
            Product product = lockedProducts.get(entry.getKey());
            if (product == null) {
                throw new ResourceNotFoundException("Product not found");
            }
            int requestedQuantity = safeQuantity(entry.getValue());
            if (requestedQuantity <= 0) {
                continue;
            }
            int availableStock = safeQuantity(product.getStock());
            if (availableStock < requestedQuantity) {
                throw new BadRequestException("Insufficient stock for product " + product.getName());
            }
            product.setStock(availableStock - requestedQuantity);
            toUpdate.add(product);

            List<ProductSerial> picked = productSerialRepository.findAvailableForAssignment(
                    product.getId(), ProductSerialStatus.AVAILABLE, PageRequest.of(0, requestedQuantity));
            for (ProductSerial serial : picked) {
                serial.setOrder(order);
                serial.setStatus(ProductSerialStatus.RESERVED);
                toReserve.add(serial);
            }
        }
        if (!toUpdate.isEmpty()) {
            productRepository.saveAll(toUpdate);
        }
        if (!toReserve.isEmpty()) {
            productSerialRepository.saveAll(toReserve);
        }
    }

    public void restoreStock(Order order) {
        Map<Long, Integer> orderedQuantities = summarizeOrderQuantities(order);
        if (orderedQuantities.isEmpty()) {
            return;
        }
        Map<Long, Product> lockedProducts = lockProducts(orderedQuantities.keySet());
        List<Product> toUpdate = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : orderedQuantities.entrySet()) {
            Product product = lockedProducts.get(entry.getKey());
            if (product == null) {
                throw new ResourceNotFoundException("Product not found");
            }
            int restoredQuantity = safeQuantity(entry.getValue());
            if (restoredQuantity <= 0) {
                continue;
            }
            product.setStock(safeQuantity(product.getStock()) + restoredQuantity);
            toUpdate.add(product);
        }
        if (!toUpdate.isEmpty()) {
            productRepository.saveAll(toUpdate);
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

    private Map<Long, Integer> summarizeOrderQuantities(Order order) {
        if (order == null || order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            return Map.of();
        }
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (OrderItem item : order.getOrderItems()) {
            if (item == null || item.getProduct() == null || item.getProduct().getId() == null) {
                continue;
            }
            quantities.merge(item.getProduct().getId(), safeQuantity(item.getQuantity()), Integer::sum);
        }
        return quantities;
    }
}
