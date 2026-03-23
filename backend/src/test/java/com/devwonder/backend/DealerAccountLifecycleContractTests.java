package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.devwonder.backend.dto.admin.UpdateAdminDealerAccountStatusRequest;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.devwonder.backend.service.AdminManagementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dealer_account_lifecycle_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false"
})
class DealerAccountLifecycleContractTests {

    @Autowired
    private AdminManagementService adminManagementService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    @Test
    void adminCanApproveDealerUnderReview() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-under-review@example.com", CustomerStatus.UNDER_REVIEW));

        var response = adminManagementService.updateDealerAccountStatus(
                dealer.getId(),
                new UpdateAdminDealerAccountStatusRequest(CustomerStatus.ACTIVE)
        );

        assertThat(response.status()).isEqualTo(CustomerStatus.ACTIVE);
        assertThat(dealerRepository.findById(dealer.getId()).orElseThrow().getCustomerStatus())
                .isEqualTo(CustomerStatus.ACTIVE);
    }

    @Test
    void adminCannotMoveActiveDealerBackToUnderReview() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-active@example.com", CustomerStatus.ACTIVE));

        assertThatThrownBy(() -> adminManagementService.updateDealerAccountStatus(
                dealer.getId(),
                new UpdateAdminDealerAccountStatusRequest(CustomerStatus.UNDER_REVIEW)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Unsupported dealer account status transition");
    }

    @Test
    void suspendedDealerCanBeReactivatedButNotMovedToUnderReview() {
        Dealer dealer = dealerRepository.save(createDealer("dealer-suspended@example.com", CustomerStatus.SUSPENDED));

        assertThatThrownBy(() -> adminManagementService.updateDealerAccountStatus(
                dealer.getId(),
                new UpdateAdminDealerAccountStatusRequest(CustomerStatus.UNDER_REVIEW)
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Unsupported dealer account status transition");

        var response = adminManagementService.updateDealerAccountStatus(
                dealer.getId(),
                new UpdateAdminDealerAccountStatusRequest(CustomerStatus.ACTIVE)
        );

        assertThat(response.status()).isEqualTo(CustomerStatus.ACTIVE);
    }

    private Dealer createDealer(String username, CustomerStatus status) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        dealer.setCustomerStatus(status);
        return dealer;
    }
}
