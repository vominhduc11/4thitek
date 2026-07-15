package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminBlogResponse;
import com.devwonder.backend.dto.admin.AdminBlogUpsertRequest;
import com.devwonder.backend.dto.admin.AdminDashboardResponse;
import com.devwonder.backend.dto.admin.AdminNotificationDispatchResponse;
import com.devwonder.backend.dto.admin.AdminNotificationResponse;
import com.devwonder.backend.dto.admin.AdminPublicContentSectionResponse;
import com.devwonder.backend.dto.admin.AdminReportExportResponse;
import com.devwonder.backend.dto.admin.AdminReportExportType;
import com.devwonder.backend.dto.admin.AdminReportFormat;
import com.devwonder.backend.dto.admin.CreateAdminNotificationRequest;
import com.devwonder.backend.dto.admin.UpdateAdminPublicContentSectionRequest;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.AdminOperationsService;
import com.devwonder.backend.service.AdminReportingService;
import com.devwonder.backend.service.DashboardService;
import com.devwonder.backend.service.PublicContentService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
public class AdminMiscController {

    private final AdminManagementService adminManagementService;
    private final AdminOperationsService adminOperationsService;
    private final AdminReportingService adminReportingService;
    private final DashboardService dashboardService;
    private final PublicContentService publicContentService;

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
    @PreAuthorize("hasAuthority('content.write')")
    public ResponseEntity<ApiResponse<AdminPublicContentSectionResponse>> updatePublicContentSection(
            @PathVariable("section") String section,
            @Valid @RequestBody UpdateAdminPublicContentSectionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(publicContentService.upsertSection(section, request)));
    }

    @GetMapping("/reports/export")
    @PreAuthorize("hasAuthority('reports.read')")
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
    @PreAuthorize("hasAuthority('blogs.write')")
    public ResponseEntity<ApiResponse<AdminBlogResponse>> createBlog(
            @Valid @RequestBody AdminBlogUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.createBlog(request)));
    }

    @PutMapping("/blogs/{id}")
    @PreAuthorize("hasAuthority('blogs.write')")
    public ResponseEntity<ApiResponse<AdminBlogResponse>> updateBlog(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminBlogUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminManagementService.updateBlog(id, request)));
    }

    @DeleteMapping("/blogs/{id}")
    @PreAuthorize("hasAuthority('blogs.write')")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteBlog(@PathVariable("id") Long id) {
        adminManagementService.deleteBlog(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "deleted")));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('dashboard.read')")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboard()));
    }

    @GetMapping("/notifications/page")
    @PreAuthorize("hasAuthority('notifications.read')")
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
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<AdminNotificationDispatchResponse>> createNotification(
            @Valid @RequestBody CreateAdminNotificationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminOperationsService.createNotification(request)));
    }
}
