package com.devwonder.backend.service;

import com.devwonder.backend.dto.dealer.CreateDealerSupportTicketMessageRequest;
import com.devwonder.backend.dto.dealer.CreateDealerSupportTicketRequest;
import com.devwonder.backend.dto.dealer.DealerSupportTicketResponse;
import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.dto.realtime.AdminNewSupportTicketEvent;
import com.devwonder.backend.dto.support.SupportTicketMessageResponse;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.DealerSupportTicket;
import com.devwonder.backend.entity.SupportTicketMessage;
import com.devwonder.backend.entity.enums.MediaType;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.SupportTicketMessageAuthorRole;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.service.support.AppMessageSupport;
import com.devwonder.backend.service.support.SupportTicketPayloadSupport;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Service
@RequiredArgsConstructor
public class DealerSupportTicketService {

    private static final Logger log = LoggerFactory.getLogger(DealerSupportTicketService.class);

    private final DealerRepository dealerRepository;
    private final DealerSupportTicketRepository dealerSupportTicketRepository;
    private final NotificationService notificationService;
    private final AppMessageSupport appMessageSupport;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final SupportTicketPayloadSupport supportTicketPayloadSupport;
    private final MediaAssetService mediaAssetService;

    @Transactional(readOnly = true)
    public DealerSupportTicketResponse getLatestTicket(String username) {
        Dealer dealer = requireDealerByUsername(username);
        return dealerSupportTicketRepository.findTopByDealerIdOrderByCreatedAtDesc(dealer.getId())
                .map(ticket -> toResponse(ticket, dealer))
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Page<DealerSupportTicketResponse> getTickets(String username, Pageable pageable) {
        Dealer dealer = requireDealerByUsername(username);
        return dealerSupportTicketRepository.findByDealerIdOrderByCreatedAtDesc(dealer.getId(), pageable)
                .map(ticket -> toResponse(ticket, dealer));
    }

    @Transactional(readOnly = true)
    public DealerSupportTicketResponse getTicketById(String username, Long ticketId) {
        Dealer dealer = requireDealerByUsername(username);
        DealerSupportTicket ticket = requireTicketForDealer(ticketId, dealer.getId());
        return toResponse(ticket, dealer);
    }

    @Transactional
    public DealerSupportTicketResponse createTicket(String username, CreateDealerSupportTicketRequest request) {
        return createTicketInternal(username, request, false);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public DealerSupportTicketResponse createTicketBestEffort(String username, CreateDealerSupportTicketRequest request) {
        try {
            return createTicketInternal(username, request, true);
        } catch (RuntimeException ex) {
            log.warn("Unable to create support ticket in best-effort mode for username={}: {}", username, ex.getMessage());
            return null;
        }
    }

    private DealerSupportTicketResponse createTicketInternal(
            String username,
            CreateDealerSupportTicketRequest request,
            boolean suppressSideEffectsError
    ) {
        Dealer dealer = requireDealerByUsername(username);
        DealerSupportTicket ticket = new DealerSupportTicket();
        ticket.setDealer(dealer);
        ticket.setTicketCode(buildUniqueTicketCode());
        ticket.setCategory(request.category());
        ticket.setPriority(request.priority());
        ticket.setStatus(DealerSupportTicketStatus.OPEN);
        ticket.setSubject(request.subject().trim());
        ticket.setMessage(request.message().trim());
        ticket.setContextData(supportTicketPayloadSupport.writeContext(request.contextData()));
        SupportTicketMessage initialMessage = buildDealerMessage(dealer, request.message(), request.attachments());
        ticket.addMessage(initialMessage);

        DealerSupportTicket saved = dealerSupportTicketRepository.saveAndFlush(ticket);
        SupportTicketMessage persistedInitialMessage = saved.getMessages().isEmpty()
                ? null
                : saved.getMessages().get(saved.getMessages().size() - 1);
        mediaAssetService.attachAssetsToSupportMessage(
                dealer,
                saved,
                persistedInitialMessage,
                request.mediaAssetIds(),
                countLegacyAttachments(request.attachments()),
                countLegacyVideos(request.attachments())
        );
        dealerSupportTicketRepository.save(saved);
        publishTicketCreatedSideEffects(saved, dealer, suppressSideEffectsError);
        return toResponse(saved, dealer);
    }

    @Transactional
    public DealerSupportTicketResponse addDealerMessage(
            String username,
            Long ticketId,
            CreateDealerSupportTicketMessageRequest request
    ) {
        Dealer dealer = requireDealerByUsername(username);
        DealerSupportTicket ticket = dealerSupportTicketRepository.findById(ticketId)
                .filter(candidate -> candidate.getDealer() != null && Objects.equals(candidate.getDealer().getId(), dealer.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found"));

        if (ticket.getStatus() == DealerSupportTicketStatus.CLOSED) {
            throw new ResourceNotFoundException("Support ticket is closed");
        }

        if (ticket.getStatus() == DealerSupportTicketStatus.RESOLVED) {
            ticket.setStatus(DealerSupportTicketStatus.IN_PROGRESS);
            ticket.setResolvedAt(null);
            ticket.setClosedAt(null);
        }

        SupportTicketMessage followUpMessage = buildDealerMessage(dealer, request.message(), request.attachments());
        ticket.addMessage(followUpMessage);
        ticket.setMessage(resolveFirstDealerMessage(ticket.getMessages()));

        DealerSupportTicket saved = dealerSupportTicketRepository.saveAndFlush(ticket);
        SupportTicketMessage persistedMessage = saved.getMessages().isEmpty()
                ? null
                : saved.getMessages().get(saved.getMessages().size() - 1);
        mediaAssetService.attachAssetsToSupportMessage(
                dealer,
                saved,
                persistedMessage,
                request.mediaAssetIds(),
                countLegacyAttachments(request.attachments()),
                countLegacyVideos(request.attachments())
        );
        dealerSupportTicketRepository.save(saved);
        webSocketEventPublisher.publishAdminNewSupportTicket(new AdminNewSupportTicketEvent(
                saved.getId(),
                saved.getTicketCode(),
                dealer.getId(),
                dealer.getBusinessName(),
                saved.getCategory(),
                saved.getPriority(),
                saved.getSubject(),
                saved.getUpdatedAt()
        ));
        return toResponse(saved, dealer);
    }

    private Dealer requireDealerByUsername(String username) {
        return dealerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found"));
    }

    private DealerSupportTicket requireTicketForDealer(Long ticketId, Long dealerId) {
        return dealerSupportTicketRepository.findById(ticketId)
                .filter(candidate -> candidate.getDealer() != null
                        && Objects.equals(candidate.getDealer().getId(), dealerId))
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found"));
    }

    private void publishTicketCreatedSideEffects(
            DealerSupportTicket ticket,
            Dealer dealer,
            boolean suppressErrors
    ) {
        try {
            webSocketEventPublisher.publishAdminNewSupportTicket(new AdminNewSupportTicketEvent(
                    ticket.getId(),
                    ticket.getTicketCode(),
                    dealer.getId(),
                    dealer.getBusinessName(),
                    ticket.getCategory(),
                    ticket.getPriority(),
                    ticket.getSubject(),
                    ticket.getCreatedAt()
            ));
        } catch (RuntimeException ex) {
            if (!suppressErrors) {
                throw ex;
            }
            log.warn("Unable to publish support ticket websocket event ticketId={}: {}", ticket.getId(), ex.getMessage());
        }

        try {
            notificationService.create(new CreateNotifyRequest(
                    dealer.getId(),
                    appMessageSupport.get("notification.support.created.title"),
                    appMessageSupport.get("notification.support.created.content", ticket.getTicketCode()),
                    NotifyType.SYSTEM,
                    "/support",
                    null
            ));
        } catch (RuntimeException ex) {
            if (!suppressErrors) {
                throw ex;
            }
            log.warn("Unable to publish support ticket notification ticketId={}: {}", ticket.getId(), ex.getMessage());
        }
    }

    private String buildUniqueTicketCode() {
        String ticketCode;
        do {
            String suffix = String.valueOf(Instant.now().toEpochMilli());
            ticketCode = "SPT-" + suffix.substring(Math.max(0, suffix.length() - 8));
        } while (dealerSupportTicketRepository.existsByTicketCode(ticketCode));
        return ticketCode;
    }

    private DealerSupportTicketResponse toResponse(DealerSupportTicket ticket, Dealer viewer) {
        List<SupportTicketMessageResponse> visibleMessages = ticket.getMessages().stream()
                .filter(message -> !Boolean.TRUE.equals(message.getInternalNote()))
                .map(message -> toMessageResponse(message, viewer))
                .toList();
        return new DealerSupportTicketResponse(
                ticket.getId(),
                ticket.getTicketCode(),
                ticket.getCategory(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getSubject(),
                resolveFirstDealerMessage(ticket.getMessages()),
                supportTicketPayloadSupport.readContext(ticket.getContextData()),
                ticket.getAssignee() == null ? null : ticket.getAssignee().getId(),
                resolveAssigneeName(ticket),
                visibleMessages,
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getResolvedAt(),
                ticket.getClosedAt()
        );
    }

    private SupportTicketMessage buildDealerMessage(
            Dealer dealer,
            String message,
            List<com.devwonder.backend.dto.support.SupportTicketAttachmentPayload> attachments
    ) {
        SupportTicketMessage supportTicketMessage = new SupportTicketMessage();
        supportTicketMessage.setAuthorRole(SupportTicketMessageAuthorRole.DEALER);
        supportTicketMessage.setAuthorName(resolveDealerName(dealer));
        supportTicketMessage.setInternalNote(Boolean.FALSE);
        supportTicketMessage.setMessage(message.trim());
        supportTicketMessage.setAttachments(supportTicketPayloadSupport.writeAttachments(attachments));
        return supportTicketMessage;
    }

    private SupportTicketMessageResponse toMessageResponse(SupportTicketMessage message, Dealer viewer) {
        List<com.devwonder.backend.dto.support.SupportTicketAttachmentResponse> attachments = new ArrayList<>();
        attachments.addAll(mediaAssetService.buildMediaAttachmentResponses(message, viewer, appBaseUrl()));
        attachments.addAll(supportTicketPayloadSupport.readAttachments(message.getAttachments()));
        return new SupportTicketMessageResponse(
                message.getId(),
                message.getAuthorRole(),
                message.getAuthorName(),
                Boolean.TRUE.equals(message.getInternalNote()),
                message.getMessage(),
                List.copyOf(attachments),
                message.getCreatedAt()
        );
    }

    private int countLegacyAttachments(List<com.devwonder.backend.dto.support.SupportTicketAttachmentPayload> attachments) {
        String raw = supportTicketPayloadSupport.writeAttachments(attachments);
        return supportTicketPayloadSupport.readAttachments(raw).size();
    }

    private int countLegacyVideos(List<com.devwonder.backend.dto.support.SupportTicketAttachmentPayload> attachments) {
        String raw = supportTicketPayloadSupport.writeAttachments(attachments);
        return (int) supportTicketPayloadSupport.readAttachments(raw).stream()
                .map(com.devwonder.backend.dto.support.SupportTicketAttachmentResponse::mediaType)
                .filter(Objects::nonNull)
                .filter(mediaType -> mediaType == MediaType.VIDEO)
                .count();
    }

    private String appBaseUrl() {
        return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
    }

    private String resolveDealerName(Dealer dealer) {
        if (dealer == null) {
            return null;
        }
        return firstNonBlank(dealer.getContactName(), dealer.getBusinessName(), dealer.getUsername(), dealer.getEmail());
    }

    private String resolveAssigneeName(DealerSupportTicket ticket) {
        if (ticket.getAssignee() == null) {
            return null;
        }
        return firstNonBlank(
                ticket.getAssignee().getDisplayName(),
                ticket.getAssignee().getRoleTitle(),
                ticket.getAssignee().getUsername(),
                ticket.getAssignee().getEmail()
        );
    }

    private String resolveFirstDealerMessage(List<SupportTicketMessage> messages) {
        return messages.stream()
                .filter(message -> message.getAuthorRole() == SupportTicketMessageAuthorRole.DEALER)
                .filter(message -> !Boolean.TRUE.equals(message.getInternalNote()))
                .map(SupportTicketMessage::getMessage)
                .findFirst()
                .orElse(null);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value == null) {
                continue;
            }
            String trimmed = value.trim();
            if (!trimmed.isEmpty()) {
                return trimmed;
            }
        }
        return null;
    }
}
