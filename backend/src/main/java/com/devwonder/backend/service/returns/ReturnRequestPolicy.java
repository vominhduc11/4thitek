package com.devwonder.backend.service.returns;

import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.ReturnRequestItemFinalResolution;
import com.devwonder.backend.entity.enums.ReturnRequestResolution;
import com.devwonder.backend.entity.enums.ReturnRequestType;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.BadRequestException;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ReturnRequestPolicy {

    private static final Set<ProductSerialStatus> LEGACY_ELIGIBLE_SERIAL_STATUSES = EnumSet.of(
            ProductSerialStatus.ASSIGNED,
            ProductSerialStatus.WARRANTY,
            ProductSerialStatus.DEFECTIVE
    );

    private static final Set<ProductSerialStatus> B2B_ELIGIBLE_SERIAL_STATUSES = EnumSet.of(
            ProductSerialStatus.ASSIGNED,
            ProductSerialStatus.DEFECTIVE
    );

    private static final Set<ProductSerialStatus> WARRANTY_RMA_ELIGIBLE_SERIAL_STATUSES = EnumSet.of(
            ProductSerialStatus.ASSIGNED,
            ProductSerialStatus.WARRANTY,
            ProductSerialStatus.DEFECTIVE
    );

    private static final Set<ReturnRequestResolution> WARRANTY_RMA_ALLOWED_REQUESTED_RESOLUTIONS = EnumSet.of(
            ReturnRequestResolution.INSPECT_ONLY,
            ReturnRequestResolution.REPLACE
    );

    private static final Set<ReturnRequestItemFinalResolution> WARRANTY_RMA_ALLOWED_FINAL_RESOLUTIONS = EnumSet.of(
            ReturnRequestItemFinalResolution.REPLACE,
            ReturnRequestItemFinalResolution.REPAIR,
            ReturnRequestItemFinalResolution.RETURN_TO_CUSTOMER,
            ReturnRequestItemFinalResolution.REJECT_WARRANTY
    );

    public void validateCreateEligibility(
            ReturnRequestType type,
            Dealer dealer,
            Order order,
            List<ProductSerial> serials,
            ReturnRequestResolution requestedResolution
    ) {
        if (type == null) {
            throw new BadRequestException("type is required");
        }
        if (dealer == null || dealer.getId() == null) {
            throw new BadRequestException("dealer context is required");
        }
        if (order == null || order.getId() == null) {
            throw new BadRequestException("order context is required");
        }
        if (serials == null || serials.isEmpty()) {
            throw new BadRequestException("items must not be empty");
        }
        validateRequestedResolution(type, requestedResolution);

        for (ProductSerial serial : serials) {
            validateSerialByType(type, dealer, order, serial);
        }
    }

    public void validateRequestedResolution(ReturnRequestType type, ReturnRequestResolution requestedResolution) {
        if (requestedResolution == null) {
            throw new BadRequestException("requestedResolution is required");
        }
        if (type == ReturnRequestType.WARRANTY_RMA
                && !WARRANTY_RMA_ALLOWED_REQUESTED_RESOLUTIONS.contains(requestedResolution)) {
            throw new BadRequestException("WARRANTY_RMA only supports INSPECT_ONLY or REPLACE requested resolution");
        }
    }

    public void validateFinalResolution(ReturnRequestType type, ReturnRequestItemFinalResolution finalResolution) {
        if (type != ReturnRequestType.WARRANTY_RMA || finalResolution == null) {
            return;
        }
        if (!WARRANTY_RMA_ALLOWED_FINAL_RESOLUTIONS.contains(finalResolution)) {
            throw new BadRequestException(
                    "WARRANTY_RMA only allows REPLACE, REPAIR, RETURN_TO_CUSTOMER or REJECT_WARRANTY final resolution"
            );
        }
    }

    public EligibilityDecision evaluateEligibility(
            ReturnRequestType type,
            Dealer dealer,
            Order order,
            ProductSerial serial,
            boolean hasActiveRequest
    ) {
        if (order == null || order.getStatus() != OrderStatus.COMPLETED) {
            return EligibilityDecision.deny(
                    "ORDER_NOT_COMPLETED",
                    "Only completed order serials are eligible for return"
            );
        }
        if (hasActiveRequest) {
            return EligibilityDecision.deny(
                    "ACTIVE_RETURN_REQUEST_EXISTS",
                    "Serial already has an active return request"
            );
        }
        if (serial == null) {
            return EligibilityDecision.deny(
                    "SERIAL_NOT_FOUND",
                    "Serial not found"
            );
        }

        if (type == null) {
            if (!LEGACY_ELIGIBLE_SERIAL_STATUSES.contains(serial.getStatus())) {
                return EligibilityDecision.deny(
                        "SERIAL_STATUS_NOT_ELIGIBLE",
                        "Serial is in a non-returnable state"
                );
            }
            return EligibilityDecision.allow();
        }

        return switch (type) {
            case COMMERCIAL_RETURN, DEFECTIVE_RETURN -> evaluateB2bEligibility(serial);
            case WARRANTY_RMA -> evaluateWarrantyEligibility(dealer, serial);
        };
    }

    private void validateSerialByType(ReturnRequestType type, Dealer dealer, Order order, ProductSerial serial) {
        if (serial == null) {
            throw new BadRequestException("Serial context is missing");
        }
        if (serial.getOrder() == null || !Objects.equals(serial.getOrder().getId(), order.getId())) {
            throw new BadRequestException("Serial " + safeSerial(serial) + " does not belong to order " + order.getOrderCode());
        }

        EligibilityDecision decision = evaluateEligibility(type, dealer, order, serial, false);
        if (!decision.eligible()) {
            throw new BadRequestException("Serial " + safeSerial(serial) + " " + decision.reasonMessage());
        }
    }

    private EligibilityDecision evaluateB2bEligibility(ProductSerial serial) {
        if (hasActiveWarranty(serial)) {
            return EligibilityDecision.deny(
                    "ACTIVE_WARRANTY_EXISTS",
                    "has active warranty; submit WARRANTY_RMA instead"
            );
        }
        if (!B2B_ELIGIBLE_SERIAL_STATUSES.contains(serial.getStatus())) {
            return EligibilityDecision.deny(
                    "SERIAL_STATUS_NOT_ELIGIBLE",
                    "is not eligible for B2B return in current state"
            );
        }
        return EligibilityDecision.allow();
    }

    private EligibilityDecision evaluateWarrantyEligibility(Dealer dealer, ProductSerial serial) {
        if (!WARRANTY_RMA_ELIGIBLE_SERIAL_STATUSES.contains(serial.getStatus())) {
            return EligibilityDecision.deny(
                    "SERIAL_STATUS_NOT_ELIGIBLE",
                    "is not eligible for WARRANTY_RMA in current state"
            );
        }

        WarrantyRegistration warranty = serial.getWarranty();
        if (warranty == null) {
            return EligibilityDecision.deny(
                    "WARRANTY_REQUIRED",
                    "requires an active warranty registration for WARRANTY_RMA"
            );
        }
        if (warranty.getDealer() == null || !Objects.equals(warranty.getDealer().getId(), dealer.getId())) {
            return EligibilityDecision.deny(
                    "WARRANTY_DEALER_MISMATCH",
                    "warranty registration belongs to a different dealer"
            );
        }
        if (warranty.getStatus() != WarrantyStatus.ACTIVE) {
            return EligibilityDecision.deny(
                    "WARRANTY_STATUS_INVALID",
                    "warranty status must be ACTIVE for WARRANTY_RMA"
            );
        }
        if (warranty.getWarrantyEnd() == null || warranty.getWarrantyEnd().isBefore(Instant.now())) {
            return EligibilityDecision.deny(
                    "WARRANTY_EXPIRED",
                    "warranty has expired and is not eligible for WARRANTY_RMA"
            );
        }
        return EligibilityDecision.allow();
    }

    private boolean hasActiveWarranty(ProductSerial serial) {
        WarrantyRegistration warranty = serial.getWarranty();
        if (warranty == null) {
            return false;
        }
        if (warranty.getStatus() != WarrantyStatus.ACTIVE) {
            return false;
        }
        Instant warrantyEnd = warranty.getWarrantyEnd();
        return warrantyEnd == null || !warrantyEnd.isBefore(Instant.now());
    }

    private String safeSerial(ProductSerial serial) {
        return serial.getSerial() == null || serial.getSerial().isBlank()
                ? "#" + serial.getId()
                : serial.getSerial();
    }

    public record EligibilityDecision(
            boolean eligible,
            String reasonCode,
            String reasonMessage
    ) {
        public static EligibilityDecision allow() {
            return new EligibilityDecision(true, "ELIGIBLE", "Serial is eligible for return request");
        }

        public static EligibilityDecision deny(String reasonCode, String reasonMessage) {
            return new EligibilityDecision(false, reasonCode, reasonMessage);
        }
    }
}
