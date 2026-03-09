package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.DealerPortalService;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class OrderWorkflowLogicTests {

    @Autowired
    private AdminManagementService adminManagementService;

    @Autowired
    private DealerPortalService dealerPortalService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        orderRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void adminCannotSkipPendingStraightToCompleted() {
        Dealer dealer = dealerRepository.save(createDealer("admin-flow@example.com"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.PENDING, "WF-ADMIN-1"));

        assertThatThrownBy(() -> adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.COMPLETED)
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("PENDING -> COMPLETED");
    }

    @Test
    void dealerCannotPromotePendingOrderToShipping() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-flow@example.com"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.PENDING, "WF-DEALER-1"));

        assertThatThrownBy(() -> dealerPortalService.updateOrderStatus(
                dealer.getUsername(),
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.SHIPPING)
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("PENDING -> SHIPPING");
    }

    @Test
    void adminCancellationRecomputesPaymentStatus() {
        Dealer dealer = dealerRepository.save(createDealer("admin-cancel@example.com"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.PENDING, "WF-CANCEL-1"));

        var response = adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED)
        );

        assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(orderRepository.findById(order.getId()).orElseThrow().getPaymentStatus())
                .isEqualTo(PaymentStatus.CANCELLED);
    }

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        return dealer;
    }

    private Order createOrder(Dealer dealer, OrderStatus status, String orderCode) {
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode(orderCode);
        order.setStatus(status);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setIsDeleted(false);
        return order;
    }
}
