package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.devwonder.backend.dto.admin.AdminDealerAccountUpdateRequest;
import com.devwonder.backend.dto.admin.UpdateAdminDealerAccountStatusRequest;
import com.devwonder.backend.dto.auth.LoginRequest;
import com.devwonder.backend.dto.auth.RefreshTokenRequest;
import com.devwonder.backend.dto.auth.RegisterDealerRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.exception.UnauthorizedException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.security.JWTUtils;
import com.devwonder.backend.service.AdminManagementService;
import com.devwonder.backend.service.AuthService;
import java.math.BigDecimal;
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
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.BadCredentialsException;

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
    void underReviewDealerCannotLoginUntilActivatedAndActivationStillSendsStatusNotification() {
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
        assertThat(notices.get(0).getTitle()).isNotBlank();
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
    void underReviewDealerCannotRefreshToken() {
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
                .hasMessageContaining("chờ duyệt");
    }

    @Test
    void registerDealerRejectsDuplicatePhoneNumber() {
        authService.registerDealer(new RegisterDealerRequest(
                "dealer.phone.one@example.com",
                "DealerPass#123",
                "Dealer Phone One",
                "Dealer Contact",
                "100200300",
                "0912345601",
                "dealer.phone.one@example.com",
                "111 Phone Street",
                null,
                "District 1",
                "Ho Chi Minh City",
                "Vietnam",
                null
        ));

        assertThatThrownBy(() -> authService.registerDealer(new RegisterDealerRequest(
                "dealer.phone.two@example.com",
                "DealerPass#123",
                "Dealer Phone Two",
                "Dealer Contact",
                "400500600",
                "0912345601",
                "dealer.phone.two@example.com",
                "222 Phone Street",
                null,
                "District 3",
                "Ho Chi Minh City",
                "Vietnam",
                null
        )))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Phone already exists");
    }

    @Test
    void registerDealerRejectsTooShortUsernameEvenIfDtoValidationIsBypassed() {
        assertThatThrownBy(() -> authService.registerDealer(new RegisterDealerRequest(
                "ab",
                "DealerPass#123",
                "Dealer Short Username",
                "Dealer Contact",
                "700800900",
                "0912345603",
                "short.username@example.com",
                "444 Username Street",
                null,
                "District 1",
                "Ho Chi Minh City",
                null,
                null
        )))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("username must be 3-50 characters");
    }

    @Test
    void registerDealerDoesNotForceVietnamAsDefaultCountry() {
        authService.registerDealer(new RegisterDealerRequest(
                "dealer.country@example.com",
                "DealerPass#123",
                "Dealer Country",
                "Dealer Contact",
                "701800900",
                "0912345604",
                "dealer.country@example.com",
                "555 Country Street",
                null,
                "District 9",
                "Ho Chi Minh City",
                null,
                null
        ));

        Dealer saved = dealerRepository.findByUsername("dealer.country@example.com").orElseThrow();
        assertThat(saved.getCountry()).isNull();
    }

    @Test
    void registerDealerAllowsMissingBusinessName() {
        authService.registerDealer(new RegisterDealerRequest(
                "dealer.no.business@example.com",
                "DealerPass#123",
                null,
                "Dealer Contact",
                "801800900",
                "0912345605",
                "dealer.no.business@example.com",
                "777 Optional Street",
                null,
                "District 2",
                "Ho Chi Minh City",
                "Vietnam",
                null
        ));

        Dealer saved = dealerRepository.findByUsername("dealer.no.business@example.com").orElseThrow();
        assertThat(saved.getBusinessName()).isNull();
    }

    @Test
    void updateDealerAccountTierAndCreditLimit() {
        authService.registerDealer(new RegisterDealerRequest(
                "dealer.lifecycle@example.com",
                "DealerPass#123",
                "Dealer Lifecycle",
                "Dealer Contact",
                "555666777",
                "0912345602",
                "dealer.lifecycle@example.com",
                "333 Lifecycle Street",
                null,
                "District 7",
                "Ho Chi Minh City",
                "Vietnam",
                null
        ));
        Dealer dealer = dealerRepository.findByUsername("dealer.lifecycle@example.com").orElseThrow();

        adminManagementService.updateDealerAccount(
                dealer.getId(),
                new AdminDealerAccountUpdateRequest(
                        BigDecimal.valueOf(100_000_000)
                )
        );

        Dealer updated = dealerRepository.findById(dealer.getId()).orElseThrow();
        assertThat(updated.getCreditLimit()).isEqualByComparingTo(BigDecimal.valueOf(100_000_000));
    }
}
