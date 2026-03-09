package com.devwonder.backend.service;

import com.devwonder.backend.dto.dealer.CreateDealerSupportTicketRequest;
import com.devwonder.backend.dto.dealer.DealerSupportTicketResponse;
import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.DealerSupportTicket;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DealerSupportTicketService {

    private final DealerRepository dealerRepository;
    private final DealerSupportTicketRepository dealerSupportTicketRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public DealerSupportTicketResponse getLatestTicket(String username) {
        Dealer dealer = requireDealerByUsername(username);
        return dealerSupportTicketRepository.findTopByDealerIdOrderByCreatedAtDesc(dealer.getId())
                .map(this::toResponse)
                .orElse(null);
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

        DealerSupportTicket saved = dealerSupportTicketRepository.save(ticket);
        notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                "Yêu cầu hỗ trợ đã được tạo",
                "Ma yeu cau " + saved.getTicketCode() + " da duoc ghi nhan.",
                NotifyType.SYSTEM,
                "/account/support"
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
        return new DealerSupportTicketResponse(
                ticket.getId(),
                ticket.getTicketCode(),
                ticket.getCategory(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getSubject(),
                ticket.getMessage(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt()
        );
    }
}
