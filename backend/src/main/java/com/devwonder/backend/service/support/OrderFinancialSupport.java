package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.OrderStatus;
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

    private static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
