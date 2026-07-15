package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminProductResponse;
import com.devwonder.backend.dto.admin.AdminProductUpsertRequest;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.dto.publicapi.PublicProductDetailResponse;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.PublicApiService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
public class AdminProductController {

    private final AdminManagementService adminManagementService;
    private final PublicApiService publicApiService;

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
    @PreAuthorize("hasAuthority('products.write')")
    public ResponseEntity<ApiResponse<AdminProductResponse>> createProduct(
            @Valid @RequestBody AdminProductUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.createProduct(request)));
    }

    @PostMapping("/products/preview")
    @PreAuthorize("hasAuthority('products.write')")
    public ResponseEntity<ApiResponse<PublicProductDetailResponse>> previewProduct(
            @Valid @RequestBody AdminProductUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(publicApiService.previewProduct(request)));
    }

    @PutMapping("/products/{id}")
    @PreAuthorize("hasAuthority('products.write')")
    public ResponseEntity<ApiResponse<AdminProductResponse>> updateProduct(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminProductUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateProduct(id, request)));
    }

    @DeleteMapping("/products/{id}")
    @PreAuthorize("hasAuthority('products.write')")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteProduct(@PathVariable("id") Long id) {
        adminManagementService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "deleted")));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> categories() {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.getCategories()));
    }
}
