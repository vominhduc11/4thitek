package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.warranty.CreateWarrantyRegistrationRequest;
import com.devwonder.backend.dto.warranty.WarrantyRegistrationResponse;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.DealerWarrantyManagementService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

@Component
public class DealerWarrantySupport {

    private final DealerWarrantyManagementService dealerWarrantyManagementService;
    private final WarrantyRegistrationRepository warrantyRegistrationRepository;
    private final DealerPortalLookupSupport dealerPortalLookupSupport;

    public DealerWarrantySupport(
            DealerWarrantyManagementService dealerWarrantyManagementService,
            WarrantyRegistrationRepository warrantyRegistrationRepository,
            DealerPortalLookupSupport dealerPortalLookupSupport
    ) {
        this.dealerWarrantyManagementService = dealerWarrantyManagementService;
        this.warrantyRegistrationRepository = warrantyRegistrationRepository;
        this.dealerPortalLookupSupport = dealerPortalLookupSupport;
    }

    public java.util.List<WarrantyRegistrationResponse> getWarranties(Long dealerId) {
        return dealerWarrantyManagementService.list(dealerId);
    }

    public Page<WarrantyRegistrationResponse> getWarranties(Long dealerId, Pageable pageable) {
        return dealerWarrantyManagementService.list(dealerId, pageable);
    }

    public WarrantyRegistrationResponse getWarranty(Long dealerId, Long id) {
        WarrantyRegistration registration = warrantyRegistrationRepository.findByIdAndDealerId(id, dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty registration not found"));
        return new WarrantyRegistrationResponse(
                registration.getId(),
                registration.getProductSerial() == null ? null : registration.getProductSerial().getId(),
                registration.getProductSerial() == null ? null : registration.getProductSerial().getSerial(),
                dealerId,
                registration.getOrder() == null ? null : registration.getOrder().getId(),
                registration.getCustomerName(),
                registration.getCustomerEmail(),
                registration.getCustomerPhone(),
                registration.getCustomerAddress(),
                registration.getPurchaseDate(),
                registration.getWarrantyStart(),
                registration.getWarrantyEnd(),
                registration.getStatus(),
                registration.getCreatedAt()
        );
    }

    public WarrantyRegistrationResponse createWarranty(Long dealerId, CreateWarrantyRegistrationRequest request) {
        return dealerWarrantyManagementService.create(dealerId, request);
    }

    public WarrantyRegistrationResponse updateWarranty(Long dealerId, Long id, CreateWarrantyRegistrationRequest request) {
        warrantyRegistrationRepository.findByIdAndDealerId(id, dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty registration not found"));
        return dealerWarrantyManagementService.update(id, dealerId, request);
    }

    public void deleteWarranty(Long dealerId, Long id) {
        warrantyRegistrationRepository.findByIdAndDealerId(id, dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty registration not found"));
        dealerWarrantyManagementService.delete(id);
    }
}
