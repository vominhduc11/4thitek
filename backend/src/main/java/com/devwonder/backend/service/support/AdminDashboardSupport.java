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
        List<Order> revenueOrders = activeOrders.stream()
                .filter(AdminDashboardSupport::isRevenueOrder)
                .toList();
        List<Product> activeProducts = safeList(products).stream()
                .filter(AdminDashboardSupport::isActiveProduct)
                .toList();
        List<BulkDiscount> allRules = safeList(rules);
        List<BulkDiscount> activeRules = allRules.stream()
                .filter(rule -> rule != null && rule.getStatus() == DiscountRuleStatus.ACTIVE)
                .toList();

        return buildDashboard(new DashboardSnapshot(
                activeOrders.size(),
                countOrdersByStatus(activeOrders, OrderStatus.PENDING),
                countOrdersByStatus(activeOrders, OrderStatus.CONFIRMED),
                countOrdersByStatus(activeOrders, OrderStatus.SHIPPING),
                countOrdersByStatus(activeOrders, OrderStatus.COMPLETED),
                countOrdersByStatus(activeOrders, OrderStatus.CANCELLED),
                activeProducts.size(),
                Math.toIntExact(activeProducts.stream().filter(product -> safeInt(product.getStock()) < 10).count()),
                Math.toIntExact(activeProducts.stream().filter(product -> safeInt(product.getStock()) < 5).count()),
                safeList(dealers).size(),
                (int) safeList(dealers).stream()
                        .filter(dealer -> dealer.getCustomerStatus() == CustomerStatus.UNDER_REVIEW)
                        .count(),
                safeList(admins).size(),
                (int) safeList(admins).stream()
                        .filter(admin -> admin.getUserStatus() == StaffUserStatus.PENDING)
                        .count(),
                (int) activeProducts.stream()
                        .filter(product -> product.getPublishStatus() == PublishStatus.PUBLISHED)
                        .count(),
                (int) activeProducts.stream()
                        .filter(product -> product.getPublishStatus() != PublishStatus.PUBLISHED)
                        .count(),
                (int) safeList(blogs).stream()
                        .filter(blog -> isActiveBlog(blog) && blog.getStatus() == BlogStatus.PUBLISHED)
                        .count(),
                (int) safeList(blogs).stream()
                        .filter(blog -> isActiveBlog(blog) && blog.getStatus() != BlogStatus.PUBLISHED)
                        .count(),
                allRules.size(),
                (int) allRules.stream()
                        .filter(rule -> rule != null && rule.getStatus() == DiscountRuleStatus.PENDING)
                        .count(),
                revenueOrders,
                aggregateTopProducts(revenueOrders),
                activeRules,
                0,
                0,
                0
        ));
    }

    public static AdminDashboardResponse buildDashboard(DashboardSnapshot snapshot) {
        DashboardSnapshot safeSnapshot = snapshot == null ? DashboardSnapshot.empty() : snapshot;
        List<Order> revenueOrders = safeList(safeSnapshot.revenueOrders());
        List<BulkDiscount> activeRules = safeList(safeSnapshot.activeRules());

        Instant now = Instant.now();
        BigDecimal current30 = revenueBetween(revenueOrders, now.minusSeconds(60L * 60 * 24 * 30), now, activeRules);
        BigDecimal previous30 = revenueBetween(
                revenueOrders,
                now.minusSeconds(60L * 60 * 24 * 60),
                now.minusSeconds(60L * 60 * 24 * 30),
                activeRules
        );
        BigDecimal progressTarget = previous30.compareTo(BigDecimal.ZERO) > 0
                ? previous30
                : current30.compareTo(BigDecimal.ZERO) > 0
                ? current30
                : BigDecimal.ONE;

        return new AdminDashboardResponse(
                new AdminDashboardResponse.Metric(
                        "Doanh thu 30 ngay",
                        current30,
                        formatDelta(current30, previous30),
                        toProgress(current30, progressTarget)
                ),
                new AdminDashboardResponse.OrderSummary(
                        safeSnapshot.totalOrders(),
                        safeSnapshot.pendingOrders(),
                        safeSnapshot.totalOrders() <= 0
                                ? 0
                                : clampProgress((safeSnapshot.pendingOrders() * 100) / safeSnapshot.totalOrders())
                ),
                new AdminDashboardResponse.LowStock(
                        safeSnapshot.lowStockSkus(),
                        safeSnapshot.urgentRestock(),
                        safeSnapshot.activeProductCount() <= 0
                                ? 0
                                : clampProgress((safeSnapshot.lowStockSkus() * 100) / safeSnapshot.activeProductCount())
                ),
                List.of(
                        new AdminDashboardResponse.StatusItem("Cho xu ly", safeSnapshot.pendingOrders()),
                        new AdminDashboardResponse.StatusItem("Xac nhan", safeSnapshot.confirmedOrders()),
                        new AdminDashboardResponse.StatusItem("Dang giao", safeSnapshot.shippingOrders()),
                        new AdminDashboardResponse.StatusItem("Hoan tat", safeSnapshot.completedOrders()),
                        new AdminDashboardResponse.StatusItem("Huy", safeSnapshot.cancelledOrders())
                ),
                buildTopProducts(safeSnapshot.topProducts()),
                buildSystemItems(safeSnapshot),
                buildTrend(revenueOrders, activeRules),
                safeSnapshot.unmatchedPendingCount(),
                safeSnapshot.settlementPendingCount(),
                safeSnapshot.staleOrdersCount()
        );
    }

    public static boolean isVisibleOrder(Order order) {
        return order != null && !Boolean.TRUE.equals(order.getIsDeleted());
    }

    public static boolean isRevenueOrder(Order order) {
        return isVisibleOrder(order) && order.getStatus() == OrderStatus.COMPLETED;
    }

    public static Instant resolveRevenueTimestamp(Order order) {
        if (order == null) {
            return null;
        }
        if (order.getCompletedAt() != null) {
            return order.getCompletedAt();
        }
        if (order.getStatus() == OrderStatus.COMPLETED && order.getUpdatedAt() != null) {
            return order.getUpdatedAt();
        }
        return order.getCreatedAt();
    }

    public static List<TopProductStat> aggregateTopProducts(List<Order> orders) {
        Map<ProductKey, Integer> byProduct = new HashMap<>();
        for (Order order : safeList(orders)) {
            if (order == null || order.getOrderItems() == null) {
                continue;
            }
            for (OrderItem item : order.getOrderItems()) {
                Product product = item == null ? null : item.getProduct();
                String label = product == null
                        ? "Unknown product"
                        : firstNonBlank(product.getName(), product.getSku(), "Unknown product");
                ProductKey key = new ProductKey(product == null ? null : product.getId(), label);
                byProduct.merge(key, safeInt(item == null ? null : item.getQuantity()), Integer::sum);
            }
        }
        return byProduct.entrySet().stream()
                .sorted(Map.Entry.<ProductKey, Integer>comparingByValue().reversed())
                .limit(5)
                .map(entry -> new TopProductStat(entry.getKey().label(), entry.getValue()))
                .toList();
    }

    private static List<AdminDashboardResponse.TopProduct> buildTopProducts(List<TopProductStat> topProducts) {
        return safeList(topProducts).stream()
                .map(item -> new AdminDashboardResponse.TopProduct(item.name(), item.units() + " sp"))
                .toList();
    }

    private static List<AdminDashboardResponse.SystemItem> buildSystemItems(DashboardSnapshot snapshot) {
        return List.of(
                new AdminDashboardResponse.SystemItem(
                        "Dai ly",
                        snapshot.totalDealers() + " tai khoan",
                        snapshot.pendingDealers() + " dang xem xet",
                        snapshot.pendingDealers() > 0 ? "warn" : "good",
                        "sales"
                ),
                new AdminDashboardResponse.SystemItem(
                        "Chiet khau ban si",
                        snapshot.totalRules() + " quy tac",
                        snapshot.pendingRules() + " cho phe duyet",
                        snapshot.pendingRules() > 0 ? "warn" : "neutral",
                        "sales"
                ),
                new AdminDashboardResponse.SystemItem(
                        "San pham",
                        snapshot.publishedProducts() + " dang ban",
                        snapshot.draftProducts() + " ban nhap",
                        "neutral",
                        "sales"
                ),
                new AdminDashboardResponse.SystemItem(
                        "Quan tri",
                        snapshot.totalAdmins() + " tai khoan",
                        snapshot.pendingAdmins() + " cho kich hoat",
                        snapshot.pendingAdmins() > 0 ? "warn" : "neutral",
                        "ops"
                ),
                new AdminDashboardResponse.SystemItem(
                        "Bai viet",
                        snapshot.publishedBlogs() + " da dang",
                        snapshot.draftBlogs() + " ban nhap",
                        "neutral",
                        "ops"
                )
        );
    }

    private static AdminDashboardResponse.Trend buildTrend(List<Order> orders, List<BulkDiscount> rules) {
        LinkedHashMap<YearMonth, BigDecimal> buckets = new LinkedHashMap<>();
        YearMonth currentMonth = YearMonth.now(APP_ZONE);
        for (int i = 5; i >= 0; i--) {
            buckets.put(currentMonth.minusMonths(i), BigDecimal.ZERO);
        }
        for (Order order : safeList(orders)) {
            Instant revenueTimestamp = resolveRevenueTimestamp(order);
            if (revenueTimestamp == null) {
                continue;
            }
            YearMonth bucket = YearMonth.from(revenueTimestamp.atZone(APP_ZONE));
            if (buckets.containsKey(bucket)) {
                buckets.put(bucket, buckets.get(bucket).add(OrderPricingSupport.computeTotalAmount(order, rules)));
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

    private static BigDecimal revenueBetween(
            List<Order> orders,
            Instant startInclusive,
            Instant endExclusive,
            List<BulkDiscount> rules
    ) {
        return safeList(orders).stream()
                .filter(order -> {
                    Instant revenueTimestamp = resolveRevenueTimestamp(order);
                    return revenueTimestamp != null
                            && !revenueTimestamp.isBefore(startInclusive)
                            && revenueTimestamp.isBefore(endExclusive);
                })
                .map(order -> OrderPricingSupport.computeTotalAmount(order, rules))
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
        return (int) safeList(orders).stream().filter(order -> order.getStatus() == status).count();
    }

    private static boolean isActiveProduct(Product product) {
        return product != null && !Boolean.TRUE.equals(product.getIsDeleted());
    }

    private static boolean isActiveBlog(Blog blog) {
        return blog != null && !Boolean.TRUE.equals(blog.getIsDeleted());
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

    public record TopProductStat(String name, long units) {
    }

    public record DashboardSnapshot(
            int totalOrders,
            int pendingOrders,
            int confirmedOrders,
            int shippingOrders,
            int completedOrders,
            int cancelledOrders,
            int activeProductCount,
            int lowStockSkus,
            int urgentRestock,
            int totalDealers,
            int pendingDealers,
            int totalAdmins,
            int pendingAdmins,
            int publishedProducts,
            int draftProducts,
            int publishedBlogs,
            int draftBlogs,
            int totalRules,
            int pendingRules,
            List<Order> revenueOrders,
            List<TopProductStat> topProducts,
            List<BulkDiscount> activeRules,
            int unmatchedPendingCount,
            int settlementPendingCount,
            int staleOrdersCount
    ) {
        public static DashboardSnapshot empty() {
            return new DashboardSnapshot(
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    List.of(),
                    List.of(),
                    List.of(),
                    0,
                    0,
                    0
            );
        }
    }

    private record ProductKey(Long id, String label) {
    }
}
