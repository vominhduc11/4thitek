package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.service.support.InventoryAlertSupport;
import java.math.BigDecimal;
import java.util.HashSet;
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
    private AdminRepository adminRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        adminRepository.deleteAll();
    }

    @Test
    void lowOrUrgentInventoryAttentionNoLongerCreatesPersistedNotifications() {
        Admin activeAdmin = new Admin();
        activeAdmin.setUsername("ops-admin");
        activeAdmin.setPassword("encoded-password");
        activeAdmin.setUserStatus(StaffUserStatus.ACTIVE);
        activeAdmin.setRoles(new HashSet<>());
        adminRepository.save(activeAdmin);

        Product product = new Product();
        product.setId(1L);
        product.setSku("SKU-LOW");
        product.setName("Low Stock Product");
        product.setRetailPrice(BigDecimal.ONE);
        product.setIsDeleted(false);

        int attentionCount = inventoryAlertSupport.notifyIfStockRequiresAttention(product, 4);

        assertThat(attentionCount).isEqualTo(1);
        assertThat(notifyRepository.findAll()).isEmpty();
    }
}
