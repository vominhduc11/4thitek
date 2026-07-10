package com.devwonder.backend.service;

import com.devwonder.backend.config.OrderProperties;
import com.devwonder.backend.dto.admin.AdminDashboardResponse;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.BlogStatus;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PublishStatus;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.entity.enums.UnmatchedPaymentStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.BlogRepository;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.FinancialSettlementRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.UnmatchedPaymentRepository;
import com.devwonder.backend.service.support.AdminDashboardSupport;
import com.devwonder.backend.service.support.OrderFinancialSnapshotService;
import com.devwonder.backend.service.support.WarrantyDateSupport;
import java.time.Instant;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final DealerRepository dealerRepository;
    private final BlogRepository blogRepository;
    private final AdminRepository adminRepository;
    private final BulkDiscountRepository bulkDiscountRepository;
    private final AdminSettingsService adminSettingsService;
    private final FinancialSettlementRepository financialSettlementRepository;
    private final UnmatchedPaymentRepository unmatchedPaymentRepository;
    private final OrderProperties orderProperties;
    private final OrderFinancialSnapshotService orderFinancialSnapshotService;

    @Transactional
    public AdminDashboardResponse getDashboard() {
        List<BulkDiscount> activeDiscountRules = activeDiscountRules();
        boolean inventoryAlertsEnabled = adminSettingsService.getEffectiveSettings().inventoryAlerts();
        List<Product> inventoryAlertProducts = inventoryAlertsEnabled
                ? productRepository.findAllActiveBelowStock(11)
                : List.of();
        int lowStockCount = Math.toIntExact(inventoryAlertProducts.stream()
                .filter(AdminDashboardSupport::isLowStockProduct)
                .count());
        int urgentRestockCount = Math.toIntExact(inventoryAlertProducts.stream()
                .filter(AdminDashboardSupport::isUrgentRestockProduct)
                .count());
        Instant dashboardStart = YearMonth.now(WarrantyDateSupport.APP_ZONE)
                .minusMonths(5)
                .atDay(1)
                .atStartOfDay(WarrantyDateSupport.APP_ZONE)
                .toInstant();
        List<Order> revenueOrders = orderRepository.findRevenueOrdersFrom(dashboardStart);
        orderFinancialSnapshotService.ensureSnapshots(revenueOrders, activeDiscountRules, currentVatPercent());
        List<AdminDashboardSupport.TopProductStat> topProducts = orderRepository.findTopProductsForDashboard(
                        OrderStatus.COMPLETED,
                        PageRequest.of(0, 5)
                ).stream()
                .map(this::toDashboardTopProductStat)
                .toList();
        Instant shippingOverdueCutoff = Instant.now()
                .minusSeconds(orderProperties.getConfirmedShippingAlertHours() * 3600L);

        return AdminDashboardSupport.buildDashboard(new AdminDashboardSupport.DashboardSnapshot(
                Math.toIntExact(orderRepository.countVisibleOrders()),
                Math.toIntExact(orderRepository.countVisibleOrdersByStatus(OrderStatus.PENDING)),
                Math.toIntExact(orderRepository.countVisibleOrdersByStatus(OrderStatus.CONFIRMED)),
                Math.toIntExact(orderRepository.countVisibleOrdersByStatus(OrderStatus.SHIPPING)),
                Math.toIntExact(orderRepository.countVisibleOrdersByStatus(OrderStatus.COMPLETED)),
                Math.toIntExact(orderRepository.countVisibleOrdersByStatus(OrderStatus.CANCELLED)),
                Math.toIntExact(productRepository.countActiveProducts()),
                lowStockCount,
                urgentRestockCount,
                Math.toIntExact(dealerRepository.count()),
                Math.toIntExact(dealerRepository.countByCustomerStatus(CustomerStatus.UNDER_REVIEW)),
                Math.toIntExact(adminRepository.count()),
                Math.toIntExact(adminRepository.countByUserStatus(StaffUserStatus.PENDING)),
                Math.toIntExact(productRepository.countActiveProductsByPublishStatus(PublishStatus.PUBLISHED)),
                Math.toIntExact(productRepository.countActiveProducts() - productRepository.countActiveProductsByPublishStatus(PublishStatus.PUBLISHED)),
                Math.toIntExact(blogRepository.countActiveByStatus(BlogStatus.PUBLISHED)),
                Math.toIntExact(blogRepository.countActiveByStatusNot(BlogStatus.PUBLISHED)),
                Math.toIntExact(bulkDiscountRepository.count()),
                Math.toIntExact(bulkDiscountRepository.countByStatus(DiscountRuleStatus.DRAFT)),
                revenueOrders,
                topProducts,
                activeDiscountRules,
                Math.toIntExact(unmatchedPaymentRepository.countByStatus(UnmatchedPaymentStatus.PENDING)),
                Math.toIntExact(financialSettlementRepository.countByStatus(FinancialSettlementStatus.PENDING)),
                Math.toIntExact(orderRepository.countByStaleReviewRequired()),
                Math.toIntExact(orderRepository.countVisibleConfirmedOrdersOlderThan(shippingOverdueCutoff)),
                currentVatPercent()
        ));
    }

    private List<BulkDiscount> activeDiscountRules() {
        return bulkDiscountRepository.findByStatus(DiscountRuleStatus.ACTIVE);
    }

    private int currentVatPercent() {
        return adminSettingsService.getEffectiveSettings().vatPercent();
    }

    private AdminDashboardSupport.TopProductStat toDashboardTopProductStat(Object[] row) {
        String name = firstNonBlank(
                row == null || row.length < 2 ? null : valueAsString(row[1]),
                row == null || row.length < 3 ? null : valueAsString(row[2]),
                "Unknown product"
        );
        long units = row == null || row.length < 4 || row[3] == null
                ? 0L
                : ((Number) row[3]).longValue();
        return new AdminDashboardSupport.TopProductStat(name, units);
    }

    private String valueAsString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
