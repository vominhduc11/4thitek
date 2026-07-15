package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminAssignOrderSerialsRequest;
import com.devwonder.backend.dto.admin.AdminOrderPaymentResponse;
import com.devwonder.backend.dto.admin.AdminOrderResponse;
import com.devwonder.backend.dto.admin.AdminOrderSummaryResponse;
import com.devwonder.backend.dto.admin.AdminUpdateOrderStatusRequest;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.service.AdminFinancialService;
import com.devwonder.backend.service.AdminManagementService;
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
public class AdminOrderController {

    private final AdminManagementService adminManagementService;
    private final AdminFinancialService adminFinancialService;

    @GetMapping("/orders")
    @PreAuthorize("hasAuthority('orders.read')")
    public ResponseEntity<ApiResponse<List<AdminOrderResponse>>> orders() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getOrders()));
    }

    @GetMapping("/orders/page")
    @PreAuthorize("hasAuthority('orders.read')")
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
    @PreAuthorize("hasAuthority('orders.read')")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> orderDetail(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getOrder(id)));
    }

    @GetMapping("/orders/summary")
    @PreAuthorize("hasAuthority('orders.read')")
    public ResponseEntity<ApiResponse<AdminOrderSummaryResponse>> orderSummary() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getOrderSummary()));
    }

    @PatchMapping("/orders/{id}/status")
    @PreAuthorize("hasAnyAuthority('orders.approve','orders.process','orders.cancel.review')")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> updateOrderStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminUpdateOrderStatusRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminManagementService.updateOrderStatus(id, request, AdminControllerSupport.extractUsername(authentication))));
    }

    @PostMapping("/orders/{id}/assign-serials")
    @PreAuthorize("hasAuthority('serials.assign')")
    public ResponseEntity<ApiResponse<List<DealerProductSerialResponse>>> assignOrderSerials(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminAssignOrderSerialsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.assignOrderSerials(id, request)));
    }

    @PostMapping("/orders/{id}/payments")
    @PreAuthorize("hasAuthority('orders.payment.confirm')")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> recordOrderPayment(
            @PathVariable("id") Long id,
            @Valid @RequestBody RecordPaymentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.recordOrderPayment(id, request)));
    }

    @GetMapping("/orders/{id}/payments")
    @PreAuthorize("hasAuthority('orders.read')")
    public ResponseEntity<ApiResponse<List<AdminOrderPaymentResponse>>> getOrderPayments(
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminFinancialService.getOrderPayments(id)));
    }

    @DeleteMapping("/orders/{id}")
    @PreAuthorize("hasAnyAuthority('orders.process','orders.cancel.review')")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteOrder(@PathVariable("id") Long id) {
        adminManagementService.deleteOrder(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "deleted")));
    }
}
