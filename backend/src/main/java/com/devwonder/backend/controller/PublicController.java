package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.dto.publicapi.PublicDealerResponse;
import com.devwonder.backend.dto.publicapi.PublicProductDetailResponse;
import com.devwonder.backend.dto.publicapi.PublicProductSummaryResponse;
import com.devwonder.backend.dto.publicapi.WarrantyLookupResponse;
import com.devwonder.backend.service.PublicApiService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PublicController {

    private final PublicApiService publicApiService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, String>>> health() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "ok")));
    }

    @GetMapping("/product/products/new")
    public ResponseEntity<ApiResponse<List<PublicProductSummaryResponse>>> newProducts() {
        return ResponseEntity.ok(ApiResponse.success(publicApiService.getHomepageProducts()));
    }

    @GetMapping("/product/products/featured")
    public ResponseEntity<ApiResponse<List<PublicProductSummaryResponse>>> featuredProducts() {
        return ResponseEntity.ok(ApiResponse.success(publicApiService.getFeaturedProducts()));
    }

    @GetMapping("/product/products")
    public ResponseEntity<ApiResponse<List<PublicProductSummaryResponse>>> products() {
        return ResponseEntity.ok(ApiResponse.success(publicApiService.getProducts()));
    }

    @GetMapping("/product/products/page")
    public ResponseEntity<ApiResponse<PagedResponse<PublicProductSummaryResponse>>> productsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(publicApiService.getProductsPaged(page, size)));
    }

    @GetMapping("/product/products/search")
    public ResponseEntity<ApiResponse<List<PublicProductSummaryResponse>>> searchProducts(
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "minPrice", required = false) Double minPrice,
            @RequestParam(name = "maxPrice", required = false) Double maxPrice
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                publicApiService.searchProducts(query, minPrice, maxPrice)
        ));
    }

    @GetMapping("/product/{id}")
    public ResponseEntity<ApiResponse<PublicProductDetailResponse>> product(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(publicApiService.getProduct(id)));
    }

    @GetMapping("/user/dealer")
    public ResponseEntity<ApiResponse<Map<String, List<PublicDealerResponse>>>> dealers() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("dealers", publicApiService.getDealers())));
    }

    @GetMapping("/user/dealer/page")
    public ResponseEntity<ApiResponse<PagedResponse<PublicDealerResponse>>> dealersPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(publicApiService.getDealersPaged(page, size)));
    }

    @GetMapping("/warranty/check/{serial}")
    public ResponseEntity<ApiResponse<WarrantyLookupResponse>> warranty(@PathVariable String serial) {
        return ResponseEntity.ok(ApiResponse.success(publicApiService.lookupWarranty(serial)));
    }
}
