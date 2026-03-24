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
import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.service.PublicApiService;
import com.devwonder.backend.service.support.ProductStockSyncSupport;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
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

    @Autowired
    private ProductStockSyncSupport productStockSyncSupport;

    @Autowired
    private CacheManager cacheManager;

    @BeforeEach
    void setUp() {
        warrantyRegistrationRepository.deleteAll();
        productSerialRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
        var cache = cacheManager.getCache(CacheNames.PUBLIC_PRODUCTS);
        if (cache != null) cache.clear();
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
    void getProductReflectsUpdatedStockAfterDerivedStockSync() {
        Product product = createProduct("SPK-STOCK-CACHE", PublishStatus.PUBLISHED);
        product.setStock(1);
        product = productRepository.save(product);

        assertThat(publicApiService.getProduct(product.getId()).stock()).isEqualTo(1);

        productSerialRepository.save(createAvailableSerial(product, "SERIAL-STOCK-CACHE-1"));
        productStockSyncSupport.syncProductStock(product);

        assertThat(publicApiService.getProduct(product.getId()).stock()).isEqualTo(1);

        productSerialRepository.deleteAll();
        productStockSyncSupport.syncProductStock(product);

        assertThat(publicApiService.getProduct(product.getId()).stock()).isZero();
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
        dealerRepository.save(createDealer("pending-dealer@example.com", CustomerStatus.UNDER_REVIEW));

        var response = publicApiService.getDealersPaged(0, 10);

        assertThat(response.totalElements()).isEqualTo(1);
        assertThat(response.items()).extracting("email")
                .containsExactly("active-dealer@example.com");
    }

    // ── searchProducts ──────────────────────────────────────────────────────────

    @Test
    void searchProducts_nullQueryAndNoPriceReturnsAllPublished() {
        saveProduct("SQ-A", "Alpha Speaker", null, null, PublishStatus.PUBLISHED);
        saveProduct("SQ-B", "Beta Speaker", null, null, PublishStatus.PUBLISHED);
        saveProduct("SQ-C", "Draft Speaker", null, null, PublishStatus.DRAFT);

        var results = publicApiService.searchProducts(null, null, null);

        assertThat(results).extracting("sku").containsExactlyInAnyOrder("SQ-A", "SQ-B");
    }

    @Test
    void searchProducts_queryMatchesNameCaseInsensitive() {
        saveProduct("SQ-NAME1", "Tai Nghe Cao Cấp", null, null, PublishStatus.PUBLISHED);
        saveProduct("SQ-NAME2", "Loa Bluetooth", null, null, PublishStatus.PUBLISHED);

        var results = publicApiService.searchProducts("cao cấp", null, null);

        assertThat(results).extracting("sku").containsExactly("SQ-NAME1");
    }

    @Test
    void searchProducts_queryMatchesSku() {
        saveProduct("PRO-MX2000", "Headset Pro", null, null, PublishStatus.PUBLISHED);
        saveProduct("BASIC-100", "Basic Headset", null, null, PublishStatus.PUBLISHED);

        var results = publicApiService.searchProducts("mx2000", null, null);

        assertThat(results).extracting("sku").containsExactly("PRO-MX2000");
    }

    @Test
    void searchProducts_queryMatchesShortDescription() {
        saveProduct("SQ-DESC1", "Product One", "wireless earbuds with ANC", null, PublishStatus.PUBLISHED);
        saveProduct("SQ-DESC2", "Product Two", "basic wired headphones", null, PublishStatus.PUBLISHED);

        var results = publicApiService.searchProducts("ANC", null, null);

        assertThat(results).extracting("sku").containsExactly("SQ-DESC1");
    }

    @Test
    void searchProducts_noMatchReturnsEmpty() {
        saveProduct("SQ-NM1", "Alpha", null, null, PublishStatus.PUBLISHED);

        var results = publicApiService.searchProducts("xyznomatch", null, null);

        assertThat(results).isEmpty();
    }

    @Test
    void searchProducts_minPriceExcludesCheaperProducts() {
        saveProduct("SQ-P1", "Budget", null, BigDecimal.valueOf(500_000), PublishStatus.PUBLISHED);
        saveProduct("SQ-P2", "Premium", null, BigDecimal.valueOf(2_000_000), PublishStatus.PUBLISHED);

        var results = publicApiService.searchProducts(null, 1_000_000.0, null);

        assertThat(results).extracting("sku").containsExactly("SQ-P2");
    }

    @Test
    void searchProducts_maxPriceExcludesExpensiveProducts() {
        saveProduct("SQ-P3", "Budget", null, BigDecimal.valueOf(500_000), PublishStatus.PUBLISHED);
        saveProduct("SQ-P4", "Premium", null, BigDecimal.valueOf(2_000_000), PublishStatus.PUBLISHED);

        var results = publicApiService.searchProducts(null, null, 999_999.0);

        assertThat(results).extracting("sku").containsExactly("SQ-P3");
    }

    @Test
    void searchProducts_nullRetailPriceIsTreeatedAsZeroForPriceRange() {
        saveProduct("SQ-NULL-PRICE", "No Price Tag", null, null, PublishStatus.PUBLISHED);

        // null price → treated as 0, so maxPrice=100 should include it
        assertThat(publicApiService.searchProducts(null, null, 100.0))
                .extracting("sku").containsExactly("SQ-NULL-PRICE");

        // null price → treated as 0, so minPrice=1 should exclude it
        assertThat(publicApiService.searchProducts(null, 1.0, null)).isEmpty();
    }

    @Test
    void searchProducts_deletedProductsExcluded() {
        Product deleted = saveProduct("SQ-DEL", "Deleted Product", null, null, PublishStatus.PUBLISHED);
        deleted.setIsDeleted(true);
        productRepository.save(deleted);

        var results = publicApiService.searchProducts(null, null, null);

        assertThat(results).isEmpty();
    }

    @Test
    void searchProducts_resultsOrderedCaseInsensitiveByNameAsc() {
        saveProduct("SQ-ORD1", "zebra Headset", null, null, PublishStatus.PUBLISHED);
        saveProduct("SQ-ORD2", "Alpha Speaker", null, null, PublishStatus.PUBLISHED);
        saveProduct("SQ-ORD3", "Mango Earphone", null, null, PublishStatus.PUBLISHED);

        var results = publicApiService.searchProducts(null, null, null);

        assertThat(results).extracting("name")
                .containsExactly("Alpha Speaker", "Mango Earphone", "zebra Headset");
    }

    @Test
    void searchProducts_combinedQueryAndPriceFilter() {
        saveProduct("SQ-C1", "Gaming Headset Pro", null, BigDecimal.valueOf(3_000_000), PublishStatus.PUBLISHED);
        saveProduct("SQ-C2", "Gaming Headset Lite", null, BigDecimal.valueOf(800_000), PublishStatus.PUBLISHED);
        saveProduct("SQ-C3", "Studio Monitor", null, BigDecimal.valueOf(5_000_000), PublishStatus.PUBLISHED);

        var results = publicApiService.searchProducts("gaming", null, 1_000_000.0);

        assertThat(results).extracting("sku").containsExactly("SQ-C2");
    }

    private Product saveProduct(String sku, String name, String shortDescription,
                                BigDecimal retailPrice, PublishStatus publishStatus) {
        Product product = new Product();
        product.setSku(sku);
        product.setName(name);
        product.setShortDescription(shortDescription);
        product.setRetailPrice(retailPrice);
        product.setIsDeleted(false);
        product.setPublishStatus(publishStatus);
        return productRepository.save(product);
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

    private ProductSerial createAvailableSerial(Product product, String serialValue) {
        ProductSerial serial = new ProductSerial();
        serial.setProduct(product);
        serial.setSerial(serialValue);
        serial.setStatus(ProductSerialStatus.AVAILABLE);
        return serial;
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
