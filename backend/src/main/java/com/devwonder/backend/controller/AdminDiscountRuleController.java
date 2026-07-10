package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminDiscountRuleResponse;
import com.devwonder.backend.dto.admin.AdminDiscountRuleUpsertRequest;
import com.devwonder.backend.dto.admin.UpdateAdminDiscountRuleStatusRequest;
import com.devwonder.backend.service.AdminManagementService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminDiscountRuleController {

    private final AdminManagementService adminManagementService;

    @GetMapping("/discount-rules")
    public ResponseEntity<ApiResponse<List<AdminDiscountRuleResponse>>> discountRules() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getDiscountRules()));
    }

    @PostMapping("/discount-rules")
    @PreAuthorize("hasAuthority('discounts.write')")
    public ResponseEntity<ApiResponse<AdminDiscountRuleResponse>> createDiscountRule(
            @Valid @RequestBody AdminDiscountRuleUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.createDiscountRule(request)));
    }

    @PutMapping("/discount-rules/{id}")
    @PreAuthorize("hasAuthority('discounts.write')")
    public ResponseEntity<ApiResponse<AdminDiscountRuleResponse>> updateDiscountRule(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminDiscountRuleUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateDiscountRule(id, request)));
    }

    @PatchMapping("/discount-rules/{id}/status")
    @PreAuthorize("hasAuthority('discounts.write')")
    public ResponseEntity<ApiResponse<AdminDiscountRuleResponse>> updateDiscountRuleStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAdminDiscountRuleStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateDiscountRuleStatus(id, request)));
    }
}
