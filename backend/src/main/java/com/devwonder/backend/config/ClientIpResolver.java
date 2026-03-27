package com.devwonder.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ClientIpResolver {

    private final boolean trustRateLimitForwardedFor;
    private final boolean trustAuditForwardedFor;

    public ClientIpResolver(
            @Value("${app.rate-limit.trust-forwarded-for:false}") boolean trustRateLimitForwardedFor,
            @Value("${app.audit.trust-forwarded-for:false}") boolean trustAuditForwardedFor
    ) {
        this.trustRateLimitForwardedFor = trustRateLimitForwardedFor;
        this.trustAuditForwardedFor = trustAuditForwardedFor;
    }

    public String resolveForRateLimit(HttpServletRequest request) {
        return resolve(request, trustRateLimitForwardedFor);
    }

    public String resolveForAudit(HttpServletRequest request) {
        return resolve(request, trustAuditForwardedFor);
    }

    private String resolve(HttpServletRequest request, boolean trustForwardedFor) {
        if (request == null) {
            return null;
        }
        if (trustForwardedFor) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                String forwardedClient = forwarded.split(",")[0].trim();
                if (!forwardedClient.isBlank()) {
                    return forwardedClient;
                }
            }
        }
        return request.getRemoteAddr();
    }
}
