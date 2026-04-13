package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.exception.ConflictException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

public final class BulkDiscountTierSupport {

    private BulkDiscountTierSupport() {
    }

    public static String buildRangeLabel(Integer fromQuantity, Integer toQuantity) {
        if (fromQuantity == null || fromQuantity < 1) {
            return "";
        }
        if (toQuantity == null) {
            return fromQuantity + "+";
        }
        return fromQuantity + " - " + toQuantity;
    }

    public static String buildRangeLabel(BulkDiscount rule) {
        if (rule == null) {
            return "";
        }
        return buildRangeLabel(rule.getFromQuantity(), rule.getToQuantity());
    }

    public static boolean matchesQuantity(BulkDiscount rule, int quantity) {
        if (rule == null || quantity <= 0) {
            return false;
        }
        Integer fromQuantity = sanitizeFromQuantity(rule.getFromQuantity());
        Integer toQuantity = sanitizeToQuantity(rule.getToQuantity());
        if (fromQuantity == null) {
            return false;
        }
        if (quantity < fromQuantity) {
            return false;
        }
        return toQuantity == null || quantity <= toQuantity;
    }

    public static Optional<BulkDiscount> findMatchingActiveRule(int quantity, List<BulkDiscount> rules) {
        if (quantity <= 0 || rules == null || rules.isEmpty()) {
            return Optional.empty();
        }
        return sortedActiveRules(rules).stream()
                .filter(rule -> matchesQuantity(rule, quantity))
                .findFirst();
    }

    public static void assertNoActiveOverlap(List<BulkDiscount> rules) {
        List<BulkDiscount> activeRules = sortedActiveRules(rules);
        BulkDiscount previous = null;
        for (BulkDiscount current : activeRules) {
            Integer currentFrom = sanitizeFromQuantity(current.getFromQuantity());
            Integer currentTo = sanitizeToQuantity(current.getToQuantity());
            if (currentFrom == null) {
                continue;
            }
            if (previous != null) {
                Integer previousFrom = sanitizeFromQuantity(previous.getFromQuantity());
                Integer previousTo = sanitizeToQuantity(previous.getToQuantity());
                if (previousFrom != null) {
                    if (previousTo == null) {
                        throw new ConflictException("Active discount tier " + buildRangeLabel(previous)
                                + " is open-ended and blocks additional active tiers");
                    }
                    if (currentFrom <= previousTo) {
                        throw new ConflictException("Active discount tiers overlap at boundary between "
                                + buildRangeLabel(previous) + " and " + buildRangeLabel(current));
                    }
                }
            }
            if (currentTo == null && activeRules.stream().anyMatch(rule ->
                    !Objects.equals(rule.getId(), current.getId())
                            && sanitizeFromQuantity(rule.getFromQuantity()) != null
                            && sanitizeFromQuantity(rule.getFromQuantity()) > currentFrom)) {
                throw new ConflictException("Only one active open-ended discount tier is allowed");
            }
            previous = current;
        }
    }

    public static int normalizePercent(BigDecimal percent) {
        if (percent == null) {
            return 0;
        }
        int value = percent.setScale(0, RoundingMode.HALF_UP).intValue();
        return Math.max(0, Math.min(100, value));
    }

    public static List<BulkDiscount> sortedActiveRules(List<BulkDiscount> rules) {
        if (rules == null || rules.isEmpty()) {
            return List.of();
        }
        return rules.stream()
                .filter(rule -> rule != null && rule.getStatus() == DiscountRuleStatus.ACTIVE)
                .sorted(ruleSortOrder())
                .toList();
    }

    public static Comparator<BulkDiscount> ruleSortOrder() {
        return Comparator
                .comparing(
                        (BulkDiscount rule) -> sanitizeFromQuantity(rule.getFromQuantity()),
                        Comparator.nullsLast(Comparator.naturalOrder())
                )
                .thenComparing(
                        (BulkDiscount rule) -> sanitizeToQuantity(rule.getToQuantity()),
                        Comparator.nullsLast(Comparator.naturalOrder())
                )
                .thenComparing(BulkDiscount::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(BulkDiscount::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(BulkDiscount::getId, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private static Integer sanitizeFromQuantity(Integer value) {
        if (value == null || value < 1) {
            return null;
        }
        return value;
    }

    private static Integer sanitizeToQuantity(Integer value) {
        if (value == null || value < 1) {
            return null;
        }
        return value;
    }
}
