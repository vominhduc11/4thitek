package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.warranty.CreateWarrantyRegistrationRequest;
import com.devwonder.backend.dto.warranty.WarrantyRegistrationResponse;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.BadRequestException;
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
        return dealerWarrantyManagementService.toResponse(registration);
    }

    public WarrantyRegistrationResponse createWarranty(Long dealerId, CreateWarrantyRegistrationRequest request) {
        return activateWarranty(dealerId, request);
    }

    public WarrantyRegistrationResponse activateWarranty(Long dealerId, CreateWarrantyRegistrationRequest request) {
        return dealerWarrantyManagementService.create(dealerId, request);
    }

    public WarrantyRegistrationResponse updateWarranty(Long dealerId, Long id, CreateWarrantyRegistrationRequest request) {
        WarrantyRegistration registration = requireDealerWarranty(dealerId, id);
        assertDealerCanMutateWarranty(registration, "update");
        return dealerWarrantyManagementService.update(id, dealerId, request);
    }

    public void deleteWarranty(Long dealerId, Long id) {
        WarrantyRegistration registration = requireDealerWarranty(dealerId, id);
        assertDealerCanMutateWarranty(registration, "delete");
        dealerWarrantyManagementService.delete(id);
    }

    private WarrantyRegistration requireDealerWarranty(Long dealerId, Long id) {
        return warrantyRegistrationRepository.findByIdAndDealerId(id, dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty registration not found"));
    }

    private void assertDealerCanMutateWarranty(WarrantyRegistration registration, String action) {
        WarrantyStatus effectiveStatus = WarrantyStatusSupport.resolveEffectiveStatus(registration);
        if (effectiveStatus == WarrantyStatus.ACTIVE) {
            throw new BadRequestException(
                    "Activated warranty records cannot be " + action + "d directly. Please request an admin correction."
            );
        }
    }
}
