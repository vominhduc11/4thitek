package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.admin.AdminStaffUserResponse;
import com.devwonder.backend.dto.admin.AdminStaffUserUpsertRequest;
import com.devwonder.backend.dto.admin.UpdateAdminStaffUserStatusRequest;
import com.devwonder.backend.dto.customer.ChangePasswordRequest;
import com.devwonder.backend.service.AdminManagementService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminStaffUserController {

    private final AdminManagementService adminManagementService;

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

    @PatchMapping("/password")
    public ResponseEntity<ApiResponse<Map<String, String>>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        adminManagementService.changePassword(AdminControllerSupport.extractUsername(authentication), request);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "updated")));
    }
}
