package com.devwonder.backend.config;

import com.devwonder.backend.entity.AuditLog;
import com.devwonder.backend.service.AuditLogService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
public class AdminAuditLoggingAspect {

    private static final String ADMIN_PATH_PREFIX = "/api/v1/admin/";
    private static final Set<String> MUTATION_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private static final Set<String> ENTITY_ACTION_SEGMENTS = Set.of("status", "assign-serials", "import");
    private static final String REDACTED_VALUE = "[REDACTED]";

    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;
    private final ClientIpResolver clientIpResolver;

    @Autowired
    public AdminAuditLoggingAspect(
            AuditLogService auditLogService,
            ObjectMapper objectMapper,
            ClientIpResolver clientIpResolver
    ) {
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
        this.clientIpResolver = clientIpResolver;
    }

    public AdminAuditLoggingAspect(
            AuditLogService auditLogService,
            ObjectMapper objectMapper
    ) {
        this(auditLogService, objectMapper, new ClientIpResolver(false, false));
    }

    @AfterReturning("execution(* com.devwonder.backend.controller.Admin*Controller.*(..))")
    public void captureAdminMutation(JoinPoint joinPoint) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return;
        }

        HttpServletRequest request = attributes.getRequest();
        if (!isMutationMethod(request.getMethod())) {
            return;
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String requestPath = request.getRequestURI();

        AuditLog auditLog = new AuditLog();
        auditLog.setActor(authentication == null ? null : authentication.getName());
        auditLog.setActorRole(authentication == null
                ? null
                : authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .sorted()
                .collect(Collectors.joining(",")));
        auditLog.setAction(resolveAction(request.getMethod(), requestPath));
        auditLog.setRequestMethod(request.getMethod());
        auditLog.setRequestPath(requestPath);
        auditLog.setEntityType(resolveEntityType(requestPath));
        auditLog.setEntityId(resolveEntityId(requestPath));
        auditLog.setIpAddress(resolveClientIp(request));
        auditLog.setPayload(serializeArgs(joinPoint.getArgs()));
        auditLogService.save(auditLog);
    }

    private String serializeArgs(Object[] args) {
        try {
            List<Object> sanitizedArgs = Arrays.stream(args == null ? new Object[0] : args)
                    .map(this::sanitizeArgument)
                    .toList();
            JsonNode tree = objectMapper.valueToTree(sanitizedArgs);
            sanitizeNode(tree);
            return objectMapper.writeValueAsString(tree);
        } catch (IllegalArgumentException | JsonProcessingException ex) {
            return null;
        }
    }

    private Object sanitizeArgument(Object arg) {
        if (arg instanceof Authentication authentication) {
            return Map.of(
                    "principal", authentication.getName(),
                    "authorities", authentication.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .sorted()
                            .toList()
            );
        }
        if (arg instanceof MultipartFile file) {
            return Map.of(
                    "name", file.getName(),
                    "originalFilename", file.getOriginalFilename(),
                    "contentType", file.getContentType(),
                    "size", file.getSize()
            );
        }
        return arg;
    }

    private void sanitizeNode(JsonNode node) {
        if (node == null) {
            return;
        }
        if (node instanceof ObjectNode objectNode) {
            List<String> fieldNames = new ArrayList<>();
            objectNode.fieldNames().forEachRemaining(fieldNames::add);
            for (String fieldName : fieldNames) {
                if (isSensitiveField(fieldName)) {
                    objectNode.put(fieldName, REDACTED_VALUE);
                    continue;
                }
                sanitizeNode(objectNode.get(fieldName));
            }
            return;
        }
        if (node instanceof ArrayNode arrayNode) {
            for (JsonNode child : arrayNode) {
                sanitizeNode(child);
            }
        }
    }

    private boolean isSensitiveField(String fieldName) {
        if (fieldName == null || fieldName.isBlank()) {
            return false;
        }
        String normalized = fieldName.trim().toLowerCase(Locale.ROOT);
        return normalized.contains("password")
                || normalized.endsWith("token")
                || normalized.contains("secret")
                || normalized.contains("apikey")
                || normalized.contains("accesskey")
                || normalized.contains("checksum");
    }

    private boolean isMutationMethod(String method) {
        return method != null && MUTATION_METHODS.contains(method.toUpperCase(Locale.ROOT));
    }

    private String resolveAction(String method, String path) {
        String normalizedMethod = method == null ? "" : method.toUpperCase(Locale.ROOT);
        String normalizedPath = normalizeAdminPath(path);
        if ("password".equals(normalizedPath)) {
            return "changePassword";
        }
        if ("POST".equals(normalizedMethod) && "notifications".equals(normalizedPath)) {
            return "createNotification";
        }
        if (normalizedPath != null && (normalizedPath.endsWith("/import") || "import".equals(normalizedPath))) {
            return "import";
        }
        return switch (normalizedMethod) {
            case "POST" -> "create";
            case "PUT", "PATCH" -> "update";
            case "DELETE" -> "delete";
            default -> null;
        };
    }

    private String resolveEntityType(String path) {
        String normalizedPath = normalizeAdminPath(path);
        if (normalizedPath == null || normalizedPath.isBlank()) {
            return "admin";
        }

        List<String> segments = Arrays.stream(normalizedPath.split("/"))
                .filter(segment -> segment != null && !segment.isBlank())
                .filter(segment -> !isNumeric(segment))
                .collect(Collectors.toCollection(ArrayList::new));
        while (!segments.isEmpty() && ENTITY_ACTION_SEGMENTS.contains(segments.get(segments.size() - 1))) {
            segments.remove(segments.size() - 1);
        }
        if (segments.isEmpty()) {
            return "admin";
        }
        return String.join("/", segments);
    }

    private String resolveEntityId(String path) {
        String normalizedPath = normalizeAdminPath(path);
        if (normalizedPath == null || normalizedPath.isBlank()) {
            return null;
        }
        return Arrays.stream(normalizedPath.split("/"))
                .filter(this::isNumeric)
                .findFirst()
                .orElse(null);
    }

    private String normalizeAdminPath(String path) {
        if (path == null || path.isBlank()) {
            return null;
        }
        String normalizedPath = path.trim();
        if (normalizedPath.startsWith(ADMIN_PATH_PREFIX)) {
            return normalizedPath.substring(ADMIN_PATH_PREFIX.length());
        }
        if ("/api/v1/admin".equals(normalizedPath)) {
            return "";
        }
        return normalizedPath.startsWith("/") ? normalizedPath.substring(1) : normalizedPath;
    }

    private boolean isNumeric(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        for (int index = 0; index < value.length(); index++) {
            if (!Character.isDigit(value.charAt(index))) {
                return false;
            }
        }
        return true;
    }

    private String resolveClientIp(HttpServletRequest request) {
        return clientIpResolver.resolveForAudit(request);
    }
}
