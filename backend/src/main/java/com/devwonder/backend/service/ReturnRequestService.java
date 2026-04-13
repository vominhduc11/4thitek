package com.devwonder.backend.service;

import com.devwonder.backend.dto.admin.AdminCompleteReturnRequest;
import com.devwonder.backend.dto.admin.AdminInspectReturnItemRequest;
import com.devwonder.backend.dto.admin.AdminReceiveReturnRequest;
import com.devwonder.backend.dto.admin.AdminReviewReturnItemDecision;
import com.devwonder.backend.dto.admin.AdminReviewReturnRequest;
import com.devwonder.backend.dto.dealer.CreateDealerReturnRequest;
import com.devwonder.backend.dto.dealer.CreateDealerSupportTicketRequest;
import com.devwonder.backend.dto.dealer.DealerReturnRequestAttachmentPayload;
import com.devwonder.backend.dto.dealer.DealerReturnRequestItemPayload;
import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.dto.returns.ReturnEligibilityResponse;
import com.devwonder.backend.dto.returns.ReturnRequestAttachmentResponse;
import com.devwonder.backend.dto.returns.ReturnRequestDetailResponse;
import com.devwonder.backend.dto.returns.ReturnRequestEventResponse;
import com.devwonder.backend.dto.returns.ReturnRequestItemResponse;
import com.devwonder.backend.dto.returns.ReturnRequestSummaryResponse;
import com.devwonder.backend.dto.support.SupportTicketContextPayload;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.DealerSupportTicket;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.OrderItem;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.ReturnRequest;
import com.devwonder.backend.entity.ReturnRequestAttachment;
import com.devwonder.backend.entity.ReturnRequestEvent;
import com.devwonder.backend.entity.ReturnRequestItem;
import com.devwonder.backend.entity.enums.DealerSupportCategory;
import com.devwonder.backend.entity.enums.DealerSupportPriority;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.ReturnRequestItemFinalResolution;
import com.devwonder.backend.entity.enums.ReturnRequestItemStatus;
import com.devwonder.backend.entity.enums.ReturnRequestStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.ReturnRequestItemRepository;
import com.devwonder.backend.repository.ReturnRequestRepository;
import com.devwonder.backend.service.support.DealerPortalLookupSupport;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReturnRequestService {

    private static final Logger log = LoggerFactory.getLogger(ReturnRequestService.class);

    private static final Set<ReturnRequestStatus> ACTIVE_REQUEST_STATUSES = EnumSet.of(
            ReturnRequestStatus.SUBMITTED,
            ReturnRequestStatus.UNDER_REVIEW,
            ReturnRequestStatus.APPROVED,
            ReturnRequestStatus.AWAITING_RECEIPT,
            ReturnRequestStatus.RECEIVED,
            ReturnRequestStatus.INSPECTING,
            ReturnRequestStatus.PARTIALLY_RESOLVED
    );

    private static final Set<ReturnRequestItemStatus> TERMINAL_ITEM_STATUSES = EnumSet.of(
            ReturnRequestItemStatus.REJECTED,
            ReturnRequestItemStatus.RESTOCKED,
            ReturnRequestItemStatus.SCRAPPED,
            ReturnRequestItemStatus.REPLACED,
            ReturnRequestItemStatus.CREDITED
    );

    private static final Set<ReturnRequestItemStatus> FINAL_OUTCOME_ITEM_STATUSES = EnumSet.of(
            ReturnRequestItemStatus.RESTOCKED,
            ReturnRequestItemStatus.SCRAPPED,
            ReturnRequestItemStatus.REPLACED,
            ReturnRequestItemStatus.CREDITED
    );

    private final DealerPortalLookupSupport dealerPortalLookupSupport;
    private final ReturnRequestRepository returnRequestRepository;
    private final ReturnRequestItemRepository returnRequestItemRepository;
    private final ProductSerialRepository productSerialRepository;
    private final DealerSupportTicketService dealerSupportTicketService;
    private final DealerSupportTicketRepository dealerSupportTicketRepository;
    private final AdminRmaService adminRmaService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public PagedResponse<ReturnRequestSummaryResponse> getDealerReturnsPage(
            String username,
            Pageable pageable,
            com.devwonder.backend.entity.enums.ReturnRequestStatus status,
            com.devwonder.backend.entity.enums.ReturnRequestType type,
            String orderCode,
            String serialQuery
    ) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        Page<ReturnRequestSummaryResponse> page = returnRequestRepository.findDealerPage(
                dealer.getId(),
                status,
                type,
                toLikeParam(orderCode),
                toLikeParam(serialQuery),
                pageable
        ).map(this::toSummaryResponse);
        return PagedResponse.from(page, pageable.getSort().isSorted()
                ? pageable.getSort().iterator().next().getProperty()
                : "createdAt");
    }

    @Transactional(readOnly = true)
    public ReturnRequestDetailResponse getDealerReturnDetail(String username, Long requestId) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        ReturnRequest request = returnRequestRepository.findDetailByIdAndDealerId(requestId, dealer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Return request not found"));
        return toDetailResponse(request);
    }

    @Transactional
    public ReturnRequestDetailResponse createDealerReturnRequest(String username, CreateDealerReturnRequest payload) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        Order order = dealerPortalLookupSupport.requireDealerOrderForUpdate(dealer.getId(), payload.orderId());
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new BadRequestException("Only completed orders can be used to create a return request");
        }
        if (payload.items() == null || payload.items().isEmpty()) {
            throw new BadRequestException("items must not be empty");
        }

        Set<Long> seenSerialIds = new HashSet<>();
        List<ProductSerial> serials = new ArrayList<>();
        Map<Long, ReturnRequestItem> itemBySerialId = new HashMap<>();
        for (DealerReturnRequestItemPayload itemPayload : payload.items()) {
            Long serialId = itemPayload.productSerialId();
            if (!seenSerialIds.add(serialId)) {
                throw new BadRequestException("Duplicate serial detected in request payload: " + serialId);
            }
            ProductSerial serial = productSerialRepository.findInventoryByIdAndDealerId(serialId, dealer.getId())
                    .orElseThrow(() -> new BadRequestException("Serial not owned by dealer: " + serialId));
            if (serial.getOrder() == null || !Objects.equals(serial.getOrder().getId(), order.getId())) {
                throw new BadRequestException("Serial " + serial.getSerial() + " does not belong to order " + order.getOrderCode());
            }
            if (serial.getStatus() == ProductSerialStatus.RETURNED
                    || serial.getStatus() == ProductSerialStatus.INSPECTING
                    || serial.getStatus() == ProductSerialStatus.SCRAPPED) {
                throw new BadRequestException("Serial " + serial.getSerial() + " is not eligible for return in current state");
            }
            serials.add(serial);
        }

        rejectActiveDuplicateSerials(serials.stream().map(ProductSerial::getId).toList());

        ReturnRequest request = new ReturnRequest();
        request.setRequestCode(generateRequestCode());
        request.setDealer(dealer);
        request.setOrder(order);
        request.setType(payload.type());
        request.setStatus(ReturnRequestStatus.SUBMITTED);
        request.setRequestedResolution(payload.requestedResolution());
        request.setReasonCode(trimOrNull(payload.reasonCode()));
        request.setReasonDetail(trimOrNull(payload.reasonDetail()));
        request.setRequestedAt(Instant.now());
        request.setCreatedBy(username);
        request.setUpdatedBy(username);

        for (int index = 0; index < payload.items().size(); index++) {
            DealerReturnRequestItemPayload itemPayload = payload.items().get(index);
            ProductSerial serial = serials.get(index);
            ReturnRequestItem item = new ReturnRequestItem();
            item.setOrderItem(resolveOrderItem(order, serial.getProduct() == null ? null : serial.getProduct().getId()));
            item.setProduct(serial.getProduct());
            item.setProductSerial(serial);
            item.setSerialSnapshot(serial.getSerial());
            item.setItemStatus(ReturnRequestItemStatus.REQUESTED);
            item.setConditionOnRequest(itemPayload.conditionOnRequest());
            request.addItem(item);
            itemBySerialId.put(serial.getId(), item);
        }

        if (payload.attachments() != null) {
            for (DealerReturnRequestAttachmentPayload attachmentPayload : payload.attachments()) {
                ReturnRequestAttachment attachment = new ReturnRequestAttachment();
                attachment.setUrl(attachmentPayload.url().trim());
                attachment.setFileName(trimOrNull(attachmentPayload.fileName()));
                attachment.setCategory(attachmentPayload.category());
                if (attachmentPayload.itemId() != null) {
                    ReturnRequestItem linkedItem = itemBySerialId.get(attachmentPayload.itemId());
                    if (linkedItem == null) {
                        throw new BadRequestException("Attachment itemId must match one of request item serial ids");
                    }
                    attachment.setItem(linkedItem);
                }
                request.addAttachment(attachment);
            }
        }

        request.setSupportTicket(maybeCreateLinkedSupportTicket(username, order, payload, serials));
        appendEvent(request, "REQUEST_SUBMITTED", username, "DEALER", Map.of(
                "orderId", order.getId(),
                "orderCode", order.getOrderCode(),
                "itemCount", request.getItems().size(),
                "type", request.getType().name(),
                "requestedResolution", request.getRequestedResolution().name()
        ));

        ReturnRequest saved = returnRequestRepository.save(request);
        return toDetailResponse(saved);
    }

    @Transactional
    public ReturnRequestDetailResponse cancelDealerReturnRequest(String username, Long requestId) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        ReturnRequest request = returnRequestRepository.findDetailByIdAndDealerId(requestId, dealer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Return request not found"));
        if (request.getStatus() == ReturnRequestStatus.CANCELLED || request.getStatus() == ReturnRequestStatus.COMPLETED) {
            throw new BadRequestException("Return request is already closed");
        }
        if (request.getStatus() == ReturnRequestStatus.RECEIVED
                || request.getStatus() == ReturnRequestStatus.INSPECTING
                || request.getStatus() == ReturnRequestStatus.PARTIALLY_RESOLVED) {
            throw new BadRequestException("Return request cannot be cancelled after warehouse processing has started");
        }
        request.setStatus(ReturnRequestStatus.CANCELLED);
        request.setUpdatedBy(username);
        appendEvent(request, "REQUEST_CANCELLED", username, "DEALER", Map.of(
                "requestId", request.getId(),
                "requestCode", request.getRequestCode()
        ));
        return toDetailResponse(returnRequestRepository.save(request));
    }

    @Transactional(readOnly = true)
    public List<ReturnEligibilityResponse> getOrderEligibleSerials(String username, Long orderId) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        Order order = dealerPortalLookupSupport.requireDealerOrder(dealer.getId(), orderId);
        List<ProductSerial> serials = productSerialRepository.findInventoryByDealerId(dealer.getId()).stream()
                .filter(serial -> serial.getOrder() != null && Objects.equals(serial.getOrder().getId(), order.getId()))
                .toList();
        Set<Long> serialIds = serials.stream().map(ProductSerial::getId).collect(java.util.stream.Collectors.toSet());
        Map<Long, String> activeRefs = resolveActiveRequestRefBySerialId(serialIds);
        List<ReturnEligibilityResponse> responses = new ArrayList<>(serials.size());
        for (ProductSerial serial : serials) {
            responses.add(toEligibilityResponse(serial, order, activeRefs.get(serial.getId())));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public ReturnEligibilityResponse getSerialEligibility(String username, Long serialId) {
        Dealer dealer = dealerPortalLookupSupport.requireDealerByUsername(username);
        ProductSerial serial = productSerialRepository.findInventoryByIdAndDealerId(serialId, dealer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Serial not found"));
        Order order = serial.getOrder();
        String activeRef = resolveActiveRequestRefBySerialId(Set.of(serial.getId())).get(serial.getId());
        return toEligibilityResponse(serial, order, activeRef);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReturnRequestSummaryResponse> getAdminReturnsPage(
            Pageable pageable,
            ReturnRequestStatus status,
            com.devwonder.backend.entity.enums.ReturnRequestType type,
            String dealerQuery,
            String orderCode,
            String serialQuery
    ) {
        Page<ReturnRequestSummaryResponse> page = returnRequestRepository.findAdminPage(
                status,
                type,
                toLikeParam(dealerQuery),
                toLikeParam(orderCode),
                toLikeParam(serialQuery),
                pageable
        ).map(this::toSummaryResponse);
        return PagedResponse.from(page, pageable.getSort().isSorted()
                ? pageable.getSort().iterator().next().getProperty()
                : "createdAt");
    }

    @Transactional(readOnly = true)
    public ReturnRequestDetailResponse getAdminReturnDetail(Long requestId) {
        ReturnRequest request = returnRequestRepository.findDetailById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Return request not found"));
        return toDetailResponse(request);
    }

    @Transactional
    public ReturnRequestDetailResponse reviewReturnRequest(Long requestId, AdminReviewReturnRequest payload, String actorUsername) {
        ReturnRequest request = requireAdminEditableRequest(requestId);
        if (request.getStatus() == ReturnRequestStatus.CANCELLED || request.getStatus() == ReturnRequestStatus.COMPLETED) {
            throw new BadRequestException("Closed return request cannot be reviewed");
        }

        Map<Long, ReturnRequestItem> itemsById = request.getItems().stream()
                .collect(java.util.stream.Collectors.toMap(ReturnRequestItem::getId, item -> item));
        for (AdminReviewReturnItemDecision decision : payload.decisions()) {
            ReturnRequestItem item = itemsById.get(decision.itemId());
            if (item == null) {
                throw new BadRequestException("Return item not found in request: " + decision.itemId());
            }
            if (item.getItemStatus() != ReturnRequestItemStatus.REQUESTED
                    && item.getItemStatus() != ReturnRequestItemStatus.APPROVED) {
                throw new BadRequestException("Return item is not reviewable in current state: " + item.getItemStatus());
            }
            item.setAdminDecisionNote(trimOrNull(decision.decisionNote()));
            item.setItemStatus(decision.approved() ? ReturnRequestItemStatus.APPROVED : ReturnRequestItemStatus.REJECTED);
        }

        request.setReviewedAt(Instant.now());
        request.setUpdatedBy(actorUsername);
        request.setStatus(resolveStatusAfterReview(request, payload.awaitingReceipt()));
        appendEvent(request, "REQUEST_REVIEWED", actorUsername, "ADMIN", Map.of(
                "requestId", request.getId(),
                "requestCode", request.getRequestCode(),
                "decisionCount", payload.decisions().size(),
                "status", request.getStatus().name()
        ));
        return toDetailResponse(returnRequestRepository.save(request));
    }

    @Transactional
    public ReturnRequestDetailResponse receiveReturnRequest(Long requestId, AdminReceiveReturnRequest payload, String actorUsername) {
        ReturnRequest request = requireAdminEditableRequest(requestId);
        if (request.getStatus() != ReturnRequestStatus.APPROVED
                && request.getStatus() != ReturnRequestStatus.AWAITING_RECEIPT
                && request.getStatus() != ReturnRequestStatus.PARTIALLY_RESOLVED
                && request.getStatus() != ReturnRequestStatus.RECEIVED) {
            throw new BadRequestException("Request is not ready for warehouse receipt");
        }

        Set<Long> explicitItemIds = payload.itemIds() == null
                ? Set.of()
                : payload.itemIds().stream().filter(Objects::nonNull).collect(java.util.stream.Collectors.toSet());

        boolean anyUpdated = false;
        for (ReturnRequestItem item : request.getItems()) {
            boolean selected = explicitItemIds.isEmpty() || explicitItemIds.contains(item.getId());
            if (!selected || item.getItemStatus() != ReturnRequestItemStatus.APPROVED) {
                continue;
            }
            item.setItemStatus(ReturnRequestItemStatus.RECEIVED);
            ProductSerial serial = item.getProductSerial();
            if (serial != null) {
                serial.setStatus(ProductSerialStatus.RETURNED);
                productSerialRepository.save(serial);
            }
            anyUpdated = true;
        }
        if (!anyUpdated) {
            throw new BadRequestException("No APPROVED items selected for receipt");
        }

        request.setReceivedAt(Instant.now());
        request.setUpdatedBy(actorUsername);
        request.setStatus(resolveStatusFromItems(request));
        Map<String, Object> eventPayload = new HashMap<>();
        eventPayload.put("requestId", request.getId());
        eventPayload.put("requestCode", request.getRequestCode());
        if (!explicitItemIds.isEmpty()) {
            eventPayload.put("itemIds", explicitItemIds);
        }
        String note = trimOrNull(payload.note());
        if (note != null) {
            eventPayload.put("note", note);
        }
        appendEvent(request, "REQUEST_RECEIVED", actorUsername, "ADMIN", eventPayload);
        return toDetailResponse(returnRequestRepository.save(request));
    }

    @Transactional
    public ReturnRequestDetailResponse inspectReturnItem(
            Long requestId,
            Long itemId,
            AdminInspectReturnItemRequest payload,
            String actorUsername
    ) {
        ReturnRequest request = requireAdminEditableRequest(requestId);
        ReturnRequestItem item = request.getItems().stream()
                .filter(candidate -> Objects.equals(candidate.getId(), itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Return item not found"));
        if (payload.rmaAction() == null) {
            throw new BadRequestException("rmaAction is required");
        }
        if (item.getItemStatus() != ReturnRequestItemStatus.RECEIVED
                && item.getItemStatus() != ReturnRequestItemStatus.INSPECTING
                && item.getItemStatus() != ReturnRequestItemStatus.QC_FAILED
                && item.getItemStatus() != ReturnRequestItemStatus.QC_PASSED) {
            throw new BadRequestException("Return item is not inspectable in current state: " + item.getItemStatus());
        }
        if (item.getProductSerial() == null) {
            throw new BadRequestException("Return item is missing serial linkage");
        }

        String reason = trimOrNull(payload.reason());
        if (reason == null) {
            throw new BadRequestException("reason is required for inspection");
        }
        validateInspectPayload(payload);

        adminRmaService.applyRmaAction(
                item.getProductSerial().getId(),
                new com.devwonder.backend.dto.admin.AdminRmaRequest(payload.rmaAction(), reason, payload.proofUrls()),
                actorUsername
        );

        item.setInspectionNote(reason);
        if (payload.rmaAction() == com.devwonder.backend.dto.admin.AdminRmaRequest.RmaAction.START_INSPECTION) {
            item.setItemStatus(ReturnRequestItemStatus.INSPECTING);
        } else {
            ReturnRequestItemFinalResolution finalResolution = payload.finalResolution();
            if (finalResolution == null) {
                finalResolution = payload.rmaAction() == com.devwonder.backend.dto.admin.AdminRmaRequest.RmaAction.PASS_QC
                        ? ReturnRequestItemFinalResolution.RESTOCK
                        : ReturnRequestItemFinalResolution.SCRAP;
            }
            applyFinalResolution(item, finalResolution, payload.replacementOrderId(), payload.refundAmount(), payload.creditAmount());
        }

        request.setUpdatedBy(actorUsername);
        request.setStatus(resolveStatusFromItems(request));
        Map<String, Object> eventPayload = new HashMap<>();
        eventPayload.put("requestId", request.getId());
        eventPayload.put("requestCode", request.getRequestCode());
        eventPayload.put("itemId", item.getId());
        eventPayload.put("serial", item.getSerialSnapshot());
        eventPayload.put("rmaAction", payload.rmaAction().name());
        eventPayload.put("itemStatus", item.getItemStatus().name());
        if (item.getFinalResolution() != null) {
            eventPayload.put("finalResolution", item.getFinalResolution().name());
        }
        appendEvent(request, "ITEM_INSPECTED", actorUsername, "ADMIN", eventPayload);
        return toDetailResponse(returnRequestRepository.save(request));
    }

    @Transactional
    public ReturnRequestDetailResponse completeReturnRequest(
            Long requestId,
            AdminCompleteReturnRequest payload,
            String actorUsername
    ) {
        ReturnRequest request = requireAdminEditableRequest(requestId);
        if (request.getStatus() == ReturnRequestStatus.CANCELLED) {
            throw new BadRequestException("Cancelled request cannot be completed");
        }
        List<ReturnRequestItem> unresolved = request.getItems().stream()
                .filter(item -> !TERMINAL_ITEM_STATUSES.contains(item.getItemStatus()))
                .toList();
        if (!unresolved.isEmpty()) {
            throw new BadRequestException("All return items must be resolved before completing request");
        }

        request.setStatus(ReturnRequestStatus.COMPLETED);
        request.setCompletedAt(Instant.now());
        request.setUpdatedBy(actorUsername);
        Map<String, Object> eventPayload = new HashMap<>();
        eventPayload.put("requestId", request.getId());
        eventPayload.put("requestCode", request.getRequestCode());
        String note = trimOrNull(payload.note());
        if (note != null) {
            eventPayload.put("note", note);
        }
        appendEvent(request, "REQUEST_COMPLETED", actorUsername, "ADMIN", eventPayload);
        return toDetailResponse(returnRequestRepository.save(request));
    }

    private ReturnRequest requireAdminEditableRequest(Long requestId) {
        return returnRequestRepository.findDetailById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Return request not found"));
    }

    private void applyFinalResolution(
            ReturnRequestItem item,
            ReturnRequestItemFinalResolution finalResolution,
            Long replacementOrderId,
            BigDecimal refundAmount,
            BigDecimal creditAmount
    ) {
        item.setFinalResolution(finalResolution);
        item.setReplacementOrderId(null);
        item.setRefundAmount(null);
        item.setCreditAmount(null);
        switch (finalResolution) {
            case RESTOCK -> item.setItemStatus(ReturnRequestItemStatus.RESTOCKED);
            case REPLACE -> {
                if (replacementOrderId == null || replacementOrderId <= 0) {
                    throw new BadRequestException("replacementOrderId is required for REPLACE resolution");
                }
                item.setItemStatus(ReturnRequestItemStatus.REPLACED);
                item.setReplacementOrderId(replacementOrderId);
            }
            case CREDIT_NOTE -> {
                if (creditAmount == null || creditAmount.signum() <= 0) {
                    throw new BadRequestException("creditAmount must be greater than 0 for CREDIT_NOTE resolution");
                }
                item.setItemStatus(ReturnRequestItemStatus.CREDITED);
                item.setCreditAmount(creditAmount);
            }
            case REFUND -> {
                if (refundAmount == null || refundAmount.signum() <= 0) {
                    throw new BadRequestException("refundAmount must be greater than 0 for REFUND resolution");
                }
                item.setItemStatus(ReturnRequestItemStatus.CREDITED);
                item.setRefundAmount(refundAmount);
            }
            case SCRAP -> item.setItemStatus(ReturnRequestItemStatus.SCRAPPED);
        }
    }

    private void validateInspectPayload(AdminInspectReturnItemRequest payload) {
        if (payload.rmaAction() == com.devwonder.backend.dto.admin.AdminRmaRequest.RmaAction.START_INSPECTION) {
            if (payload.finalResolution() != null
                    || payload.replacementOrderId() != null
                    || payload.refundAmount() != null
                    || payload.creditAmount() != null) {
                throw new BadRequestException(
                        "START_INSPECTION does not accept final resolution or settlement fields"
                );
            }
            return;
        }

        ReturnRequestItemFinalResolution requestedFinalResolution = payload.finalResolution();
        if (payload.rmaAction() == com.devwonder.backend.dto.admin.AdminRmaRequest.RmaAction.PASS_QC
                && requestedFinalResolution == ReturnRequestItemFinalResolution.SCRAP) {
            throw new BadRequestException("PASS_QC cannot use SCRAP final resolution");
        }
        if (payload.rmaAction() == com.devwonder.backend.dto.admin.AdminRmaRequest.RmaAction.SCRAP
                && requestedFinalResolution != null
                && requestedFinalResolution != ReturnRequestItemFinalResolution.SCRAP) {
            throw new BadRequestException("SCRAP action requires SCRAP final resolution");
        }
    }

    private ReturnRequestStatus resolveStatusAfterReview(ReturnRequest request, Boolean awaitingReceipt) {
        long requestedCount = request.getItems().stream().filter(item -> item.getItemStatus() == ReturnRequestItemStatus.REQUESTED).count();
        long approvedCount = request.getItems().stream().filter(item -> item.getItemStatus() == ReturnRequestItemStatus.APPROVED).count();
        long rejectedCount = request.getItems().stream().filter(item -> item.getItemStatus() == ReturnRequestItemStatus.REJECTED).count();
        if (rejectedCount == request.getItems().size()) {
            return ReturnRequestStatus.REJECTED;
        }
        if (approvedCount > 0 && requestedCount == 0) {
            return Boolean.FALSE.equals(awaitingReceipt)
                    ? ReturnRequestStatus.APPROVED
                    : ReturnRequestStatus.AWAITING_RECEIPT;
        }
        return ReturnRequestStatus.UNDER_REVIEW;
    }

    private ReturnRequestStatus resolveStatusFromItems(ReturnRequest request) {
        if (request.getItems().stream().allMatch(item -> item.getItemStatus() == ReturnRequestItemStatus.REJECTED)) {
            return ReturnRequestStatus.REJECTED;
        }
        long resolvedOutcomeCount = request.getItems().stream()
                .filter(item -> FINAL_OUTCOME_ITEM_STATUSES.contains(item.getItemStatus()))
                .count();
        if (resolvedOutcomeCount > 0) {
            return ReturnRequestStatus.PARTIALLY_RESOLVED;
        }
        if (request.getItems().stream().anyMatch(item ->
                item.getItemStatus() == ReturnRequestItemStatus.INSPECTING
                        || item.getItemStatus() == ReturnRequestItemStatus.QC_PASSED
                        || item.getItemStatus() == ReturnRequestItemStatus.QC_FAILED)) {
            return ReturnRequestStatus.INSPECTING;
        }
        if (request.getItems().stream().anyMatch(item -> item.getItemStatus() == ReturnRequestItemStatus.RECEIVED)) {
            return ReturnRequestStatus.RECEIVED;
        }
        if (request.getItems().stream().anyMatch(item -> item.getItemStatus() == ReturnRequestItemStatus.APPROVED)) {
            return ReturnRequestStatus.AWAITING_RECEIPT;
        }
        if (request.getItems().stream().allMatch(item -> item.getItemStatus() == ReturnRequestItemStatus.REQUESTED)) {
            return request.getReviewedAt() == null ? ReturnRequestStatus.SUBMITTED : ReturnRequestStatus.UNDER_REVIEW;
        }
        return ReturnRequestStatus.UNDER_REVIEW;
    }

    private void rejectActiveDuplicateSerials(List<Long> serialIds) {
        List<Object[]> refs = returnRequestItemRepository.findActiveSerialRequestRefs(serialIds, ACTIVE_REQUEST_STATUSES);
        if (!refs.isEmpty()) {
            Object[] first = refs.get(0);
            Long serialId = first[0] instanceof Number number ? number.longValue() : null;
            Long activeRequestId = first[1] instanceof Number number ? number.longValue() : null;
            String activeRequestCode = first[2] == null ? null : first[2].toString();
            throw new BadRequestException(
                    "Serial " + serialId + " already has an active return request "
                            + (activeRequestCode == null ? "#" + activeRequestId : activeRequestCode)
            );
        }
    }

    private Map<Long, String> resolveActiveRequestRefBySerialId(Collection<Long> serialIds) {
        if (serialIds == null || serialIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, String> refs = new HashMap<>();
        for (Object[] row : returnRequestItemRepository.findActiveSerialRequestRefs(serialIds, ACTIVE_REQUEST_STATUSES)) {
            Long serialId = row[0] instanceof Number number ? number.longValue() : null;
            Long requestId = row[1] instanceof Number number ? number.longValue() : null;
            String requestCode = row[2] == null ? null : row[2].toString();
            if (serialId == null) {
                continue;
            }
            refs.put(serialId, requestCode == null ? "#" + requestId : requestCode);
        }
        return refs;
    }

    private ReturnEligibilityResponse toEligibilityResponse(ProductSerial serial, Order order, String activeRequestCode) {
        boolean orderCompleted = order != null && order.getStatus() == OrderStatus.COMPLETED;
        boolean statusAllowed = serial.getStatus() != ProductSerialStatus.RETURNED
                && serial.getStatus() != ProductSerialStatus.INSPECTING
                && serial.getStatus() != ProductSerialStatus.SCRAPPED;
        boolean noActiveRequest = activeRequestCode == null;
        boolean eligible = orderCompleted && statusAllowed && noActiveRequest;
        String reasonCode;
        String reasonMessage;
        if (!orderCompleted) {
            reasonCode = "ORDER_NOT_COMPLETED";
            reasonMessage = "Only completed order serials are eligible for return";
        } else if (!statusAllowed) {
            reasonCode = "SERIAL_STATUS_NOT_ELIGIBLE";
            reasonMessage = "Serial is in a non-returnable state";
        } else if (!noActiveRequest) {
            reasonCode = "ACTIVE_RETURN_REQUEST_EXISTS";
            reasonMessage = "Serial already has an active return request";
        } else {
            reasonCode = "ELIGIBLE";
            reasonMessage = "Serial is eligible for return request";
        }
        return new ReturnEligibilityResponse(
                serial.getId(),
                serial.getSerial(),
                order == null ? null : order.getId(),
                order == null ? null : order.getOrderCode(),
                serial.getProduct() == null ? null : serial.getProduct().getId(),
                serial.getProduct() == null ? null : serial.getProduct().getName(),
                serial.getProduct() == null ? null : serial.getProduct().getSku(),
                eligible,
                reasonCode,
                reasonMessage,
                activeRequestCode == null ? null : extractRequestId(activeRequestCode),
                activeRequestCode
        );
    }

    private Long extractRequestId(String requestCodeOrRef) {
        if (requestCodeOrRef == null || requestCodeOrRef.isBlank()) {
            return null;
        }
        if (!requestCodeOrRef.startsWith("#")) {
            return null;
        }
        try {
            return Long.parseLong(requestCodeOrRef.substring(1));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private DealerSupportTicket maybeCreateLinkedSupportTicket(
            String username,
            Order order,
            CreateDealerReturnRequest payload,
            List<ProductSerial> serials
    ) {
        String message = "Return request created for order "
                + safeValue(order.getOrderCode(), "#" + order.getId())
                + " with " + serials.size() + " serial(s). Requested resolution: "
                + payload.requestedResolution().name()
                + (payload.reasonDetail() == null || payload.reasonDetail().isBlank()
                ? ""
                : ". Detail: " + payload.reasonDetail().trim());
        message = message.length() > 500 ? message.substring(0, 500) : message;
        String subject = "Return request " + safeValue(order.getOrderCode(), "#" + order.getId());
        subject = subject.length() > 80 ? subject.substring(0, 80) : subject;
        String serialPreview = serials.stream()
                .map(ProductSerial::getSerial)
                .filter(Objects::nonNull)
                .limit(1)
                .findFirst()
                .orElse(null);
        try {
            var support = dealerSupportTicketService.createTicket(username, new CreateDealerSupportTicketRequest(
                    DealerSupportCategory.RETURN,
                    DealerSupportPriority.NORMAL,
                    subject,
                    message,
                    new SupportTicketContextPayload(
                            order.getOrderCode(),
                            null,
                            null,
                            null,
                            serialPreview,
                            trimOrNull(payload.reasonDetail())
                    ),
                    List.of()
            ));
            if (support == null || support.id() == null) {
                return null;
            }
            return dealerSupportTicketRepository.findById(support.id()).orElse(null);
        } catch (RuntimeException ex) {
            log.warn("Unable to create linked support ticket for return request orderId={}: {}", order.getId(), ex.getMessage());
            return null;
        }
    }

    private OrderItem resolveOrderItem(Order order, Long productId) {
        if (order == null || order.getOrderItems() == null || productId == null) {
            return null;
        }
        return order.getOrderItems().stream()
                .filter(item -> item.getProduct() != null && Objects.equals(item.getProduct().getId(), productId))
                .findFirst()
                .orElse(null);
    }

    private void appendEvent(ReturnRequest request, String eventType, String actor, String actorRole, Map<String, Object> payload) {
        ReturnRequestEvent event = new ReturnRequestEvent();
        event.setEventType(eventType);
        event.setActor(trimOrNull(actor));
        event.setActorRole(actorRole);
        event.setPayloadJson(writeJson(payload));
        request.addEvent(event);
    }

    private String writeJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private ReturnRequestSummaryResponse toSummaryResponse(ReturnRequest request) {
        int totalItems = request.getItems().size();
        int requestedItems = (int) request.getItems().stream()
                .filter(item -> item.getItemStatus() == ReturnRequestItemStatus.REQUESTED)
                .count();
        int approvedItems = (int) request.getItems().stream()
                .filter(item -> item.getItemStatus() == ReturnRequestItemStatus.APPROVED
                        || item.getItemStatus() == ReturnRequestItemStatus.RECEIVED
                        || item.getItemStatus() == ReturnRequestItemStatus.INSPECTING
                        || item.getItemStatus() == ReturnRequestItemStatus.QC_PASSED
                        || item.getItemStatus() == ReturnRequestItemStatus.QC_FAILED)
                .count();
        int rejectedItems = (int) request.getItems().stream()
                .filter(item -> item.getItemStatus() == ReturnRequestItemStatus.REJECTED)
                .count();
        int resolvedItems = (int) request.getItems().stream()
                .filter(item -> TERMINAL_ITEM_STATUSES.contains(item.getItemStatus()))
                .count();
        return new ReturnRequestSummaryResponse(
                request.getId(),
                request.getRequestCode(),
                request.getDealer() == null ? null : request.getDealer().getId(),
                resolveDealerName(request.getDealer()),
                request.getOrder() == null ? null : request.getOrder().getId(),
                request.getOrder() == null ? null : request.getOrder().getOrderCode(),
                request.getType(),
                request.getStatus(),
                request.getRequestedResolution(),
                request.getReasonCode(),
                request.getReasonDetail(),
                request.getSupportTicket() == null ? null : request.getSupportTicket().getId(),
                request.getRequestedAt(),
                request.getReviewedAt(),
                request.getReceivedAt(),
                request.getCompletedAt(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                totalItems,
                requestedItems,
                approvedItems,
                rejectedItems,
                resolvedItems
        );
    }

    private ReturnRequestDetailResponse toDetailResponse(ReturnRequest request) {
        List<ReturnRequestItemResponse> items = request.getItems().stream()
                .map(item -> new ReturnRequestItemResponse(
                        item.getId(),
                        item.getOrderItem() == null ? null : item.getOrderItem().getId(),
                        item.getProduct() == null ? null : item.getProduct().getId(),
                        item.getProduct() == null ? null : item.getProduct().getName(),
                        item.getProduct() == null ? null : item.getProduct().getSku(),
                        item.getProductSerial() == null ? null : item.getProductSerial().getId(),
                        item.getSerialSnapshot(),
                        item.getItemStatus(),
                        item.getConditionOnRequest(),
                        item.getAdminDecisionNote(),
                        item.getInspectionNote(),
                        item.getFinalResolution(),
                        item.getReplacementOrderId(),
                        item.getRefundAmount(),
                        item.getCreditAmount()
                ))
                .toList();
        List<ReturnRequestAttachmentResponse> attachments = request.getAttachments().stream()
                .map(attachment -> new ReturnRequestAttachmentResponse(
                        attachment.getId(),
                        attachment.getItem() == null ? null : attachment.getItem().getId(),
                        attachment.getUrl(),
                        attachment.getFileName(),
                        attachment.getCategory()
                ))
                .toList();
        List<ReturnRequestEventResponse> events = request.getEvents().stream()
                .map(event -> new ReturnRequestEventResponse(
                        event.getId(),
                        event.getEventType(),
                        event.getActor(),
                        event.getActorRole(),
                        event.getPayloadJson(),
                        event.getCreatedAt()
                ))
                .toList();
        return new ReturnRequestDetailResponse(
                request.getId(),
                request.getRequestCode(),
                request.getDealer() == null ? null : request.getDealer().getId(),
                resolveDealerName(request.getDealer()),
                request.getOrder() == null ? null : request.getOrder().getId(),
                request.getOrder() == null ? null : request.getOrder().getOrderCode(),
                request.getType(),
                request.getStatus(),
                request.getRequestedResolution(),
                request.getReasonCode(),
                request.getReasonDetail(),
                request.getSupportTicket() == null ? null : request.getSupportTicket().getId(),
                request.getRequestedAt(),
                request.getReviewedAt(),
                request.getReceivedAt(),
                request.getCompletedAt(),
                request.getCreatedBy(),
                request.getUpdatedBy(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                items,
                attachments,
                events
        );
    }

    private String resolveDealerName(Dealer dealer) {
        if (dealer == null) {
            return null;
        }
        return firstNonBlank(dealer.getBusinessName(), dealer.getContactName(), dealer.getUsername(), dealer.getEmail());
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private String generateRequestCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = "RET-" + Instant.now().toEpochMilli() + "-"
                    + ThreadLocalRandom.current().nextInt(100, 1000);
            if (!returnRequestRepository.existsByRequestCode(code)) {
                return code;
            }
        }
        throw new BadRequestException("Unable to generate unique return request code");
    }

    private String toLikeParam(String value) {
        String normalized = trimOrNull(value);
        return normalized == null ? null : "%" + normalized.toLowerCase(Locale.ROOT) + "%";
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String safeValue(String value, String fallback) {
        String normalized = trimOrNull(value);
        return normalized == null ? fallback : normalized;
    }
}
