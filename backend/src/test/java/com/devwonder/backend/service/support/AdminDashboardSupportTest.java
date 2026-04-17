package com.devwonder.backend.service.support;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.dto.admin.AdminDashboardResponse;
import com.devwonder.backend.entity.Product;
import java.util.List;
import org.junit.jupiter.api.Test;

class AdminDashboardSupportTest {

    @Test
    void lowStockCountsAlignWithProductsPageSemantics() {
        AdminDashboardResponse response = AdminDashboardSupport.buildDashboard(
                List.of(),
                List.of(
                        productWithStock(0),
                        productWithStock(4),
                        productWithStock(10),
                        productWithStock(11)
                ),
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );

        assertThat(response.lowStock().skus()).isEqualTo(2);
        assertThat(response.lowStock().restock()).isEqualTo(1);
    }

    private Product productWithStock(int stock) {
        Product product = new Product();
        product.setIsDeleted(false);
        product.setStock(stock);
        return product;
    }
}
