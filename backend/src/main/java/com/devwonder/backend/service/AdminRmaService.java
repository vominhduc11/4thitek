package com.devwonder.backend.service;

import com.devwonder.backend.dto.admin.AdminRmaRequest;
import com.devwonder.backend.dto.admin.AdminSerialResponse;
import com.devwonder.backend.entity.AuditLog;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.support.ProductStockSyncSupport;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles the RMA lifecycle for product serials.
 *
 * Allowed transitions (BUSINESS_LOGIC.md Section 7.3):
 *   START_INSPECTION : DEFECTIVE | RETURNED → INSPECTING
 *   PASS_QC          : INSPECTING → AVAILABLE  (requires reason + at least 1 proofUrl)
 *   SCRAP            : INSPECTING → SCRAPPED   (requires reason)
 *
 * Only ADMIN / SUPER_ADMIN may call these endpoints.
 * Every action is recorded in the audit log.
 */
@Service
@RequiredArgsConstructor
public class AdminRmaService {

    private static final Logger log = LoggerFactory.getLogger(AdminRmaService.class);

    private static final Set<ProductSerialStatus> START_INSPECTION_ALLOWED = EnumSet.of(
            ProductSerialStatus.DEFECTIVE,
            ProductSerialStatus.RETURNED
    );

    private final ProductSerialRepository productSerialRepository;
    private final WarrantyRegistrationRepository warrantyRegistrationRepository;
    private final AuditLogService auditLogService;
    private final ProductStockSyncSupport productStockSyncSupport;

    @Transactional
    public AdminSerialResponse applyRmaAction(Long serialId, AdminRmaRequest request, String actorUsername) {
        ProductSerial serial = productSerialRepository.findById(serialId)
                .orElseThrow(() -> new ResourceNotFoundException("Serial not found: " + serialId));

        String reason = request.reason() == null ? null : request.reason().trim();
        List<String> proofUrls = request.proofUrls() == null ? List.of() : request.proofUrls();
        if (reason == null || reason.isBlank()) {
            throw new BadRequestException("reason is required for RMA action");
        }

        ProductSerialStatus previousStatus = serial.getStatus();
        ProductSerialStatus newStatus;

        switch (request.action()) {
            case START_INSPECTION -> {
                if (!START_INSPECTION_ALLOWED.contains(previousStatus)) {
                    throw new BadRequestException(
                            "START_INSPECTION is only allowed for DEFECTIVE or RETURNED serials. Current status: " + previousStatus
                    );
                }
                newStatus = ProductSerialStatus.INSPECTING;
            }
            case PASS_QC -> {
                if (previousStatus != ProductSerialStatus.INSPECTING) {
                    throw new BadRequestException(
                            "PASS_QC is only allowed for INSPECTING serials. Current status: " + previousStatus
                    );
                }
                if (proofUrls == null || proofUrls.isEmpty()) {
                    throw new BadRequestException("At least one proofUrl is required for PASS_QC action");
                }
                newStatus = ProductSerialStatus.AVAILABLE;
            }
            case SCRAP -> {
                if (previousStatus != ProductSerialStatus.INSPECTING) {
                    throw new BadRequestException(
                            "SCRAP is only allowed for INSPECTING serials. Current status: " + previousStatus
                    );
                }
                newStatus = ProductSerialStatus.SCRAPPED;
            }
            default -> throw new BadRequestException("Unknown RMA action: " + request.action());
        }

        if (newStatus == ProductSerialStatus.AVAILABLE) {
            applyPassQcSideEffects(serial);
        }
        serial.setStatus(newStatus);
        ProductSerial saved = productSerialRepository.save(serial);

        if (newStatus == ProductSerialStatus.AVAILABLE) {
            productStockSyncSupport.syncProductStock(saved.getProduct());
        }

        // Audit log entry
        AuditLog auditLog = new AuditLog();
        auditLog.setActor(actorUsername);
        auditLog.setActorRole("ADMIN");
        auditLog.setAction("RMA_" + request.action().name());
        auditLog.setRequestMethod("PATCH");
        auditLog.setRequestPath("/api/v1/admin/serials/" + serialId + "/rma");
        auditLog.setEntityType("ProductSerial");
        auditLog.setEntityId(String.valueOf(serialId));
        auditLog.setPayload(
                "{\"serialId\":" + serialId
                + ",\"serial\":\"" + (saved.getSerial() != null ? saved.getSerial() : "") + "\""
                + ",\"action\":\"" + request.action().name() + "\""
                + ",\"previousStatus\":\"" + previousStatus + "\""
                + ",\"newStatus\":\"" + newStatus + "\""
                + ",\"reason\":\"" + escapeJson(reason) + "\""
                + ",\"proofUrls\":" + toJsonArray(proofUrls) + "}"
        );
        auditLogService.save(auditLog);

        log.info("RMA action={} applied to serial id={}, {} → {} by {}",
                request.action(), serialId, previousStatus, newStatus, actorUsername);

        return toSerialResponse(saved);
    }

    private AdminSerialResponse toSerialResponse(ProductSerial serial) {
        Product product = serial.getProduct();
        Dealer dealer = serial.getDealer();
        Order order = serial.getOrder();
        WarrantyRegistration warranty = serial.getWarranty();
        Dealer pendingDealer = dealer == null && order != null ? order.getDealer() : null;
        return new AdminSerialResponse(
                serial.getId(),
                serial.getSerial(),
                serial.getStatus(),
                product == null ? null : product.getId(),
                product == null ? null : product.getName(),
                product == null ? null : product.getSku(),
                dealer == null ? null : dealer.getId(),
                dealer == null ? null : firstNonBlank(
                        dealer.getBusinessName(), dealer.getContactName(), dealer.getUsername()),
                pendingDealer == null ? null : pendingDealer.getId(),
                pendingDealer == null ? null : firstNonBlank(
                        pendingDealer.getBusinessName(), pendingDealer.getContactName(), pendingDealer.getUsername()),
                warranty == null ? null : warranty.getCustomerName(),
                order == null ? null : order.getId(),
                order == null ? null : order.getOrderCode(),
                serial.getWarehouseId(),
                serial.getWarehouseName(),
                serial.getImportedAt()
        );
    }

    private void applyPassQcSideEffects(ProductSerial serial) {
        serial.setDealer(null);
        serial.setOrder(null);
        WarrantyRegistration warranty = serial.getWarranty();
        if (warranty == null) {
            return;
        }
        warranty.setStatus(WarrantyStatus.VOID);
        warrantyRegistrationRepository.save(warranty);
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return null;
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String toJsonArray(List<String> values) {
        return values.stream()
                .map(value -> "\"" + escapeJson(value) + "\"")
                .collect(java.util.stream.Collectors.joining(",", "[", "]"));
    }
}
