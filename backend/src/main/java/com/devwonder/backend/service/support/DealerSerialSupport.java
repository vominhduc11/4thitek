package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.CreateDealerSerialBatchRequest;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.UpdateDealerSerialStatusRequest;
import com.devwonder.backend.entity.Customer;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
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
            Customer customer,
            CreateDealerSerialBatchRequest request
    ) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
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

        List<DealerProductSerialResponse> imported = new ArrayList<>();
        for (String serial : uniqueSerials) {
            ProductSerial productSerial = new ProductSerial();
            productSerial.setSerial(serial);
            productSerial.setProduct(product);
            productSerial.setDealer(dealer);
            productSerial.setCustomer(customer);
            productSerial.setOrder(order);
            productSerial.setStatus(request.status() == null ? ProductSerialStatus.AVAILABLE : request.status());
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
}
