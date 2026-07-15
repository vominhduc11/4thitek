package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminFinancialSettlementResponse;
import com.devwonder.backend.dto.admin.AdminOrderAdjustmentRequest;
import com.devwonder.backend.dto.admin.AdminOrderAdjustmentResponse;
import com.devwonder.backend.dto.admin.AdminRecentPaymentResponse;
import com.devwonder.backend.dto.admin.AdminUnmatchedPaymentResponse;
import com.devwonder.backend.dto.admin.AdminUpdateFinancialSettlementRequest;
import com.devwonder.backend.dto.admin.AdminUpdateUnmatchedPaymentRequest;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.security.AdminActorRoleSupport;
import com.devwonder.backend.service.AdminFinancialService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminFinancialController {

    private final AdminFinancialService adminFinancialService;

    // ---- FinancialSettlement (BUSINESS_LOGIC.md Section 3.4) ----

    @GetMapping("/financial-settlements")
    @PreAuthorize("hasAuthority('orders.payment.confirm')")
    public ResponseEntity<ApiResponse<List<AdminFinancialSettlementResponse>>> financialSettlements(
            @RequestParam(name = "status", required = false) String status
    ) {
        if (status != null) {
            FinancialSettlementStatus s = FinancialSettlementStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(ApiResponse.success(adminFinancialService.getFinancialSettlementsByStatus(s)));
        }
        return ResponseEntity.ok(ApiResponse.success(adminFinancialService.getFinancialSettlements()));
    }

    @PatchMapping("/financial-settlements/{id}")
    @PreAuthorize("hasAuthority('orders.payment.confirm')")
    public ResponseEntity<ApiResponse<AdminFinancialSettlementResponse>> resolveFinancialSettlement(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminUpdateFinancialSettlementRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminFinancialService.resolveFinancialSettlement(id, request, AdminControllerSupport.extractUsername(authentication))));
    }

    @GetMapping("/payments/recent")
    @PreAuthorize("hasAuthority('orders.payment.confirm')")
    public ResponseEntity<ApiResponse<PagedResponse<AdminRecentPaymentResponse>>> recentPayments(
            @RequestParam(name = "dealerId", required = false) Long dealerId,
            @RequestParam(name = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(name = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(name = "minAmount", required = false) BigDecimal minAmount,
            @RequestParam(name = "maxAmount", required = false) BigDecimal maxAmount,
            @RequestParam(name = "hasProof", required = false) Boolean hasProof,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toUnsortedPageable(page, size);
        Page<AdminRecentPaymentResponse> result = adminFinancialService.getRecentPayments(
                dealerId,
                from,
                to,
                minAmount,
                maxAmount,
                hasProof,
                pageable
        );
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "paidAt")));
    }

    // ---- OrderAdjustment (BUSINESS_LOGIC.md Section 3.25) ----

    @GetMapping("/orders/{id}/adjustments")
    @PreAuthorize("hasAuthority('orders.read')")
    public ResponseEntity<ApiResponse<List<AdminOrderAdjustmentResponse>>> getOrderAdjustments(
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminFinancialService.getOrderAdjustments(id)));
    }

    @PostMapping("/orders/{id}/adjustments")
    @PreAuthorize("hasAuthority('orders.payment.confirm')")
    public ResponseEntity<ApiResponse<AdminOrderAdjustmentResponse>> createOrderAdjustment(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminOrderAdjustmentRequest request
    ) {
        String username = AdminControllerSupport.extractUsername(authentication);
        String role = AdminActorRoleSupport.resolvePrimaryRole(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                adminFinancialService.createOrderAdjustment(id, request, username, role)));
    }

    // ---- UnmatchedPayment (BUSINESS_LOGIC.md Section 3.21) ----

    @GetMapping("/unmatched-payments")
    @PreAuthorize("hasAuthority('orders.payment.confirm')")
    public ResponseEntity<ApiResponse<PagedResponse<AdminUnmatchedPaymentResponse>>> getUnmatchedPayments(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "reason", required = false) String reason,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<AdminUnmatchedPaymentResponse> result =
                adminFinancialService.getUnmatchedPayments(status, reason, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @PatchMapping("/unmatched-payments/{id}")
    @PreAuthorize("hasAuthority('orders.payment.confirm')")
    public ResponseEntity<ApiResponse<AdminUnmatchedPaymentResponse>> resolveUnmatchedPayment(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminUpdateUnmatchedPaymentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminFinancialService.resolveUnmatchedPayment(id, request, AdminControllerSupport.extractUsername(authentication))));
    }
}
