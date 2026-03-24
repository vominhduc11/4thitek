package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.dto.dealer.CreateDealerOrderItemRequest;
import com.devwonder.backend.dto.dealer.CreateDealerOrderRequest;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.service.DealerPortalService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dealer_bank_transfer_payment_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false",
        "sepay.enabled=false"
})
class DealerBankTransferPaymentContractTests {

    @Autowired
    private DealerPortalService dealerPortalService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void setUp() {
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void dealerCanRecordBankTransferPaymentWhenSepayIsDisabled() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-bank-contract@example.com"));
        Product product = productRepository.save(createProduct("SKU-DEALER-BANK-CONTRACT"));
        productSerialRepository.save(createAvailableSerial(product, "SERIAL-DEALER-BANK-001"));

        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Dealer Payment Street",
                        "0900000000",
                        0,
                        "Dealer manual payment when SePay is disabled",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        dealerPortalService.recordPayment(
                dealer.getUsername(),
                createdOrder.id(),
                new RecordPaymentRequest(
                        createdOrder.totalAmount(),
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer manual confirmation",
                        "DEALER-CONTRACT-TX-001",
                        "Recorded because SePay is disabled",
                        null,
                        Instant.parse("2026-03-10T02:00:00Z")
                )
        );

        Order updatedOrder = orderRepository.findById(createdOrder.id()).orElseThrow();
        assertThat(updatedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(updatedOrder.getPaidAmount()).isEqualByComparingTo(createdOrder.totalAmount());
    }

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        return dealer;
    }

    private Product createProduct(String sku) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setShortDescription("Test product");
        product.setRetailPrice(BigDecimal.valueOf(100_000));
        product.setStock(100);
        product.setIsDeleted(false);
        return product;
    }

    private ProductSerial createAvailableSerial(Product product, String serialValue) {
        ProductSerial serial = new ProductSerial();
        serial.setProduct(product);
        serial.setSerial(serialValue);
        serial.setStatus(ProductSerialStatus.AVAILABLE);
        return serial;
    }
}
