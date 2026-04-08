package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.service.support.OrderPricingSupport;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class PaymentStatusContractTests {

    @Test
    void aggregateResolverNeverEmitsFailed() {
        Order pendingBankTransfer = new Order();
        pendingBankTransfer.setStatus(OrderStatus.PENDING);
        pendingBankTransfer.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        pendingBankTransfer.setPaidAmount(BigDecimal.ZERO);
        pendingBankTransfer.setShippingFee(100_000);

        Order paidBankTransfer = new Order();
        paidBankTransfer.setStatus(OrderStatus.CONFIRMED);
        paidBankTransfer.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        paidBankTransfer.setPaidAmount(BigDecimal.valueOf(110_000));
        paidBankTransfer.setShippingFee(100_000);

        Order cancelledOrder = new Order();
        cancelledOrder.setStatus(OrderStatus.CANCELLED);
        cancelledOrder.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        cancelledOrder.setPaidAmount(BigDecimal.ZERO);

        assertThat(OrderPricingSupport.resolvePaymentStatus(pendingBankTransfer, List.of()))
                .isEqualTo(PaymentStatus.PENDING)
                .isNotEqualTo(PaymentStatus.FAILED);
        assertThat(OrderPricingSupport.resolvePaymentStatus(paidBankTransfer, List.of()))
                .isEqualTo(PaymentStatus.PAID)
                .isNotEqualTo(PaymentStatus.FAILED);
        assertThat(OrderPricingSupport.resolvePaymentStatus(cancelledOrder, List.of()))
                .isEqualTo(PaymentStatus.CANCELLED)
                .isNotEqualTo(PaymentStatus.FAILED);
    }
}
