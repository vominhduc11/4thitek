package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.auth.AuthResponse;
import com.devwonder.backend.dto.auth.LoginRequest;
import com.devwonder.backend.dto.auth.RefreshTokenRequest;
import com.devwonder.backend.dto.auth.RegisterCustomerRequest;
import com.devwonder.backend.dto.auth.RegisterDealerRequest;
import com.devwonder.backend.dto.auth.RegisterDealerResponse;
import com.devwonder.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refreshToken(request)));
    }

    @PostMapping("/register-dealer")
    public ResponseEntity<ApiResponse<RegisterDealerResponse>> registerDealer(
            @Valid @RequestBody RegisterDealerRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(authService.registerDealer(request)));
    }

    @PostMapping("/register-customer")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCustomer(
            @Valid @RequestBody RegisterCustomerRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(authService.registerCustomer(request)));
    }
}
