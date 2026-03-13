package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.dealer.CreateDealerOrderItemRequest;
import com.devwonder.backend.dto.dealer.CreateDealerSerialBatchRequest;
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
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.DealerPortalService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
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
    void dealerCannotImportMoreSerialsThanOrderedQuantity() {
        Dealer dealer = dealerRepository.save(createDealer("serial-quantity-guard@example.com"));
        Product product = productRepository.save(createProduct("SKU-SERIAL-3", BigDecimal.valueOf(100_000)));
        Order order = orderRepository.save(createOrder(dealer, product, 1, "SERIAL-ORDER-2"));

        assertThatThrownBy(() -> dealerPortalService.importSerials(
                dealer.getUsername(),
                new CreateDealerSerialBatchRequest(
                        product.getId(),
                        order.getId(),
                        ProductSerialStatus.AVAILABLE,
                        "main",
                        "Kho",
                        List.of("SERIAL-X-02", "SERIAL-X-03")
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Imported serial count exceeds ordered quantity");
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
                .hasMessageContaining("Product serial not found");
    }

    @Test
    void dealerCannotActivateDefectiveSerialForWarranty() {
        Dealer dealer = dealerRepository.save(createDealer("warranty-defective-guard@example.com"));
        Product product = productRepository.save(createProduct("SKU-WARRANTY-2", BigDecimal.valueOf(100_000)));
        ProductSerial productSerial = new ProductSerial();
        productSerial.setProduct(product);
        productSerial.setDealer(dealer);
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
        Order order = new Order();
        order.setDealer(dealer);
        order.setOrderCode(orderCode);
        order.setStatus(OrderStatus.PENDING);
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
}
