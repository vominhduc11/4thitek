package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.dealer.CreateDealerOrderRequest;
import com.devwonder.backend.dto.dealer.CreateDealerSerialBatchRequest;
import com.devwonder.backend.dto.dealer.CreateDealerSupportTicketRequest;
import com.devwonder.backend.dto.dealer.DealerBankTransferInstructionResponse;
import com.devwonder.backend.dto.dealer.DealerCartItemResponse;
import com.devwonder.backend.dto.dealer.DealerDiscountRuleResponse;
import com.devwonder.backend.dto.dealer.DealerOrderResponse;
import com.devwonder.backend.dto.dealer.DealerPaymentResponse;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.DealerProfileResponse;
import com.devwonder.backend.dto.dealer.DealerSupportTicketResponse;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerProfileRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerSerialStatusRequest;
import com.devwonder.backend.dto.dealer.UpsertDealerCartItemRequest;
import com.devwonder.backend.dto.customer.ChangePasswordRequest;
import com.devwonder.backend.dto.notify.NotifyResponse;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.dto.warranty.CreateWarrantyRegistrationRequest;
import com.devwonder.backend.dto.warranty.WarrantyRegistrationResponse;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.service.DealerAccountLifecycleService;
import com.devwonder.backend.service.DealerPortalService;
import com.devwonder.backend.service.DealerSupportTicketService;
import com.devwonder.backend.service.SepayService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
@RequestMapping("/api/v1/dealer")
@RequiredArgsConstructor
public class DealerController {

    private final DealerPortalService dealerPortalService;
    private final DealerSupportTicketService dealerSupportTicketService;
    private final SepayService sepayService;
    private final DealerAccountLifecycleService dealerAccountLifecycleService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<DealerProfileResponse>> profile(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.getProfile(extractUsername(authentication))));
    }

    @GetMapping("/discount-rules")
    public ResponseEntity<ApiResponse<List<DealerDiscountRuleResponse>>> discountRules(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.getDiscountRules(extractUsername(authentication))));
    }

    @GetMapping("/payment-instructions")
    public ResponseEntity<ApiResponse<DealerBankTransferInstructionResponse>> paymentInstructions(Authentication authentication) {
        extractUsername(authentication);
        return ResponseEntity.ok(ApiResponse.success(sepayService.getBankTransferInstructions()));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<DealerProfileResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateDealerProfileRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.updateProfile(extractUsername(authentication), request)));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<DealerOrderResponse>>> orders(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.getOrders(extractUsername(authentication))));
    }

    @GetMapping("/orders/page")
    public ResponseEntity<ApiResponse<PagedResponse<DealerOrderResponse>>> ordersPaged(
            Authentication authentication,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<DealerOrderResponse> result = dealerPortalService.getOrders(extractUsername(authentication), pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<DealerOrderResponse>> orderDetail(
            Authentication authentication,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.getOrder(extractUsername(authentication), id)));
    }

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<DealerOrderResponse>> createOrder(
            Authentication authentication,
            @Valid @RequestBody CreateDealerOrderRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.createOrder(extractUsername(authentication), request)));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<DealerOrderResponse>> updateOrderStatus(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateDealerOrderStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.updateOrderStatus(extractUsername(authentication), id, request)));
    }

    @GetMapping("/orders/{id}/payments")
    public ResponseEntity<ApiResponse<List<DealerPaymentResponse>>> payments(
            Authentication authentication,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.getPayments(extractUsername(authentication), id)));
    }

    @PostMapping("/orders/{id}/payments")
    public ResponseEntity<ApiResponse<DealerPaymentResponse>> recordPayment(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody RecordPaymentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.recordPayment(extractUsername(authentication), id, request)));
    }

    @GetMapping("/cart")
    public ResponseEntity<ApiResponse<List<DealerCartItemResponse>>> cart(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.getCart(extractUsername(authentication))));
    }

    @PutMapping("/cart/items")
    public ResponseEntity<ApiResponse<DealerCartItemResponse>> upsertCartItem(
            Authentication authentication,
            @Valid @RequestBody UpsertDealerCartItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.upsertCartItem(extractUsername(authentication), request)));
    }

    @DeleteMapping("/cart/items/{productId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> removeCartItem(
            Authentication authentication,
            @PathVariable("productId") Long productId
    ) {
        dealerPortalService.removeCartItem(extractUsername(authentication), productId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "removed")));
    }

    @DeleteMapping("/cart")
    public ResponseEntity<ApiResponse<Map<String, String>>> clearCart(Authentication authentication) {
        dealerPortalService.clearCart(extractUsername(authentication));
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "cleared")));
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<NotifyResponse>>> notifications(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.getNotifications(extractUsername(authentication))));
    }

    @GetMapping("/notifications/page")
    public ResponseEntity<ApiResponse<PagedResponse<NotifyResponse>>> notificationsPaged(
            Authentication authentication,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<NotifyResponse> result = dealerPortalService.getNotifications(extractUsername(authentication), pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<NotifyResponse>> markRead(
            Authentication authentication,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.markNotificationRead(extractUsername(authentication), id)));
    }

    @PatchMapping("/notifications/{id}/unread")
    public ResponseEntity<ApiResponse<NotifyResponse>> markUnread(
            Authentication authentication,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.markNotificationUnread(extractUsername(authentication), id)));
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAllRead(Authentication authentication) {
        int updated = dealerPortalService.markAllNotificationsRead(extractUsername(authentication));
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "updated", "updatedCount", updated)));
    }

    @GetMapping("/warranties")
    public ResponseEntity<ApiResponse<List<WarrantyRegistrationResponse>>> warranties(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.getWarranties(extractUsername(authentication))));
    }

    @GetMapping("/warranties/page")
    public ResponseEntity<ApiResponse<PagedResponse<WarrantyRegistrationResponse>>> warrantiesPaged(
            Authentication authentication,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<WarrantyRegistrationResponse> result = dealerPortalService.getWarranties(extractUsername(authentication), pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @GetMapping("/warranties/{id}")
    public ResponseEntity<ApiResponse<WarrantyRegistrationResponse>> warrantyDetail(
            Authentication authentication,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.getWarranty(extractUsername(authentication), id)));
    }

    @PostMapping("/warranties")
    public ResponseEntity<ApiResponse<WarrantyRegistrationResponse>> createWarranty(
            Authentication authentication,
            @Valid @RequestBody CreateWarrantyRegistrationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.createWarranty(extractUsername(authentication), request)));
    }

    @PutMapping("/warranties/{id}")
    public ResponseEntity<ApiResponse<WarrantyRegistrationResponse>> updateWarranty(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody CreateWarrantyRegistrationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.updateWarranty(extractUsername(authentication), id, request)));
    }

    @DeleteMapping("/warranties/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteWarranty(
            Authentication authentication,
            @PathVariable("id") Long id
    ) {
        dealerPortalService.deleteWarranty(extractUsername(authentication), id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "deleted")));
    }

    @GetMapping("/serials")
    public ResponseEntity<ApiResponse<List<DealerProductSerialResponse>>> serials(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.getSerials(extractUsername(authentication))));
    }

    @PostMapping("/serials/import")
    public ResponseEntity<ApiResponse<List<DealerProductSerialResponse>>> importSerials(
            Authentication authentication,
            @Valid @RequestBody CreateDealerSerialBatchRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.importSerials(extractUsername(authentication), request)));
    }

    @PatchMapping("/serials/{id}/status")
    public ResponseEntity<ApiResponse<DealerProductSerialResponse>> updateSerialStatus(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateDealerSerialStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerPortalService.updateSerialStatus(extractUsername(authentication), id, request)));
    }

    @GetMapping("/support-tickets/latest")
    public ResponseEntity<ApiResponse<DealerSupportTicketResponse>> latestSupportTicket(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(dealerSupportTicketService.getLatestTicket(extractUsername(authentication))));
    }

    @GetMapping("/support-tickets/page")
    public ResponseEntity<ApiResponse<PagedResponse<DealerSupportTicketResponse>>> supportTicketsPaged(
            Authentication authentication,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false) String sortDir
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, sortBy, sortDir, "createdAt");
        Page<DealerSupportTicketResponse> result =
                dealerSupportTicketService.getTickets(extractUsername(authentication), pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }

    @PostMapping("/support-tickets")
    public ResponseEntity<ApiResponse<DealerSupportTicketResponse>> createSupportTicket(
            Authentication authentication,
            @Valid @RequestBody CreateDealerSupportTicketRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(dealerSupportTicketService.createTicket(extractUsername(authentication), request)));
    }

    @PatchMapping("/password")
    public ResponseEntity<ApiResponse<Map<String, String>>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        dealerPortalService.changePassword(
                extractUsername(authentication),
                request.currentPassword(),
                request.newPassword()
        );
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "updated")));
    }

    private String extractUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new BadRequestException("Unauthenticated request");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Account account) {
            dealerAccountLifecycleService.assertDealerPortalAccess(account);
        }
        return authentication.getName();
    }
}
