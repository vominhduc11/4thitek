package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.OrderStatus;
import java.time.Instant;

public final class OrderAlertSupport {

    private OrderAlertSupport() {
    }

    public static boolean isShippingOverdue(Order order, long confirmedShippingAlertHours) {
        return isShippingOverdue(order, confirmedShippingAlertHours, Instant.now());
    }

    static boolean isShippingOverdue(Order order, long confirmedShippingAlertHours, Instant now) {
        if (order == null || now == null || confirmedShippingAlertHours <= 0) {
            return false;
        }
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            return false;
        }
        Instant confirmedAt = resolveConfirmedAt(order);
        if (confirmedAt == null) {
            return false;
        }
        return confirmedAt.plusSeconds(confirmedShippingAlertHours * 3600L).isBefore(now);
    }

    public static Instant resolveConfirmedAt(Order order) {
        if (order == null) {
            return null;
        }
        if (order.getConfirmedAt() != null) {
            return order.getConfirmedAt();
        }
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            if (order.getUpdatedAt() != null) {
                return order.getUpdatedAt();
            }
            return order.getCreatedAt();
        }
        return null;
    }
}
