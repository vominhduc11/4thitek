package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.PaymentMethod;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

public final class DealerOrderSupport {

    private DealerOrderSupport() {
    }

    public static PaymentMethod defaultPaymentMethod(Order order) {
        return order == null || order.getPaymentMethod() == null
                ? PaymentMethod.BANK_TRANSFER
                : order.getPaymentMethod();
    }

    public static BigDecimal resolveUnitPrice(BigDecimal requestedPrice, Product product) {
        if (requestedPrice != null && requestedPrice.compareTo(BigDecimal.ZERO) > 0) {
            return requestedPrice.setScale(0, RoundingMode.HALF_UP);
        }
        if (product != null && product.getRetailPrice() != null) {
            return product.getRetailPrice().setScale(0, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    public static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    public static int safeShippingFee(Integer shippingFee) {
        if (shippingFee == null) {
            return 0;
        }
        return Math.max(0, shippingFee);
    }

    public static String buildOrderCode(Long dealerId) {
        return "SCS-" + dealerId + "-" + Instant.now().toEpochMilli()
                + "-" + ThreadLocalRandom.current().nextInt(100000, 1_000_000);
    }
}
