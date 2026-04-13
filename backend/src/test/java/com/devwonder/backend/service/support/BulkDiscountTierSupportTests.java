package com.devwonder.backend.service.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.exception.ConflictException;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class BulkDiscountTierSupportTests {

    @Test
    void quantitiesMatchInclusiveTierBoundariesDeterministically() {
        List<BulkDiscount> rules = List.of(
                rule(1, 10, 10, DiscountRuleStatus.ACTIVE),
                rule(11, 20, 20, DiscountRuleStatus.ACTIVE),
                rule(21, 50, 30, DiscountRuleStatus.ACTIVE),
                rule(51, null, 40, DiscountRuleStatus.ACTIVE)
        );

        assertThat(BulkDiscountTierSupport.findMatchingActiveRule(1, rules)).get()
                .extracting(BulkDiscount::getDiscountPercent)
                .isEqualTo(BigDecimal.valueOf(10));
        assertThat(BulkDiscountTierSupport.findMatchingActiveRule(10, rules)).get()
                .extracting(BulkDiscount::getDiscountPercent)
                .isEqualTo(BigDecimal.valueOf(10));
        assertThat(BulkDiscountTierSupport.findMatchingActiveRule(11, rules)).get()
                .extracting(BulkDiscount::getDiscountPercent)
                .isEqualTo(BigDecimal.valueOf(20));
        assertThat(BulkDiscountTierSupport.findMatchingActiveRule(20, rules)).get()
                .extracting(BulkDiscount::getDiscountPercent)
                .isEqualTo(BigDecimal.valueOf(20));
        assertThat(BulkDiscountTierSupport.findMatchingActiveRule(21, rules)).get()
                .extracting(BulkDiscount::getDiscountPercent)
                .isEqualTo(BigDecimal.valueOf(30));
        assertThat(BulkDiscountTierSupport.findMatchingActiveRule(51, rules)).get()
                .extracting(BulkDiscount::getDiscountPercent)
                .isEqualTo(BigDecimal.valueOf(40));
    }

    @Test
    void rangeLabelsAreGeneratedFromCanonicalBoundaries() {
        assertThat(BulkDiscountTierSupport.buildRangeLabel(1, 10)).isEqualTo("1 - 10");
        assertThat(BulkDiscountTierSupport.buildRangeLabel(51, null)).isEqualTo("51+");
    }

    @Test
    void activeOverlapAtBoundaryIsRejected() {
        List<BulkDiscount> rules = List.of(
                rule(1, 10, 10, DiscountRuleStatus.ACTIVE),
                rule(10, 20, 20, DiscountRuleStatus.ACTIVE)
        );

        assertThatThrownBy(() -> BulkDiscountTierSupport.assertNoActiveOverlap(rules))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("overlap");
    }

    @Test
    void multipleActiveOpenEndedRulesAreRejected() {
        List<BulkDiscount> rules = List.of(
                rule(21, null, 30, DiscountRuleStatus.ACTIVE),
                rule(51, null, 40, DiscountRuleStatus.ACTIVE)
        );

        assertThatThrownBy(() -> BulkDiscountTierSupport.assertNoActiveOverlap(rules))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("open-ended");
    }

    private static BulkDiscount rule(int fromQuantity, Integer toQuantity, int percent, DiscountRuleStatus status) {
        BulkDiscount rule = new BulkDiscount();
        rule.setFromQuantity(fromQuantity);
        rule.setToQuantity(toQuantity);
        rule.setDiscountPercent(BigDecimal.valueOf(percent));
        rule.setStatus(status);
        return rule;
    }
}
