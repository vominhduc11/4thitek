package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.admin.AdminSerialImportRequest;
import com.devwonder.backend.dto.admin.AdminSerialResponse;
import com.devwonder.backend.dto.admin.UpdateAdminSerialStatusRequest;
import com.devwonder.backend.dto.admin.UpdateAdminWarrantyStatusRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.AdminOperationsService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AdminSerialInvariantTests {

    @Autowired
    private AdminOperationsService adminOperationsService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private WarrantyRegistrationRepository warrantyRegistrationRepository;

    @BeforeEach
    void setUp() {
        warrantyRegistrationRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void adminCannotImportSoldSerialWithoutLinkedOrder() {
        Product product = productRepository.save(createProduct("SKU-ADMIN-IMPORT-1"));

        assertThatThrownBy(() -> adminOperationsService.importSerials(new AdminSerialImportRequest(
                product.getId(),
                null,
                null,
                ProductSerialStatus.ASSIGNED,
                "main",
                "Kho tong",
                List.of("ADMIN-SERIAL-1")
        )))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ASSIGNED status requires a linked order");
    }

    @Test
    void adminCannotSetWarrantyStatusWithoutActiveWarrantyRegistration() {
        Dealer dealer = dealerRepository.save(createDealer("admin-serial-warranty@example.com"));
        Product product = productRepository.save(createProduct("SKU-ADMIN-STATUS-1"));
        Order order = orderRepository.save(createOrder(dealer, product, "ADMIN-ORDER-1"));
        ProductSerial serial = productSerialRepository.save(createSerial(
                dealer,
                order,
                product,
                "ADMIN-SERIAL-2",
                ProductSerialStatus.ASSIGNED
        ));

        assertThatThrownBy(() -> adminOperationsService.updateSerialStatus(
                serial.getId(),
                new UpdateAdminSerialStatusRequest(ProductSerialStatus.WARRANTY)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("WARRANTY status requires an active warranty registration");
    }

    @Test
    void adminCannotMoveWarrantyLinkedSerialBackToInventoryStatus() {
        Dealer dealer = dealerRepository.save(createDealer("admin-serial-inventory@example.com"));
        Product product = productRepository.save(createProduct("SKU-ADMIN-STATUS-2"));
        Order order = orderRepository.save(createOrder(dealer, product, "ADMIN-ORDER-2"));
        ProductSerial serial = productSerialRepository.save(createSerial(
                dealer,
                order,
                product,
                "ADMIN-SERIAL-3",
                ProductSerialStatus.WARRANTY
        ));
        warrantyRegistrationRepository.save(createWarranty(serial, dealer, order, WarrantyStatus.ACTIVE));

        assertThatThrownBy(() -> adminOperationsService.updateSerialStatus(
                serial.getId(),
                new UpdateAdminSerialStatusRequest(ProductSerialStatus.AVAILABLE)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Warranty-linked serial cannot move back to inventory status");
    }

    @Test
    void adminCannotMarkDefectiveSerialThatIsDirectlyOwnedByDealer() {
        Dealer dealer = dealerRepository.save(createDealer("admin-defective-owned@example.com"));
        Product product = productRepository.save(createProduct("SKU-ADMIN-DEFECTIVE-1"));
        ProductSerial serial = productSerialRepository.save(createSerial(
                dealer,
                null,
                product,
                "ADMIN-SERIAL-DEFECTIVE-1",
                ProductSerialStatus.AVAILABLE
        ));

        assertThatThrownBy(() -> adminOperationsService.updateSerialStatus(
                serial.getId(),
                new UpdateAdminSerialStatusRequest(ProductSerialStatus.DEFECTIVE)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Serial already belongs to a dealer");
    }

    @Test
    void adminCannotMarkDefectiveSerialAssignedToDealerOrder() {
        Dealer dealer = dealerRepository.save(createDealer("admin-defective-order@example.com"));
        Product product = productRepository.save(createProduct("SKU-ADMIN-DEFECTIVE-2"));
        Order order = orderRepository.save(createOrder(dealer, product, "ADMIN-ORDER-DEFECTIVE-1"));
        ProductSerial serial = productSerialRepository.save(createSerial(
                null,
                order,
                product,
                "ADMIN-SERIAL-DEFECTIVE-2",
                ProductSerialStatus.ASSIGNED
        ));

        assertThatThrownBy(() -> adminOperationsService.updateSerialStatus(
                serial.getId(),
                new UpdateAdminSerialStatusRequest(ProductSerialStatus.DEFECTIVE)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Serial already belongs to a dealer");
    }

    @Test
    void adminCannotSetReturnedStatusManually() {
        Product product = productRepository.save(createProduct("SKU-ADMIN-STATUS-3"));
        ProductSerial serial = productSerialRepository.save(createSerial(
                null,
                null,
                product,
                "ADMIN-SERIAL-4",
                ProductSerialStatus.AVAILABLE
        ));

        assertThatThrownBy(() -> adminOperationsService.updateSerialStatus(
                serial.getId(),
                new UpdateAdminSerialStatusRequest(ProductSerialStatus.RETURNED)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("RETURNED status must be managed via a dedicated return workflow");
    }

    @Test
    void adminWarrantyStatusUpdateKeepsUnorderedSerialOutOfSoldState() {
        Product product = productRepository.save(createProduct("SKU-ADMIN-STATUS-4"));
        ProductSerial serial = productSerialRepository.save(createSerial(
                null,
                null,
                product,
                "ADMIN-SERIAL-5",
                ProductSerialStatus.WARRANTY
        ));
        WarrantyRegistration warranty = warrantyRegistrationRepository.save(createWarranty(
                serial,
                null,
                null,
                WarrantyStatus.ACTIVE
        ));

        adminOperationsService.updateWarrantyStatus(
                warranty.getId(),
                new UpdateAdminWarrantyStatusRequest(WarrantyStatus.EXPIRED)
        );

        assertThat(productSerialRepository.findById(serial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.AVAILABLE);
    }

    @Test
    void adminWarrantyStatusUpdateReturnsCompletedOrderSerialToAssigned() {
        Dealer dealer = dealerRepository.save(createDealer("admin-serial-warranty-completed@example.com"));
        Product product = productRepository.save(createProduct("SKU-ADMIN-STATUS-5"));
        Order order = orderRepository.save(createOrder(dealer, product, "ADMIN-ORDER-3"));
        order.setStatus(OrderStatus.COMPLETED);
        order = orderRepository.save(order);
        ProductSerial serial = productSerialRepository.save(createSerial(
                dealer,
                order,
                product,
                "ADMIN-SERIAL-6",
                ProductSerialStatus.WARRANTY
        ));
        WarrantyRegistration warranty = warrantyRegistrationRepository.save(createWarranty(
                serial,
                dealer,
                order,
                WarrantyStatus.ACTIVE
        ));

        adminOperationsService.updateWarrantyStatus(
                warranty.getId(),
                new UpdateAdminWarrantyStatusRequest(WarrantyStatus.VOID)
        );

        assertThat(productSerialRepository.findById(serial.getId()).orElseThrow().getStatus())
                .isEqualTo(ProductSerialStatus.ASSIGNED);
    }

    @Test
    void adminImportSerialsReturnsPartialSuccessSummaryAndSyncsDerivedStock() {
        Product product = productRepository.save(createProduct("SKU-ADMIN-IMPORT-SUMMARY"));
        productSerialRepository.save(createSerial(
                null,
                null,
                product,
                "ADMIN-IMPORT-EXISTING",
                ProductSerialStatus.AVAILABLE
        ));

        var result = adminOperationsService.importSerials(new AdminSerialImportRequest(
                product.getId(),
                null,
                null,
                ProductSerialStatus.AVAILABLE,
                "main",
                "Kho tong",
                List.of("admin-import-01", "admin-import-01", "   ", "ADMIN-IMPORT-EXISTING", "admin-import-02")
        ));

        assertThat(result.importedCount()).isEqualTo(2);
        assertThat(result.skippedCount()).isEqualTo(3);
        assertThat(result.importedItems()).extracting(AdminSerialResponse::serial)
                .containsExactly("ADMIN-IMPORT-01", "ADMIN-IMPORT-02");
        assertThat(result.skippedItems()).extracting(item -> item.serial() + ":" + item.reason())
                .containsExactly(
                        "ADMIN-IMPORT-01:Duplicate serial in request",
                        ":serial must not be blank",
                        "ADMIN-IMPORT-EXISTING:Serial already exists"
                );
        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock()).isEqualTo(3);
    }

    @Test
    void adminImportSerialsSkipsEntriesThatExceedOrderedQuantity() {
        Dealer dealer = dealerRepository.save(createDealer("admin-serial-import-order@example.com"));
        Product product = productRepository.save(createProduct("SKU-ADMIN-IMPORT-ORDER"));
        Order order = orderRepository.save(createOrder(dealer, product, "ADMIN-ORDER-IMPORT"));

        var result = adminOperationsService.importSerials(new AdminSerialImportRequest(
                product.getId(),
                dealer.getId(),
                order.getId(),
                null,
                "main",
                "Kho tong",
                List.of("ADMIN-ORDER-SERIAL-1", "ADMIN-ORDER-SERIAL-2")
        ));

        assertThat(result.importedCount()).isEqualTo(1);
        assertThat(result.skippedCount()).isEqualTo(1);
        assertThat(result.importedItems()).singleElement().satisfies(item -> {
            assertThat(item.serial()).isEqualTo("ADMIN-ORDER-SERIAL-1");
            assertThat(item.status()).isEqualTo(ProductSerialStatus.ASSIGNED);
            assertThat(item.dealerId()).isEqualTo(dealer.getId());
            assertThat(item.orderId()).isEqualTo(order.getId());
        });
        assertThat(result.skippedItems()).singleElement().satisfies(item -> {
            assertThat(item.serial()).isEqualTo("ADMIN-ORDER-SERIAL-2");
            assertThat(item.reason()).isEqualTo("Imported serial count exceeds ordered quantity");
        });
    }

    @Test
    void adminUpdatingSerialStatusSyncsDerivedProductStock() {
        Product product = productRepository.save(createProduct("SKU-ADMIN-STOCK-SYNC"));
        ProductSerial serial = productSerialRepository.save(createSerial(
                null,
                null,
                product,
                "ADMIN-STOCK-SYNC-1",
                ProductSerialStatus.AVAILABLE
        ));

        adminOperationsService.updateSerialStatus(
                serial.getId(),
                new UpdateAdminSerialStatusRequest(ProductSerialStatus.DEFECTIVE)
        );

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock()).isZero();
    }

    @Test
    void adminDeletingAvailableSerialSyncsDerivedProductStock() {
        Product product = productRepository.save(createProduct("SKU-ADMIN-STOCK-DELETE"));
        ProductSerial serial = productSerialRepository.save(createSerial(
                null,
                null,
                product,
                "ADMIN-STOCK-DELETE-1",
                ProductSerialStatus.AVAILABLE
        ));

        adminOperationsService.deleteSerial(serial.getId());

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock()).isZero();
    }

    private Dealer createDealer(String email) {
        Dealer dealer = new Dealer();
        dealer.setUsername(email);
        dealer.setEmail(email);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + email);
        return dealer;
    }

    private Product createProduct(String sku) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setRetailPrice(BigDecimal.valueOf(100_000));
        product.setStock(100);
        product.setWarrantyPeriod(12);
        product.setIsDeleted(false);
        return product;
    }

    private Order createOrder(Dealer dealer, Product product, String orderCode) {
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode(orderCode);
        order.setStatus(OrderStatus.COMPLETED);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaidAmount(BigDecimal.valueOf(110_000));
        order.setIsDeleted(false);

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(1);
        item.setUnitPrice(product.getRetailPrice());

        Set<OrderItem> items = new LinkedHashSet<>();
        items.add(item);
        order.setOrderItems(items);
        return order;
    }

    private ProductSerial createSerial(
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

    private WarrantyRegistration createWarranty(
            ProductSerial serial,
            Dealer dealer,
            Order order,
            WarrantyStatus status
    ) {
        WarrantyRegistration registration = new WarrantyRegistration();
        registration.setProductSerial(serial);
        registration.setDealer(dealer);
        registration.setOrder(order);
        registration.setWarrantyCode("WAR-" + serial.getSerial());
        registration.setStatus(status);
        registration.setCustomerName("Customer " + serial.getSerial());
        registration.setCustomerEmail(serial.getSerial().toLowerCase() + "@example.com");
        registration.setCustomerPhone("0912345699");
        registration.setCustomerAddress("123 Serial Street");
        registration.setPurchaseDate(LocalDate.now());
        registration.setWarrantyStart(Instant.now());
        registration.setWarrantyEnd(Instant.now().plusSeconds(86400));
        return registration;
    }
}
