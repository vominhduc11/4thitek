package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminCompleteReturnRequest;
import com.devwonder.backend.dto.admin.AdminInspectReturnItemRequest;
import com.devwonder.backend.dto.admin.AdminReceiveReturnRequest;
import com.devwonder.backend.dto.admin.AdminReviewReturnRequest;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.dto.returns.ReturnRequestDetailResponse;
import com.devwonder.backend.dto.returns.ReturnRequestSummaryResponse;
import com.devwonder.backend.entity.enums.ReturnRequestStatus;
import com.devwonder.backend.entity.enums.ReturnRequestType;
import com.devwonder.backend.service.ReturnRequestService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
public class AdminReturnController {

    private final ReturnRequestService returnRequestService;

    @GetMapping("/returns/page")
    @PreAuthorize("hasAuthority('returns.read')")
    public ResponseEntity<ApiResponse<PagedResponse<ReturnRequestSummaryResponse>>> returnRequestsPaged(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir,
            @RequestParam(name = "status", required = false) ReturnRequestStatus status,
            @RequestParam(name = "type", required = false) ReturnRequestType type,
            @RequestParam(name = "dealer", required = false) String dealer,
            @RequestParam(name = "orderCode", required = false) String orderCode,
            @RequestParam(name = "serial", required = false) String serial
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        return ResponseEntity.ok(ApiResponse.success(
                returnRequestService.getAdminReturnsPage(pageable, status, type, dealer, orderCode, serial)
        ));
    }

    @GetMapping("/returns/{id}")
    @PreAuthorize("hasAuthority('returns.read')")
    public ResponseEntity<ApiResponse<ReturnRequestDetailResponse>> returnRequestDetail(
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(returnRequestService.getAdminReturnDetail(id)));
    }

    @PatchMapping("/returns/{id}/review")
    @PreAuthorize("hasAuthority('returns.write')")
    public ResponseEntity<ApiResponse<ReturnRequestDetailResponse>> reviewReturnRequest(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminReviewReturnRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                returnRequestService.reviewReturnRequest(id, request, AdminControllerSupport.extractUsername(authentication))
        ));
    }

    @PatchMapping("/returns/{id}/receive")
    @PreAuthorize("hasAuthority('returns.write')")
    public ResponseEntity<ApiResponse<ReturnRequestDetailResponse>> receiveReturnRequest(
            Authentication authentication,
            @PathVariable("id") Long id,
            @RequestBody(required = false) AdminReceiveReturnRequest request
    ) {
        AdminReceiveReturnRequest payload = request == null
                ? new AdminReceiveReturnRequest(null, null)
                : request;
        return ResponseEntity.ok(ApiResponse.success(
                returnRequestService.receiveReturnRequest(id, payload, AdminControllerSupport.extractUsername(authentication))
        ));
    }

    @PatchMapping("/returns/{id}/items/{itemId}/inspect")
    @PreAuthorize("hasAuthority('returns.write')")
    public ResponseEntity<ApiResponse<ReturnRequestDetailResponse>> inspectReturnItem(
            Authentication authentication,
            @PathVariable("id") Long id,
            @PathVariable("itemId") Long itemId,
            @Valid @RequestBody AdminInspectReturnItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                returnRequestService.inspectReturnItem(id, itemId, request, AdminControllerSupport.extractUsername(authentication))
        ));
    }

    @PatchMapping("/returns/{id}/complete")
    @PreAuthorize("hasAuthority('returns.write')")
    public ResponseEntity<ApiResponse<ReturnRequestDetailResponse>> completeReturnRequest(
            Authentication authentication,
            @PathVariable("id") Long id,
            @RequestBody(required = false) AdminCompleteReturnRequest request
    ) {
        AdminCompleteReturnRequest payload = request == null
                ? new AdminCompleteReturnRequest(null)
                : request;
        return ResponseEntity.ok(ApiResponse.success(
                returnRequestService.completeReturnRequest(id, payload, AdminControllerSupport.extractUsername(authentication))
        ));
    }
}
