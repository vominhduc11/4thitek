package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class OrderPricingSupport {

    private static final int VAT_PERCENT = 10;
    private static final Pattern RANGE_NUMBER_PATTERN = Pattern.compile("(\\d+)");

    private OrderPricingSupport() {
    }

    public static BigDecimal computeSubtotal(Order order) {
        if (order == null || order.getOrderItems() == null) {
            return BigDecimal.ZERO;
        }
        return order.getOrderItems().stream()
                .map(item -> zeroIfNull(item.getUnitPrice())
                        .multiply(BigDecimal.valueOf(item.getQuantity() == null ? 0 : item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public static int computeDiscountPercent(Order order, List<BulkDiscount> rules) {
        if (order == null || order.getOrderItems() == null) {
            return 0;
        }
        int totalItems = order.getOrderItems().stream()
                .mapToInt(item -> item.getQuantity() == null ? 0 : item.getQuantity())
                .sum();
        if (totalItems <= 0) {
            return 0;
        }
        return safeRules(rules).stream()
                .filter(rule -> matchesOrder(rule, order, totalItems))
                .sorted(ruleComparator())
                .map(BulkDiscount::getDiscountPercent)
                .filter(percent -> percent != null && percent.compareTo(BigDecimal.ZERO) > 0)
                .mapToInt(OrderPricingSupport::normalizePercent)
                .findFirst()
                .orElse(0);
    }

    public static BigDecimal computeDiscountAmount(BigDecimal subtotal, int discountPercent) {
        if (discountPercent <= 0 || subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return subtotal.multiply(BigDecimal.valueOf(discountPercent))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
    }

    public static BigDecimal computeVatAmount(BigDecimal totalAfterDiscount) {
        if (totalAfterDiscount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return totalAfterDiscount.multiply(BigDecimal.valueOf(VAT_PERCENT))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
    }

    public static BigDecimal computeTotalAmount(Order order, List<BulkDiscount> rules) {
        BigDecimal subtotal = computeSubtotal(order);
        BigDecimal discountAmount = computeDiscountAmount(subtotal, computeDiscountPercent(order, rules));
        return subtotal.subtract(discountAmount)
                .add(computeVatAmount(subtotal.subtract(discountAmount)))
                .add(BigDecimal.valueOf(safeShippingFee(order == null ? null : order.getShippingFee())));
    }

    public static PaymentStatus resolvePaymentStatus(Order order, List<BulkDiscount> rules) {
        BigDecimal paidAmount = zeroIfNull(order == null ? null : order.getPaidAmount());
        if (order != null && order.getStatus() == OrderStatus.CANCELLED && paidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentStatus.CANCELLED;
        }
        BigDecimal totalAmount = computeTotalAmount(order, rules);
        if (paidAmount.compareTo(totalAmount) >= 0 && totalAmount.compareTo(BigDecimal.ZERO) > 0) {
            return PaymentStatus.PAID;
        }
        if (defaultPaymentMethod(order) == PaymentMethod.DEBT) {
            return PaymentStatus.DEBT_RECORDED;
        }
        return PaymentStatus.PENDING;
    }

    private static PaymentMethod defaultPaymentMethod(Order order) {
        return order == null || order.getPaymentMethod() == null
                ? PaymentMethod.BANK_TRANSFER
                : order.getPaymentMethod();
    }

    private static boolean matchesOrder(BulkDiscount rule, Order order, int totalItems) {
        if (rule == null || totalItems <= 0) {
            return false;
        }
        QuantityRange range = resolveRange(rule);
        if (range == null || !range.matches(totalItems)) {
            return false;
        }

        Long ruleProductId = rule.getProduct() == null ? null : rule.getProduct().getId();
        if (ruleProductId == null) {
            return true;
        }

        Set<Long> orderProductIds = orderedProductIds(order);
        return orderProductIds.size() == 1 && orderProductIds.contains(ruleProductId);
    }

    private static Set<Long> orderedProductIds(Order order) {
        Set<Long> productIds = new LinkedHashSet<>();
        if (order == null || order.getOrderItems() == null) {
            return productIds;
        }
        for (OrderItem item : order.getOrderItems()) {
            if (item == null || item.getProduct() == null || item.getProduct().getId() == null) {
                continue;
            }
            productIds.add(item.getProduct().getId());
        }
        return productIds;
    }

    private static QuantityRange resolveRange(BulkDiscount rule) {
        Integer min = sanitizeQuantity(rule.getMinQuantity());
        Integer max = sanitizeQuantity(rule.getMaxQuantity());
        if (min != null || max != null) {
            return QuantityRange.of(min, max);
        }
        return parseRange(rule.getRangeLabel());
    }

    public static QuantityRange parseRange(String rawRange) {
        if (rawRange == null) {
            return null;
        }
        String normalized = normalizeRange(rawRange);
        if (normalized.isEmpty()) {
            return null;
        }

        List<Integer> numbers = extractNumbers(normalized);
        if (numbers.isEmpty()) {
            return null;
        }

        if (numbers.size() >= 2) {
            return QuantityRange.of(numbers.get(0), numbers.get(1));
        }

        int value = numbers.get(0);
        if (normalized.contains("<=") || normalized.startsWith("max")) {
            return QuantityRange.of(null, value);
        }
        if (normalized.contains("<")) {
            return QuantityRange.of(null, Math.max(0, value - 1));
        }
        if (normalized.contains(">")) {
            return QuantityRange.of(value + (normalized.contains(">=") ? 0 : 1), null);
        }
        if (normalized.contains("+")
                || normalized.contains("up")
                || normalized.contains("more")
                || normalized.contains("tro len")) {
            return QuantityRange.of(value, null);
        }
        return QuantityRange.of(value, null);
    }

    private static List<Integer> extractNumbers(String value) {
        List<Integer> numbers = new ArrayList<>();
        Matcher matcher = RANGE_NUMBER_PATTERN.matcher(value);
        while (matcher.find()) {
            numbers.add(Integer.parseInt(matcher.group(1)));
        }
        return numbers;
    }

    private static Comparator<BulkDiscount> ruleComparator() {
        return Comparator
                .comparing(OrderPricingSupport::isProductSpecific)
                .reversed()
                .thenComparing(
                        (BulkDiscount rule) -> {
                            QuantityRange range = resolveRange(rule);
                            return range == null || range.min() == null ? 0 : range.min();
                        },
                        Comparator.reverseOrder()
                )
                .thenComparing(
                        (BulkDiscount rule) -> rule.getDiscountPercent() == null ? BigDecimal.ZERO : rule.getDiscountPercent(),
                        Comparator.reverseOrder()
                )
                .thenComparing(BulkDiscount::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(BulkDiscount::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(BulkDiscount::getId, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private static boolean isProductSpecific(BulkDiscount rule) {
        return rule != null && rule.getProduct() != null && rule.getProduct().getId() != null;
    }

    private static int normalizePercent(BigDecimal percent) {
        int value = percent.setScale(0, RoundingMode.HALF_UP).intValue();
        return Math.max(0, Math.min(100, value));
    }

    private static Integer sanitizeQuantity(Integer value) {
        if (value == null) {
            return null;
        }
        return Math.max(0, value);
    }

    private static List<BulkDiscount> safeRules(List<BulkDiscount> rules) {
        return rules == null ? List.of() : rules;
    }

    private static String normalizeRange(String rawValue) {
        String trimmed = rawValue == null ? "" : rawValue.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        String withoutDiacritics = Normalizer.normalize(trimmed, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return withoutDiacritics.toLowerCase(Locale.ROOT);
    }

    private static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static int safeShippingFee(Integer shippingFee) {
        if (shippingFee == null) {
            return 0;
        }
        return Math.max(0, shippingFee);
    }

    public record QuantityRange(Integer min, Integer max) {
        public static QuantityRange of(Integer min, Integer max) {
            Integer sanitizedMin = min == null ? null : Math.max(0, min);
            Integer sanitizedMax = max == null ? null : Math.max(0, max);
            if (sanitizedMin != null && sanitizedMax != null && sanitizedMin > sanitizedMax) {
                return new QuantityRange(sanitizedMax, sanitizedMin);
            }
            return new QuantityRange(sanitizedMin, sanitizedMax);
        }

        public boolean matches(int quantity) {
            if (quantity < 0) {
                return false;
            }
            if (min != null && quantity < min) {
                return false;
            }
            if (max != null && quantity > max) {
                return false;
            }
            return true;
        }
    }
}
