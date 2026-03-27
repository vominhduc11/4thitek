package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.config.ClientIpResolver;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientIpResolverTests {

    @Test
    void trustedAuditAndRateLimitUseTheSameForwardedClientExtraction() {
        ClientIpResolver resolver = new ClientIpResolver(true, true);
        MockHttpServletRequest request = request("10.0.0.50", "203.0.113.8, 10.0.0.1");

        assertThat(resolver.resolveForRateLimit(request)).isEqualTo("203.0.113.8");
        assertThat(resolver.resolveForAudit(request)).isEqualTo("203.0.113.8");
    }

    @Test
    void untrustedAuditAndRateLimitFallBackToRemoteAddress() {
        ClientIpResolver resolver = new ClientIpResolver(false, false);
        MockHttpServletRequest request = request("10.0.0.50", "203.0.113.8, 10.0.0.1");

        assertThat(resolver.resolveForRateLimit(request)).isEqualTo("10.0.0.50");
        assertThat(resolver.resolveForAudit(request)).isEqualTo("10.0.0.50");
    }

    private MockHttpServletRequest request(String remoteAddr, String forwardedFor) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(remoteAddr);
        request.addHeader("X-Forwarded-For", forwardedFor);
        return request;
    }
}
