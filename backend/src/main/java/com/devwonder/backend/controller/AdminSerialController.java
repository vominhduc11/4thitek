package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminRmaRequest;
import com.devwonder.backend.dto.admin.AdminSerialImportRequest;
import com.devwonder.backend.dto.admin.AdminSerialResponse;
import com.devwonder.backend.dto.admin.UpdateAdminSerialStatusRequest;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.dto.serial.SerialImportSummaryResponse;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.AdminOperationsService;
import com.devwonder.backend.service.AdminRmaService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
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
public class AdminSerialController {

    private final AdminManagementService adminManagementService;
    private final AdminOperationsService adminOperationsService;
    private final AdminRmaService adminRmaService;

    @GetMapping("/serials")
    @PreAuthorize("hasAuthority('serials.read')")
    public ResponseEntity<ApiResponse<List<DealerProductSerialResponse>>> serials() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getSerials()));
    }

    @GetMapping("/serials/page")
    @PreAuthorize("hasAuthority('serials.read')")
    public ResponseEntity<ApiResponse<PagedResponse<AdminSerialResponse>>> serialsPaged(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "importedAt");
        Page<AdminSerialResponse> result = adminOperationsService.getSerials(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "importedAt")));
    }

    @PostMapping("/serials/import")
    @PreAuthorize("hasAuthority('serials.write')")
    public ResponseEntity<ApiResponse<SerialImportSummaryResponse<AdminSerialResponse>>> importSerials(
            @Valid @RequestBody AdminSerialImportRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminOperationsService.importSerials(request)));
    }

    @PatchMapping("/serials/{id}/status")
    @PreAuthorize("hasAuthority('serials.write')")
    public ResponseEntity<ApiResponse<AdminSerialResponse>> updateSerialStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAdminSerialStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminOperationsService.updateSerialStatus(id, request)));
    }

    @DeleteMapping("/serials/{id}")
    @PreAuthorize("hasAuthority('serials.write')")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteSerial(@PathVariable("id") Long id) {
        adminOperationsService.deleteSerial(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "deleted")));
    }

    // ---- RMA: Serial lifecycle (BUSINESS_LOGIC.md Section 7.3) ----

    @PatchMapping("/serials/{id}/rma")
    @PreAuthorize("hasAuthority('serials.write')")
    public ResponseEntity<ApiResponse<AdminSerialResponse>> applyRmaAction(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminRmaRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminRmaService.applyRmaAction(id, request, AdminControllerSupport.extractUsername(authentication))));
    }
}
