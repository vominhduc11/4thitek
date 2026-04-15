package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.admin.AdminUpdateUnmatchedPaymentRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.UnmatchedPayment;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.UnmatchedPaymentReason;
import com.devwonder.backend.entity.enums.UnmatchedPaymentStatus;
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
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.AdminFinancialService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class UnmatchedPaymentResolveTests {

    @Autowired
    private AdminFinancialService adminFinancialService;

    @Autowired
    private UnmatchedPaymentRepository unmatchedPaymentRepository;

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
    private NotifyRepository notifyRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WarrantyRegistrationRepository warrantyRegistrationRepository;

    @Autowired
    private AdminRepository adminRepository;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        orderAdjustmentRepository.deleteAll();
        paymentRepository.deleteAll();
        warrantyRegistrationRepository.deleteAll();
        productSerialRepository.deleteAll();
        unmatchedPaymentRepository.deleteAll();
        orderRepository.deleteAll();
        bulkDiscountRepository.deleteAll();
        productRepository.deleteAll();
        adminRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void matchedResolutionCreatesPaymentRecordOnTargetOrder() {
        Order order = orderRepository.save(createOrder("MATCH-ORDER-1", 100_000));
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX001", BigDecimal.valueOf(100_000)));

        adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "Amount matches order balance - applying manually",
                        order.getId(),
                        null
                ),
                "admin@example.com"
        );

        var payments = paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(order.getId());
        assertThat(payments).hasSize(1);
        assertThat(payments.get(0).getAmount()).isEqualByComparingTo(BigDecimal.valueOf(100_000));
        assertThat(payments.get(0).getMethod()).isEqualTo(PaymentMethod.BANK_TRANSFER);
        assertThat(payments.get(0).getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(payments.get(0).getTransactionCode()).isEqualTo("UNMATCHED_MATCH:" + unmatched.getId());
    }

    @Test
    void matchedResolutionRecalculatesOrderFinancialState() {
        Order order = orderRepository.save(createOrder("MATCH-ORDER-2", 100_000));
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX002", BigDecimal.valueOf(100_000)));

        adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "Correct amount - assigning to order",
                        order.getId(),
                        null
                ),
                "admin@example.com"
        );

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getPaidAmount()).isEqualByComparingTo(BigDecimal.valueOf(100_000));
        assertThat(updated.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);

        UnmatchedPayment resolved = unmatchedPaymentRepository.findById(unmatched.getId()).orElseThrow();
        assertThat(resolved.getStatus()).isEqualTo(UnmatchedPaymentStatus.MATCHED);
        assertThat(resolved.getMatchedOrderId()).isEqualTo(order.getId());
    }

    @Test
    void resolveMatchedTwiceDoesNotCreateDuplicatePayment() {
        Order order = orderRepository.save(createOrder("MATCH-ORDER-3", 100_000));
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX003", BigDecimal.valueOf(50_000)));

        adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "First resolution - valid",
                        order.getId(),
                        null
                ),
                "admin@example.com"
        );

        assertThatThrownBy(() -> adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "Second resolution - duplicate attempt",
                        order.getId(),
                        null
                ),
                "admin@example.com"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already resolved");

        assertThat(paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(order.getId())).hasSize(1);
    }

    @Test
    void refundedResolutionDoesNotCreatePaymentOrTouchOrders() {
        Order order = orderRepository.save(createOrder("MATCH-ORDER-4", 100_000));
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX004", BigDecimal.valueOf(50_000)));

        adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.REFUNDED,
                        "Refunded to sender outside the system",
                        null,
                        null
                ),
                "admin@example.com"
        );

        assertThat(paymentRepository.findAll()).isEmpty();
        Order unchanged = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(unchanged.getPaidAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(unchanged.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(unmatchedPaymentRepository.findById(unmatched.getId()).orElseThrow().getStatus())
                .isEqualTo(UnmatchedPaymentStatus.REFUNDED);
    }

    @Test
    void writtenOffResolutionDoesNotCreatePaymentOrTouchOrders() {
        Order order = orderRepository.save(createOrder("MATCH-ORDER-5", 100_000));
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX005", BigDecimal.valueOf(25_000)));

        adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.WRITTEN_OFF,
                        "Small amount, written off as processing fee error",
                        null,
                        null
                ),
                "admin@example.com"
        );

        assertThat(paymentRepository.findAll()).isEmpty();
        Order unchanged = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(unchanged.getPaidAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(unchanged.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(unmatchedPaymentRepository.findById(unmatched.getId()).orElseThrow().getStatus())
                .isEqualTo(UnmatchedPaymentStatus.WRITTEN_OFF);
    }

    @Test
    void matchedPartialPaymentLeavesOrderPending() {
        Order order = orderRepository.save(createOrder("MATCH-ORDER-6", 100_000));
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX006", BigDecimal.valueOf(40_000)));

        adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "Partial payment - applying to order outstanding balance",
                        order.getId(),
                        null
                ),
                "admin@example.com"
        );

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getPaidAmount()).isEqualByComparingTo(BigDecimal.valueOf(40_000));
        assertThat(updated.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(order.getId())).hasSize(1);
    }

    @Test
    void matchedResolutionRejectsAllocationThatOverpaysOutstanding() {
        Order order = orderRepository.save(createOrder("MATCH-ORDER-7", 100_000));
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX007", BigDecimal.valueOf(120_000)));

        assertThatThrownBy(() -> adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "Attempting to overpay target order",
                        order.getId(),
                        null
                ),
                "admin@example.com"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("outstanding");

        assertThat(paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(order.getId())).isEmpty();
        assertThat(unmatchedPaymentRepository.findById(unmatched.getId()).orElseThrow().getStatus())
                .isEqualTo(UnmatchedPaymentStatus.PENDING);
    }

    @Test
    void matchedResolutionSupportsExplicitAllocationAndPreservesResidualUnmatchedAmount() {
        Order order = orderRepository.save(createOrder("MATCH-ORDER-8", 100_000));
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX008", BigDecimal.valueOf(120_000)));

        adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "Allocate only the exact outstanding amount",
                        order.getId(),
                        BigDecimal.valueOf(100_000)
                ),
                "admin@example.com"
        );

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getPaidAmount()).isEqualByComparingTo(BigDecimal.valueOf(100_000));
        assertThat(updated.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);

        UnmatchedPayment resolved = unmatchedPaymentRepository.findById(unmatched.getId()).orElseThrow();
        assertThat(resolved.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(100_000));
        assertThat(resolved.getStatus()).isEqualTo(UnmatchedPaymentStatus.MATCHED);
        assertThat(resolved.getMatchedOrderId()).isEqualTo(order.getId());

        List<UnmatchedPayment> residuals = unmatchedPaymentRepository.findAll().stream()
                .filter(item -> !item.getId().equals(unmatched.getId()))
                .toList();
        assertThat(residuals).hasSize(1);
        assertThat(residuals.get(0).getAmount()).isEqualByComparingTo(BigDecimal.valueOf(20_000));
        assertThat(residuals.get(0).getStatus()).isEqualTo(UnmatchedPaymentStatus.PENDING);
    }

    private Order createOrder(String orderCode, int shippingFee) {
        Dealer dealer = dealerRepository.save(createDealer(orderCode + "@test.com"));
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
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        return dealer;
    }

    private UnmatchedPayment createUnmatched(String transactionCode, BigDecimal amount) {
        UnmatchedPayment u = new UnmatchedPayment();
        u.setTransactionCode(transactionCode);
        u.setAmount(amount);
        u.setSenderInfo("Test sender");
        u.setContent("Test transfer content");
        u.setReceivedAt(Instant.now());
        u.setReason(UnmatchedPaymentReason.AMOUNT_MISMATCH);
        u.setStatus(UnmatchedPaymentStatus.PENDING);
        return u;
    }
}
