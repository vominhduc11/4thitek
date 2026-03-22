package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.CreateDealerSerialBatchRequest;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.UpdateDealerSerialStatusRequest;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerSerialSupport {

    private final ProductSerialRepository productSerialRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public List<DealerProductSerialResponse> getSerials(Long dealerId) {
        return productSerialRepository.findDealerInventorySerials(dealerId).stream()
                .map(ProductSerialResponseMapper::toDealerProductSerialResponse)
                .toList();
    }

    public DealerProductSerialResponse updateSerialStatus(
            Long dealerId,
            Long serialId,
            UpdateDealerSerialStatusRequest request
    ) {
        ProductSerial productSerial = productSerialRepository.findByIdAndDealerId(serialId, dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Serial not found"));
        ProductSerialStatus nextStatus = request.status();
        if (nextStatus != ProductSerialStatus.DEFECTIVE && nextStatus != ProductSerialStatus.RETURNED) {
            throw new BadRequestException("Unsupported serial status transition");
        }

        ProductSerialStatus currentStatus = productSerial.getStatus();
        if (currentStatus != ProductSerialStatus.ASSIGNED && currentStatus != ProductSerialStatus.WARRANTY) {
            throw new BadRequestException("Only ASSIGNED or WARRANTY serials can be marked DEFECTIVE or RETURNED");
        }

        productSerial.setStatus(nextStatus);
        return ProductSerialResponseMapper.toDealerProductSerialResponse(productSerialRepository.save(productSerial));
    }

    public List<DealerProductSerialResponse> importSerials(Long dealerId, CreateDealerSerialBatchRequest request) {
        Long orderId = request.orderId();
        if (orderId == null) {
            throw new BadRequestException("orderId is required");
        }
        Order order = orderRepository.findVisibleByIdAndDealerId(orderId, dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        OrderStatus orderStatus = order.getStatus();
        if (orderStatus != OrderStatus.SHIPPING && orderStatus != OrderStatus.COMPLETED) {
            throw new BadRequestException("Can only import serials for a shipping or completed order");
        }
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        int orderedQuantity = order.getOrderItems() == null ? 0 : order.getOrderItems().stream()
                .filter(item -> item != null && item.getProduct() != null
                        && Objects.equals(item.getProduct().getId(), product.getId()))
                .map(OrderItem::getQuantity)
                .filter(Objects::nonNull)
                .mapToInt(qty -> Math.max(0, qty))
                .sum();
        if (orderedQuantity <= 0) {
            throw new BadRequestException("Product is not part of the selected order");
        }
        long existingCount = productSerialRepository.countByOrderIdAndProductId(orderId, product.getId());
        if (existingCount + request.serials().size() > orderedQuantity) {
            throw new BadRequestException("Imported serial count exceeds ordered quantity");
        }
        ProductSerialStatus initialStatus = resolveImportedStatus(orderStatus, request.status());
        Set<String> uniqueSerials = new LinkedHashSet<>();
        for (String rawSerial : request.serials()) {
            String normalizedSerial = DealerRequestSupport.requireNonBlank(rawSerial, "serial").toUpperCase(Locale.ROOT);
            if (!uniqueSerials.add(normalizedSerial)) {
                continue;
            }
            productSerialRepository.findBySerialIgnoreCase(normalizedSerial).ifPresent(existing -> {
                throw new BadRequestException("Serial already exists: " + normalizedSerial);
            });
        }
        List<ProductSerial> toSave = new ArrayList<>();
        for (String serialValue : uniqueSerials) {
            ProductSerial serial = new ProductSerial();
            serial.setSerial(serialValue);
            serial.setProduct(product);
            serial.setDealer(initialStatus == ProductSerialStatus.ASSIGNED ? order.getDealer() : null);
            serial.setOrder(order);
            serial.setStatus(initialStatus);
            serial.setWarehouseId(request.warehouseId());
            serial.setWarehouseName(request.warehouseName());
            toSave.add(serial);
        }
        return productSerialRepository.saveAll(toSave).stream()
                .map(ProductSerialResponseMapper::toDealerProductSerialResponse)
                .toList();
    }

    private ProductSerialStatus resolveImportedStatus(OrderStatus orderStatus, ProductSerialStatus requestedStatus) {
        if (requestedStatus != null) {
            if (requestedStatus != ProductSerialStatus.RESERVED && requestedStatus != ProductSerialStatus.ASSIGNED) {
                throw new BadRequestException("Dealer imports only support RESERVED or ASSIGNED status");
            }
            if (requestedStatus == ProductSerialStatus.ASSIGNED && orderStatus != OrderStatus.COMPLETED) {
                throw new BadRequestException("ASSIGNED status requires a completed order");
            }
            return requestedStatus;
        }
        return orderStatus == OrderStatus.COMPLETED
                ? ProductSerialStatus.ASSIGNED
                : ProductSerialStatus.RESERVED;
    }

}
