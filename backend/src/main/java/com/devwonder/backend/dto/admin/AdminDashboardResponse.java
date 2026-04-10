package com.devwonder.backend.dto.admin;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardResponse(
        Metric revenue,
        OrderSummary orders,
        LowStock lowStock,
        List<StatusItem> orderStatus,
        List<TopProduct> topProducts,
        List<SystemItem> system,
        Trend trend,
        int unmatchedPendingCount,
        int settlementPendingCount,
        int staleOrdersCount,
        int shippingOverdueCount
) {
    public record Metric(
            String label,
            BigDecimal value,
            String delta,
            int progress
    ) {
    }

    public record OrderSummary(
            int total,
            int pending,
            int progress
    ) {
    }

    public record LowStock(
            int skus,
            int restock,
            int progress
    ) {
    }

    public record StatusItem(
            String label,
            int value
    ) {
    }

    public record TopProduct(
            String name,
            String units
    ) {
    }

    public record SystemItem(
            String label,
            String value,
            String hint,
            String tone,
            String group
    ) {
    }

    public record Trend(
            String title,
            String subtitle,
            List<TrendPoint> points
    ) {
    }

    public record TrendPoint(
            String label,
            int value
    ) {
    }
}
