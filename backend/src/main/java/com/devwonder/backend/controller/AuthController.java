package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.auth.AuthResponse;
import com.devwonder.backend.dto.auth.ForgotPasswordRequest;
import com.devwonder.backend.dto.auth.LoginRequest;
import com.devwonder.backend.dto.auth.PasswordResetTokenValidationResponse;
import com.devwonder.backend.dto.auth.RefreshTokenRequest;
import com.devwonder.backend.dto.auth.RegisterDealerRequest;
import com.devwonder.backend.dto.auth.RegisterDealerResponse;
import com.devwonder.backend.dto.auth.ResetPasswordRequest;
import com.devwonder.backend.service.AuthService;
import com.devwonder.backend.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refreshToken(request)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(ApiResponse.success(passwordResetService.requestReset(request.email())));
    }

    @GetMapping("/reset-password/validate")
    public ResponseEntity<ApiResponse<PasswordResetTokenValidationResponse>> validateResetPasswordToken(
            @RequestParam("token") String token
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                new PasswordResetTokenValidationResponse(passwordResetService.isTokenValid(token))
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                passwordResetService.resetPassword(request.token(), request.newPassword())
        ));
    }

    @PostMapping("/register-dealer")
    public ResponseEntity<ApiResponse<RegisterDealerResponse>> registerDealer(
            @Valid @RequestBody RegisterDealerRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(authService.registerDealer(request)));
    }

}
