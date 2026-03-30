package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.FinancialSettlement;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Payment;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.FinancialSettlementRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderAdjustmentRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.UnmatchedPaymentRepository;
import com.devwonder.backend.service.AdminManagementService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Integration tests for BUSINESS_LOGIC.md §3.4 "Guard condition hủy đơn có nghĩa vụ tài chính":
 * When admin cancels an order with paidAmount > 0, the system must:
 *  1. Create a FinancialSettlement with createdBy = actual admin actor (not "admin")
 *  2. Send notification to all ACTIVE admins
 *  3. Not regress serial release or stock restore
 */
@SpringBootTest
class AdminCancelOrderFinancialTests {

    @Autowired
    private AdminManagementService adminManagementService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private FinancialSettlementRepository financialSettlementRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BulkDiscountRepository bulkDiscountRepository;

    @Autowired
    private OrderAdjustmentRepository orderAdjustmentRepository;

    @Autowired
    private UnmatchedPaymentRepository unmatchedPaymentRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        orderAdjustmentRepository.deleteAll();
        paymentRepository.deleteAll();
        productSerialRepository.deleteAll();
        unmatchedPaymentRepository.deleteAll();
        financialSettlementRepository.deleteAll();
        orderRepository.deleteAll();
        bulkDiscountRepository.deleteAll();
        productRepository.deleteAll();
        adminRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    /**
     * Admin cancels an order that has paidAmount > 0.
     * FinancialSettlement.createdBy must be the actual actor username, not the hardcoded "admin" string.
     * BUSINESS_LOGIC.md §3.4: "createdBy: actor thực hiện hủy"
     */
    @Test
    void adminCancelWithPaidAmountCreatesFinancialSettlementWithActorUsername() {
        Order order = savedOrderWithPayment("ADJ-CANCEL-1", BigDecimal.valueOf(50_000));

        adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED),
                "ops.manager@4thitek.vn"
        );

        List<FinancialSettlement> settlements = financialSettlementRepository
                .findByOrderIdOrderByCreatedAtDesc(order.getId());
        assertThat(settlements).hasSize(1);

        FinancialSettlement settlement = settlements.get(0);
        assertThat(settlement.getCreatedBy()).isEqualTo("ops.manager@4thitek.vn");
        assertThat(settlement.getType()).isEqualTo(FinancialSettlementType.CANCELLATION_REFUND);
        assertThat(settlement.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(50_000));
        assertThat(settlement.getStatus()).isEqualTo(FinancialSettlementStatus.PENDING);
    }

    /**
     * Admin cancels an order with paidAmount > 0.
     * An admin notification about the financial settlement must be sent.
     * BUSINESS_LOGIC.md §3.4: "Backend gửi notification cho tất cả admin ACTIVE yêu cầu xử lý settlement"
     */
    @Test
    void adminCancelWithPaidAmountSendsFinancialSettlementNotificationToAdmins() {
        com.devwonder.backend.entity.Admin admin = adminRepository.save(createAdmin("finance.admin@4thitek.vn"));
        Order order = savedOrderWithPayment("ADJ-CANCEL-2", BigDecimal.valueOf(75_000));

        adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED),
                "ops.manager@4thitek.vn"
        );

        List<Notify> adminNotifications = notifyRepository.findByAccountIdOrderByCreatedAtDesc(admin.getId());
        // At least one notification about financial settlement required
        assertThat(adminNotifications).isNotEmpty();
        boolean hasSettlementNotification = adminNotifications.stream()
                .anyMatch(n -> n.getLink() != null && n.getLink().contains("financial-settlement")
                        || n.getContent() != null && (n.getContent().contains("settlement") || n.getContent().contains("tài chính")));
        assertThat(hasSettlementNotification)
                .as("Expected at least one financial settlement notification for admin")
                .isTrue();
    }

    /**
     * Admin cancels an order with paidAmount = 0.
     * No FinancialSettlement must be created.
     * BUSINESS_LOGIC.md §3.4: "Nếu paidAmount = 0: hủy bình thường, không tạo settlement record."
     */
    @Test
    void adminCancelWithZeroPaidAmountDoesNotCreateFinancialSettlement() {
        Order order = savedOrderNoPaid("ADJ-CANCEL-3");

        adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED),
                "ops.manager@4thitek.vn"
        );

        assertThat(financialSettlementRepository.findByOrderIdOrderByCreatedAtDesc(order.getId())).isEmpty();
        Order cancelled = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(cancelled.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(cancelled.getPaymentStatus()).isEqualTo(PaymentStatus.CANCELLED);
    }

    /**
     * Admin cancels an order with paidAmount > 0: serials must still be released
     * and the order's financialSettlementRequired flag must be true.
     * Verifies no regression in the core cancel behavior.
     */
    @Test
    void adminCancelWithPaidAmountReleasesSerialAndSetsSettlementFlag() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-serial@example.com"));
        Order order = orderRepository.save(createOrder(dealer, "ADJ-CANCEL-4", 0));
        order.setPaidAmount(BigDecimal.valueOf(30_000));
        order = orderRepository.save(order);

        ProductSerial serial = new ProductSerial();
        serial.setOrder(order);
        serial.setSerial("SN-CANCEL-TEST-1");
        serial.setStatus(ProductSerialStatus.AVAILABLE);
        productSerialRepository.save(serial);

        adminManagementService.updateOrderStatus(
                order.getId(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED),
                "ops.manager@4thitek.vn"
        );

        // Serial must be detached from order
        ProductSerial saved = productSerialRepository.findById(serial.getId()).orElseThrow();
        assertThat(saved.getOrder()).isNull();

        // financialSettlementRequired flag must be set
        Order cancelled = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(cancelled.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(cancelled.getFinancialSettlementRequired()).isTrue();

        // FinancialSettlement record created with correct actor
        List<FinancialSettlement> settlements = financialSettlementRepository
                .findByOrderIdOrderByCreatedAtDesc(order.getId());
        assertThat(settlements).hasSize(1);
        assertThat(settlements.get(0).getCreatedBy()).isEqualTo("ops.manager@4thitek.vn");
    }

    // ---- Helpers ----

    private Order savedOrderWithPayment(String orderCode, BigDecimal paidAmount) {
        Dealer dealer = dealerRepository.save(createDealer(orderCode + "@test.com"));
        Order order = orderRepository.save(createOrder(dealer, orderCode, 0));

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(paidAmount);
        payment.setMethod(PaymentMethod.BANK_TRANSFER);
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now());
        paymentRepository.save(payment);

        order.setPaidAmount(paidAmount);
        order.setPaymentStatus(PaymentStatus.PAID);
        return orderRepository.save(order);
    }

    private Order savedOrderNoPaid(String orderCode) {
        Dealer dealer = dealerRepository.save(createDealer(orderCode + "@test.com"));
        return orderRepository.save(createOrder(dealer, orderCode, 0));
    }

    private Order createOrder(Dealer dealer, String orderCode, int shippingFee) {
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode(orderCode);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setShippingFee(shippingFee);
        order.setIsDeleted(false);
        return order;
    }

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Test Dealer " + username);
        return dealer;
    }

    private com.devwonder.backend.entity.Admin createAdmin(String username) {
        com.devwonder.backend.entity.Admin admin = new com.devwonder.backend.entity.Admin();
        admin.setUsername(username);
        admin.setEmail(username);
        admin.setPassword("encoded-password");
        admin.setUserStatus(com.devwonder.backend.entity.enums.StaffUserStatus.ACTIVE);
        return admin;
    }
}
