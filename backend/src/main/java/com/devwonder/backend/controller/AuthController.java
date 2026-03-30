package com.devwonder.backend.controller;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.dto.auth.AuthResponse;
import com.devwonder.backend.dto.auth.ForgotPasswordRequest;
import com.devwonder.backend.dto.auth.LoginRequest;
import com.devwonder.backend.dto.auth.EmailVerificationResponse;
import com.devwonder.backend.dto.auth.PasswordResetTokenValidationResponse;
import com.devwonder.backend.dto.auth.RefreshTokenRequest;
import com.devwonder.backend.dto.auth.RegisterDealerRequest;
import com.devwonder.backend.dto.auth.RegisterDealerResponse;
import com.devwonder.backend.dto.auth.ResendEmailVerificationRequest;
import com.devwonder.backend.dto.auth.ResendEmailVerificationResponse;
import com.devwonder.backend.dto.auth.ResetPasswordRequest;
import com.devwonder.backend.dto.auth.VerifyEmailRequest;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.exception.UnauthorizedException;
import com.devwonder.backend.service.AuthRefreshCookieService;
import com.devwonder.backend.service.AuthService;
import com.devwonder.backend.service.EmailVerificationService;
import com.devwonder.backend.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
// Canonical auth routes live under /api/v1/auth; /api/auth is a legacy compatibility alias.
@RequestMapping({"/api/v1/auth", "/api/auth"})
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthRefreshCookieService authRefreshCookieService;
    private final PasswordResetService passwordResetService;
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.login(request);
        HttpHeaders headers = new HttpHeaders();
        authRefreshCookieService.writeRefreshToken(
                headers,
                authResponse.refreshToken(),
                Boolean.TRUE.equals(request.remember())
        );
        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.success(authResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody(required = false) RefreshTokenRequest request,
            @RequestParam(value = "remember", required = false) Boolean remember,
            @RequestHeader(value = "X-Remember-Session", required = false) String rememberHeader,
            HttpServletRequest httpServletRequest,
            HttpServletResponse httpServletResponse
    ) {
        String refreshToken = request == null ? null : request.refreshToken();
        if (refreshToken == null || refreshToken.isBlank()) {
            refreshToken = authRefreshCookieService.extractRefreshToken(httpServletRequest);
        }
        try {
            AuthResponse authResponse = authService.refreshToken(refreshToken);
            HttpHeaders headers = new HttpHeaders();
            authRefreshCookieService.writeRefreshToken(
                    headers,
                    authResponse.refreshToken(),
                    resolveRememberSession(remember, rememberHeader)
            );
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(ApiResponse.success(authResponse));
        } catch (UnauthorizedException | ResourceNotFoundException ex) {
            httpServletResponse.addHeader(
                    HttpHeaders.SET_COOKIE,
                    authRefreshCookieService.clearRefreshTokenCookie().toString()
            );
            throw ex;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Map<String, String>>> logout(
            @RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpServletRequest
    ) {
        String refreshToken = request == null ? null : request.refreshToken();
        if (refreshToken == null || refreshToken.isBlank()) {
            refreshToken = authRefreshCookieService.extractRefreshToken(httpServletRequest);
        }
        authService.logout(refreshToken);
        HttpHeaders headers = new HttpHeaders();
        authRefreshCookieService.clearRefreshToken(headers);
        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.success(Map.of("status", "logged_out")));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(ApiResponse.success(passwordResetService.requestReset(request.email())));
    }

    @PostMapping("/resend-email-verification")
    public ResponseEntity<ApiResponse<ResendEmailVerificationResponse>> resendEmailVerification(
            @Valid @RequestBody ResendEmailVerificationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(emailVerificationService.resendVerification(request.identity())));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<EmailVerificationResponse>> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(emailVerificationService.verifyEmail(request.token())));
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

    private boolean resolveRememberSession(Boolean remember, String rememberHeader) {
        if (remember != null) {
            return remember;
        }
        if (rememberHeader == null || rememberHeader.isBlank()) {
            return false;
        }
        return Boolean.parseBoolean(rememberHeader.trim());
    }

}
