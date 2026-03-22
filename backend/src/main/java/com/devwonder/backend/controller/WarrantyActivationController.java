package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.warranty.CreateWarrantyRegistrationRequest;
import com.devwonder.backend.dto.warranty.WarrantyRegistrationResponse;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.service.DealerAccountLifecycleService;
import com.devwonder.backend.service.DealerPortalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class WarrantyActivationController {

    private final DealerPortalService dealerPortalService;
    private final DealerAccountLifecycleService dealerAccountLifecycleService;

    @PostMapping("/warranty-activation")
    public ResponseEntity<ApiResponse<WarrantyRegistrationResponse>> activateWarranty(
            Authentication authentication,
            @Valid @RequestBody CreateWarrantyRegistrationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                dealerPortalService.activateWarranty(extractDealerUsername(authentication), request)
        ));
    }

    private String extractDealerUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new BadRequestException("Unauthenticated request");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Account account) {
            dealerAccountLifecycleService.assertDealerPortalAccess(account);
        }
        return authentication.getName();
    }
}
