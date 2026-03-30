package com.devwonder.backend.service.support;

import static org.assertj.core.api.Assertions.assertThat;

import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.PaymentStatus;
import com.devwonder.backend.entity.enums.PublishStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class AdminDashboardSupportTests {

    @Test
    void buildDashboardUsesOnlyCompletedOrdersForRevenueMetric() {
        Instant now = Instant.now();
        Order recentCompleted = createOrder(
                "DASH-COMPLETE-RECENT",
                createProduct("Completed recent"),
                1,
                BigDecimal.valueOf(100),
                OrderStatus.COMPLETED,
                now.minusSeconds(60L * 60 * 24 * 10)
        );
        Order previousCompleted = createOrder(
                "DASH-COMPLETE-PREV",
                createProduct("Completed previous"),
                1,
                BigDecimal.valueOf(200),
                OrderStatus.COMPLETED,
                now.minusSeconds(60L * 60 * 24 * 40)
        );
        Order pendingOrder = createOrder(
                "DASH-PENDING",
                createProduct("Pending product"),
                1,
                BigDecimal.valueOf(999),
                OrderStatus.PENDING,
                now.minusSeconds(60L * 60 * 24 * 5)
        );
        Order cancelledOrder = createOrder(
                "DASH-CANCELLED",
                createProduct("Cancelled product"),
                1,
                BigDecimal.valueOf(888),
                OrderStatus.CANCELLED,
                now.minusSeconds(60L * 60 * 24 * 3)
        );

        var dashboard = AdminDashboardSupport.buildDashboard(
                List.of(recentCompleted, previousCompleted, pendingOrder, cancelledOrder),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                10
        );

        assertThat(dashboard.revenue().label()).isEqualTo("Doanh thu 30 ngay");
        assertThat(dashboard.revenue().value()).isEqualByComparingTo("110");
        assertThat(dashboard.revenue().delta()).isEqualTo("-50%");
        assertThat(dashboard.topProducts())
                .extracting(item -> item.name())
                .containsExactlyInAnyOrder("Completed recent", "Completed previous");
    }

    @Test
    void dealerAccountRevenueUsesOnlyCompletedOrders() {
        Dealer dealer = new Dealer();
        dealer.setUsername("dealer-revenue@example.com");
        dealer.setEmail("dealer-revenue@example.com");
        dealer.setBusinessName("Dealer Revenue");

        Order completedOrder = createOrder(
                "DEALER-COMPLETE",
                createProduct("Completed dealer product"),
                1,
                BigDecimal.valueOf(100),
                OrderStatus.COMPLETED,
                Instant.now().minusSeconds(60L * 60 * 24 * 15)
        );
        completedOrder.setDealer(dealer);
        Order pendingOrder = createOrder(
                "DEALER-PENDING",
                createProduct("Pending dealer product"),
                1,
                BigDecimal.valueOf(900),
                OrderStatus.PENDING,
                Instant.now().minusSeconds(60L * 60 * 24 * 2)
        );
        pendingOrder.setDealer(dealer);
        dealer.setOrders(new LinkedHashSet<>(List.of(completedOrder, pendingOrder)));

        var response = AdminResponseMapper.toDealerAccountResponse(dealer, List.of(), 10);

        assertThat(response.orders()).isEqualTo(2);
        assertThat(response.revenue()).isEqualByComparingTo("110");
        assertThat(response.lastOrderAt()).isEqualTo(pendingOrder.getCreatedAt());
    }

    @Test
    void buildDashboardUsesCompletedAtForTrendBuckets() {
        YearMonth currentMonth = YearMonth.now(WarrantyDateSupport.APP_ZONE);
        Instant createdInOldMonth = currentMonth.minusMonths(2)
                .atDay(5)
                .atStartOfDay(WarrantyDateSupport.APP_ZONE)
                .toInstant();
        Instant completedThisMonth = currentMonth
                .atDay(3)
                .atStartOfDay(WarrantyDateSupport.APP_ZONE)
                .toInstant();

        Order order = createOrder(
                "DASH-TREND-COMPLETED",
                createProduct("Trend product"),
                1,
                BigDecimal.valueOf(100),
                OrderStatus.COMPLETED,
                createdInOldMonth
        );
        order.setCompletedAt(completedThisMonth);

        var dashboard = AdminDashboardSupport.buildDashboard(
                List.of(order),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                10
        );

        String currentMonthLabel = currentMonth.format(java.time.format.DateTimeFormatter.ofPattern("MM/yyyy"));
        assertThat(dashboard.trend().points())
                .filteredOn(point -> point.label().equals(currentMonthLabel))
                .singleElement()
                .extracting(point -> point.value())
                .isEqualTo(110);
    }

    @Test
    void buildDashboardExcludesDeletedProductsFromDraftCount() {
        Product published = createProduct("Published product");
        published.setPublishStatus(PublishStatus.PUBLISHED);

        Product draft = createProduct("Draft product");
        draft.setPublishStatus(PublishStatus.DRAFT);

        Product deletedDraft = createProduct("Deleted draft");
        deletedDraft.setPublishStatus(PublishStatus.DRAFT);
        deletedDraft.setIsDeleted(true);

        var dashboard = AdminDashboardSupport.buildDashboard(
                List.of(),
                List.of(published, draft, deletedDraft),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                10
        );

        assertThat(dashboard.system())
                .filteredOn(item -> item.label().equals("San pham"))
                .singleElement()
                .extracting(item -> item.hint())
                .isEqualTo("1 ban nhap");
    }

    private Order createOrder(
            String orderCode,
            Product product,
            int quantity,
            BigDecimal unitPrice,
            OrderStatus status,
            Instant createdAt
    ) {
        Order order = new Order();
        order.setOrderCode(orderCode);
        order.setStatus(status);
        order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setIsDeleted(false);
        order.setCreatedAt(createdAt);

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setUnitPrice(unitPrice);

        Set<OrderItem> items = new LinkedHashSet<>();
        items.add(item);
        order.setOrderItems(items);
        return order;
    }

    private Product createProduct(String name) {
        Product product = new Product();
        product.setName(name);
        product.setSku(name.replace(' ', '-').toUpperCase());
        product.setRetailPrice(BigDecimal.valueOf(100));
        product.setStock(10);
        product.setIsDeleted(false);
        return product;
    }
}
