package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.customer.ChangePasswordRequest;
import com.devwonder.backend.dto.customer.CustomerProfileResponse;
import com.devwonder.backend.dto.customer.CustomerWarrantyDetailResponse;
import com.devwonder.backend.dto.customer.CustomerWarrantySummaryResponse;
import com.devwonder.backend.dto.customer.UpdateCustomerProfileRequest;
import com.devwonder.backend.dto.notify.NotifyResponse;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.service.CustomerPortalService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerPortalService customerPortalService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> profile(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(customerPortalService.getProfile(extractUsername(authentication))));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateCustomerProfileRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(customerPortalService.updateProfile(extractUsername(authentication), request)));
    }

    @PatchMapping("/password")
    public ResponseEntity<ApiResponse<Map<String, String>>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        customerPortalService.changePassword(extractUsername(authentication), request);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "updated")));
    }

    @GetMapping("/warranties")
    public ResponseEntity<ApiResponse<List<CustomerWarrantySummaryResponse>>> warranties(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(customerPortalService.getWarranties(extractUsername(authentication))));
    }

    @GetMapping("/warranties/page")
    public ResponseEntity<ApiResponse<PagedResponse<CustomerWarrantySummaryResponse>>> warrantiesPaged(
            Authentication authentication,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "warrantyEnd");
        Page<CustomerWarrantySummaryResponse> result = customerPortalService.getWarranties(extractUsername(authentication), pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "warrantyEnd")));
    }

    @GetMapping("/warranties/{id}")
    public ResponseEntity<ApiResponse<CustomerWarrantyDetailResponse>> warrantyDetail(
            Authentication authentication,
            @PathVariable("id") UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(customerPortalService.getWarrantyDetail(extractUsername(authentication), id)));
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<NotifyResponse>>> notifications(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(customerPortalService.getNotifications(extractUsername(authentication))));
    }

    @GetMapping("/notifications/page")
    public ResponseEntity<ApiResponse<PagedResponse<NotifyResponse>>> notificationsPaged(
            Authentication authentication,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<NotifyResponse> result = customerPortalService.getNotifications(extractUsername(authentication), pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<NotifyResponse>> markRead(
            Authentication authentication,
            @PathVariable("id") UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(customerPortalService.markNotificationRead(extractUsername(authentication), id)));
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAllRead(Authentication authentication) {
        int updatedCount = customerPortalService.markAllNotificationsRead(extractUsername(authentication));
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "updated",
                "updatedCount", updatedCount
        )));
    }

    private String extractUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new BadRequestException("Unauthenticated request");
        }
        return authentication.getName();
    }
}
