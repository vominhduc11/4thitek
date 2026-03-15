package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.UpdateDealerSerialStatusRequest;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.ProductSerialRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DealerSerialSupport {

    private final ProductSerialRepository productSerialRepository;

    public List<DealerProductSerialResponse> getSerials(Long dealerId) {
        return productSerialRepository.findByDealerIdOrderByImportedAtDesc(dealerId).stream()
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
