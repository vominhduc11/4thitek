package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.admin.AdminOrderAdjustmentRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Payment;
import com.devwonder.backend.entity.enums.OrderAdjustmentType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderAdjustmentRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.UnmatchedPaymentRepository;
import com.devwonder.backend.service.AdminFinancialService;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Integration tests for BUSINESS_LOGIC.md §3.25:
 * OrderAdjustment must recalculate Order financial state (paidAmount + paymentStatus)
 * after every append, not just insert a row.
 */
@SpringBootTest
class OrderAdjustmentRecalculationTests {

    @Autowired
    private AdminFinancialService adminFinancialService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderAdjustmentRepository orderAdjustmentRepository;

    @Autowired
    private BulkDiscountRepository bulkDiscountRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private UnmatchedPaymentRepository unmatchedPaymentRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AdminRepository adminRepository;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        orderAdjustmentRepository.deleteAll();
        paymentRepository.deleteAll();
        productSerialRepository.deleteAll();
        unmatchedPaymentRepository.deleteAll();
        orderRepository.deleteAll();
        bulkDiscountRepository.deleteAll();
        productRepository.deleteAll();
        adminRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    /**
     * Positive adjustment on an order with no prior payments:
     * paidAmount should increase by the adjustment amount.
     * paymentStatus stays PENDING because paidAmount < totalAmount.
     */
    @Test
    void positiveAdjustmentIncreasesPaidAmount() {
        Order order = orderRepository.save(createOrder(OrderStatus.PENDING, "ADJ-POS-1", 100_000));

        adminFinancialService.createOrderAdjustment(
                order.getId(),
                new AdminOrderAdjustmentRequest(
                        OrderAdjustmentType.CORRECTION,
                        BigDecimal.valueOf(30_000),
                        "Positive correction for under-recorded bank transfer",
                        null,
                        null
                ),
                "admin@example.com",
                "ADMIN"
        );

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getPaidAmount()).isEqualByComparingTo(BigDecimal.valueOf(30_000));
        assertThat(updated.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    /**
     * Negative adjustment on a fully-paid order:
     * paidAmount decreases and paymentStatus reverts from PAID to PENDING.
     */
    @Test
    void negativeAdjustmentDecreasesPaidAmountAndChangesPaymentStatus() {
        // shippingFee=100000 makes totalAmount=100000 (no items → subtotal=0, total=shippingFee)
        Order order = orderRepository.save(createOrder(OrderStatus.CONFIRMED, "ADJ-NEG-1", 100_000));
        savePayment(order, BigDecimal.valueOf(100_000));
        // Sync paidAmount to match the seeded payment
        order.setPaidAmount(BigDecimal.valueOf(100_000));
        order.setPaymentStatus(PaymentStatus.PAID);
        orderRepository.save(order);

        adminFinancialService.createOrderAdjustment(
                order.getId(),
                new AdminOrderAdjustmentRequest(
                        OrderAdjustmentType.CORRECTION,
                        BigDecimal.valueOf(-10_000),
                        "Refund correction reducing outstanding balance",
                        null,
                        null
                ),
                "admin@example.com",
                "ADMIN"
        );

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getPaidAmount()).isEqualByComparingTo(BigDecimal.valueOf(90_000));
        assertThat(updated.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    /**
     * Positive adjustment that brings paidAmount up to totalAmount:
     * paymentStatus must transition to PAID.
     */
    @Test
    void positiveAdjustmentThatCoversRemainingBalanceTransitionsToPaid() {
        Order order = orderRepository.save(createOrder(OrderStatus.CONFIRMED, "ADJ-PAID-1", 100_000));
        savePayment(order, BigDecimal.valueOf(60_000));
        order.setPaidAmount(BigDecimal.valueOf(60_000));
        order.setPaymentStatus(PaymentStatus.PENDING);
        orderRepository.save(order);

        adminFinancialService.createOrderAdjustment(
                order.getId(),
                new AdminOrderAdjustmentRequest(
                        OrderAdjustmentType.CORRECTION,
                        BigDecimal.valueOf(40_000),
                        "Top-up adjustment covering remaining order balance",
                        null,
                        null
                ),
                "admin@example.com",
                "ADMIN"
        );

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getPaidAmount()).isEqualByComparingTo(BigDecimal.valueOf(100_000));
        assertThat(updated.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    /**
     * Adjustment on a COMPLETED order without confirmOverride=true must be rejected.
     * BUSINESS_LOGIC.md §3.25: completed orders are protected.
     */
    @Test
    void completedOrderAdjustmentRequiresConfirmOverride() {
        Order order = orderRepository.save(createOrder(OrderStatus.COMPLETED, "ADJ-GUARD-1", 100_000));

        // Without confirmOverride (null)
        assertThatThrownBy(() -> adminFinancialService.createOrderAdjustment(
                order.getId(),
                new AdminOrderAdjustmentRequest(
                        OrderAdjustmentType.CORRECTION,
                        BigDecimal.valueOf(5_000),
                        "Adjustment without override on completed order",
                        null,
                        null
                ),
                "admin@example.com",
                "ADMIN"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("confirmOverride");

        // With confirmOverride=false
        assertThatThrownBy(() -> adminFinancialService.createOrderAdjustment(
                order.getId(),
                new AdminOrderAdjustmentRequest(
                        OrderAdjustmentType.CORRECTION,
                        BigDecimal.valueOf(5_000),
                        "Adjustment with override=false on completed order",
                        null,
                        false
                ),
                "admin@example.com",
                "ADMIN"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("confirmOverride");

        // With confirmOverride=true — must succeed
        adminFinancialService.createOrderAdjustment(
                order.getId(),
                new AdminOrderAdjustmentRequest(
                        OrderAdjustmentType.CORRECTION,
                        BigDecimal.valueOf(5_000),
                        "Adjustment with explicit override on completed order",
                        null,
                        true
                ),
                "admin@example.com",
                "ADMIN"
        );

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getPaidAmount()).isEqualByComparingTo(BigDecimal.valueOf(5_000));
    }

    /**
     * Negative adjustment that would drive paidAmount below zero must be rejected.
     * BUSINESS_LOGIC.md §3.25: result must not go negative.
     */
    @Test
    void negativeAdjustmentResultingInNegativePaidAmountIsRejected() {
        Order order = orderRepository.save(createOrder(OrderStatus.PENDING, "ADJ-NEG-GUARD-1", 100_000));
        // No payments → paidAmount = 0

        assertThatThrownBy(() -> adminFinancialService.createOrderAdjustment(
                order.getId(),
                new AdminOrderAdjustmentRequest(
                        OrderAdjustmentType.CORRECTION,
                        BigDecimal.valueOf(-1),
                        "This adjustment would make paidAmount negative",
                        null,
                        null
                ),
                "admin@example.com",
                "ADMIN"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("negative paidAmount");

        // Order financial state must be unchanged
        Order unchanged = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(unchanged.getPaidAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(unchanged.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        // Adjustment row must have been rolled back
        assertThat(orderAdjustmentRepository.findByOrderIdOrderByCreatedAtAsc(order.getId())).isEmpty();
    }

    // ---- Helpers ----

    private Order createOrder(OrderStatus status, String orderCode, int shippingFee) {
        Dealer dealer = dealerRepository.save(createDealer(orderCode + "@test.com"));
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode(orderCode);
        order.setStatus(status);
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

    private void savePayment(Order order, BigDecimal amount) {
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(amount);
        payment.setMethod(PaymentMethod.BANK_TRANSFER);
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now());
        paymentRepository.save(payment);
    }
}
