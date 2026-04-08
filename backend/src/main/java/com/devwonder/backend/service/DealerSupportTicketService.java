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
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.entity.enums.SupportTicketMessageAuthorRole;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.service.support.AppMessageSupport;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DealerSupportTicketService {

    private final DealerRepository dealerRepository;
    private final DealerSupportTicketRepository dealerSupportTicketRepository;
    private final NotificationService notificationService;
    private final AppMessageSupport appMessageSupport;
    private final WebSocketEventPublisher webSocketEventPublisher;

    @Transactional(readOnly = true)
    public DealerSupportTicketResponse getLatestTicket(String username) {
        Dealer dealer = requireDealerByUsername(username);
        return dealerSupportTicketRepository.findTopByDealerIdOrderByCreatedAtDesc(dealer.getId())
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Page<DealerSupportTicketResponse> getTickets(String username, Pageable pageable) {
        Dealer dealer = requireDealerByUsername(username);
        return dealerSupportTicketRepository.findByDealerIdOrderByCreatedAtDesc(dealer.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional
    public DealerSupportTicketResponse createTicket(String username, CreateDealerSupportTicketRequest request) {
        Dealer dealer = requireDealerByUsername(username);

        DealerSupportTicket ticket = new DealerSupportTicket();
        ticket.setDealer(dealer);
        ticket.setTicketCode(buildUniqueTicketCode());
        ticket.setCategory(request.category());
        ticket.setPriority(request.priority());
        ticket.setStatus(DealerSupportTicketStatus.OPEN);
        ticket.setSubject(request.subject().trim());
        ticket.setMessage(request.message().trim());
        ticket.addMessage(buildDealerMessage(dealer, request.message()));

        DealerSupportTicket saved = dealerSupportTicketRepository.save(ticket);
        webSocketEventPublisher.publishAdminNewSupportTicket(new AdminNewSupportTicketEvent(
                saved.getId(),
                saved.getTicketCode(),
                dealer.getId(),
                dealer.getBusinessName(),
                saved.getCategory(),
                saved.getPriority(),
                saved.getSubject(),
                saved.getCreatedAt()
        ));
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                appMessageSupport.get("notification.support.created.title"),
                appMessageSupport.get("notification.support.created.content", saved.getTicketCode()),
                NotifyType.SYSTEM,
                "/support",
                null
        ));
        return toResponse(saved);
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

        ticket.addMessage(buildDealerMessage(dealer, request.message()));
        ticket.setMessage(resolveFirstDealerMessage(ticket.getMessages()));

        DealerSupportTicket saved = dealerSupportTicketRepository.save(ticket);
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
        return toResponse(saved);
    }

    private Dealer requireDealerByUsername(String username) {
        return dealerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found"));
    }

    private String buildUniqueTicketCode() {
        String ticketCode;
        do {
            String suffix = String.valueOf(Instant.now().toEpochMilli());
            ticketCode = "SPT-" + suffix.substring(Math.max(0, suffix.length() - 8));
        } while (dealerSupportTicketRepository.existsByTicketCode(ticketCode));
        return ticketCode;
    }

    private DealerSupportTicketResponse toResponse(DealerSupportTicket ticket) {
        List<SupportTicketMessageResponse> visibleMessages = ticket.getMessages().stream()
                .filter(message -> !Boolean.TRUE.equals(message.getInternalNote()))
                .map(this::toMessageResponse)
                .toList();
        return new DealerSupportTicketResponse(
                ticket.getId(),
                ticket.getTicketCode(),
                ticket.getCategory(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getSubject(),
                resolveFirstDealerMessage(ticket.getMessages()),
                resolveLatestAdminReply(ticket.getMessages()),
                ticket.getAssignee() == null ? null : ticket.getAssignee().getId(),
                resolveAssigneeName(ticket),
                visibleMessages,
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getResolvedAt(),
                ticket.getClosedAt()
        );
    }

    private SupportTicketMessage buildDealerMessage(Dealer dealer, String message) {
        SupportTicketMessage supportTicketMessage = new SupportTicketMessage();
        supportTicketMessage.setAuthorRole(SupportTicketMessageAuthorRole.DEALER);
        supportTicketMessage.setAuthorName(resolveDealerName(dealer));
        supportTicketMessage.setInternalNote(Boolean.FALSE);
        supportTicketMessage.setMessage(message.trim());
        return supportTicketMessage;
    }

    private SupportTicketMessageResponse toMessageResponse(SupportTicketMessage message) {
        return new SupportTicketMessageResponse(
                message.getId(),
                message.getAuthorRole(),
                message.getAuthorName(),
                Boolean.TRUE.equals(message.getInternalNote()),
                message.getMessage(),
                message.getCreatedAt()
        );
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

    private String resolveLatestAdminReply(List<SupportTicketMessage> messages) {
        String latestReply = null;
        for (SupportTicketMessage message : messages) {
            if (message.getAuthorRole() == SupportTicketMessageAuthorRole.ADMIN
                    && !Boolean.TRUE.equals(message.getInternalNote())) {
                latestReply = message.getMessage();
            }
        }
        return latestReply;
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
