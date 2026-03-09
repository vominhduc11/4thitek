package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.admin.AdminDashboardResponse;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Blog;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.BlogStatus;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PublishStatus;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class AdminDashboardSupport {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter MONTH_LABEL_FORMAT = DateTimeFormatter.ofPattern("MM/yyyy");
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private AdminDashboardSupport() {
    }

    public static AdminDashboardResponse buildDashboard(
            List<Order> orders,
            List<Product> products,
            List<Dealer> dealers,
            List<Admin> admins,
            List<Blog> blogs,
            List<BulkDiscount> rules
    ) {
        List<Order> activeOrders = safeList(orders).stream()
                .filter(AdminDashboardSupport::isVisibleOrder)
                .toList();
        List<Product> availableProducts = safeList(products);
        List<Dealer> availableDealers = safeList(dealers);
        List<Admin> availableAdmins = safeList(admins);
        List<Blog> availableBlogs = safeList(blogs);
        List<BulkDiscount> availableRules = safeList(rules);

        Instant now = Instant.now();
        BigDecimal revenue = activeOrders.stream()
                .map(OrderPricingSupport::computeTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal current30 = revenueBetween(activeOrders, now.minusSeconds(60L * 60 * 24 * 30), now);
        BigDecimal previous30 = revenueBetween(
                activeOrders,
                now.minusSeconds(60L * 60 * 24 * 60),
                now.minusSeconds(60L * 60 * 24 * 30)
        );

        long pendingOrders = activeOrders.stream().filter(order -> order.getStatus() == OrderStatus.PENDING).count();
        long lowStockSkus = availableProducts.stream().filter(product -> safeInt(product.getStock()) < 10).count();
        long urgentRestock = availableProducts.stream().filter(product -> safeInt(product.getStock()) < 5).count();

        List<AdminDashboardResponse.StatusItem> orderStatus = List.of(
                new AdminDashboardResponse.StatusItem("Cho xu ly", countOrdersByStatus(activeOrders, OrderStatus.PENDING)),
                new AdminDashboardResponse.StatusItem("Xác nhận", countOrdersByStatus(activeOrders, OrderStatus.CONFIRMED)),
                new AdminDashboardResponse.StatusItem("Đang giao", countOrdersByStatus(activeOrders, OrderStatus.SHIPPING)),
                new AdminDashboardResponse.StatusItem("Hoan tat", countOrdersByStatus(activeOrders, OrderStatus.COMPLETED)),
                new AdminDashboardResponse.StatusItem("Huy", countOrdersByStatus(activeOrders, OrderStatus.CANCELLED))
        );

        return new AdminDashboardResponse(
                new AdminDashboardResponse.Metric(
                        "Doanh thu 30 ngay",
                        revenue,
                        formatDelta(current30, previous30),
                        toProgress(revenue, revenue.add(BigDecimal.valueOf(1_000_000L)))
                ),
                new AdminDashboardResponse.OrderSummary(
                        activeOrders.size(),
                        Math.toIntExact(pendingOrders),
                        activeOrders.isEmpty() ? 0 : clampProgress((int) ((pendingOrders * 100) / activeOrders.size()))
                ),
                new AdminDashboardResponse.LowStock(
                        Math.toIntExact(lowStockSkus),
                        Math.toIntExact(urgentRestock),
                        availableProducts.isEmpty() ? 0 : clampProgress((int) ((lowStockSkus * 100) / availableProducts.size()))
                ),
                orderStatus,
                buildTopProducts(activeOrders),
                buildSystemItems(availableDealers, availableAdmins, availableProducts, availableBlogs, availableRules),
                buildTrend(activeOrders)
        );
    }

    public static boolean isVisibleOrder(Order order) {
        return order != null && !Boolean.TRUE.equals(order.getIsDeleted());
    }

    private static List<AdminDashboardResponse.TopProduct> buildTopProducts(List<Order> orders) {
        Map<String, Integer> byName = new HashMap<>();
        for (Order order : orders) {
            if (order.getOrderItems() == null) {
                continue;
            }
            for (OrderItem item : order.getOrderItems()) {
                Product product = item.getProduct();
                String name = product == null
                        ? "Unknown product"
                        : firstNonBlank(product.getName(), product.getSku(), "Unknown product");
                byName.merge(name, safeInt(item.getQuantity()), Integer::sum);
            }
        }
        return byName.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(entry -> new AdminDashboardResponse.TopProduct(entry.getKey(), entry.getValue() + " sp"))
                .toList();
    }

    private static List<AdminDashboardResponse.SystemItem> buildSystemItems(
            List<Dealer> dealers,
            List<Admin> admins,
            List<Product> products,
            List<Blog> blogs,
            List<BulkDiscount> rules
    ) {
        long pendingDealers = dealers.stream()
                .filter(dealer -> dealer.getCustomerStatus() == CustomerStatus.UNDER_REVIEW)
                .count();
        long publishedProducts = products.stream()
                .filter(product -> product.getPublishStatus() == PublishStatus.PUBLISHED && !Boolean.TRUE.equals(product.getIsDeleted()))
                .count();
        long draftProducts = products.stream().filter(product -> product.getPublishStatus() != PublishStatus.PUBLISHED).count();
        long pendingAdmins = admins.stream().filter(admin -> admin.getUserStatus() == StaffUserStatus.PENDING).count();
        long publishedBlogs = blogs.stream()
                .filter(blog -> blog.getStatus() == BlogStatus.PUBLISHED && !Boolean.TRUE.equals(blog.getIsDeleted()))
                .count();
        long draftBlogs = blogs.stream().filter(blog -> blog.getStatus() != BlogStatus.PUBLISHED).count();
        long pendingRules = rules.stream().filter(rule -> rule.getStatus() == DiscountRuleStatus.PENDING).count();

        List<AdminDashboardResponse.SystemItem> items = new ArrayList<>();
        items.add(new AdminDashboardResponse.SystemItem(
                "Đại lý",
                dealers.size() + " tai khoan",
                pendingDealers + " dang xem xet",
                pendingDealers > 0 ? "warn" : "good",
                "sales"
        ));
        items.add(new AdminDashboardResponse.SystemItem(
                "Chiet khau ban si",
                rules.size() + " quy tac",
                pendingRules + " cho phe duyet",
                pendingRules > 0 ? "warn" : "neutral",
                "sales"
        ));
        items.add(new AdminDashboardResponse.SystemItem(
                "San pham",
                publishedProducts + " dang ban",
                draftProducts + " ban nhap",
                "neutral",
                "sales"
        ));
        items.add(new AdminDashboardResponse.SystemItem(
                "Quan tri",
                admins.size() + " tai khoan",
                pendingAdmins + " chờ kích hoạt",
                pendingAdmins > 0 ? "warn" : "neutral",
                "ops"
        ));
        items.add(new AdminDashboardResponse.SystemItem(
                "Bai viet",
                publishedBlogs + " da dang",
                draftBlogs + " ban nhap",
                "neutral",
                "ops"
        ));
        return List.copyOf(items);
    }

    private static AdminDashboardResponse.Trend buildTrend(List<Order> orders) {
        LinkedHashMap<YearMonth, BigDecimal> buckets = new LinkedHashMap<>();
        YearMonth currentMonth = YearMonth.now(APP_ZONE);
        for (int i = 5; i >= 0; i--) {
            buckets.put(currentMonth.minusMonths(i), BigDecimal.ZERO);
        }
        for (Order order : orders) {
            if (order.getCreatedAt() == null) {
                continue;
            }
            YearMonth bucket = YearMonth.from(order.getCreatedAt().atZone(APP_ZONE));
            if (buckets.containsKey(bucket)) {
                buckets.put(bucket, buckets.get(bucket).add(OrderPricingSupport.computeTotalAmount(order)));
            }
        }
        List<AdminDashboardResponse.TrendPoint> points = buckets.entrySet().stream()
                .map(entry -> new AdminDashboardResponse.TrendPoint(
                        MONTH_LABEL_FORMAT.format(entry.getKey()),
                        entry.getValue().setScale(0, RoundingMode.HALF_UP).intValue()
                ))
                .toList();
        return new AdminDashboardResponse.Trend(
                "Doanh thu theo thang",
                "6 thang gan nhat",
                points
        );
    }

    private static BigDecimal revenueBetween(List<Order> orders, Instant startInclusive, Instant endExclusive) {
        return orders.stream()
                .filter(order -> order.getCreatedAt() != null)
                .filter(order -> !order.getCreatedAt().isBefore(startInclusive))
                .filter(order -> order.getCreatedAt().isBefore(endExclusive))
                .map(OrderPricingSupport::computeTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static String formatDelta(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) <= 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? "+100%" : "0%";
        }
        BigDecimal percent = current.subtract(previous)
                .multiply(ONE_HUNDRED)
                .divide(previous, 0, RoundingMode.HALF_UP);
        String prefix = percent.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "";
        return prefix + percent + "%";
    }

    private static int countOrdersByStatus(List<Order> orders, OrderStatus status) {
        return (int) orders.stream().filter(order -> order.getStatus() == status).count();
    }

    private static int safeInt(Integer value) {
        return value == null ? 0 : Math.max(value, 0);
    }

    private static int clampProgress(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private static int toProgress(BigDecimal value, BigDecimal target) {
        if (target == null || target.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return clampProgress(value.multiply(ONE_HUNDRED).divide(target, 0, RoundingMode.HALF_UP).intValue());
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return "";
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static <T> List<T> safeList(List<T> values) {
        return values == null ? List.of() : values;
    }
}
