package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.devwonder.backend.dto.admin.UpdateAdminDealerAccountStatusRequest;
import com.devwonder.backend.dto.auth.LoginRequest;
import com.devwonder.backend.dto.auth.RefreshTokenRequest;
import com.devwonder.backend.dto.auth.RegisterDealerRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.exception.UnauthorizedException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.security.JWTUtils;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.AuthService;
import java.util.HashMap;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.mail.javamail.JavaMailSender;

@SpringBootTest(properties = {
        "app.mail.enabled=true",
        "app.mail.from=test@4thitek.local"
})
class DealerOnboardingFlowTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private AdminManagementService adminManagementService;

    @Autowired
    private JWTUtils jwtUtils;

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

    @MockBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        orderRepository.deleteAll();
        dealerRepository.deleteAll();
        accountRepository.deleteAll();
        when(javaMailSender.createMimeMessage()).thenReturn(
                new MimeMessage(Session.getInstance(new Properties()))
        );
        reset(javaMailSender);
        when(javaMailSender.createMimeMessage()).thenReturn(
                new MimeMessage(Session.getInstance(new Properties()))
        );
    }

    @Test
    void registerDealerCreatesUnderReviewAccountAndSendsReceiptEmail() {
        authService.registerDealer(new RegisterDealerRequest(
                "dealer.test@example.com",
                "DealerPass#123",
                "Dealer Test",
                "Dealer Contact",
                "123456789",
                "0912345678",
                "dealer.test@example.com",
                "123 Le Loi",
                null,
                "District 1",
                "Ho Chi Minh City",
                "Vietnam",
                null
        ));

        Dealer saved = dealerRepository.findByUsername("dealer.test@example.com").orElseThrow();

        assertThat(saved.getCustomerStatus()).isEqualTo(CustomerStatus.UNDER_REVIEW);
        verify(javaMailSender).send(any(MimeMessage.class));
    }

    @Test
    void dealerCannotLoginUntilActivatedAndReceivesStatusNotification() {
        authService.registerDealer(new RegisterDealerRequest(
                "dealer.active@example.com",
                "DealerPass#123",
                "Dealer Active",
                "Dealer Contact",
                "987654321",
                "0912345679",
                "dealer.active@example.com",
                "456 Nguyen Hue",
                null,
                "District 1",
                "Ho Chi Minh City",
                "Vietnam",
                null
        ));
        Dealer dealer = dealerRepository.findByUsername("dealer.active@example.com").orElseThrow();

        assertThatThrownBy(() -> authService.login(new LoginRequest(
                "dealer.active@example.com",
                "DealerPass#123"
        )))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("chờ duyệt");

        reset(javaMailSender);
        when(javaMailSender.createMimeMessage()).thenReturn(
                new MimeMessage(Session.getInstance(new Properties()))
        );

        adminManagementService.updateDealerAccountStatus(
                dealer.getId(),
                new UpdateAdminDealerAccountStatusRequest(CustomerStatus.ACTIVE)
        );

        List<Notify> notices = notifyRepository.findByAccountIdOrderByCreatedAtDesc(dealer.getId());
        assertThat(notices).hasSize(1);
        assertThat(notices.get(0).getTitle()).contains("kích hoạt");
        verify(javaMailSender).send(any(MimeMessage.class));

        assertThat(authService.login(new LoginRequest(
                "dealer.active@example.com",
                "DealerPass#123"
        )).accessToken()).isNotBlank();
    }

    @Test
    void underReviewDealerWithWrongPasswordLooksLikeInvalidCredentials() {
        authService.registerDealer(new RegisterDealerRequest(
                "dealer.hidden@example.com",
                "DealerPass#123",
                "Dealer Hidden",
                "Dealer Contact",
                "222333444",
                "0912345691",
                "dealer.hidden@example.com",
                "101 Nguyen Trai",
                null,
                "District 1",
                "Ho Chi Minh City",
                "Vietnam",
                null
        ));

        assertThatThrownBy(() -> authService.login(new LoginRequest(
                "dealer.hidden@example.com",
                "WrongPass#123"
        )))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void inactiveDealerCannotRefreshToken() {
        authService.registerDealer(new RegisterDealerRequest(
                "dealer.refresh@example.com",
                "DealerPass#123",
                "Dealer Refresh",
                "Dealer Contact",
                "1122334455",
                "0912345680",
                "dealer.refresh@example.com",
                "789 Tran Hung Dao",
                null,
                "District 5",
                "Ho Chi Minh City",
                "Vietnam",
                null
        ));
        Dealer dealer = dealerRepository.findByUsername("dealer.refresh@example.com").orElseThrow();
        String refreshToken = jwtUtils.generateRefreshToken(new HashMap<>(), dealer);

        assertThatThrownBy(() -> authService.refreshToken(new RefreshTokenRequest(refreshToken)))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Account is not active");
    }
}
