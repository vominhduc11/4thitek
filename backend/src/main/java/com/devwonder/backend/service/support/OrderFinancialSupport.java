package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import java.math.BigDecimal;
import java.util.List;

public final class OrderFinancialSupport {

    private OrderFinancialSupport() {
    }

    public static BigDecimal finalOrderAmount(Order order, List<BulkDiscount> rules, int vatPercent) {
        return OrderPricingSupport.computeTotalAmount(order, rules, vatPercent);
    }

    public static BigDecimal totalPaidAmount(Order order) {
        return zeroIfNull(order == null ? null : order.getPaidAmount());
    }

    /**
     * Raw unpaid amount that could still be collected for the order.
     * Cancelled orders no longer expose any payable balance.
     */
    public static BigDecimal paymentDueAmount(Order order, List<BulkDiscount> rules, int vatPercent) {
        if (order == null || order.getStatus() == OrderStatus.CANCELLED) {
            return BigDecimal.ZERO;
        }
        BigDecimal diff = finalOrderAmount(order, rules, vatPercent).subtract(totalPaidAmount(order));
        return diff.compareTo(BigDecimal.ZERO) > 0 ? diff : BigDecimal.ZERO;
    }

    /**
     * Credit limit reservation applies only to debt orders before completion.
     */
    public static BigDecimal reservedCreditAmount(Order order, List<BulkDiscount> rules, int vatPercent) {
        if (!isDebtOrder(order) || order == null || order.getStatus() == OrderStatus.CANCELLED
                || order.getStatus() == OrderStatus.COMPLETED) {
            return BigDecimal.ZERO;
        }
        return paymentDueAmount(order, rules, vatPercent);
    }

    /**
     * Open receivable is recognized only for completed debt orders with unpaid balance.
     * Mandatory formula: open_receivable = final_order_amount - total_paid_amount.
     */
    public static BigDecimal openReceivableAmount(Order order, List<BulkDiscount> rules, int vatPercent) {
        if (!isDebtOrder(order) || order == null || order.getStatus() != OrderStatus.COMPLETED) {
            return BigDecimal.ZERO;
        }
        BigDecimal openReceivable = finalOrderAmount(order, rules, vatPercent).subtract(totalPaidAmount(order));
        return openReceivable.compareTo(BigDecimal.ZERO) > 0 ? openReceivable : BigDecimal.ZERO;
    }

    /**
     * Total credit exposure that consumes the dealer's limit:
     * reserved credit before completion + recognized receivable after completion.
     */
    public static BigDecimal creditExposureAmount(Order order, List<BulkDiscount> rules, int vatPercent) {
        return reservedCreditAmount(order, rules, vatPercent).add(openReceivableAmount(order, rules, vatPercent));
    }

    private static boolean isDebtOrder(Order order) {
        return order != null && DealerOrderSupport.defaultPaymentMethod(order) == PaymentMethod.DEBT;
    }

    private static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
