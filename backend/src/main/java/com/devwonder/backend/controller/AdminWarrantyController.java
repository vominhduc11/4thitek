package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminWarrantyResponse;
import com.devwonder.backend.dto.admin.UpdateAdminWarrantyStatusRequest;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.service.AdminOperationsService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminWarrantyController {

    private final AdminOperationsService adminOperationsService;

    @GetMapping("/warranties")
    @PreAuthorize("hasAuthority('warranties.read')")
    public ResponseEntity<ApiResponse<PagedResponse<AdminWarrantyResponse>>> warranties(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<AdminWarrantyResponse> result = adminOperationsService.getWarranties(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @PatchMapping("/warranties/{id}/status")
    @PreAuthorize("hasAuthority('warranties.write')")
    public ResponseEntity<ApiResponse<AdminWarrantyResponse>> updateWarrantyStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAdminWarrantyStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminOperationsService.updateWarrantyStatus(id, request)));
    }
}
