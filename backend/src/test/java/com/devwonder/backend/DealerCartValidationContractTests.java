package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.dealer.UpsertDealerCartItemRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.DealerCartItemRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.ProductOfCartRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.service.DealerPortalService;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dealer_cart_validation_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false"
})
class DealerCartValidationContractTests {

    @Autowired
    private DealerPortalService dealerPortalService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DealerCartItemRepository dealerCartItemRepository;

    @Autowired
    private ProductOfCartRepository productOfCartRepository;

    @BeforeEach
    void setUp() {
        dealerCartItemRepository.deleteAll();
        productOfCartRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void rejectsOutOfStockProductsAtServerBoundary() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-cart-out-of-stock@example.com"));
        Product product = productRepository.save(createProduct("SKU-CART-OOS", 0));

        assertThatThrownBy(() -> dealerPortalService.upsertCartItem(
                dealer.getUsername(),
                new UpsertDealerCartItemRequest(product.getId(), 1, null)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Product is out of stock");
    }

    @Test
    void rejectsQuantitiesThatExceedAvailableStock() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-cart-stock-limit@example.com"));
        Product product = productRepository.save(createProduct("SKU-CART-LIMIT", 2));

        assertThatThrownBy(() -> dealerPortalService.upsertCartItem(
                dealer.getUsername(),
                new UpsertDealerCartItemRequest(product.getId(), 3, null)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("quantity must not exceed available stock");
    }

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        return dealer;
    }

    private Product createProduct(String sku, int stock) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setShortDescription("Cart validation product");
        product.setRetailPrice(BigDecimal.valueOf(150_000));
        product.setStock(stock);
        product.setIsDeleted(false);
        return product;
    }
}
