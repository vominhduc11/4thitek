package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.dto.dealer.CreateDealerOrderItemRequest;
import com.devwonder.backend.dto.dealer.CreateDealerOrderRequest;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerOrderStatusRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderAdjustmentRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.DealerPortalService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class OrderReceivableRecognitionTests {

    @Autowired
    private DealerPortalService dealerPortalService;

    @Autowired
    private AdminManagementService adminManagementService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private BulkDiscountRepository bulkDiscountRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @Autowired
    private OrderAdjustmentRepository orderAdjustmentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        orderAdjustmentRepository.deleteAll();
        paymentRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        bulkDiscountRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void debtOrderBeforeCompletionOnlyReservesCreditWithoutReceivable() {
        Dealer dealer = saveDealerWithCredit("receivable-create@example.com", 500_000);
        Product product = saveProduct("SKU-RECV-1", BigDecimal.valueOf(100_000), 5);

        var createdOrder = createDebtOrder(dealer, product, "Pre-completion reservation only");

        Order persisted = orderRepository.findById(createdOrder.id()).orElseThrow();
        assertThat(createdOrder.paymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(persisted.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(createdOrder.reservedCreditAmount()).isEqualByComparingTo(createdOrder.creditExposureAmount());
        assertThat(createdOrder.reservedCreditAmount()).isGreaterThan(BigDecimal.ZERO);
        assertThat(createdOrder.openReceivableAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void completedDebtOrderWithUnpaidAmountRecognizesReceivable() {
        Dealer dealer = saveDealerWithCredit("receivable-complete@example.com", 500_000);
        Product product = saveProduct("SKU-RECV-2", BigDecimal.valueOf(100_000), 5);

        var createdOrder = createDebtOrder(dealer, product, "Recognize receivable on completion");
        advanceOrderToCompleted(createdOrder.id());

        var completedOrder = dealerPortalService.getOrder(dealer.getUsername(), createdOrder.id());
        Order persisted = orderRepository.findById(createdOrder.id()).orElseThrow();
        assertThat(completedOrder.paymentStatus()).isEqualTo(PaymentStatus.DEBT_RECORDED);
        assertThat(persisted.getPaymentStatus()).isEqualTo(PaymentStatus.DEBT_RECORDED);
        assertThat(completedOrder.reservedCreditAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(completedOrder.openReceivableAmount()).isEqualByComparingTo(completedOrder.totalAmount());
        assertThat(completedOrder.creditExposureAmount()).isEqualByComparingTo(completedOrder.openReceivableAmount());
    }

    @Test
    void completedDebtOrderFullyPaidDoesNotCreateReceivable() {
        Dealer dealer = saveDealerWithCredit("receivable-paid@example.com", 500_000);
        Product product = saveProduct("SKU-RECV-3", BigDecimal.valueOf(100_000), 5);

        var createdOrder = createDebtOrder(dealer, product, "Fully pay before completion");
        dealerPortalService.recordPayment(
                dealer.getUsername(),
                createdOrder.id(),
                new RecordPaymentRequest(
                        createdOrder.totalAmount(),
                        PaymentMethod.DEBT,
                        "Cash",
                        null,
                        "Paid in full before completion",
                        null,
                        Instant.parse("2026-03-10T01:00:00Z")
                )
        );
        advanceOrderToCompleted(createdOrder.id());

        var completedOrder = dealerPortalService.getOrder(dealer.getUsername(), createdOrder.id());
        assertThat(completedOrder.paymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(completedOrder.reservedCreditAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(completedOrder.openReceivableAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(completedOrder.creditExposureAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void cancellingDebtOrderBeforeCompletionReleasesReservationWithoutReceivable() {
        Dealer dealer = saveDealerWithCredit("receivable-cancel@example.com", 500_000);
        Product product = saveProduct("SKU-RECV-4", BigDecimal.valueOf(100_000), 5);

        var createdOrder = createDebtOrder(dealer, product, "Cancel before completion");
        dealerPortalService.updateOrderStatus(
                dealer.getUsername(),
                createdOrder.id(),
                new UpdateDealerOrderStatusRequest(OrderStatus.CANCELLED)
        );

        var cancelledOrder = dealerPortalService.getOrder(dealer.getUsername(), createdOrder.id());
        assertThat(cancelledOrder.status()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(cancelledOrder.paymentStatus()).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(cancelledOrder.reservedCreditAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(cancelledOrder.openReceivableAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(cancelledOrder.creditExposureAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void partialPaymentBeforeCompletionOnlyReducesReservation() {
        Dealer dealer = saveDealerWithCredit("receivable-partial-before@example.com", 500_000);
        Product product = saveProduct("SKU-RECV-5", BigDecimal.valueOf(100_000), 5);

        var createdOrder = createDebtOrder(dealer, product, "Partial payment before completion");
        dealerPortalService.recordPayment(
                dealer.getUsername(),
                createdOrder.id(),
                new RecordPaymentRequest(
                        BigDecimal.valueOf(100_000),
                        PaymentMethod.DEBT,
                        "Cash",
                        null,
                        "Partial payment before completion",
                        null,
                        Instant.parse("2026-03-10T02:00:00Z")
                )
        );

        var updatedOrder = dealerPortalService.getOrder(dealer.getUsername(), createdOrder.id());
        assertThat(updatedOrder.paymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(updatedOrder.paidAmount()).isEqualByComparingTo("100000");
        assertThat(updatedOrder.openReceivableAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(updatedOrder.reservedCreditAmount()).isEqualByComparingTo(updatedOrder.totalAmount().subtract(updatedOrder.paidAmount()));
    }

    @Test
    void partialPaymentAfterCompletionKeepsReceivableInSync() {
        Dealer dealer = saveDealerWithCredit("receivable-partial-after@example.com", 500_000);
        Product product = saveProduct("SKU-RECV-6", BigDecimal.valueOf(100_000), 5);

        var createdOrder = createDebtOrder(dealer, product, "Partial payment after completion");
        advanceOrderToCompleted(createdOrder.id());
        dealerPortalService.recordPayment(
                dealer.getUsername(),
                createdOrder.id(),
                new RecordPaymentRequest(
                        BigDecimal.valueOf(100_000),
                        PaymentMethod.DEBT,
                        "Cash",
                        null,
                        "Partial payment after completion",
                        null,
                        Instant.parse("2026-03-10T03:00:00Z")
                )
        );

        var updatedOrder = dealerPortalService.getOrder(dealer.getUsername(), createdOrder.id());
        assertThat(updatedOrder.paymentStatus()).isEqualTo(PaymentStatus.DEBT_RECORDED);
        assertThat(updatedOrder.reservedCreditAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(updatedOrder.openReceivableAmount()).isEqualByComparingTo(updatedOrder.totalAmount().subtract(updatedOrder.paidAmount()));
        assertThat(updatedOrder.creditExposureAmount()).isEqualByComparingTo(updatedOrder.openReceivableAmount());
    }

    private Dealer saveDealerWithCredit(String username, long creditLimit) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        dealer.setCreditLimit(BigDecimal.valueOf(creditLimit));
        return dealerRepository.save(dealer);
    }

    private Product saveProduct(String sku, BigDecimal retailPrice, int stock) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setShortDescription("Receivable test product");
        product.setRetailPrice(retailPrice);
        product.setStock(stock);
        product.setIsDeleted(false);
        Product savedProduct = productRepository.save(product);
        if (stock > 0) {
            productSerialRepository.saveAll(createAvailableSerials(savedProduct, stock, "SERIAL-" + sku));
        }
        return productRepository.findById(savedProduct.getId()).orElseThrow();
    }

    private List<ProductSerial> createAvailableSerials(Product product, int count, String prefix) {
        List<ProductSerial> serials = new ArrayList<>();
        for (int index = 0; index < count; index++) {
            ProductSerial serial = new ProductSerial();
            serial.setProduct(product);
            serial.setSerial(prefix + "-" + (index + 1));
            serial.setStatus(ProductSerialStatus.AVAILABLE);
            serials.add(serial);
        }
        return serials;
    }

    private com.devwonder.backend.dto.dealer.DealerOrderResponse createDebtOrder(
            Dealer dealer,
            Product product,
            String note
    ) {
        return dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.DEBT,
                        "Dealer receiver",
                        "123 Receivable Street",
                        "0900000000",
                        0,
                        note,
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );
    }

    private void advanceOrderToCompleted(Long orderId) {
        adminManagementService.updateOrderStatus(
                orderId,
                new UpdateDealerOrderStatusRequest(OrderStatus.CONFIRMED),
                "receivable-admin@example.com"
        );
        adminManagementService.updateOrderStatus(
                orderId,
                new UpdateDealerOrderStatusRequest(OrderStatus.SHIPPING),
                "receivable-admin@example.com"
        );
        adminManagementService.updateOrderStatus(
                orderId,
                new UpdateDealerOrderStatusRequest(OrderStatus.COMPLETED),
                "receivable-admin@example.com"
        );
    }
}
