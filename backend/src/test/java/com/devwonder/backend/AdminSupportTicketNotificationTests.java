package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.devwonder.backend.dto.admin.UpdateAdminSupportTicketRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.DealerSupportTicket;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.entity.enums.DealerSupportCategory;
import com.devwonder.backend.entity.enums.DealerSupportPriority;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.service.AdminOperationsService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;

@SpringBootTest(properties = {
        "app.mail.enabled=true",
        "app.mail.from=test@4thitek.local"
})
class AdminSupportTicketNotificationTests {

    @Autowired
    private AdminOperationsService adminOperationsService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private OrderRepository orderRepository;

    @MockBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        orderRepository.deleteAll();
        when(javaMailSender.createMimeMessage()).thenReturn(
                new MimeMessage(Session.getInstance(new Properties()))
        );
        reset(javaMailSender);
        when(javaMailSender.createMimeMessage()).thenReturn(
                new MimeMessage(Session.getInstance(new Properties()))
        );
    }

    @Test
    void updateSupportTicketCreatesNotificationAndSendsMailWhenAdminReplies() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-support@example.com"));
        DealerSupportTicket ticket = dealerSupportTicketRepository.save(createTicket(dealer, "SPT-TEST-1"));

        adminOperationsService.updateSupportTicket(
                ticket.getId(),
                new UpdateAdminSupportTicketRequest(
                        DealerSupportTicketStatus.IN_PROGRESS,
                        "Admin đã tiếp nhận và đang xử lý yêu cầu của bạn."
                )
        );

        List<Notify> notifications = notifyRepository.findByAccountIdOrderByCreatedAtDesc(dealer.getId());
        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getType()).isEqualTo(NotifyType.SYSTEM);
        assertThat(notifications.get(0).getTitle()).contains("yêu cầu hỗ trợ");
        assertThat(notifications.get(0).getContent()).contains("SPT-TEST-1");
        verify(javaMailSender, timeout(1_000)).send(any(MimeMessage.class));
    }

    @Test
    void updateSupportTicketDoesNotNotifyForNoopUpdate() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-support-noop@example.com"));
        DealerSupportTicket ticket = dealerSupportTicketRepository.save(createTicket(dealer, "SPT-TEST-2"));

        adminOperationsService.updateSupportTicket(
                ticket.getId(),
                new UpdateAdminSupportTicketRequest(DealerSupportTicketStatus.OPEN, null)
        );

        assertThat(notifyRepository.findByAccountIdOrderByCreatedAtDesc(dealer.getId())).isEmpty();
        verify(javaMailSender, never()).send(any(MimeMessage.class));
    }

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        return dealer;
    }

    private DealerSupportTicket createTicket(Dealer dealer, String ticketCode) {
        DealerSupportTicket ticket = new DealerSupportTicket();
        ticket.setDealer(dealer);
        ticket.setTicketCode(ticketCode);
        ticket.setCategory(DealerSupportCategory.RETURN);
        ticket.setPriority(DealerSupportPriority.NORMAL);
        ticket.setStatus(DealerSupportTicketStatus.OPEN);
        ticket.setSubject("Yêu cầu hỗ trợ test");
        ticket.setMessage("Dealer cần được hỗ trợ xử lý đổi trả.");
        return ticket;
    }
}
