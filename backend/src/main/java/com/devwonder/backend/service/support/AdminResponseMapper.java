package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.admin.AdminBlogResponse;
import com.devwonder.backend.dto.admin.AdminDealerAccountResponse;
import com.devwonder.backend.dto.admin.AdminDealerResponse;
import com.devwonder.backend.dto.admin.AdminDiscountRuleResponse;
import com.devwonder.backend.dto.admin.AdminOrderItemResponse;
import com.devwonder.backend.dto.admin.AdminOrderResponse;
import com.devwonder.backend.dto.admin.AdminProductResponse;
import com.devwonder.backend.dto.admin.AdminStaffUserResponse;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Blog;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.CategoryBlog;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public final class AdminResponseMapper {

    private AdminResponseMapper() {
    }

    public static AdminProductResponse toProductResponse(Product product, int availableStock) {
        return new AdminProductResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getShortDescription(),
                product.getImage(),
                product.getDescriptions(),
                product.getVideos(),
                product.getSpecifications(),
                product.getRetailPrice(),
                availableStock,
                product.getWarrantyPeriod(),
                product.getShowOnHomepage(),
                product.getIsFeatured(),
                product.getIsDeleted(),
                product.getPublishStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    public static AdminOrderResponse toOrderResponse(Order order) {
        return toOrderResponse(order, List.of());
    }

    public static AdminOrderResponse toOrderResponse(Order order, List<BulkDiscount> rules) {
        Dealer dealer = order.getDealer();
        List<AdminOrderItemResponse> orderItems = order.getOrderItems() == null
                ? List.of()
                : order.getOrderItems().stream()
                        .filter(item -> item != null && item.getProduct() != null)
                        .map(AdminResponseMapper::toOrderItemResponse)
                        .toList();
        return new AdminOrderResponse(
                order.getId(),
                order.getOrderCode(),
                dealer == null ? null : dealer.getId(),
                dealer == null ? null : firstNonBlank(dealer.getBusinessName(), dealer.getContactName(), dealer.getUsername()),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getPaymentStatus(),
                order.getPaidAmount(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                OrderPricingSupport.computeTotalAmount(order, rules),
                countOrderItems(order),
                order.getReceiverAddress(),
                order.getNote(),
                orderItems,
                order.getStaleReviewRequired()
        );
    }

    private static AdminOrderItemResponse toOrderItemResponse(OrderItem item) {
        Product product = item.getProduct();
        return new AdminOrderItemResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                item.getQuantity(),
                item.getUnitPrice()
        );
    }

    public static AdminDealerResponse toDealerResponse(Dealer dealer) {
        return new AdminDealerResponse(
                dealer.getId(),
                dealer.getUsername(),
                dealer.getBusinessName(),
                dealer.getContactName(),
                dealer.getPhone(),
                dealer.getEmail(),
                dealer.getCity(),
                dealer.getCreatedAt()
        );
    }

    public static AdminBlogResponse toBlogResponse(Blog blog) {
        CategoryBlog categoryBlog = blog.getCategoryBlog();
        return new AdminBlogResponse(
                blog.getId(),
                categoryBlog == null ? null : categoryBlog.getId(),
                categoryBlog == null ? null : categoryBlog.getName(),
                blog.getTitle(),
                blog.getDescription(),
                blog.getImage(),
                blog.getIntroduction(),
                blog.getStatus(),
                blog.getScheduledAt(),
                blog.getShowOnHomepage(),
                blog.getIsDeleted(),
                blog.getCreatedAt(),
                blog.getUpdatedAt()
        );
    }

    public static AdminDealerAccountResponse toDealerAccountResponse(Dealer dealer) {
        return toDealerAccountResponse(dealer, List.of());
    }

    public static AdminDealerAccountResponse toDealerAccountResponse(Dealer dealer, List<BulkDiscount> rules) {
        List<Order> visibleOrders = dealer.getOrders() == null
                ? List.of()
                : dealer.getOrders().stream().filter(AdminDashboardSupport::isVisibleOrder).toList();
        List<Order> revenueOrders = visibleOrders.stream()
                .filter(AdminDashboardSupport::isRevenueOrder)
                .toList();
        Instant lastOrderAt = visibleOrders.stream()
                .map(Order::getCreatedAt)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(dealer.getCreatedAt());
        BigDecimal revenue = revenueOrders.stream()
                .map(order -> OrderPricingSupport.computeTotalAmount(order, rules))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new AdminDealerAccountResponse(
                dealer.getId(),
                firstNonBlank(dealer.getBusinessName(), dealer.getContactName(), dealer.getUsername()),
                dealer.getBusinessName(),
                dealer.getContactName(),
                dealer.getCustomerStatus() == null ? CustomerStatus.ACTIVE : dealer.getCustomerStatus(),
                visibleOrders.size(),
                lastOrderAt,
                revenue,
                dealer.getCreditLimit(),
                dealer.getEmail(),
                dealer.getPhone()
        );
    }

    public static AdminStaffUserResponse toStaffUserResponse(Admin admin) {
        return toStaffUserResponse(admin, null);
    }

    public static AdminStaffUserResponse toStaffUserResponse(Admin admin, String temporaryPassword) {
        return new AdminStaffUserResponse(
                admin.getId(),
                firstNonBlank(admin.getDisplayName(), admin.getUsername()),
                firstNonBlank(admin.getRoleTitle(), "Admin"),
                admin.getUserStatus() == null ? StaffUserStatus.ACTIVE : admin.getUserStatus(),
                admin.getUsername(),
                admin.getEmail(),
                temporaryPassword
        );
    }

    public static AdminDiscountRuleResponse toDiscountRuleResponse(BulkDiscount rule) {
        return new AdminDiscountRuleResponse(
                rule.getId(),
                firstNonBlank(rule.getLabel(), "Rule " + rule.getId()),
                firstNonBlank(rule.getRangeLabel(), buildRangeLabel(rule)),
                rule.getDiscountPercent() == null ? BigDecimal.ZERO : rule.getDiscountPercent(),
                rule.getStatus() == null ? DiscountRuleStatus.ACTIVE : rule.getStatus(),
                rule.getUpdatedAt()
        );
    }

    private static int countOrderItems(Order order) {
        if (order == null || order.getOrderItems() == null) {
            return 0;
        }
        return order.getOrderItems().stream().mapToInt(item -> safeInt(item.getQuantity())).sum();
    }

    private static int safeInt(Integer value) {
        return value == null ? 0 : Math.max(value, 0);
    }

    private static String buildRangeLabel(BulkDiscount rule) {
        Integer min = rule.getMinQuantity();
        Integer max = rule.getMaxQuantity();
        if (min == null && max == null) {
            return "Theo cau hinh";
        }
        if (min != null && max != null) {
            return min + " - " + max;
        }
        if (min != null) {
            return ">=" + min;
        }
        return "<=" + max;
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
}
