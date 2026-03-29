package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.service.support.OrderCodeSupport;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class OrderCodeSupportTests {

    @Test
    void buildProducesCanonicalFourSegmentOrderCode() {
        String orderCode = OrderCodeSupport.build(42L, Instant.ofEpochMilli(1_743_206_400_123L), 654321);

        assertThat(orderCode).isEqualTo("SCS-42-1743206400123-654321");
        assertThat(OrderCodeSupport.isCanonical(orderCode)).isTrue();
    }

    @Test
    void extractFirstPrefersCanonicalCodeButKeepsLegacyFallback() {
        assertThat(OrderCodeSupport.extractFirst(
                "legacy SCS-42-2026",
                "canonical SCS-42-1743206400123-654321"
        )).isEqualTo("SCS-42-1743206400123-654321");

        assertThat(OrderCodeSupport.extractFirst(
                "legacy SCS-42-2026",
                "still legacy SCS-99-3030"
        )).isEqualTo("SCS-42-2026");
    }
}
