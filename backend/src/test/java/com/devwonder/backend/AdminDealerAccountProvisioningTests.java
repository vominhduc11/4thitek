package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.devwonder.backend.dto.admin.AdminDealerAccountUpsertRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.DealerTier;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.service.AdminManagementService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest(properties = {
        "app.mail.enabled=true",
        "app.mail.from=test@4thitek.local"
})
class AdminDealerAccountProvisioningTests {

    @Autowired
    private AdminManagementService adminManagementService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        orderRepository.deleteAll();
        dealerRepository.deleteAll();
        accountRepository.deleteAll();
        reset(javaMailSender);
        when(javaMailSender.createMimeMessage()).thenReturn(
                new MimeMessage(Session.getInstance(new Properties()))
        );
    }

    @Test
    void createDealerAccountGeneratesRandomPasswordAndSendsEmail() {
        adminManagementService.createDealerAccount(new AdminDealerAccountUpsertRequest(
                "Dealer Provisioned",
                DealerTier.GOLD,
                CustomerStatus.ACTIVE,
                null,
                BigDecimal.valueOf(500_000),
                "provisioned.dealer@example.com",
                "0901234567",
                null,
                null
        ));

        Dealer savedDealer = dealerRepository.findByUsername("provisioned.dealer@example.com").orElseThrow();
        assertThat(passwordEncoder.matches("123456", savedDealer.getPassword())).isFalse();
        verify(javaMailSender).send(any(MimeMessage.class));
    }
}
