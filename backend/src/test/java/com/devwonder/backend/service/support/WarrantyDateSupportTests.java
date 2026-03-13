package com.devwonder.backend.service.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class WarrantyDateSupportTests {

    @Test
    void keepsWarrantyActiveThroughTheDisplayedEndDate() {
        Instant warrantyEnd = Instant.parse("2027-03-13T00:00:00Z");

        assertThat(WarrantyDateSupport.isExpired(warrantyEnd, LocalDate.of(2027, 3, 13))).isFalse();
        assertThat(WarrantyDateSupport.isExpired(warrantyEnd, LocalDate.of(2027, 3, 14))).isTrue();
    }

    @Test
    void computesRemainingDaysAgainstTheBusinessDateBoundary() {
        Instant warrantyEnd = Instant.parse("2027-03-13T00:00:00Z");

        assertThat(WarrantyDateSupport.remainingDays(warrantyEnd, LocalDate.of(2027, 3, 12))).isEqualTo(2L);
        assertThat(WarrantyDateSupport.remainingDays(warrantyEnd, LocalDate.of(2027, 3, 13))).isEqualTo(1L);
        assertThat(WarrantyDateSupport.remainingDays(warrantyEnd, LocalDate.of(2027, 3, 14))).isZero();
    }
}
