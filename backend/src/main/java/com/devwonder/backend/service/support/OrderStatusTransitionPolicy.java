package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.exception.BadRequestException;
import java.util.Arrays;
import java.util.List;

/**
 * Order workflow: PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> COMPLETED.
 * <p>
 * Cancellation: a dealer cannot cancel directly. From PENDING/CONFIRMED a dealer raises
 * CANCEL_REQUESTED; an admin then approves (-> CANCELLED) or rejects (-> CANCEL_REJECTED).
 * A rejected request is resumable — the order moves back to the status it held before the
 * request (tracked on {@code Order.cancelRequestedFrom}). Admins may also cancel an active
 * order directly. System jobs may cancel a stale PENDING order directly.
 */
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
        if (current == null || next == null) {
            return false;
        }
        if (current == next) {
            return true;
        }
        return switch (current) {
            case PENDING -> next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED;
            case CONFIRMED -> next == OrderStatus.PROCESSING || next == OrderStatus.CANCELLED;
            case PROCESSING -> next == OrderStatus.SHIPPING || next == OrderStatus.CANCELLED;
            case SHIPPING -> next == OrderStatus.COMPLETED;
            case CANCEL_REQUESTED -> next == OrderStatus.CANCELLED || next == OrderStatus.CANCEL_REJECTED;
            case CANCEL_REJECTED -> next == OrderStatus.PENDING
                    || next == OrderStatus.CONFIRMED
                    || next == OrderStatus.PROCESSING
                    || next == OrderStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    public static boolean isDealerTransitionAllowed(OrderStatus current, OrderStatus next) {
        if (current == null || next == null) {
            return false;
        }
        if (current == next) {
            return true;
        }
        return switch (current) {
            case PENDING, CONFIRMED -> next == OrderStatus.CANCEL_REQUESTED;
            case PROCESSING, SHIPPING, COMPLETED, CANCELLED, CANCEL_REQUESTED, CANCEL_REJECTED -> false;
        };
    }

    public static List<OrderStatus> adminAllowedTransitions(OrderStatus current) {
        return allowedAdminTransitions(current);
    }

    public static List<OrderStatus> allowedAdminTransitions(OrderStatus current) {
        if (current == null) {
            return List.of();
        }
        return Arrays.stream(OrderStatus.values())
                .filter(next -> isAdminTransitionAllowed(current, next))
                .toList();
    }

    public static List<OrderStatus> dealerAllowedTransitions(OrderStatus current) {
        return allowedDealerTransitions(current);
    }

    public static List<OrderStatus> allowedDealerTransitions(OrderStatus current) {
        if (current == null) {
            return List.of();
        }
        return Arrays.stream(OrderStatus.values())
                .filter(next -> isDealerTransitionAllowed(current, next))
                .toList();
    }

    private static String buildMessage(OrderStatus current, OrderStatus next) {
        return "Unsupported order status transition: " + current + " -> " + next;
    }
}
