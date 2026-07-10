package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountSummaryResponse;
import com.devwonder.backend.dto.admin.AdminDealerResponse;
import com.devwonder.backend.dto.admin.UpdateAdminDealerAccountStatusRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerProfileRequest;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminDealerAccountController {

    private final AdminManagementService adminManagementService;

    @GetMapping("/dealers")
    @PreAuthorize("hasAuthority('dealers.read')")
    public ResponseEntity<ApiResponse<List<AdminDealerResponse>>> dealers() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getDealers()));
    }

    @GetMapping("/dealers/accounts")
    @PreAuthorize("hasAuthority('dealers.read')")
    public ResponseEntity<ApiResponse<List<AdminDealerAccountResponse>>> dealerAccounts() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getDealerAccounts()));
    }

    @GetMapping("/dealers/accounts/page")
    @PreAuthorize("hasAuthority('dealers.read')")
    public ResponseEntity<ApiResponse<PagedResponse<AdminDealerAccountResponse>>> dealerAccountsPaged(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir,
            @RequestParam(name = "status", required = false) CustomerStatus status,
            @RequestParam(name = "query", required = false) String query
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<AdminDealerAccountResponse> result = adminManagementService.getDealerAccounts(pageable, status, query);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @GetMapping("/dealers/accounts/summary")
    @PreAuthorize("hasAuthority('dealers.read')")
    public ResponseEntity<ApiResponse<AdminDealerAccountSummaryResponse>> dealerAccountSummary() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getDealerAccountSummary()));
    }

    @PatchMapping("/dealers/accounts/{id}/status")
    @PreAuthorize("hasAuthority('dealers.write')")
    public ResponseEntity<ApiResponse<AdminDealerAccountResponse>> updateDealerAccountStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAdminDealerAccountStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateDealerAccountStatus(id, request)));
    }

    @PutMapping("/dealers/accounts/{id}")
    @PreAuthorize("hasAuthority('dealers.write')")
    public ResponseEntity<ApiResponse<AdminDealerAccountResponse>> updateDealerProfile(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateDealerProfileRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateDealerProfile(id, request)));
    }
}
