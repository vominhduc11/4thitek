package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminSupportTicketResponse;
import com.devwonder.backend.dto.admin.CreateAdminSupportTicketMessageRequest;
import com.devwonder.backend.dto.admin.UpdateAdminSupportTicketRequest;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.service.AdminOperationsService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public class AdminSupportTicketController {

    private final AdminOperationsService adminOperationsService;

    @GetMapping("/support-tickets")
    @PreAuthorize("hasAuthority('support.read')")
    public ResponseEntity<ApiResponse<PagedResponse<AdminSupportTicketResponse>>> supportTickets(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir,
            Authentication authentication
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<AdminSupportTicketResponse> result = adminOperationsService.getSupportTickets(
                pageable,
                AdminControllerSupport.extractUsername(authentication)
        );
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @GetMapping("/support-tickets/{id}")
    @PreAuthorize("hasAuthority('support.read')")
    public ResponseEntity<ApiResponse<AdminSupportTicketResponse>> supportTicketDetail(
            @PathVariable("id") Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminOperationsService.getSupportTicketById(id, AdminControllerSupport.extractUsername(authentication))
        ));
    }

    @PatchMapping("/support-tickets/{id}")
    @PreAuthorize("hasAuthority('support.write')")
    public ResponseEntity<ApiResponse<AdminSupportTicketResponse>> updateSupportTicket(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAdminSupportTicketRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminOperationsService.updateSupportTicket(id, request, AdminControllerSupport.extractUsername(authentication))
        ));
    }

    @PostMapping("/support-tickets/{id}/messages")
    @PreAuthorize("hasAuthority('support.write')")
    public ResponseEntity<ApiResponse<AdminSupportTicketResponse>> addSupportTicketMessage(
            @PathVariable("id") Long id,
            @Valid @RequestBody CreateAdminSupportTicketMessageRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminOperationsService.addSupportTicketMessage(id, request, AdminControllerSupport.extractUsername(authentication))
        ));
    }
}
