package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.dto.admin.AdminUpdateFinancialSettlementRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.FinancialSettlement;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.FinancialSettlementRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.service.AdminFinancialService;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class FinancialSettlementResolutionDashboardStateTests {

    @Autowired
    private AdminFinancialService adminFinancialService;

    @Autowired
    private FinancialSettlementRepository financialSettlementRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @BeforeEach
    void setUp() {
        financialSettlementRepository.deleteAll();
        orderRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void resolvingStaleReviewSettlementClearsDashboardReviewFlags() {
        Dealer dealer = dealerRepository.save(createDealer());
        Order order = orderRepository.save(createOrder(dealer));

        FinancialSettlement settlement = new FinancialSettlement();
        settlement.setOrder(order);
        settlement.setType(FinancialSettlementType.STALE_ORDER_REVIEW);
        settlement.setAmount(BigDecimal.valueOf(150_000));
        settlement.setStatus(FinancialSettlementStatus.PENDING);
        settlement.setCreatedBy("system");
        FinancialSettlement savedSettlement = financialSettlementRepository.save(settlement);

        adminFinancialService.resolveFinancialSettlement(
                savedSettlement.getId(),
                new AdminUpdateFinancialSettlementRequest(
                        FinancialSettlementStatus.CREDITED,
                        "Reviewed and accepted"
                ),
                "finance.admin@example.com"
        );

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        FinancialSettlement updatedSettlement = financialSettlementRepository.findById(savedSettlement.getId()).orElseThrow();

        assertThat(updatedSettlement.getStatus()).isEqualTo(FinancialSettlementStatus.CREDITED);
        assertThat(updatedOrder.getStaleReviewRequired()).isFalse();
        assertThat(updatedOrder.getFinancialSettlementRequired()).isFalse();
        assertThat(financialSettlementRepository.countByStatus(FinancialSettlementStatus.PENDING)).isZero();
    }

    private Dealer createDealer() {
        Dealer dealer = new Dealer();
        dealer.setUsername("dashboard-review-dealer@example.com");
        dealer.setEmail("dashboard-review-dealer@example.com");
        dealer.setBusinessName("Dashboard Review Dealer");
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        return dealer;
    }

    private Order createOrder(Dealer dealer) {
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode("DASH-SETTLEMENT-001");
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaidAmount(BigDecimal.valueOf(150_000));
        order.setFinancialSettlementRequired(Boolean.TRUE);
        order.setStaleReviewRequired(Boolean.TRUE);
        order.setIsDeleted(false);
        order.setCreatedAt(Instant.now().minusSeconds(86_400));
        return order;
    }
}
