package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.devwonder.backend.dto.notify.CreateNotifyRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.enums.NotifyType;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:notification_realtime_commit_consistency;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false",
        "app.fcm.enabled=false"
})
class NotificationRealtimeCommitConsistencyTests {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void setUp() {
        transactionTemplate = new TransactionTemplate(transactionManager);
        notifyRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void notificationRealtimeEventIsNotPublishedWhenTransactionRollsBack() {
        Dealer dealer = dealerRepository.save(createDealer("notify-rollback@example.com"));

        transactionTemplate.executeWithoutResult(status -> {
            notificationService.create(new CreateNotifyRequest(
                    dealer.getId(),
                    "Rollback title",
                    "Rollback body",
                    NotifyType.SYSTEM,
                    "/orders/ROLLBACK",
                    null
            ));
            status.setRollbackOnly();
        });

        assertThat(notifyRepository.findByAccountIdOrderByCreatedAtDesc(dealer.getId())).isEmpty();
        verify(messagingTemplate, never()).convertAndSendToUser(eq(dealer.getUsername()), eq("/queue/notifications"), any());
    }

    @Test
    void notificationRealtimeEventIsPublishedAfterSuccessfulCommit() {
        Dealer dealer = dealerRepository.save(createDealer("notify-commit@example.com"));

        transactionTemplate.executeWithoutResult(status -> notificationService.create(new CreateNotifyRequest(
                dealer.getId(),
                "Commit title",
                "Commit body",
                NotifyType.SYSTEM,
                "/orders/COMMIT",
                null
        )));

        assertThat(notifyRepository.findByAccountIdOrderByCreatedAtDesc(dealer.getId())).hasSize(1);
        verify(messagingTemplate).convertAndSendToUser(eq(dealer.getUsername()), eq("/queue/notifications"), any());
    }

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        return dealer;
    }
}
