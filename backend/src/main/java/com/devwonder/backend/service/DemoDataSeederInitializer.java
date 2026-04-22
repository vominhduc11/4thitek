package com.devwonder.backend.service;

import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Role;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.RoleRepository;
import com.devwonder.backend.service.support.AccountValidationSupport;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeederInitializer implements ApplicationRunner {

    private final AccountRepository accountRepository;
    private final DealerRepository dealerRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Value("${app.seed-demo-data:false}")
    private boolean seedDemoData;

    @Value("${app.seed-demo-password:}")
    private String seedDemoPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedDemoData) {
            return;
        }
        if (isProductionRuntimeActive()) {
            throw new IllegalStateException("Demo data seeding is blocked when production profile is active.");
        }

        String password = normalize(seedDemoPassword);
        if (password == null) {
            if (isTestProfileActive()) {
                log.warn("Skipping demo data seeding in test profile because app.seed-demo-password is not configured.");
                return;
            }
            throw new IllegalStateException(
                    "Demo data seeding is enabled but app.seed-demo-password is missing. "
                            + "Set APP_SEED_DEMO_PASSWORD to a strong password for local/staging only."
            );
        }
        AccountValidationSupport.assertStrongPassword(password, "app.seed-demo-password");

        long existingAccounts = accountRepository.count();
        if (existingAccounts > 0) {
            log.warn("Skipping demo data seeding because {} account(s) already exist.", existingAccounts);
            return;
        }

        Role dealerRole = resolveRole("DEALER", "Default dealer role");
        Dealer first = createDemoDealer(
                "daily.hn@4thitek.vn",
                "Daily Hanoi",
                "Daily HN 4T HITEK",
                "MST-DEMO-001",
                "0900000001",
                dealerRole,
                password
        );
        Dealer second = createDemoDealer(
                "duc123@gmail.com",
                "Duc Nguyen",
                "Duc Trading",
                "MST-DEMO-002",
                "0900000002",
                dealerRole,
                password
        );
        dealerRepository.saveAll(List.of(first, second));
        log.info("Seeded {} demo dealer account(s) for local/staging usage.", 2);
    }

    private Dealer createDemoDealer(
            String email,
            String contactName,
            String businessName,
            String taxCode,
            String phone,
            Role dealerRole,
            String rawPassword
    ) {
        Dealer dealer = new Dealer();
        dealer.setUsername(email);
        dealer.setEmail(email);
        dealer.setPassword(passwordEncoder.encode(rawPassword));
        dealer.setContactName(contactName);
        dealer.setBusinessName(businessName);
        dealer.setTaxCode(taxCode);
        dealer.setPhone(phone);
        dealer.setAddressLine("Demo Address");
        dealer.setWard("Demo Ward");
        dealer.setDistrict("Demo District");
        dealer.setCity("Ha Noi");
        dealer.setCountry("VN");
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        dealer.setEmailVerified(Boolean.TRUE);
        dealer.setEmailVerifiedAt(Instant.now());
        dealer.setRoles(new HashSet<>(List.of(dealerRole)));
        return dealer;
    }

    private Role resolveRole(String roleName, String description) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(roleName);
                    role.setDescription(description);
                    return roleRepository.save(role);
                });
    }

    private boolean isProductionRuntimeActive() {
        if (environment.acceptsProfiles(Profiles.of("production", "prod"))) {
            return true;
        }
        return isProductionEnvironmentValue(environment.getProperty("app.env"))
                || isProductionEnvironmentValue(environment.getProperty("APP_ENV"))
                || isProductionEnvironmentValue(environment.getProperty("env"))
                || isProductionEnvironmentValue(environment.getProperty("ENV"))
                || isProductionEnvironmentValue(environment.getProperty("environment"))
                || isProductionEnvironmentValue(environment.getProperty("ENVIRONMENT"));
    }

    private boolean isProductionEnvironmentValue(String value) {
        String normalized = normalize(value);
        return "production".equalsIgnoreCase(normalized) || "prod".equalsIgnoreCase(normalized);
    }

    private boolean isTestProfileActive() {
        return environment.acceptsProfiles(Profiles.of("test"));
    }

    private String normalize(String value) {
        return AccountValidationSupport.normalize(value);
    }
}
