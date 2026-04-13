package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.entity.Product;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.service.support.InventoryAlertSupport;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "app.mail.enabled=false"
})
class InventoryAlertSupportTests {

    @Autowired
    private InventoryAlertSupport inventoryAlertSupport;

    @Autowired
    private NotifyRepository notifyRepository;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
    }

    @Test
    void lowOrUrgentInventoryAttentionNoLongerCreatesPersistedNotifications() {
        Product product = buildProduct();

        boolean requiresAttention = inventoryAlertSupport.shouldSurfaceAttention(product, 4);

        assertThat(requiresAttention).isTrue();
        assertThat(notifyRepository.findAll()).isEmpty();
    }

    @Test
    void thresholdEscalationOnlyTriggersWhenStockMovesToMoreSevereLevel() {
        Product product = buildProduct();

        assertThat(inventoryAlertSupport.didAttentionLevelEscalate(product, 16, 9)).isTrue();
        assertThat(inventoryAlertSupport.didAttentionLevelEscalate(product, 8, 4)).isTrue();
        assertThat(inventoryAlertSupport.didAttentionLevelEscalate(product, 4, 4)).isFalse();
        assertThat(inventoryAlertSupport.didAttentionLevelEscalate(product, 4, 7)).isFalse();
    }

    private Product buildProduct() {
        Product product = new Product();
        product.setId(1L);
        product.setSku("SKU-LOW");
        product.setName("Low Stock Product");
        product.setRetailPrice(BigDecimal.ONE);
        product.setIsDeleted(false);
        return product;
    }
}
