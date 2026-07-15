package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminAuditLogResponse;
import com.devwonder.backend.dto.admin.AdminSettingsResponse;
import com.devwonder.backend.dto.admin.UpdateAdminSettingsRequest;
import com.devwonder.backend.dto.admin.UpdateSepayWebhookTokenRequest;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.service.AdminSettingsService;
import com.devwonder.backend.service.AuditLogService;
import com.devwonder.backend.service.MailService;
import com.devwonder.backend.util.PaginationUtils;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminSettingsController {

    private final AdminSettingsService adminSettingsService;
    private final MailService mailService;
    private final AuditLogService auditLogService;

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<AdminSettingsResponse>> settings() {
        return ResponseEntity.ok(ApiResponse.success(adminSettingsService.getSettings()));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<AdminSettingsResponse>> updateSettings(
            @Valid @RequestBody UpdateAdminSettingsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminSettingsService.updateSettings(request)));
    }

    @PutMapping("/settings/sepay/webhook-token")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AdminSettingsResponse>> replaceSepayWebhookToken(
            @Valid @RequestBody UpdateSepayWebhookTokenRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminSettingsService.replaceSepayWebhookToken(request)));
    }

    @PostMapping("/settings/test-email")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
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

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<PagedResponse<AdminAuditLogResponse>>> auditLogs(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(name = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(name = "actor", required = false) String actor,
            @RequestParam(name = "action", required = false) String action,
            @RequestParam(name = "entityType", required = false) String entityType,
            @RequestParam(name = "entityId", required = false) String entityId
    ) {
        Pageable pageable = PaginationUtils.toPageable(page, size, "createdAt", "desc", "createdAt");
        Page<AdminAuditLogResponse> result = auditLogService.getLogs(pageable, from, to, actor, action, entityType, entityId);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(result, "createdAt")));
    }
}
