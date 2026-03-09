package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminBlogResponse;
import com.devwonder.backend.dto.admin.AdminBlogUpsertRequest;
import com.devwonder.backend.dto.admin.AdminDashboardResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountUpsertRequest;
import com.devwonder.backend.dto.admin.AdminDealerResponse;
import com.devwonder.backend.dto.admin.AdminDiscountRuleResponse;
import com.devwonder.backend.dto.admin.AdminDiscountRuleUpsertRequest;
import com.devwonder.backend.dto.admin.AdminOrderResponse;
import com.devwonder.backend.dto.admin.AdminProductResponse;
import com.devwonder.backend.dto.admin.AdminProductUpsertRequest;
import com.devwonder.backend.dto.admin.AdminSettingsResponse;
import com.devwonder.backend.dto.admin.AdminStaffUserResponse;
import com.devwonder.backend.dto.admin.AdminStaffUserUpsertRequest;
import com.devwonder.backend.dto.admin.UpdateAdminDealerAccountStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminSettingsRequest;
import com.devwonder.backend.dto.admin.UpdateAdminDiscountRuleStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminStaffUserStatusRequest;
import com.devwonder.backend.dto.dealer.DealerProductSerialResponse;
import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.AdminSettingsService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminManagementService adminManagementService;
    private final AdminSettingsService adminSettingsService;

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<AdminProductResponse>>> products() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getProducts()));
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

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> updateOrderStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateDealerOrderStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateOrderStatus(id, request)));
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

    @GetMapping({"/customers", "/dealers/accounts"})
    public ResponseEntity<ApiResponse<List<AdminDealerAccountResponse>>> dealerAccounts() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getDealerAccounts()));
    }

    @PostMapping({"/customers", "/dealers/accounts"})
    public ResponseEntity<ApiResponse<AdminDealerAccountResponse>> createDealerAccount(
            @Valid @RequestBody AdminDealerAccountUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.createDealerAccount(request)));
    }

    @PatchMapping({"/customers/{id}/status", "/dealers/accounts/{id}/status"})
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

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<AdminSettingsResponse>> updateSettings(
            @RequestBody UpdateAdminSettingsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminSettingsService.updateSettings(request)));
    }
}
