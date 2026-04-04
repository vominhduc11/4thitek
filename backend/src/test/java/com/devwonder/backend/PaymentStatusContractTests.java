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

        Order debtOrder = new Order();
        debtOrder.setStatus(OrderStatus.PENDING);
        debtOrder.setPaymentMethod(PaymentMethod.DEBT);
        debtOrder.setPaidAmount(BigDecimal.ZERO);
        debtOrder.setShippingFee(100_000);

        Order completedDebtOrder = new Order();
        completedDebtOrder.setStatus(OrderStatus.COMPLETED);
        completedDebtOrder.setPaymentMethod(PaymentMethod.DEBT);
        completedDebtOrder.setPaidAmount(BigDecimal.ZERO);
        completedDebtOrder.setShippingFee(100_000);

        Order cancelledOrder = new Order();
        cancelledOrder.setStatus(OrderStatus.CANCELLED);
        cancelledOrder.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        cancelledOrder.setPaidAmount(BigDecimal.ZERO);

        assertThat(OrderPricingSupport.resolvePaymentStatus(pendingBankTransfer, List.of()))
                .isEqualTo(PaymentStatus.PENDING)
                .isNotEqualTo(PaymentStatus.FAILED);
        assertThat(OrderPricingSupport.resolvePaymentStatus(debtOrder, List.of()))
                .isEqualTo(PaymentStatus.PENDING)
                .isNotEqualTo(PaymentStatus.FAILED);
        assertThat(OrderPricingSupport.resolvePaymentStatus(completedDebtOrder, List.of()))
                .isEqualTo(PaymentStatus.DEBT_RECORDED)
                .isNotEqualTo(PaymentStatus.FAILED);
        assertThat(OrderPricingSupport.resolvePaymentStatus(cancelledOrder, List.of()))
                .isEqualTo(PaymentStatus.CANCELLED)
                .isNotEqualTo(PaymentStatus.FAILED);
    }
}
