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

/**
 * Integration tests for BUSINESS_LOGIC.md UnmatchedPayment resolution:
 * status = MATCHED must create a real Payment record and recalculate
 * the target Order's financial state — not just update the unmatched_payments row.
 */
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

    /**
     * MATCHED must create a real Payment record linked to the target order.
     * BUSINESS_LOGIC.md: "MATCHED — gán thủ công vào order phù hợp (tạo payment record cho order đó)"
     */
    @Test
    void matchedResolutionCreatesPaymentRecordOnTargetOrder() {
        Order order = orderRepository.save(createOrder("MATCH-ORDER-1", 100_000));
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX001", BigDecimal.valueOf(100_000)));

        adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "Amount matches order balance — applying manually",
                        order.getId()
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

    /**
     * MATCHED must recalculate the target order's paidAmount and paymentStatus.
     * shippingFee = 100_000 → totalAmount = 100_000; after matching → paymentStatus = PAID.
     */
    @Test
    void matchedResolutionRecalculatesOrderFinancialState() {
        Order order = orderRepository.save(createOrder("MATCH-ORDER-2", 100_000));
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX002", BigDecimal.valueOf(100_000)));

        adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "Correct amount — assigning to order",
                        order.getId()
                ),
                "admin@example.com"
        );

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getPaidAmount()).isEqualByComparingTo(BigDecimal.valueOf(100_000));
        assertThat(updated.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);

        // UnmatchedPayment row itself must also be updated
        UnmatchedPayment resolved = unmatchedPaymentRepository.findById(unmatched.getId()).orElseThrow();
        assertThat(resolved.getStatus()).isEqualTo(UnmatchedPaymentStatus.MATCHED);
        assertThat(resolved.getMatchedOrderId()).isEqualTo(order.getId());
    }

    /**
     * Resolving the same MATCHED payment twice must NOT create a duplicate Payment record.
     * The PENDING guard on the unmatched payment is the primary protection.
     */
    @Test
    void resolveMatchedTwiceDoesNotCreateDuplicatePayment() {
        Order order = orderRepository.save(createOrder("MATCH-ORDER-3", 100_000));
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX003", BigDecimal.valueOf(50_000)));

        adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "First resolution — valid",
                        order.getId()
                ),
                "admin@example.com"
        );

        // Second attempt on the same unmatched payment must be rejected
        assertThatThrownBy(() -> adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "Second resolution — duplicate attempt",
                        order.getId()
                ),
                "admin@example.com"
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already resolved");

        // Exactly one payment must exist on the order
        assertThat(paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(order.getId())).hasSize(1);
    }

    /**
     * REFUNDED resolution must NOT create any Payment record on an order.
     * BUSINESS_LOGIC.md: "REFUNDED — đã hoàn tiền ngoài hệ thống" (external refund, no order impact).
     */
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
                        null
                ),
                "admin@example.com"
        );

        // No payment must have been created
        assertThat(paymentRepository.findAll()).isEmpty();

        // Order financial state must be untouched
        Order unchanged = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(unchanged.getPaidAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(unchanged.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);

        // UnmatchedPayment status updated correctly
        assertThat(unmatchedPaymentRepository.findById(unmatched.getId()).orElseThrow().getStatus())
                .isEqualTo(UnmatchedPaymentStatus.REFUNDED);
    }

    /**
     * WRITTEN_OFF resolution must NOT create any Payment record.
     * BUSINESS_LOGIC.md: "WRITTEN_OFF — xử lý ngoại lệ, ghi chú lý do".
     */
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

    /**
     * MATCHED against a partial amount (less than order total) must still apply and leave
     * the order in PENDING status — paidAmount increases but does not reach total.
     */
    @Test
    void matchedPartialPaymentLeavesOrderPending() {
        // shippingFee=100_000 → totalAmount=100_000
        Order order = orderRepository.save(createOrder("MATCH-ORDER-6", 100_000));
        // Only 40_000 from the unmatched payment
        UnmatchedPayment unmatched = unmatchedPaymentRepository.save(
                createUnmatched("SEPAY:TX006", BigDecimal.valueOf(40_000)));

        adminFinancialService.resolveUnmatchedPayment(
                unmatched.getId(),
                new AdminUpdateUnmatchedPaymentRequest(
                        UnmatchedPaymentStatus.MATCHED,
                        "Partial payment — applying to order outstanding balance",
                        order.getId()
                ),
                "admin@example.com"
        );

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getPaidAmount()).isEqualByComparingTo(BigDecimal.valueOf(40_000));
        assertThat(updated.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);

        List<?> payments = paymentRepository.findByOrderIdOrderByPaidAtDescIdDesc(order.getId());
        assertThat(payments).hasSize(1);
    }

    // ---- Helpers ----

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
