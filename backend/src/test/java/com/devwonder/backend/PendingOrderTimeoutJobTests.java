package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.dto.dealer.CreateDealerOrderItemRequest;
import com.devwonder.backend.dto.dealer.CreateDealerOrderRequest;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.FinancialSettlement;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementType;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
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
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.DealerPortalService;
import com.devwonder.backend.service.PendingOrderTimeoutJob;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
class PendingOrderTimeoutJobTests {

    @Autowired
    private PendingOrderTimeoutJob pendingOrderTimeoutJob;

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
    private FinancialSettlementRepository financialSettlementRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @Autowired
    private OrderAdjustmentRepository orderAdjustmentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        orderAdjustmentRepository.deleteAll();
        paymentRepository.deleteAll();
        financialSettlementRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        bulkDiscountRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void staleUnpaidPendingOrderAutoCancelsAndReleasesReservedInventory() {
        Dealer dealer = dealerRepository.save(createDealer("timeout-unpaid@example.com"));
        Product product = saveProduct("SKU-TIMEOUT-1", BigDecimal.valueOf(100_000), 3);

        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Timeout Street",
                        "0900000000",
                        0,
                        "Pending timeout cancellation",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 2, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        setOrderCreatedAt(createdOrder.id(), Instant.now().minusSeconds(72 * 3600L));

        pendingOrderTimeoutJob.processStaleOrders();

        Order cancelledOrder = orderRepository.findById(createdOrder.id()).orElseThrow();
        Product reloadedProduct = productRepository.findById(product.getId()).orElseThrow();
        List<ProductSerial> reservedSerials = productSerialRepository.findAll().stream()
                .filter(serial -> serial.getProduct() != null && product.getId().equals(serial.getProduct().getId()))
                .toList();

        assertThat(cancelledOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(cancelledOrder.getPaymentStatus()).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(reloadedProduct.getStock()).isEqualTo(3);
        assertThat(reservedSerials).hasSize(3);
        assertThat(reservedSerials).allSatisfy(serial -> {
            assertThat(serial.getStatus()).isEqualTo(ProductSerialStatus.AVAILABLE);
            assertThat(serial.getOrder()).isNull();
        });
    }

    @Test
    void stalePendingOrderWithRecordedMoneyRequiresManualReviewInsteadOfAutoCancel() {
        Dealer dealer = dealerRepository.save(createDealer("timeout-paid@example.com"));
        Product product = saveProduct("SKU-TIMEOUT-2", BigDecimal.valueOf(100_000), 2);

        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "456 Timeout Street",
                        "0900000000",
                        0,
                        "Pending timeout review",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        adminManagementService.recordOrderPayment(
                createdOrder.id(),
                new RecordPaymentRequest(
                        createdOrder.totalAmount(),
                        PaymentMethod.BANK_TRANSFER,
                        "Admin manual confirmation",
                        "TIMEOUT-TX-001",
                        "Money recorded before timeout sweep",
                        null,
                        Instant.parse("2026-03-10T02:00:00Z")
                )
        );

        setOrderCreatedAt(createdOrder.id(), Instant.now().minusSeconds(72 * 3600L));

        pendingOrderTimeoutJob.processStaleOrders();

        Order reviewedOrder = orderRepository.findById(createdOrder.id()).orElseThrow();
        ProductSerial reservedSerial = productSerialRepository.findAll().stream()
                .filter(serial -> serial.getOrder() != null && reviewedOrder.getId().equals(serial.getOrder().getId()))
                .findFirst()
                .orElseThrow();
        List<FinancialSettlement> settlements = financialSettlementRepository.findByOrderIdOrderByCreatedAtDesc(reviewedOrder.getId());

        assertThat(reviewedOrder.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(reviewedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(reviewedOrder.getStaleReviewRequired()).isTrue();
        assertThat(reviewedOrder.getFinancialSettlementRequired()).isTrue();
        assertThat(reservedSerial.getStatus()).isEqualTo(ProductSerialStatus.RESERVED);
        assertThat(settlements).hasSize(1);
        assertThat(settlements.get(0).getStatus()).isEqualTo(FinancialSettlementStatus.PENDING);
        assertThat(settlements.get(0).getType()).isEqualTo(FinancialSettlementType.STALE_ORDER_REVIEW);
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

    private Product saveProduct(String sku, BigDecimal retailPrice, int stock) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setShortDescription("Timeout test product");
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

    private void setOrderCreatedAt(Long orderId, Instant createdAt) {
        jdbcTemplate.update("update orders set created_at = ? where id = ?", createdAt, orderId);
    }
}
