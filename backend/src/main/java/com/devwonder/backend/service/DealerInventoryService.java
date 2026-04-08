package com.devwonder.backend.service;

import com.devwonder.backend.dto.dealer.DealerInventorySerialDetailResponse;
import com.devwonder.backend.dto.dealer.DealerInventorySerialResponse;
import com.devwonder.backend.dto.dealer.DealerInventorySummaryItemResponse;
import com.devwonder.backend.dto.dealer.DealerInventorySummaryResponse;
import com.devwonder.backend.dto.dealer.DealerInventoryTimelineEntryResponse;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DealerInventoryService {

    private final ProductSerialRepository productSerialRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public DealerInventorySummaryResponse getInventorySummary(Long dealerId) {
        List<ProductSerial> serials = productSerialRepository.findInventoryByDealerId(dealerId);
        Map<Long, InventoryAccumulator> grouped = new java.util.LinkedHashMap<>();

        for (ProductSerial serial : serials) {
            Product product = serial.getProduct();
            if (product == null || product.getId() == null) {
                continue;
            }
            InventoryAccumulator accumulator = grouped.computeIfAbsent(
                    product.getId(),
                    ignored -> new InventoryAccumulator(product, serial.getImportedAt())
            );
            accumulator.include(serial);
        }

        List<DealerInventorySummaryItemResponse> items = grouped.values().stream()
                .map(InventoryAccumulator::toResponse)
                .sorted(Comparator.comparing(DealerInventorySummaryItemResponse::latestImportedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(DealerInventorySummaryItemResponse::productName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        int totalSerials = items.stream().mapToInt(DealerInventorySummaryItemResponse::totalSerials).sum();
        int readySerials = items.stream().mapToInt(DealerInventorySummaryItemResponse::readySerials).sum();
        int warrantySerials = items.stream().mapToInt(DealerInventorySummaryItemResponse::warrantySerials).sum();
        int issueSerials = items.stream().mapToInt(DealerInventorySummaryItemResponse::issueSerials).sum();

        return new DealerInventorySummaryResponse(
                items.size(),
                totalSerials,
                readySerials,
                warrantySerials,
                issueSerials,
                items
        );
    }

    @Transactional(readOnly = true)
    public List<DealerInventorySerialResponse> getInventorySerials(Long dealerId, Long productId, ProductSerialStatus status) {
        return productSerialRepository.findInventoryByDealerId(dealerId).stream()
                .filter(serial -> productId == null || (serial.getProduct() != null && Objects.equals(serial.getProduct().getId(), productId)))
                .filter(serial -> status == null || status == serial.getStatus())
                .map(this::toSerialResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DealerInventorySerialDetailResponse getInventorySerialDetail(Long dealerId, Long serialId) {
        ProductSerial serial = productSerialRepository.findInventoryByIdAndDealerId(serialId, dealerId)
                .orElseThrow(() -> new ResourceNotFoundException("Serial not found"));
        return new DealerInventorySerialDetailResponse(toSerialResponse(serial), buildTimeline(serial));
    }

    private DealerInventorySerialResponse toSerialResponse(ProductSerial serial) {
        Product product = serial.getProduct();
        Order order = serial.getOrder();
        WarrantyRegistration warranty = serial.getWarranty();
        return new DealerInventorySerialResponse(
                serial.getId(),
                serial.getSerial(),
                serial.getStatus(),
                product == null ? null : product.getId(),
                product == null ? null : product.getName(),
                product == null ? null : product.getSku(),
                order == null ? null : order.getId(),
                order == null ? null : order.getOrderCode(),
                serial.getWarehouseId(),
                serial.getWarehouseName(),
                serial.getImportedAt(),
                warranty == null ? null : warranty.getCustomerName()
        );
    }

    private List<DealerInventoryTimelineEntryResponse> buildTimeline(ProductSerial serial) {
        List<DealerInventoryTimelineEntryResponse> timeline = new ArrayList<>();
        timeline.add(new DealerInventoryTimelineEntryResponse(
                "imported",
                "Nhập serial vào hệ thống",
                buildImportDescription(serial),
                serial.getImportedAt()
        ));

        Order order = serial.getOrder();
        if (order != null) {
            timeline.add(new DealerInventoryTimelineEntryResponse(
                    "order_linked",
                    "Gắn với đơn hàng đại lý",
                    "Serial được liên kết với đơn hàng %s.".formatted(safeValue(order.getOrderCode(), "#" + order.getId())),
                    order.getCreatedAt()
            ));
            if (order.getCompletedAt() != null) {
                timeline.add(new DealerInventoryTimelineEntryResponse(
                        "dealer_owned",
                        "Đại lý hoàn tất tiếp nhận",
                        "Đơn hàng %s đã hoàn tất, serial được tính vào tồn kho đã sở hữu.".formatted(
                                safeValue(order.getOrderCode(), "#" + order.getId())
                        ),
                        order.getCompletedAt()
                ));
            }
        }

        WarrantyRegistration warranty = serial.getWarranty();
        if (warranty != null) {
            timeline.add(new DealerInventoryTimelineEntryResponse(
                    "warranty_registered",
                    "Kích hoạt bảo hành",
                    "Serial đã được kích hoạt bảo hành cho khách hàng %s.".formatted(
                            safeValue(warranty.getCustomerName(), "không xác định")
                    ),
                    firstNonNull(warranty.getWarrantyStart(), warranty.getCreatedAt())
            ));
        }

        timeline.add(new DealerInventoryTimelineEntryResponse(
                "current_status",
                "Trạng thái hiện tại",
                "Serial hiện ở trạng thái %s.".formatted(serial.getStatus() == null ? "UNKNOWN" : serial.getStatus().name()),
                resolveCurrentStatusTimestamp(serial)
        ));
        return timeline.stream()
                .sorted(Comparator.comparing(DealerInventoryTimelineEntryResponse::occurredAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private Instant resolveCurrentStatusTimestamp(ProductSerial serial) {
        if (serial.getWarranty() != null) {
            return firstNonNull(serial.getWarranty().getUpdatedAt(), serial.getWarranty().getWarrantyStart(), serial.getImportedAt());
        }
        if (serial.getOrder() != null) {
            return firstNonNull(serial.getOrder().getCompletedAt(), serial.getOrder().getUpdatedAt(), serial.getImportedAt());
        }
        return serial.getImportedAt();
    }

    private String buildImportDescription(ProductSerial serial) {
        List<String> parts = new ArrayList<>();
        if (serial.getWarehouseName() != null && !serial.getWarehouseName().isBlank()) {
            parts.add("Kho: " + serial.getWarehouseName().trim());
        }
        if (serial.getWarehouseId() != null && !serial.getWarehouseId().isBlank()) {
            parts.add("Mã kho: " + serial.getWarehouseId().trim());
        }
        return parts.isEmpty() ? "Serial được nhập vào hệ thống tồn kho." : String.join(" • ", parts);
    }

    private Instant firstNonNull(Instant... candidates) {
        for (Instant candidate : candidates) {
            if (candidate != null) {
                return candidate;
            }
        }
        return null;
    }

    private String safeValue(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }

    private final class InventoryAccumulator {
        private final Product product;
        private final LinkedHashSet<String> orderCodes = new LinkedHashSet<>();
        private int totalSerials;
        private int readySerials;
        private int warrantySerials;
        private int issueSerials;
        private Instant latestImportedAt;

        private InventoryAccumulator(Product product, Instant latestImportedAt) {
            this.product = product;
            this.latestImportedAt = latestImportedAt;
        }

        private void include(ProductSerial serial) {
            totalSerials++;
            if (isReadyStatus(serial.getStatus())) {
                readySerials++;
            } else if (serial.getStatus() == ProductSerialStatus.WARRANTY) {
                warrantySerials++;
            } else {
                issueSerials++;
            }

            if (serial.getImportedAt() != null
                    && (latestImportedAt == null || serial.getImportedAt().isAfter(latestImportedAt))) {
                latestImportedAt = serial.getImportedAt();
            }
            if (serial.getOrder() != null && serial.getOrder().getOrderCode() != null) {
                orderCodes.add(serial.getOrder().getOrderCode());
            }
        }

        private DealerInventorySummaryItemResponse toResponse() {
            return new DealerInventorySummaryItemResponse(
                    product.getId(),
                    product.getName(),
                    product.getSku(),
                    extractImage(product),
                    totalSerials,
                    readySerials,
                    warrantySerials,
                    issueSerials,
                    latestImportedAt,
                    List.copyOf(orderCodes)
            );
        }
    }

    private boolean isReadyStatus(ProductSerialStatus status) {
        return status == ProductSerialStatus.AVAILABLE || status == ProductSerialStatus.ASSIGNED;
    }

    private String extractImage(Product product) {
        if (product == null || product.getImage() == null || product.getImage().isEmpty()) {
            return null;
        }
        Object imageUrl = product.getImage().get("imageUrl");
        if (imageUrl != null) {
            return imageUrl.toString();
        }
        try {
            return objectMapper.writeValueAsString(product.getImage());
        } catch (JsonProcessingException ex) {
            return null;
        }
    }
}
