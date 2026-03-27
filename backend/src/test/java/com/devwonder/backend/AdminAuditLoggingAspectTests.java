package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.devwonder.backend.config.AdminAuditLoggingAspect;
import com.devwonder.backend.config.ClientIpResolver;
import com.devwonder.backend.dto.admin.UpdateAdminSettingsRequest;
import com.devwonder.backend.dto.customer.ChangePasswordRequest;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.entity.AuditLog;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.service.AuditLogService;
import com.fasterxml.jackson.databind.json.JsonMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.aspectj.lang.JoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@ExtendWith(MockitoExtension.class)
class AdminAuditLoggingAspectTests {

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private JoinPoint joinPoint;

    private AdminAuditLoggingAspect aspect;

    @BeforeEach
    void setUp() {
        aspect = new AdminAuditLoggingAspect(auditLogService, JsonMapper.builder().findAndAddModules().build());
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
        SecurityContextHolder.clearContext();
    }

    @Test
    void ignoresReadOnlyAdminRequests() {
        setRequest("GET", "/api/v1/admin/settings");

        aspect.captureAdminMutation(joinPoint);

        verifyNoInteractions(auditLogService);
    }

    @Test
    void sanitizesPasswordsForAdminPasswordChangeAudit() {
        setRequest("PATCH", "/api/v1/admin/password");
        authenticate("owner@example.com", "ADMIN", "SUPER_ADMIN");
        when(joinPoint.getArgs()).thenReturn(new Object[]{
                new ChangePasswordRequest("Current#123", "NewSecret#456")
        });

        AuditLog auditLog = captureSingleAuditLog();

        assertThat(auditLog.getActor()).isEqualTo("owner@example.com");
        assertThat(auditLog.getActorRole()).isEqualTo("ADMIN,SUPER_ADMIN");
        assertThat(auditLog.getAction()).isEqualTo("changePassword");
        assertThat(auditLog.getEntityType()).isEqualTo("password");
        assertThat(auditLog.getRequestMethod()).isEqualTo("PATCH");
        assertThat(auditLog.getRequestPath()).isEqualTo("/api/v1/admin/password");
        assertThat(auditLog.getIpAddress()).isEqualTo("10.0.0.50");
        assertThat(auditLog.getPayload())
                .contains("[REDACTED]")
                .doesNotContain("Current#123")
                .doesNotContain("NewSecret#456");
    }

    @Test
    void usesSharedClientIpResolverWhenAuditTrustsForwardedFor() {
        aspect = new AdminAuditLoggingAspect(
                auditLogService,
                JsonMapper.builder().findAndAddModules().build(),
                new ClientIpResolver(false, true)
        );
        setRequest("PUT", "/api/v1/admin/settings");
        authenticate("settings.admin@example.com", "SUPER_ADMIN");
        when(joinPoint.getArgs()).thenReturn(new Object[]{
                new UpdateAdminSettingsRequest(
                        true,
                        60,
                        true,
                        true,
                        null,
                        null,
                        null
                )
        });

        AuditLog auditLog = captureSingleAuditLog();

        assertThat(auditLog.getIpAddress()).isEqualTo("203.0.113.8");
    }

    @Test
    void sanitizesWebhookTokenWhenUpdatingAdminSettings() {
        setRequest("PUT", "/api/v1/admin/settings");
        authenticate("settings.admin@example.com", "SUPER_ADMIN");
        when(joinPoint.getArgs()).thenReturn(new Object[]{
                new UpdateAdminSettingsRequest(
                        true,
                        120,
                        true,
                        false,
                        new UpdateAdminSettingsRequest.SepaySettings(
                                true,
                                "whsec_live_123",
                                "VCB",
                                "123456789",
                                "4ThiTek"
                        ),
                        null,
                        null
                )
        });

        AuditLog auditLog = captureSingleAuditLog();

        assertThat(auditLog.getAction()).isEqualTo("update");
        assertThat(auditLog.getEntityType()).isEqualTo("settings");
        assertThat(auditLog.getPayload())
                .contains("[REDACTED]")
                .doesNotContain("whsec_live_123");
    }

    @Test
    void normalizesCreateActionForAdminOrderPaymentMutation() {
        setRequest("POST", "/api/v1/admin/orders/123/payments");
        authenticate("staff@example.com", "ADMIN");
        when(joinPoint.getArgs()).thenReturn(new Object[]{
                123L,
                new RecordPaymentRequest(
                        new BigDecimal("500000"),
                        PaymentMethod.DEBT,
                        "MANUAL",
                        "TX-123",
                        "Confirmed by finance",
                        "proof.pdf",
                        Instant.parse("2026-03-21T12:30:00Z")
                )
        });

        AuditLog auditLog = captureSingleAuditLog();

        assertThat(auditLog.getAction()).isEqualTo("create");
        assertThat(auditLog.getEntityType()).isEqualTo("orders/payments");
        assertThat(auditLog.getEntityId()).isEqualTo("123");
        assertThat(auditLog.getPayload()).contains("\"transactionCode\":\"TX-123\"");
    }

    private AuditLog captureSingleAuditLog() {
        aspect.captureAdminMutation(joinPoint);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogService).save(captor.capture());
        return captor.getValue();
    }

    private void setRequest(String method, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRemoteAddr("10.0.0.50");
        request.addHeader("X-Forwarded-For", "203.0.113.8, 10.0.0.1");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    private void authenticate(String username, String... authorities) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                username,
                "n/a",
                List.of(authorities).stream()
                        .map(SimpleGrantedAuthority::new)
                        .toList()
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
