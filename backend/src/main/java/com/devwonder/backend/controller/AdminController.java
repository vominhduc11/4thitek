package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminAssignOrderSerialsRequest;
import com.devwonder.backend.dto.admin.AdminBlogResponse;
import com.devwonder.backend.dto.admin.AdminBlogUpsertRequest;
import com.devwonder.backend.dto.admin.AdminDashboardResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountUpdateRequest;
import com.devwonder.backend.dto.admin.AdminDealerResponse;
import com.devwonder.backend.dto.admin.AdminDiscountRuleResponse;
import com.devwonder.backend.dto.admin.AdminDiscountRuleUpsertRequest;
import com.devwonder.backend.dto.admin.AdminNotificationDispatchResponse;
import com.devwonder.backend.dto.admin.AdminNotificationResponse;
import com.devwonder.backend.dto.admin.AdminOrderResponse;
import com.devwonder.backend.dto.admin.AdminProductResponse;
import com.devwonder.backend.dto.admin.AdminProductUpsertRequest;
import com.devwonder.backend.dto.admin.AdminReportExportResponse;
import com.devwonder.backend.dto.admin.AdminReportExportType;
import com.devwonder.backend.dto.admin.AdminReportFormat;
import com.devwonder.backend.dto.admin.AdminSettingsResponse;
import com.devwonder.backend.dto.admin.AdminSerialImportRequest;
import com.devwonder.backend.dto.admin.AdminSerialResponse;
import com.devwonder.backend.dto.admin.AdminStaffUserResponse;
import com.devwonder.backend.dto.admin.AdminStaffUserUpsertRequest;
import com.devwonder.backend.dto.admin.AdminSupportTicketResponse;
import com.devwonder.backend.dto.admin.AdminWarrantyResponse;
import com.devwonder.backend.dto.admin.CreateAdminNotificationRequest;
import com.devwonder.backend.dto.admin.UpdateAdminSerialStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminDealerAccountStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminSupportTicketRequest;
import com.devwonder.backend.dto.admin.UpdateAdminSettingsRequest;
import com.devwonder.backend.dto.admin.UpdateAdminDiscountRuleStatusRequest;
import com.devwonder.backend.dto.admin.AdminFinancialSettlementResponse;
import com.devwonder.backend.dto.admin.AdminOrderAdjustmentRequest;
import com.devwonder.backend.dto.admin.AdminOrderAdjustmentResponse;
import com.devwonder.backend.dto.admin.AdminRmaRequest;
import com.devwonder.backend.dto.admin.AdminUnmatchedPaymentResponse;
import com.devwonder.backend.dto.admin.AdminUpdateFinancialSettlementRequest;
import com.devwonder.backend.dto.admin.AdminAuditLogResponse;
import com.devwonder.backend.dto.admin.AdminUpdateUnmatchedPaymentRequest;
import com.devwonder.backend.dto.admin.UpdateAdminStaffUserStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminWarrantyStatusRequest;
import com.devwonder.backend.dto.customer.ChangePasswordRequest;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.dto.serial.SerialImportSummaryResponse;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.service.AdminFinancialService;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.AdminOperationsService;
import com.devwonder.backend.service.AdminReportingService;
import com.devwonder.backend.service.AdminRmaService;
import com.devwonder.backend.service.AuditLogService;
import com.devwonder.backend.service.AdminSettingsService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminManagementService adminManagementService;
    private final AdminOperationsService adminOperationsService;
    private final AdminReportingService adminReportingService;
    private final AdminSettingsService adminSettingsService;
    private final AdminFinancialService adminFinancialService;
    private final AdminRmaService adminRmaService;
    private final AuditLogService auditLogService;

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<AdminProductResponse>>> products() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getProducts()));
    }

    @GetMapping("/products/page")
    public ResponseEntity<ApiResponse<PagedResponse<AdminProductResponse>>> productsPaged(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "updatedAt");
        Page<AdminProductResponse> result = adminManagementService.getProducts(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "updatedAt")));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<AdminProductResponse>> createProduct(
            @Valid @RequestBody AdminProductUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.createProduct(request)));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ApiResponse<AdminProductResponse>> updateProduct(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminProductUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateProduct(id, request)));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteProduct(@PathVariable("id") Long id) {
        adminManagementService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "deleted")));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<AdminOrderResponse>>> orders() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getOrders()));
    }

    @GetMapping("/orders/page")
    public ResponseEntity<ApiResponse<PagedResponse<AdminOrderResponse>>> ordersPaged(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir,
            @RequestParam(name = "status", required = false) OrderStatus status
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<AdminOrderResponse> result = adminManagementService.getOrders(pageable, status);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> updateOrderStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateDealerOrderStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateOrderStatus(id, request)));
    }

    @PostMapping("/orders/{id}/assign-serials")
    public ResponseEntity<ApiResponse<List<DealerProductSerialResponse>>> assignOrderSerials(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminAssignOrderSerialsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.assignOrderSerials(id, request)));
    }

    @PostMapping("/orders/{id}/payments")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> recordOrderPayment(
            @PathVariable("id") Long id,
            @Valid @RequestBody RecordPaymentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.recordOrderPayment(id, request)));
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteOrder(@PathVariable("id") Long id) {
        adminManagementService.deleteOrder(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "deleted")));
    }

    @GetMapping("/dealers")
    public ResponseEntity<ApiResponse<List<AdminDealerResponse>>> dealers() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getDealers()));
    }

    @GetMapping("/serials")
    public ResponseEntity<ApiResponse<List<DealerProductSerialResponse>>> serials() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getSerials()));
    }

    @GetMapping("/support-tickets")
    public ResponseEntity<ApiResponse<PagedResponse<AdminSupportTicketResponse>>> supportTickets(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<AdminSupportTicketResponse> result = adminOperationsService.getSupportTickets(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @PatchMapping("/support-tickets/{id}")
    public ResponseEntity<ApiResponse<AdminSupportTicketResponse>> updateSupportTicket(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAdminSupportTicketRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminOperationsService.updateSupportTicket(id, request)));
    }

    @GetMapping("/warranties")
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
    public ResponseEntity<ApiResponse<AdminWarrantyResponse>> updateWarrantyStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAdminWarrantyStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminOperationsService.updateWarrantyStatus(id, request)));
    }

    @GetMapping("/serials/page")
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
    public ResponseEntity<ApiResponse<SerialImportSummaryResponse<AdminSerialResponse>>> importSerials(
            @Valid @RequestBody AdminSerialImportRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminOperationsService.importSerials(request)));
    }

    @PatchMapping("/serials/{id}/status")
    public ResponseEntity<ApiResponse<AdminSerialResponse>> updateSerialStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAdminSerialStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminOperationsService.updateSerialStatus(id, request)));
    }

    @DeleteMapping("/serials/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteSerial(@PathVariable("id") Long id) {
        adminOperationsService.deleteSerial(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "deleted")));
    }

    @GetMapping("/notifications/page")
    public ResponseEntity<ApiResponse<PagedResponse<AdminNotificationResponse>>> notifications(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<AdminNotificationResponse> result = adminOperationsService.getNotifications(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @PostMapping("/notifications")
    public ResponseEntity<ApiResponse<AdminNotificationDispatchResponse>> createNotification(
            @Valid @RequestBody CreateAdminNotificationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminOperationsService.createNotification(request)));
    }

    @GetMapping("/reports/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam("type") AdminReportExportType type,
            @RequestParam("format") AdminReportFormat format
    ) {
        AdminReportExportResponse report = adminReportingService.export(type, format);
        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(report.contentType());
        } catch (IllegalArgumentException ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(report.fileName(), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .contentLength(report.content().length)
                .body(report.content());
    }

    @GetMapping("/blogs")
    public ResponseEntity<ApiResponse<List<AdminBlogResponse>>> blogs() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getBlogs()));
    }

    @PostMapping("/blogs")
    public ResponseEntity<ApiResponse<AdminBlogResponse>> createBlog(
            @Valid @RequestBody AdminBlogUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.createBlog(request)));
    }

    @PutMapping("/blogs/{id}")
    public ResponseEntity<ApiResponse<AdminBlogResponse>> updateBlog(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminBlogUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateBlog(id, request)));
    }

    @DeleteMapping("/blogs/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteBlog(@PathVariable("id") Long id) {
        adminManagementService.deleteBlog(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "deleted")));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> categories() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getCategories()));
    }

    @GetMapping("/dealers/accounts")
    public ResponseEntity<ApiResponse<List<AdminDealerAccountResponse>>> dealerAccounts() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getDealerAccounts()));
    }

    @GetMapping("/dealers/accounts/page")
    public ResponseEntity<ApiResponse<PagedResponse<AdminDealerAccountResponse>>> dealerAccountsPaged(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<AdminDealerAccountResponse> result = adminManagementService.getDealerAccounts(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @PutMapping("/dealers/accounts/{id}")
    public ResponseEntity<ApiResponse<AdminDealerAccountResponse>> updateDealerAccount(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminDealerAccountUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateDealerAccount(id, request)));
    }

    @PatchMapping("/dealers/accounts/{id}/status")
    public ResponseEntity<ApiResponse<AdminDealerAccountResponse>> updateDealerAccountStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAdminDealerAccountStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateDealerAccountStatus(id, request)));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminStaffUserResponse>>> users() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getUsers()));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<AdminStaffUserResponse>> createUser(
            @Valid @RequestBody AdminStaffUserUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.createUser(request)));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<AdminStaffUserResponse>> updateUserStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAdminStaffUserStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateUserStatus(id, request)));
    }

    @GetMapping("/discount-rules")
    public ResponseEntity<ApiResponse<List<AdminDiscountRuleResponse>>> discountRules() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getDiscountRules()));
    }

    @PostMapping("/discount-rules")
    public ResponseEntity<ApiResponse<AdminDiscountRuleResponse>> createDiscountRule(
            @Valid @RequestBody AdminDiscountRuleUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.createDiscountRule(request)));
    }

    @PatchMapping("/discount-rules/{id}/status")
    public ResponseEntity<ApiResponse<AdminDiscountRuleResponse>> updateDiscountRuleStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAdminDiscountRuleStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateDiscountRuleStatus(id, request)));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getDashboard()));
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<AdminSettingsResponse>> settings() {
        return ResponseEntity.ok(ApiResponse.success(adminSettingsService.getSettings()));
    }

    @PatchMapping("/password")
    public ResponseEntity<ApiResponse<Map<String, String>>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        adminManagementService.changePassword(extractUsername(authentication), request);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "updated")));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<AdminSettingsResponse>> updateSettings(
            @Valid @RequestBody UpdateAdminSettingsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminSettingsService.updateSettings(request)));
    }

    // ---- RMA: Serial lifecycle (BUSINESS_LOGIC.md Section 7.3) ----

    @PatchMapping("/serials/{id}/rma")
    public ResponseEntity<ApiResponse<AdminSerialResponse>> applyRmaAction(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminRmaRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminRmaService.applyRmaAction(id, request, extractUsername(authentication))));
    }

    // ---- FinancialSettlement (BUSINESS_LOGIC.md Section 3.4) ----

    @GetMapping("/financial-settlements")
    public ResponseEntity<ApiResponse<List<AdminFinancialSettlementResponse>>> financialSettlements(
            @RequestParam(name = "status", required = false) String status
    ) {
        if (status != null) {
            com.devwonder.backend.entity.enums.FinancialSettlementStatus s =
                    com.devwonder.backend.entity.enums.FinancialSettlementStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(ApiResponse.success(adminFinancialService.getFinancialSettlementsByStatus(s)));
        }
        return ResponseEntity.ok(ApiResponse.success(adminFinancialService.getFinancialSettlements()));
    }

    @PatchMapping("/financial-settlements/{id}")
    public ResponseEntity<ApiResponse<AdminFinancialSettlementResponse>> resolveFinancialSettlement(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminUpdateFinancialSettlementRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminFinancialService.resolveFinancialSettlement(id, request, extractUsername(authentication))));
    }

    // ---- OrderAdjustment (BUSINESS_LOGIC.md Section 3.25) ----

    @GetMapping("/orders/{id}/adjustments")
    public ResponseEntity<ApiResponse<List<AdminOrderAdjustmentResponse>>> getOrderAdjustments(
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminFinancialService.getOrderAdjustments(id)));
    }

    @PostMapping("/orders/{id}/adjustments")
    public ResponseEntity<ApiResponse<AdminOrderAdjustmentResponse>> createOrderAdjustment(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminOrderAdjustmentRequest request
    ) {
        String username = extractUsername(authentication);
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("ADMIN");
        return ResponseEntity.ok(ApiResponse.success(
                adminFinancialService.createOrderAdjustment(id, request, username, role)));
    }

    // ---- UnmatchedPayment (BUSINESS_LOGIC.md Section 3.21) ----

    @GetMapping("/unmatched-payments")
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
    public ResponseEntity<ApiResponse<AdminUnmatchedPaymentResponse>> resolveUnmatchedPayment(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminUpdateUnmatchedPaymentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminFinancialService.resolveUnmatchedPayment(id, request, extractUsername(authentication))));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<PagedResponse<AdminAuditLogResponse>>> auditLogs(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, "createdAt", "desc", "createdAt");
        Page<AdminAuditLogResponse> result = auditLogService.getLogs(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    private String extractUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new BadRequestException("Unauthenticated request");
        }
        return authentication.getName();
    }
}
