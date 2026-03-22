package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.PublishStatus;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.PublicApiService;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.util.List;
import java.util.Map;

@SpringBootTest
class PublicApiServiceTests {

    @Autowired
    private PublicApiService publicApiService;

    @Autowired
    private WarrantyRegistrationRepository warrantyRegistrationRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void setUp() {
        warrantyRegistrationRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void getProductRejectsNonPublishedProducts() {
        Product product = new Product();
        product.setName("Hidden");
        product.setSku("HIDDEN-1");
        product.setIsDeleted(false);
        product.setPublishStatus(PublishStatus.DRAFT);
        Product saved = productRepository.save(product);

        assertThatThrownBy(() -> publicApiService.getProduct(saved.getId()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Product not found");
    }

    @Test
    void getProductPrefersLongDescriptionFromStructuredContent() {
        Product product = new Product();
        product.setName("Detailed");
        product.setSku("DETAIL-1");
        product.setShortDescription("Short summary");
        product.setDescriptions(List.of(Map.of(
                "type", "description",
                "text", "Long form detail for the public product page"
        )));
        product.setIsDeleted(false);
        product.setPublishStatus(PublishStatus.PUBLISHED);
        Product saved = productRepository.save(product);

        var response = publicApiService.getProduct(saved.getId());

        assertThat(response.shortDescription()).isEqualTo("Short summary");
        assertThat(response.description()).isEqualTo("Long form detail for the public product page");
    }

    @Test
    void lookupWarrantyReturnsCanonicalDatesAndExpiredStatus() {
        Product product = createProduct("SPK-1", PublishStatus.PUBLISHED);
        ProductSerial serial = createSerial(product, "SERIAL-EXP-1");
        Instant warrantyStart = Instant.parse("2024-01-01T00:00:00Z");
        Instant warrantyEnd = Instant.parse("2024-12-31T00:00:00Z");

        WarrantyRegistration registration = new WarrantyRegistration();
        registration.setProductSerial(serial);
        registration.setWarrantyCode("WH-EXP-1");
        registration.setStatus(WarrantyStatus.ACTIVE);
        registration.setPurchaseDate(LocalDate.of(2024, 1, 1));
        registration.setWarrantyStart(warrantyStart);
        registration.setWarrantyEnd(warrantyEnd);
        warrantyRegistrationRepository.save(registration);

        var response = publicApiService.lookupWarranty(serial.getSerial());

        assertThat(response.status()).isEqualTo("EXPIRED");
        assertThat(response.productName()).isEqualTo("Product SPK-1");
        assertThat(response.serialNumber()).isEqualTo("SERIAL-EXP-1");
        assertThat(response.purchaseDate()).isEqualTo(LocalDate.of(2024, 1, 1));
        assertThat(response.warrantyEndDate()).isEqualTo(LocalDate.of(2024, 12, 31));
        assertThat(response.remainingDays()).isZero();
        assertThat(response.warrantyCode()).isEqualTo("WH-EXP-1");
    }

    @Test
    void lookupWarrantyPreservesVoidStatus() {
        Product product = createProduct("SPK-2", PublishStatus.PUBLISHED);
        ProductSerial serial = createSerial(product, "SERIAL-VOID-1");
        Instant now = Instant.now();

        WarrantyRegistration registration = new WarrantyRegistration();
        registration.setProductSerial(serial);
        registration.setWarrantyCode("WH-VOID-1");
        registration.setStatus(WarrantyStatus.VOID);
        registration.setPurchaseDate(LocalDate.now());
        registration.setWarrantyStart(now);
        registration.setWarrantyEnd(now.plusSeconds(86400));
        warrantyRegistrationRepository.save(registration);

        var response = publicApiService.lookupWarranty(serial.getSerial());

        assertThat(response.status()).isEqualTo("VOID");
    }

    @Test
    void lookupWarrantyReturnsInvalidForMissingOrUnactivatedSerials() {
        Product product = createProduct("SPK-3", PublishStatus.PUBLISHED);
        createSerial(product, "SERIAL-UNACTIVATED-1");

        var response = publicApiService.lookupWarranty(" serial-unactivated-1 ");

        assertThat(response.status()).isEqualTo("invalid");
        assertThat(response.serialNumber()).isEqualTo("SERIAL-UNACTIVATED-1");
        assertThat(response.productName()).isNull();
        assertThat(response.purchaseDate()).isNull();
        assertThat(response.warrantyEndDate()).isNull();
        assertThat(response.remainingDays()).isZero();
        assertThat(response.warrantyCode()).isNull();
    }

    @Test
    void getDealersReturnsOnlyActiveDealerAccounts() {
        dealerRepository.save(createDealer("active-dealer@example.com", CustomerStatus.ACTIVE));
        dealerRepository.save(createDealer("pending-dealer@example.com", CustomerStatus.UNDER_REVIEW));

        var response = publicApiService.getDealers();

        assertThat(response).hasSize(1);
        assertThat(response.get(0).email()).isEqualTo("active-dealer@example.com");
    }

    @Test
    void getDealersPagedReturnsOnlyPublicDealers() {
        dealerRepository.save(createDealer("active-dealer@example.com", CustomerStatus.ACTIVE));
        dealerRepository.save(createDealer("legacy-active@example.com", null));
        dealerRepository.save(createDealer("pending-dealer@example.com", CustomerStatus.UNDER_REVIEW));

        var response = publicApiService.getDealersPaged(0, 10);

        assertThat(response.totalElements()).isEqualTo(2);
        assertThat(response.items()).extracting("email")
                .containsExactlyInAnyOrder("active-dealer@example.com", "legacy-active@example.com");
    }

    private Product createProduct(String sku, PublishStatus publishStatus) {
        Product product = new Product();
        product.setName("Product " + sku);
        product.setSku(sku);
        product.setIsDeleted(false);
        product.setPublishStatus(publishStatus);
        return productRepository.save(product);
    }

    private ProductSerial createSerial(Product product, String serialValue) {
        ProductSerial serial = new ProductSerial();
        serial.setProduct(product);
        serial.setSerial(serialValue);
        serial.setStatus(ProductSerialStatus.WARRANTY);
        return productSerialRepository.save(serial);
    }

    private Dealer createDealer(String email, CustomerStatus status) {
        Dealer dealer = new Dealer();
        dealer.setUsername(email);
        dealer.setEmail(email);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + email);
        dealer.setCustomerStatus(status);
        return dealer;
    }
}
