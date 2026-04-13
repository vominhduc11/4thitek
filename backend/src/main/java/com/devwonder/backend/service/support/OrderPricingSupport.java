package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public final class OrderPricingSupport {

    public static final int DEFAULT_VAT_PERCENT_FALLBACK = 10;

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

    public static int computeDiscountPercent(Order order, List<BulkDiscount> rules, int vatPercent) {
        return computePricing(order, rules, vatPercent).discountPercent();
    }

    public static BigDecimal computeDiscountAmount(BigDecimal subtotal, int discountPercent) {
        if (discountPercent <= 0 || subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return subtotal.multiply(BigDecimal.valueOf(discountPercent))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
    }

    public static BigDecimal computeVatAmount(BigDecimal totalAfterDiscount) {
        return computeVatAmount(totalAfterDiscount, DEFAULT_VAT_PERCENT_FALLBACK);
    }
    public static BigDecimal computeVatAmount(BigDecimal totalAfterDiscount, int vatPercent) {
        if (totalAfterDiscount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        int normalizedVatPercent = normalizeVatPercent(vatPercent);
        return totalAfterDiscount.multiply(BigDecimal.valueOf(normalizedVatPercent))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
    }

    public static BigDecimal computeTotalAmount(Order order, List<BulkDiscount> rules) {
        return computeTotalAmount(order, rules, DEFAULT_VAT_PERCENT_FALLBACK);
    }

    public static BigDecimal computeTotalAmount(Order order, List<BulkDiscount> rules, int vatPercent) {
        return computePricing(order, rules, vatPercent).totalAmount();
    }

    public static PaymentStatus resolvePaymentStatus(Order order, List<BulkDiscount> rules) {
        return resolvePaymentStatus(order, rules, DEFAULT_VAT_PERCENT_FALLBACK);
    }

    public static PaymentStatus resolvePaymentStatus(Order order, List<BulkDiscount> rules, int vatPercent) {
        // Aggregate order.paymentStatus is derived from order state + paidAmount.
        // FAILED is kept only for legacy compatibility and is intentionally not
        // emitted from this aggregate resolver.
        BigDecimal paidAmount = zeroIfNull(order == null ? null : order.getPaidAmount());
        if (order != null && order.getStatus() == OrderStatus.CANCELLED && paidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentStatus.CANCELLED;
        }
        BigDecimal totalAmount = computePricing(order, rules, vatPercent).totalAmount();
        if (paidAmount.compareTo(totalAmount) >= 0 && totalAmount.compareTo(BigDecimal.ZERO) > 0) {
            return PaymentStatus.PAID;
        }
        return PaymentStatus.PENDING;
    }

    public static PricingBreakdown computePricing(Order order, List<BulkDiscount> rules) {
        return computePricing(order, rules, DEFAULT_VAT_PERCENT_FALLBACK);
    }

    public static PricingBreakdown computePricing(Order order, List<BulkDiscount> rules, int vatPercent) {
        int normalizedVatPercent = normalizeVatPercent(vatPercent);
        BigDecimal subtotal = computeSubtotal(order);
        if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            BigDecimal totalAmount = BigDecimal.valueOf(safeShippingFee(order == null ? null : order.getShippingFee()));
            return new PricingBreakdown(BigDecimal.ZERO, 0, BigDecimal.ZERO, normalizedVatPercent, BigDecimal.ZERO, totalAmount);
        }

        int totalItems = computeTotalQuantity(order);
        BulkDiscount matchedRule = BulkDiscountTierSupport.findMatchingActiveRule(totalItems, safeRules(rules)).orElse(null);
        int effectiveDiscountPercent = matchedRule == null
                ? 0
                : BulkDiscountTierSupport.normalizePercent(matchedRule.getDiscountPercent());
        BigDecimal discountAmount = computeDiscountAmount(subtotal, effectiveDiscountPercent);
        BigDecimal totalAfterDiscount = subtotal.subtract(discountAmount);
        BigDecimal vatAmount = computeVatAmount(totalAfterDiscount, normalizedVatPercent);
        BigDecimal totalAmount = totalAfterDiscount
                .add(vatAmount)
                .add(BigDecimal.valueOf(safeShippingFee(order == null ? null : order.getShippingFee())));
        return new PricingBreakdown(subtotal, effectiveDiscountPercent, discountAmount, normalizedVatPercent, vatAmount, totalAmount);
    }

    public static int normalizeVatPercent(Integer vatPercent) {
        if (vatPercent == null) {
            return DEFAULT_VAT_PERCENT_FALLBACK;
        }
        return Math.max(0, Math.min(100, vatPercent));
    }

    private static int computeTotalQuantity(Order order) {
        int totalItems = 0;
        if (order != null && order.getOrderItems() != null) {
            for (var item : order.getOrderItems()) {
                if (item == null) {
                    continue;
                }
                int quantity = safeQuantity(item.getQuantity());
                totalItems += quantity;
            }
        }
        return totalItems;
    }

    private static List<BulkDiscount> safeRules(List<BulkDiscount> rules) {
        return rules == null ? List.of() : rules;
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

    private static int safeQuantity(Integer quantity) {
        return quantity == null ? 0 : Math.max(0, quantity);
    }

    public record PricingBreakdown(
            BigDecimal subtotal,
            int discountPercent,
            BigDecimal discountAmount,
            int vatPercent,
            BigDecimal vatAmount,
            BigDecimal totalAmount
    ) {
    }
}
