package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.DealerPortalService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.util.List;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@SpringBootTest(properties = {
        "app.mail.enabled=true",
        "app.mail.from=test@4thitek.local"
})
class AdminOrderNotificationTests {

    @Autowired
    private AdminManagementService adminManagementService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private DealerPortalService dealerPortalService;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @MockBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        orderRepository.deleteAll();
        dealerRepository.deleteAll();
        reset(javaMailSender, messagingTemplate);
        when(javaMailSender.createMimeMessage()).thenReturn(
                new MimeMessage(Session.getInstance(new Properties()))
        );
    }

    @Test
    void updateOrderStatusCreatesOrderNotificationForDealer() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-order@example.com"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.PENDING, "SCS-1-ORDER"));
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaidAmount(BigDecimal.valueOf(100_000));
        order = orderRepository.save(order);

        adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CONFIRMED),
                "test-admin@example.com"
        );

        List<Notify> notifications = notifyRepository.findByAccountIdOrderByCreatedAtDesc(dealer.getId());
        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getType()).isEqualTo(NotifyType.ORDER);
        assertThat(notifications.get(0).getTitle()).contains("xác nhận");
        assertThat(notifications.get(0).getContent()).contains("SCS-1-ORDER");
        assertThat(notifications.get(0).getLink()).isEqualTo("/orders/SCS-1-ORDER");
        verify(javaMailSender).send(any(MimeMessage.class));
        verify(messagingTemplate).convertAndSendToUser(
                org.mockito.ArgumentMatchers.eq("dealer-order@example.com"),
                org.mockito.ArgumentMatchers.eq("/queue/order-status"),
                any()
        );
    }

    @Test
    void updateOrderStatusDoesNotNotifyWhenStatusDoesNotChange() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-noop@example.com"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.SHIPPING, "SCS-1-SHIPPING"));

        adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.SHIPPING),
                "test-admin@example.com"
        );

        assertThat(notifyRepository.findByAccountIdOrderByCreatedAtDesc(dealer.getId())).isEmpty();
    }

    @Test
    void deleteOrderHidesItFromDealerPortalAndCreatesNotification() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-delete@example.com"));
        Order order = orderRepository.save(createOrder(dealer, OrderStatus.CANCELLED, "SCS-1-DELETE"));

        adminManagementService.deleteOrder(order.getId());

        assertThat(dealerPortalService.getOrders(dealer.getUsername())).isEmpty();

        List<Notify> notifications = notifyRepository.findByAccountIdOrderByCreatedAtDesc(dealer.getId());
        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getType()).isEqualTo(NotifyType.ORDER);
        assertThat(notifications.get(0).getTitle()).contains("gỡ khỏi");
        assertThat(notifications.get(0).getLink()).isEqualTo("/orders");
    }

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
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
