package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.CreateDealerSerialBatchRequest;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.UpdateDealerSerialStatusRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerSerialSupport {

    private final ProductSerialRepository productSerialRepository;
    private final ProductRepository productRepository;

    public List<DealerProductSerialResponse> getSerials(Long dealerId) {
        return productSerialRepository.findByDealerIdOrderByImportedAtDesc(dealerId).stream()
                .map(ProductSerialResponseMapper::toDealerProductSerialResponse)
                .toList();
    }

    public List<DealerProductSerialResponse> importSerials(
            Dealer dealer,
            Order order,
            CreateDealerSerialBatchRequest request
    ) {
        if (order == null) {
            throw new BadRequestException("orderId is required");
        }
        if (order.getStatus() != OrderStatus.SHIPPING && order.getStatus() != OrderStatus.COMPLETED) {
            throw new BadRequestException("Serial import requires a shipping or completed order");
        }

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        int orderedQuantity = resolveOrderedQuantity(order, product.getId());
        if (orderedQuantity <= 0) {
            throw new BadRequestException("Product is not part of the selected order");
        }
        Set<String> uniqueSerials = new LinkedHashSet<>();
        for (String rawSerial : request.serials()) {
            String serial = DealerRequestSupport.requireNonBlank(rawSerial, "serial");
            if (!uniqueSerials.add(serial)) {
                continue;
            }
            productSerialRepository.findBySerialIgnoreCase(serial).ifPresent(existing -> {
                throw new ConflictException("Serial already exists: " + serial);
            });
        }
        if (uniqueSerials.isEmpty()) {
            throw new BadRequestException("No valid serials supplied");
        }
        ProductSerialStatus initialStatus = request.status() == null ? ProductSerialStatus.AVAILABLE : request.status();
        if (initialStatus != ProductSerialStatus.AVAILABLE && initialStatus != ProductSerialStatus.DEFECTIVE) {
            throw new BadRequestException("Unsupported serial import status");
        }
        long existingSerialCount = productSerialRepository.countByOrderIdAndProductId(order.getId(), product.getId());
        if (existingSerialCount + uniqueSerials.size() > orderedQuantity) {
            throw new BadRequestException("Imported serial count exceeds ordered quantity");
        }

        List<DealerProductSerialResponse> imported = new ArrayList<>();
        for (String serial : uniqueSerials) {
            ProductSerial productSerial = new ProductSerial();
            productSerial.setSerial(serial);
            productSerial.setProduct(product);
            productSerial.setDealer(dealer);
            productSerial.setOrder(order);
            productSerial.setStatus(initialStatus);
            productSerial.setWarehouseId(DealerRequestSupport.defaultIfBlank(request.warehouseId(), "main"));
            productSerial.setWarehouseName(DealerRequestSupport.defaultIfBlank(request.warehouseName(), "Kho"));
            imported.add(ProductSerialResponseMapper.toDealerProductSerialResponse(productSerialRepository.save(productSerial)));
        }
        return imported;
    }

    public DealerProductSerialResponse updateSerialStatus(
            Long dealerId,
            Long serialId,
            UpdateDealerSerialStatusRequest request
    ) {
        ProductSerial productSerial = productSerialRepository.findByIdAndDealerId(serialId, dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Serial not found"));
        ProductSerialStatus nextStatus = request.status();
        if (nextStatus != ProductSerialStatus.AVAILABLE && nextStatus != ProductSerialStatus.DEFECTIVE) {
            throw new BadRequestException("Unsupported serial status transition");
        }

        ProductSerialStatus currentStatus = productSerial.getStatus();
        if (currentStatus == ProductSerialStatus.WARRANTY
                || currentStatus == ProductSerialStatus.SOLD
                || productSerial.getWarranty() != null) {
            throw new BadRequestException("Activated serial cannot change defective status");
        }
        if (currentStatus != ProductSerialStatus.AVAILABLE && currentStatus != ProductSerialStatus.DEFECTIVE) {
            throw new BadRequestException("Only inventory serials can change defective status");
        }

        productSerial.setStatus(nextStatus);
        return ProductSerialResponseMapper.toDealerProductSerialResponse(productSerialRepository.save(productSerial));
    }

    private int resolveOrderedQuantity(Order order, Long productId) {
        if (order == null || order.getOrderItems() == null || productId == null) {
            return 0;
        }
        return order.getOrderItems().stream()
                .filter(item -> item != null
                        && item.getProduct() != null
                        && Objects.equals(item.getProduct().getId(), productId))
                .map(OrderItem::getQuantity)
                .filter(Objects::nonNull)
                .mapToInt(quantity -> Math.max(0, quantity))
                .sum();
    }
}
