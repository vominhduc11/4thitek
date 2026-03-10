package com.devwonder.backend.config;

import com.devwonder.backend.entity.AuditLog;
import com.devwonder.backend.service.AuditLogService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
public class AdminAuditLoggingAspect {

    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public AdminAuditLoggingAspect(AuditLogService auditLogService, ObjectMapper objectMapper) {
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    @AfterReturning(
            "execution(* com.devwonder.backend.controller.AdminController.create*(..))"
                    + " || execution(* com.devwonder.backend.controller.AdminController.update*(..))"
                    + " || execution(* com.devwonder.backend.controller.AdminController.delete*(..))"
                    + " || execution(* com.devwonder.backend.controller.AdminController.changePassword(..))"
                    + " || execution(* com.devwonder.backend.controller.AdminController.import*(..))"
                    + " || execution(* com.devwonder.backend.controller.AdminController.createNotification(..))"
    )
    public void captureAdminMutation(JoinPoint joinPoint) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return;
        }

        HttpServletRequest request = attributes.getRequest();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        AuditLog auditLog = new AuditLog();
        auditLog.setActor(authentication == null ? null : authentication.getName());
        auditLog.setActorRole(authentication == null
                ? null
                : authentication.getAuthorities().stream()
                .map(grantedAuthority -> grantedAuthority.getAuthority())
                .sorted()
                .collect(Collectors.joining(",")));
        auditLog.setAction(joinPoint.getSignature().getName());
        auditLog.setRequestMethod(request.getMethod());
        auditLog.setRequestPath(request.getRequestURI());
        auditLog.setIpAddress(resolveClientIp(request));
        auditLog.setEntityType("admin");
        auditLog.setPayload(serializeArgs(joinPoint.getArgs()));
        auditLogService.save(auditLog);
    }

    private String serializeArgs(Object[] args) {
        try {
            return objectMapper.writeValueAsString(Arrays.asList(args));
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
