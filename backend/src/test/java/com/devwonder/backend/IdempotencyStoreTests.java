package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.config.OrderProperties;
import com.devwonder.backend.dto.dealer.CreateDealerOrderItemRequest;
import com.devwonder.backend.dto.dealer.CreateDealerOrderRequest;
import com.devwonder.backend.dto.dealer.DealerOrderResponse;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.service.DealerPortalService;
import com.devwonder.backend.service.IdempotencyStore;
import java.math.BigDecimal;
import java.sql.Timestamp;
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
class IdempotencyStoreTests {

    @Autowired
    private DealerPortalService dealerPortalService;

    @Autowired
    private IdempotencyStore idempotencyStore;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @Autowired
    private OrderProperties orderProperties;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Dealer dealer;
    private Product product;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();

        dealer = dealerRepository.save(createDealer("idempotency-dealer@example.com"));
        product = saveProductWithSerials("IDEM-SKU-1", BigDecimal.valueOf(100_000), 10);
    }

    // ── get() returns present within TTL ────────────────────────────────────

    @Test
    void getReturnsPresentForKeyWithinTtl() {
        String key = UUID.randomUUID().toString();
        DealerOrderResponse order = dealerPortalService.createOrder(
                dealer.getUsername(), createRequest(), key);

        assertThat(idempotencyStore.get(key, dealer.getId())).contains(order.id());
    }

    @Test
    void getReturnsEmptyForUnknownKey() {
        assertThat(idempotencyStore.get(UUID.randomUUID().toString(), dealer.getId())).isEmpty();
    }

    @Test
    void getReturnsEmptyForNullKey() {
        assertThat(idempotencyStore.get(null, dealer.getId())).isEmpty();
    }

    // ── put() is a no-op ─────────────────────────────────────────────────────

    @Test
    void putDoesNotPopulateStoreForNonExistentOrder() {
        // put() is intentionally a no-op; calling it must not produce a false hit
        String key = UUID.randomUUID().toString();
        idempotencyStore.put(key, 99999L);

        // No Order row with this key exists → must remain empty
        assertThat(idempotencyStore.get(key, dealer.getId())).isEmpty();
    }

    // ── duplicate key → same order ───────────────────────────────────────────

    @Test
    void duplicateKeyWithinTtlReturnsSameOrder() {
        String key = UUID.randomUUID().toString();
        DealerOrderResponse first = dealerPortalService.createOrder(
                dealer.getUsername(), createRequest(), key);
        DealerOrderResponse second = dealerPortalService.createOrder(
                dealer.getUsername(), createRequest(), key);

        assertThat(second.id()).isEqualTo(first.id());
        assertThat(second.orderCode()).isEqualTo(first.orderCode());
        assertThat(orderRepository.count()).isEqualTo(1L);
    }

    @Test
    void differentKeysProduceDifferentOrders() {
        DealerOrderResponse first = dealerPortalService.createOrder(
                dealer.getUsername(), createRequest(), UUID.randomUUID().toString());
        DealerOrderResponse second = dealerPortalService.createOrder(
                dealer.getUsername(), createRequest(), UUID.randomUUID().toString());

        assertThat(second.id()).isNotEqualTo(first.id());
        assertThat(orderRepository.count()).isEqualTo(2L);
    }

    // ── expired key is ignored ────────────────────────────────────────────────

    @Test
    void expiredKeyIsNotReturnedByGet() {
        // Create an order with a known idempotency key, then backdate its createdAt
        // beyond the TTL window using JDBC (bypasses @CreationTimestamp).
        String key = UUID.randomUUID().toString();

        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode("SCS-IDEM-EXPIRED-1");
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setIsDeleted(false);
        order.setShippingFee(0);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setIdempotencyKey(key);
        Order saved = orderRepository.saveAndFlush(order);

        // Backdate beyond TTL: (ttlMinutes + 1) * 60 seconds ago
        long secondsAgo = (orderProperties.getIdempotencyTtlMinutes() + 1) * 60L;
        Instant expiredAt = Instant.now().minusSeconds(secondsAgo);
        jdbcTemplate.update(
                "UPDATE orders SET created_at = ? WHERE id = ?",
                Timestamp.from(expiredAt),
                saved.getId()
        );

        assertThat(idempotencyStore.get(key, dealer.getId())).isEmpty();
    }

    // ── persistence model: restart-safe ──────────────────────────────────────

    @Test
    void idempotencyKeyIsPersistedOnOrderRow() {
        String key = UUID.randomUUID().toString();
        DealerOrderResponse response = dealerPortalService.createOrder(
                dealer.getUsername(), createRequest(), key);

        Order persisted = orderRepository.findById(response.id()).orElseThrow();
        assertThat(persisted.getIdempotencyKey()).isEqualTo(key);
    }

    @Test
    void getWorksWithFreshStoreInstanceSimulatingRestart() {
        // A brand-new IdempotencyStore (no in-memory state) must still find the key
        // because the backing is the DB, not a map.
        String key = UUID.randomUUID().toString();
        DealerOrderResponse response = dealerPortalService.createOrder(
                dealer.getUsername(), createRequest(), key);

        IdempotencyStore freshStore = new IdempotencyStore(orderRepository, orderProperties);

        assertThat(freshStore.get(key, dealer.getId())).contains(response.id());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private CreateDealerOrderRequest createRequest() {
        return new CreateDealerOrderRequest(
                PaymentMethod.BANK_TRANSFER,
                null, null, null, null, null,
                List.of(new CreateDealerOrderItemRequest(product.getId(), 1, null))
        );
    }

    private Dealer createDealer(String email) {
        Dealer d = new Dealer();
        d.setUsername(email);
        d.setEmail(email);
        d.setPassword("encoded");
        d.setBusinessName("Idempotency Test Dealer");
        d.setCustomerStatus(CustomerStatus.ACTIVE);
        return d;
    }

    /**
     * Creates and saves a product with the given number of AVAILABLE ProductSerial records,
     * matching the pattern used across test suite (stock is driven by serials, not product.stock).
     */
    private Product saveProductWithSerials(String sku, BigDecimal retailPrice, int count) {
        Product p = new Product();
        p.setSku(sku);
        p.setName("Product " + sku);
        p.setShortDescription("test");
        p.setRetailPrice(retailPrice);
        p.setStock(count);
        p.setIsDeleted(false);
        Product saved = productRepository.save(p);

        List<ProductSerial> serials = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            ProductSerial s = new ProductSerial();
            s.setProduct(saved);
            s.setSerial("SN-" + sku + "-" + (i + 1));
            s.setStatus(ProductSerialStatus.AVAILABLE);
            serials.add(s);
        }
        productSerialRepository.saveAll(serials);

        return productRepository.findById(saved.getId()).orElseThrow();
    }
}
