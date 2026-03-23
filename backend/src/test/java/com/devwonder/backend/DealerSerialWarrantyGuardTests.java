package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.dealer.CreateDealerSerialBatchRequest;
import com.devwonder.backend.dto.dealer.UpdateDealerSerialStatusRequest;
import com.devwonder.backend.dto.warranty.CreateWarrantyRegistrationRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.DealerPortalService;
import com.devwonder.backend.service.PublicApiService;
import com.devwonder.backend.service.support.WarrantyDateSupport;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dealer_serial_warranty_guard;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false"
})
class DealerSerialWarrantyGuardTests {

    @Autowired
    private DealerPortalService dealerPortalService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private WarrantyRegistrationRepository warrantyRegistrationRepository;

    @Autowired
    private PublicApiService publicApiService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        warrantyRegistrationRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void dealerCannotImportSerialsForProductOutsideSelectedOrder() {
        Dealer dealer = dealerRepository.save(createDealer("serial-order-guard@example.com"));
        Product orderedProduct = productRepository.save(createProduct("SKU-SERIAL-1", BigDecimal.valueOf(100_000)));
        Product otherProduct = productRepository.save(createProduct("SKU-SERIAL-2", BigDecimal.valueOf(120_000)));
        Order order = orderRepository.save(createOrder(dealer, orderedProduct, 1, "SERIAL-ORDER-1"));

        assertThatThrownBy(() -> dealerPortalService.importSerials(
                dealer.getUsername(),
                new CreateDealerSerialBatchRequest(
                        otherProduct.getId(),
                        order.getId(),
                        ProductSerialStatus.AVAILABLE,
                        "main",
                        "Kho",
                        List.of("SERIAL-X-01")
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Product is not part of the selected order");
    }

    @Test
    void dealerImportSkipsSerialsThatExceedOrderedQuantity() {
        Dealer dealer = dealerRepository.save(createDealer("serial-quantity-guard@example.com"));
        Product product = productRepository.save(createProduct("SKU-SERIAL-3", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-2"));

        var result = dealerPortalService.importSerials(
                dealer.getUsername(),
                new CreateDealerSerialBatchRequest(
                        product.getId(),
                        order.getId(),
                        ProductSerialStatus.ASSIGNED,
                        "main",
                        "Kho",
                        List.of("SERIAL-X-02", "SERIAL-X-03")
                )
        );

        assertThat(result.importedCount()).isEqualTo(1);
        assertThat(result.skippedCount()).isEqualTo(1);
        assertThat(result.importedItems()).singleElement().satisfies(item -> {
            assertThat(item.serial()).isEqualTo("SERIAL-X-02");
            assertThat(item.status()).isEqualTo(ProductSerialStatus.ASSIGNED);
        });
        assertThat(result.skippedItems()).singleElement().satisfies(item -> {
            assertThat(item.serial()).isEqualTo("SERIAL-X-03");
            assertThat(item.reason()).isEqualTo("Imported serial count exceeds ordered quantity");
        });
    }

    @Test
    void dealerCannotImportSerialsBeforeOrderShips() {
        Dealer dealer = dealerRepository.save(createDealer("serial-status-guard@example.com"));
        Product product = productRepository.save(createProduct("SKU-SERIAL-4", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(
                dealer,
                product,
                1,
                "SERIAL-ORDER-STATUS-1",
                OrderStatus.PENDING
        ));

        assertThatThrownBy(() -> dealerPortalService.importSerials(
                dealer.getUsername(),
                new CreateDealerSerialBatchRequest(
                        product.getId(),
                        order.getId(),
                        ProductSerialStatus.AVAILABLE,
                        "main",
                        "Kho",
                        List.of("SERIAL-X-04")
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("shipping or completed order");
    }

    @Test
    void dealerImportReturnsPartialSuccessSummaryForDuplicateAndExistingSerials() {
        Dealer dealer = dealerRepository.save(createDealer("serial-import-summary@example.com"));
        Product product = productRepository.save(createProduct("SKU-SERIAL-SUMMARY", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 2, "SERIAL-ORDER-SUMMARY"));
        productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-EXISTING-1",
                ProductSerialStatus.ASSIGNED
        ));

        var result = dealerPortalService.importSerials(
                dealer.getUsername(),
                new CreateDealerSerialBatchRequest(
                        product.getId(),
                        order.getId(),
                        ProductSerialStatus.ASSIGNED,
                        "main",
                        "Kho",
                        List.of("SERIAL-NEW-1", "SERIAL-NEW-1", "SERIAL-EXISTING-1", "SERIAL-NEW-2")
                )
        );

        assertThat(result.importedCount()).isEqualTo(1);
        assertThat(result.skippedCount()).isEqualTo(3);
        assertThat(result.importedItems()).singleElement().satisfies(item -> {
            assertThat(item.serial()).isEqualTo("SERIAL-NEW-1");
            assertThat(item.status()).isEqualTo(ProductSerialStatus.ASSIGNED);
            assertThat(item.orderId()).isEqualTo(order.getId());
        });
        assertThat(result.skippedItems()).extracting(item -> item.serial() + ":" + item.reason())
                .containsExactly(
                        "SERIAL-NEW-1:Duplicate serial in request",
                        "SERIAL-EXISTING-1:Serial already exists",
                        "SERIAL-NEW-2:Imported serial count exceeds ordered quantity"
                );
    }

    @Test
    void dealerCannotActivateWarrantyForUnassignedSerial() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-owner-guard@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-1", BigDecimal.valueOf(100_000)));
        ProductSerial productSerial = new ProductSerial();
        productSerial.setProduct(product);
        productSerial.setSerial("SERIAL-WARRANTY-1");
        productSerial.setStatus(ProductSerialStatus.AVAILABLE);
        ProductSerial savedSerial = productSerialRepository.save(productSerial);

        assertThatThrownBy(() -> dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        savedSerial.getId(),
                        "Customer A",
                        "customer@example.com",
                        "0912345678",
                        "123 Warranty Street",
                        LocalDate.of(2026, 3, 1)
                )
        ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Product serial is not assigned to this dealer");
    }

    @Test
    void dealerCannotActivateWarrantyWithoutLinkedOrder() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-order-link-guard@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-8", BigDecimal.valueOf(100_000)));
        ProductSerial productSerial = new ProductSerial();
        productSerial.setProduct(product);
        productSerial.setDealer(dealer);
        productSerial.setSerial("SERIAL-WARRANTY-8");
        productSerial.setStatus(ProductSerialStatus.AVAILABLE);
        ProductSerial savedSerial = productSerialRepository.save(productSerial);

        assertThatThrownBy(() -> dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        savedSerial.getId(),
                        "Customer No Order",
                        "no-order@example.com",
                        "0912345680",
                        "124 Warranty Street",
                        LocalDate.of(2026, 3, 1)
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("completed order");
    }

    @Test
    void dealerCannotActivateDefectiveSerialForWarranty() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-defective-guard@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-2", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-DEFECTIVE"));
        ProductSerial productSerial = new ProductSerial();
        productSerial.setProduct(product);
        productSerial.setDealer(dealer);
        productSerial.setOrder(order);
        productSerial.setSerial("SERIAL-WARRANTY-2");
        productSerial.setStatus(ProductSerialStatus.DEFECTIVE);
        ProductSerial savedSerial = productSerialRepository.save(productSerial);

        assertThatThrownBy(() -> dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        savedSerial.getId(),
                        "Customer B",
                        "customer2@example.com",
                        "0912345679",
                        "456 Warranty Street",
                        LocalDate.of(2026, 3, 1)
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Defective serial cannot be activated for warranty");
    }

    @Test
    void dealerCannotActivateWarrantyBeforeOrderCompletes() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-status-guard@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-9", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(
                dealer,
                product,
                1,
                "SERIAL-ORDER-STATUS-2",
                OrderStatus.SHIPPING
        ));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-9",
                ProductSerialStatus.ASSIGNED
        ));

        assertThatThrownBy(() -> dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        serial.getId(),
                        "Customer Pending",
                        "pending@example.com",
                        "0912345681",
                        "125 Warranty Street",
                        LocalDate.of(2026, 3, 1)
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("completed order");
    }

    @Test
    void expiredWarrantyActivationKeepsSerialInWarrantyState() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-expired-status@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-3", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-3"));
        Instant orderCreatedAt = LocalDate.now(WarrantyDateSupport.APP_ZONE)
                .minusMonths(19)
                .atStartOfDay(WarrantyDateSupport.APP_ZONE)
                .toInstant();
        jdbcTemplate.update(
                "update orders set created_at = ? where id = ?",
                Timestamp.from(orderCreatedAt),
                order.getId()
        );
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-3",
                ProductSerialStatus.ASSIGNED
        ));

        var response = dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        serial.getId(),
                        "Customer Expired",
                        "expired@example.com",
                        "0912345688",
                        "789 Warranty Street",
                        LocalDate.now(WarrantyDateSupport.APP_ZONE).minusMonths(18)
                )
        );

        assertThat(response.status().name()).isEqualTo("EXPIRED");
        assertThat(productSerialRepository.findById(serial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.WARRANTY);
    }

    @Test
    void warrantyActivationUsesAppTimezoneForStartDate() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-timezone@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-5", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-5"));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-5",
                ProductSerialStatus.ASSIGNED
        ));
        LocalDate purchaseDate = LocalDate.now(WarrantyDateSupport.APP_ZONE);

        var response = dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        serial.getId(),
                        "Customer Timezone",
                        "timezone@example.com",
                        "0912345690",
                        "202 Warranty Street",
                        purchaseDate
                )
        );

        Instant expectedStart = purchaseDate.atStartOfDay(WarrantyDateSupport.APP_ZONE).toInstant();
        assertThat(response.warrantyStart()).isEqualTo(expectedStart);
    }

    @Test
    void dealerCannotActivateWarrantyWithFuturePurchaseDate() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-future-date@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-6", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-6"));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-6",
                ProductSerialStatus.ASSIGNED
        ));

        assertThatThrownBy(() -> dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        serial.getId(),
                        "Customer Future",
                        "future@example.com",
                        "0912345691",
                        "303 Warranty Street",
                        LocalDate.now(WarrantyDateSupport.APP_ZONE).plusDays(1)
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("purchaseDate cannot be in the future");
    }

    @Test
    void dealerCannotActivateWarrantyBeforeOrderDate() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-before-order@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-7", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-7"));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-7",
                ProductSerialStatus.ASSIGNED
        ));

        assertThatThrownBy(() -> dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        serial.getId(),
                        "Customer Before",
                        "before@example.com",
                        "0912345692",
                        "404 Warranty Street",
                        LocalDate.now(WarrantyDateSupport.APP_ZONE).minusDays(1)
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("purchaseDate cannot be earlier than order date");
    }

    @Test
    void warrantyActivationFallsBackToOrderReceiverInfoWhenDealerLeavesFieldsBlank() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-fallback@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-FALLBACK", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-FALLBACK"));
        order.setReceiverName("Receiver Fallback");
        order.setReceiverPhone("0912345601");
        order.setReceiverAddress("501 Receiver Street");
        orderRepository.save(order);
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-FALLBACK",
                ProductSerialStatus.ASSIGNED
        ));

        var response = dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        serial.getId(),
                        "   ",
                        "fallback@example.com",
                        "   ",
                        "   ",
                        LocalDate.now(WarrantyDateSupport.APP_ZONE)
                )
        );

        assertThat(response.customerName()).isEqualTo("Receiver Fallback");
        assertThat(response.customerPhone()).isEqualTo("0912345601");
        assertThat(response.customerAddress()).isEqualTo("501 Receiver Street");
    }

    @Test
    void createWarrantyIsAliasOfActivateWarranty() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-alias@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-ALIAS", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 2, "SERIAL-ORDER-ALIAS"));
        ProductSerial firstSerial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-ALIAS-1",
                ProductSerialStatus.ASSIGNED
        ));
        ProductSerial secondSerial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-ALIAS-2",
                ProductSerialStatus.ASSIGNED
        ));
        LocalDate purchaseDate = LocalDate.now(WarrantyDateSupport.APP_ZONE);

        var createdViaCreate = dealerPortalService.createWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        firstSerial.getId(),
                        "Customer Create Alias",
                        "create-alias@example.com",
                        "0912345604",
                        "504 Warranty Street",
                        purchaseDate
                )
        );
        var createdViaActivate = dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        secondSerial.getId(),
                        "Customer Activate Alias",
                        "activate-alias@example.com",
                        "0912345605",
                        "505 Warranty Street",
                        purchaseDate
                )
        );

        assertThat(createdViaCreate.status()).isEqualTo(WarrantyStatus.ACTIVE);
        assertThat(createdViaActivate.status()).isEqualTo(WarrantyStatus.ACTIVE);
        assertThat(createdViaCreate.orderId()).isEqualTo(order.getId());
        assertThat(createdViaActivate.orderId()).isEqualTo(order.getId());
        assertThat(productSerialRepository.findById(firstSerial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.WARRANTY);
        assertThat(productSerialRepository.findById(secondSerial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.WARRANTY);
        assertThat(warrantyRegistrationRepository.findAll()).hasSize(2);
    }

    @Test
    void dealerCanMarkAssignedSerialAsReturned() {
        Dealer dealer = dealerRepository.save(createDealer("serial-returned@example.com"));
        Product product = productRepository.save(createProduct("SKU-SERIAL-RETURNED", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-RETURNED"));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-RETURNED-1",
                ProductSerialStatus.ASSIGNED
        ));

        var response = dealerPortalService.updateSerialStatus(
                dealer.getUsername(),
                serial.getId(),
                new UpdateDealerSerialStatusRequest(ProductSerialStatus.RETURNED)
        );

        assertThat(response.status()).isEqualTo(ProductSerialStatus.RETURNED);
    }

    @Test
    void dealerCanMarkWarrantySerialAsDefective() {
        Dealer dealer = dealerRepository.save(createDealer("serial-defective@example.com"));
        Product product = productRepository.save(createProduct("SKU-SERIAL-DEFECTIVE", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-WARRANTY"));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-STATUS-1",
                ProductSerialStatus.WARRANTY
        ));

        var response = dealerPortalService.updateSerialStatus(
                dealer.getUsername(),
                serial.getId(),
                new UpdateDealerSerialStatusRequest(ProductSerialStatus.DEFECTIVE)
        );

        assertThat(response.status()).isEqualTo(ProductSerialStatus.DEFECTIVE);
    }

    @Test
    void dealerCannotMarkAvailableSerialAsReturned() {
        Dealer dealer = dealerRepository.save(createDealer("serial-available-guard@example.com"));
        Product product = productRepository.save(createProduct("SKU-SERIAL-AVAILABLE", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-AVAILABLE"));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-AVAILABLE-1",
                ProductSerialStatus.AVAILABLE
        ));

        assertThatThrownBy(() -> dealerPortalService.updateSerialStatus(
                dealer.getUsername(),
                serial.getId(),
                new UpdateDealerSerialStatusRequest(ProductSerialStatus.RETURNED)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ASSIGNED or WARRANTY");
    }

    @Test
    void dealerCannotMoveAssignedSerialBackToAvailable() {
        Dealer dealer = dealerRepository.save(createDealer("serial-unsupported-transition@example.com"));
        Product product = productRepository.save(createProduct("SKU-SERIAL-UNSUPPORTED", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-UNSUPPORTED"));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-UNSUPPORTED-1",
                ProductSerialStatus.ASSIGNED
        ));

        assertThatThrownBy(() -> dealerPortalService.updateSerialStatus(
                dealer.getUsername(),
                serial.getId(),
                new UpdateDealerSerialStatusRequest(ProductSerialStatus.AVAILABLE)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Unsupported serial status transition");
    }

    @Test
    void deletingWarrantyEvictsLookupAndRestoresSerialToSold() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-delete-guard@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-4", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-4"));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-4",
                ProductSerialStatus.ASSIGNED
        ));

        var warranty = dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        serial.getId(),
                        "Customer Delete",
                        "delete@example.com",
                        "0912345689",
                        "101 Warranty Street",
                        LocalDate.now()
                )
        );

        assertThat(publicApiService.lookupWarranty(serial.getSerial()).status()).isEqualTo("ACTIVE");

        dealerPortalService.deleteWarranty(dealer.getUsername(), warranty.id());

        assertThat(warrantyRegistrationRepository.findById(warranty.id())).isEmpty();
        assertThat(productSerialRepository.findById(serial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.ASSIGNED);
        assertThat(publicApiService.lookupWarranty(serial.getSerial()).status()).isEqualTo("invalid");
    }

    @Test
    void deletingWarrantyKeepsDefectiveSerialStatus() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-delete-defective@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-DELETE-DEFECTIVE", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-DELETE-DEFECTIVE"));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-DELETE-DEFECTIVE",
                ProductSerialStatus.ASSIGNED
        ));

        var warranty = dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        serial.getId(),
                        "Customer Delete Defective",
                        "delete-defective@example.com",
                        "0912345602",
                        "502 Warranty Street",
                        LocalDate.now()
                )
        );

        ProductSerial warrantySerial = productSerialRepository.findById(serial.getId()).orElseThrow();
        warrantySerial.setStatus(ProductSerialStatus.DEFECTIVE);
        productSerialRepository.save(warrantySerial);

        dealerPortalService.deleteWarranty(dealer.getUsername(), warranty.id());

        assertThat(productSerialRepository.findById(serial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.DEFECTIVE);
    }

    @Test
    void deletingWarrantyKeepsReturnedSerialStatus() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-delete-returned@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-DELETE-RETURNED", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-DELETE-RETURNED"));
        ProductSerial serial = productSerialRepository.save(createDealerOwnedSerial(
                dealer,
                order,
                product,
                "SERIAL-WARRANTY-DELETE-RETURNED",
                ProductSerialStatus.ASSIGNED
        ));

        var warranty = dealerPortalService.activateWarranty(
                dealer.getUsername(),
                new CreateWarrantyRegistrationRequest(
                        serial.getId(),
                        "Customer Delete Returned",
                        "delete-returned@example.com",
                        "0912345603",
                        "503 Warranty Street",
                        LocalDate.now()
                )
        );

        ProductSerial warrantySerial = productSerialRepository.findById(serial.getId()).orElseThrow();
        warrantySerial.setStatus(ProductSerialStatus.RETURNED);
        productSerialRepository.save(warrantySerial);

        dealerPortalService.deleteWarranty(dealer.getUsername(), warranty.id());

        assertThat(productSerialRepository.findById(serial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.RETURNED);
    }

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        return dealer;
    }

    private Product createProduct(String sku, BigDecimal retailPrice) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setShortDescription("Test product");
        product.setRetailPrice(retailPrice);
        product.setStock(100);
        product.setIsDeleted(false);
        product.setWarrantyPeriod(12);
        return product;
    }

    private Order createOrder(Dealer dealer, Product product, int quantity, String orderCode) {
        return createOrder(dealer, product, quantity, orderCode, OrderStatus.COMPLETED);
    }

    private Order createOrder(Dealer dealer, Product product, int quantity, String orderCode, OrderStatus status) {
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode(orderCode);
        order.setStatus(status);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setIsDeleted(false);

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setUnitPrice(product.getRetailPrice());

        Set<OrderItem> items = new LinkedHashSet<>();
        items.add(item);
        order.setOrderItems(items);
        return order;
    }

    private ProductSerial createDealerOwnedSerial(
            Dealer dealer,
            Order order,
            Product product,
            String serialValue,
            ProductSerialStatus status
    ) {
        ProductSerial serial = new ProductSerial();
        serial.setDealer(dealer);
        serial.setOrder(order);
        serial.setProduct(product);
        serial.setSerial(serialValue);
        serial.setStatus(status);
        return serial;
    }
}
