package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.exception.BadRequestException;

public final class OrderStatusTransitionPolicy {

    private OrderStatusTransitionPolicy() {
    }

    public static void assertAdminTransitionAllowed(OrderStatus current, OrderStatus next) {
        if (!isAdminTransitionAllowed(current, next)) {
            throw new BadRequestException(buildMessage(current, next));
        }
    }

    public static void assertDealerTransitionAllowed(OrderStatus current, OrderStatus next) {
        if (!isDealerTransitionAllowed(current, next)) {
            throw new BadRequestException(buildMessage(current, next));
        }
    }

    public static boolean isAdminTransitionAllowed(OrderStatus current, OrderStatus next) {
        return isTransitionAllowed(current, next);
    }

    public static boolean isDealerTransitionAllowed(OrderStatus current, OrderStatus next) {
        if (current == null || next == null) {
            return false;
        }
        if (current == next) {
            return true;
        }
        return switch (current) {
            case PENDING, CONFIRMED -> next == OrderStatus.CANCELLED;
            case SHIPPING -> false;
            case COMPLETED, CANCELLED -> false;
        };
    }

    private static boolean isTransitionAllowed(OrderStatus current, OrderStatus next) {
        if (current == null || next == null) {
            return false;
        }
        if (current == next) {
            return true;
        }
        return switch (current) {
            case PENDING -> next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED;
            case CONFIRMED -> next == OrderStatus.SHIPPING || next == OrderStatus.CANCELLED;
            case SHIPPING -> next == OrderStatus.COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    private static String buildMessage(OrderStatus current, OrderStatus next) {
        return "Unsupported order status transition: " + current + " -> " + next;
    }
}
