package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.exception.BadRequestException;
import java.util.Arrays;
import java.util.List;

public final class DealerAccountStatusTransitionPolicy {

    private DealerAccountStatusTransitionPolicy() {
    }

    public static void assertTransitionAllowed(CustomerStatus current, CustomerStatus next) {
        if (!isTransitionAllowed(current, next)) {
            throw new BadRequestException("Unsupported dealer account status transition: " + current + " -> " + next);
        }
    }

    public static boolean isTransitionAllowed(CustomerStatus current, CustomerStatus next) {
        if (next == null) {
            return false;
        }
        CustomerStatus normalizedCurrent = current == null ? CustomerStatus.ACTIVE : current;
        if (normalizedCurrent == next) {
            return true;
        }
        return switch (normalizedCurrent) {
            case UNDER_REVIEW -> next == CustomerStatus.ACTIVE || next == CustomerStatus.SUSPENDED;
            case ACTIVE -> next == CustomerStatus.SUSPENDED;
            case SUSPENDED -> next == CustomerStatus.ACTIVE;
        };
    }

    public static List<CustomerStatus> allowedTransitions(CustomerStatus current) {
        CustomerStatus normalizedCurrent = current == null ? CustomerStatus.ACTIVE : current;
        return Arrays.stream(CustomerStatus.values())
                .filter(next -> isTransitionAllowed(normalizedCurrent, next))
                .toList();
    }
}
