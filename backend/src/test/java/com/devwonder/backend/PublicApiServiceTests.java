package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.PublishStatus;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.ResourceNotFoundException;
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

    @BeforeEach
    void setUp() {
        warrantyRegistrationRepository.deleteAll();
        productSerialRepository.deleteAll();
        productRepository.deleteAll();
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
        assertThat(response.purchaseDate()).isEqualTo(LocalDate.of(2024, 1, 1));
        assertThat(response.warrantyStart()).isEqualTo(warrantyStart);
        assertThat(response.warrantyEnd()).isEqualTo(warrantyEnd);
        assertThat(response.remainingDays()).isZero();
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
}
