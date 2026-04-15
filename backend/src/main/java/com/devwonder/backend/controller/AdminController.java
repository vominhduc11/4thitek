package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminAssignOrderSerialsRequest;
import com.devwonder.backend.dto.admin.AdminBlogResponse;
import com.devwonder.backend.dto.admin.AdminBlogUpsertRequest;
import com.devwonder.backend.dto.admin.AdminCompleteReturnRequest;
import com.devwonder.backend.dto.admin.AdminDashboardResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountSummaryResponse;
import com.devwonder.backend.dto.admin.AdminDealerResponse;
import com.devwonder.backend.dto.admin.AdminDiscountRuleResponse;
import com.devwonder.backend.dto.admin.AdminDiscountRuleUpsertRequest;
import com.devwonder.backend.dto.admin.AdminNotificationDispatchResponse;
import com.devwonder.backend.dto.admin.AdminNotificationResponse;
import com.devwonder.backend.dto.admin.AdminOrderResponse;
import com.devwonder.backend.dto.admin.AdminOrderSummaryResponse;
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
import com.devwonder.backend.dto.admin.UpdateSepayWebhookTokenRequest;
import com.devwonder.backend.dto.admin.AdminWarrantyResponse;
import com.devwonder.backend.dto.admin.CreateAdminSupportTicketMessageRequest;
import com.devwonder.backend.dto.admin.CreateAdminNotificationRequest;
import com.devwonder.backend.dto.admin.UpdateAdminSerialStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminDealerAccountStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminSupportTicketRequest;
import com.devwonder.backend.dto.admin.UpdateAdminSettingsRequest;
import com.devwonder.backend.dto.admin.UpdateAdminDiscountRuleStatusRequest;
import com.devwonder.backend.dto.admin.AdminFinancialSettlementResponse;
import com.devwonder.backend.dto.admin.AdminOrderAdjustmentRequest;
import com.devwonder.backend.dto.admin.AdminOrderAdjustmentResponse;
import com.devwonder.backend.dto.admin.AdminOrderPaymentResponse;
import com.devwonder.backend.dto.admin.AdminPublicContentSectionResponse;
import com.devwonder.backend.dto.admin.AdminRecentPaymentResponse;
import com.devwonder.backend.dto.admin.AdminRmaRequest;
import com.devwonder.backend.dto.admin.AdminInspectReturnItemRequest;
import com.devwonder.backend.dto.admin.AdminReceiveReturnRequest;
import com.devwonder.backend.dto.admin.AdminReviewReturnRequest;
import com.devwonder.backend.dto.admin.AdminUnmatchedPaymentResponse;
import com.devwonder.backend.dto.admin.AdminUpdateFinancialSettlementRequest;
import com.devwonder.backend.dto.admin.AdminAuditLogResponse;
import com.devwonder.backend.dto.admin.AdminUpdateUnmatchedPaymentRequest;
import com.devwonder.backend.dto.admin.UpdateAdminPublicContentSectionRequest;
import com.devwonder.backend.dto.admin.UpdateAdminStaffUserStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminWarrantyStatusRequest;
import com.devwonder.backend.dto.customer.ChangePasswordRequest;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.dto.returns.ReturnRequestDetailResponse;
import com.devwonder.backend.dto.returns.ReturnRequestSummaryResponse;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.ReturnRequestStatus;
import com.devwonder.backend.entity.enums.ReturnRequestType;
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
import com.devwonder.backend.service.MailService;
import com.devwonder.backend.service.PublicContentService;
import com.devwonder.backend.service.ReturnRequestService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.time.Instant;
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
import org.springframework.format.annotation.DateTimeFormat;
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
    private final MailService mailService;
    private final PublicContentService publicContentService;
    private final ReturnRequestService returnRequestService;

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
            @RequestParam(name = "status", required = false) OrderStatus status,
            @RequestParam(name = "query", required = false) String query
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<AdminOrderResponse> result = adminManagementService.getOrders(pageable, status, query);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> orderDetail(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getOrder(id)));
    }

    @GetMapping("/orders/summary")
    public ResponseEntity<ApiResponse<AdminOrderSummaryResponse>> orderSummary() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getOrderSummary()));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> updateOrderStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateDealerOrderStatusRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminManagementService.updateOrderStatus(id, request, extractUsername(authentication))));
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

    @GetMapping("/orders/{id}/payments")
    public ResponseEntity<ApiResponse<List<AdminOrderPaymentResponse>>> getOrderPayments(
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminFinancialService.getOrderPayments(id)));
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteOrder(@PathVariable("id") Long id) {
        adminManagementService.deleteOrder(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "deleted")));
    }

    @GetMapping("/content")
    public ResponseEntity<ApiResponse<List<AdminPublicContentSectionResponse>>> getPublicContentSections() {
        return ResponseEntity.ok(ApiResponse.success(publicContentService.getAdminSections()));
    }

    @GetMapping("/content/{section}")
    public ResponseEntity<ApiResponse<AdminPublicContentSectionResponse>> getPublicContentSection(
            @PathVariable("section") String section,
            @RequestParam(name = "lang", defaultValue = "vi") String lang
    ) {
        return ResponseEntity.ok(ApiResponse.success(publicContentService.getAdminSection(section, lang)));
    }

    @PutMapping("/content/{section}")
    public ResponseEntity<ApiResponse<AdminPublicContentSectionResponse>> updatePublicContentSection(
            @PathVariable("section") String section,
            @Valid @RequestBody UpdateAdminPublicContentSectionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(publicContentService.upsertSection(section, request)));
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
            @Valid @RequestBody UpdateAdminSupportTicketRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminOperationsService.updateSupportTicket(id, request, extractUsername(authentication))
        ));
    }

    @PostMapping("/support-tickets/{id}/messages")
    public ResponseEntity<ApiResponse<AdminSupportTicketResponse>> addSupportTicketMessage(
            @PathVariable("id") Long id,
            @Valid @RequestBody CreateAdminSupportTicketMessageRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminOperationsService.addSupportTicketMessage(id, request, extractUsername(authentication))
        ));
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
            @RequestParam("format") AdminReportFormat format,
            @RequestParam(name = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(name = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        AdminReportExportResponse report = adminReportingService.export(type, format, from, to);
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
            @RequestParam(name = "sortDir", required = false) String sortDir,
            @RequestParam(name = "status", required = false) CustomerStatus status,
            @RequestParam(name = "query", required = false) String query
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<AdminDealerAccountResponse> result = adminManagementService.getDealerAccounts(pageable, status, query);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @GetMapping("/dealers/accounts/summary")
    public ResponseEntity<ApiResponse<AdminDealerAccountSummaryResponse>> dealerAccountSummary() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getDealerAccountSummary()));
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

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetUserPassword(
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.resetUserPassword(id)));
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

    @PutMapping("/discount-rules/{id}")
    public ResponseEntity<ApiResponse<AdminDiscountRuleResponse>> updateDiscountRule(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminDiscountRuleUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateDiscountRule(id, request)));
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

    @PutMapping("/settings/sepay/webhook-token")
    public ResponseEntity<ApiResponse<AdminSettingsResponse>> replaceSepayWebhookToken(
            @Valid @RequestBody UpdateSepayWebhookTokenRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminSettingsService.replaceSepayWebhookToken(request)));
    }

    @PostMapping("/settings/test-email")
    public ResponseEntity<ApiResponse<Map<String, String>>> testEmail() {
        if (!mailService.isEnabled()) {
            throw new BadRequestException("Email is not configured or disabled in settings");
        }
        String to = adminSettingsService.getEmailSettings().from();
        if (to == null || to.isBlank()) {
            throw new BadRequestException("No sender email configured — set the mail 'from' address in settings first");
        }
        mailService.sendText(to, "Test Email - Admin Panel",
                "This is a test email sent from the admin panel to verify your email configuration is working correctly.");
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "sent")));
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

    @GetMapping("/returns/page")
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
    public ResponseEntity<ApiResponse<ReturnRequestDetailResponse>> returnRequestDetail(
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(returnRequestService.getAdminReturnDetail(id)));
    }

    @PatchMapping("/returns/{id}/review")
    public ResponseEntity<ApiResponse<ReturnRequestDetailResponse>> reviewReturnRequest(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminReviewReturnRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                returnRequestService.reviewReturnRequest(id, request, extractUsername(authentication))
        ));
    }

    @PatchMapping("/returns/{id}/receive")
    public ResponseEntity<ApiResponse<ReturnRequestDetailResponse>> receiveReturnRequest(
            Authentication authentication,
            @PathVariable("id") Long id,
            @RequestBody(required = false) AdminReceiveReturnRequest request
    ) {
        AdminReceiveReturnRequest payload = request == null
                ? new AdminReceiveReturnRequest(null, null)
                : request;
        return ResponseEntity.ok(ApiResponse.success(
                returnRequestService.receiveReturnRequest(id, payload, extractUsername(authentication))
        ));
    }

    @PatchMapping("/returns/{id}/items/{itemId}/inspect")
    public ResponseEntity<ApiResponse<ReturnRequestDetailResponse>> inspectReturnItem(
            Authentication authentication,
            @PathVariable("id") Long id,
            @PathVariable("itemId") Long itemId,
            @Valid @RequestBody AdminInspectReturnItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                returnRequestService.inspectReturnItem(id, itemId, request, extractUsername(authentication))
        ));
    }

    @PatchMapping("/returns/{id}/complete")
    public ResponseEntity<ApiResponse<ReturnRequestDetailResponse>> completeReturnRequest(
            Authentication authentication,
            @PathVariable("id") Long id,
            @RequestBody(required = false) AdminCompleteReturnRequest request
    ) {
        AdminCompleteReturnRequest payload = request == null
                ? new AdminCompleteReturnRequest(null)
                : request;
        return ResponseEntity.ok(ApiResponse.success(
                returnRequestService.completeReturnRequest(id, payload, extractUsername(authentication))
        ));
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

    @GetMapping("/payments/recent")
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
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(name = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(name = "actor", required = false) String actor,
            @RequestParam(name = "action", required = false) String action
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, "createdAt", "desc", "createdAt");
        Page<AdminAuditLogResponse> result = auditLogService.getLogs(pageable, from, to, actor, action);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    private String extractUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new BadRequestException("Unauthenticated request");
        }
        return authentication.getName();
    }
}
