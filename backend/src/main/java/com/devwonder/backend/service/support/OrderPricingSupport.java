package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;

public final class OrderPricingSupport {

    private static final int VAT_PERCENT = 10;

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

    public static int computeDiscountPercent(Order order) {
        if (order == null || order.getOrderItems() == null) {
            return 0;
        }
        int totalItems = order.getOrderItems().stream()
                .mapToInt(item -> item.getQuantity() == null ? 0 : item.getQuantity())
                .sum();
        if (totalItems >= 20) {
            return 20;
        }
        if (totalItems >= 10) {
            return 10;
        }
        return 0;
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

    public static BigDecimal computeTotalAmount(Order order) {
        BigDecimal subtotal = computeSubtotal(order);
        BigDecimal discountAmount = computeDiscountAmount(subtotal, computeDiscountPercent(order));
        return subtotal.subtract(discountAmount)
                .add(computeVatAmount(subtotal.subtract(discountAmount)))
                .add(BigDecimal.valueOf(safeShippingFee(order == null ? null : order.getShippingFee())));
    }

    public static PaymentStatus resolvePaymentStatus(Order order) {
        BigDecimal paidAmount = zeroIfNull(order == null ? null : order.getPaidAmount());
        if (order != null && order.getStatus() == OrderStatus.CANCELLED && paidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentStatus.CANCELLED;
        }
        BigDecimal totalAmount = computeTotalAmount(order);
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

    private static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static int safeShippingFee(Integer shippingFee) {
        if (shippingFee == null) {
            return 0;
        }
        return Math.max(0, shippingFee);
    }
}
