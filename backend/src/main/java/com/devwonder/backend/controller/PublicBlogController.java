package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.blog.PublicBlogCategoryResponse;
import com.devwonder.backend.dto.blog.PublicBlogDetailResponse;
import com.devwonder.backend.dto.blog.PublicBlogSummaryResponse;
import com.devwonder.backend.service.PublicBlogService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/blog", "/api/v1/blog"})
@RequiredArgsConstructor
public class PublicBlogController {

    private final PublicBlogService publicBlogService;

    @GetMapping("/blogs/homepage")
    public ResponseEntity<ApiResponse<List<PublicBlogSummaryResponse>>> homepage() {
        return ResponseEntity.ok(ApiResponse.success(publicBlogService.getHomepageBlogs()));
    }

    @GetMapping("/blogs")
    public ResponseEntity<ApiResponse<List<PublicBlogSummaryResponse>>> blogs() {
        return ResponseEntity.ok(ApiResponse.success(publicBlogService.getBlogs()));
    }

    @GetMapping("/blogs/search")
    public ResponseEntity<ApiResponse<List<PublicBlogSummaryResponse>>> search(
            @RequestParam(name = "query", required = false) String query
    ) {
        return ResponseEntity.ok(ApiResponse.success(publicBlogService.searchBlogs(query)));
    }

    @GetMapping("/blogs/related/{id}")
    public ResponseEntity<ApiResponse<List<PublicBlogSummaryResponse>>> related(
            @PathVariable("id") Long id,
            @RequestParam(name = "limit", defaultValue = "4") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.success(publicBlogService.getRelatedBlogs(id, limit)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<PublicBlogCategoryResponse>>> categories() {
        return ResponseEntity.ok(ApiResponse.success(publicBlogService.getCategories()));
    }

    @GetMapping("/categories/{id}/blogs")
    public ResponseEntity<ApiResponse<List<PublicBlogSummaryResponse>>> byCategory(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(publicBlogService.getBlogsByCategory(id)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PublicBlogDetailResponse>> detail(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(publicBlogService.getBlog(id)));
    }
}
