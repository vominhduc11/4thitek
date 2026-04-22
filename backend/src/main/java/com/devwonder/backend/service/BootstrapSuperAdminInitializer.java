package com.devwonder.backend.service;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Role;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.RoleRepository;
import com.devwonder.backend.service.support.AccountValidationSupport;
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
public class BootstrapSuperAdminInitializer implements ApplicationRunner {

    private final AdminRepository adminRepository;
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;
    private final Environment environment;

    @Value("${app.bootstrap-super-admin.enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${app.bootstrap-super-admin.email:}")
    private String bootstrapEmail;

    @Value("${app.bootstrap-super-admin.password:}")
    private String bootstrapPassword;

    @Value("${app.bootstrap-super-admin.name:System Owner}")
    private String bootstrapName;

    @Value("${app.allow-production-bootstrap:false}")
    private boolean allowProductionBootstrap;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!bootstrapEnabled) {
            return;
        }
        if (isProductionRuntimeActive() && !allowProductionBootstrap) {
            throw new IllegalStateException(
                    "SUPER_ADMIN bootstrap is blocked when production profile is active. "
                            + "Set APP_ALLOW_PRODUCTION_BOOTSTRAP=true only for an explicit one-time emergency flow."
            );
        }
        if (adminRepository.existsByRoles_Name("SUPER_ADMIN")) {
            return;
        }

        String email = normalize(bootstrapEmail);
        String password = normalize(bootstrapPassword);
        String displayName = normalize(bootstrapName);
        if (email == null || password == null) {
            throw new IllegalStateException(
                    "SUPER_ADMIN bootstrap is enabled but app.bootstrap-super-admin.email/password are missing."
            );
        }
        AccountValidationSupport.assertStrongPassword(password, "app.bootstrap-super-admin.password");
        if (accountRepository.existsByUsernameIgnoreCase(email) || accountRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalStateException("Cannot bootstrap SUPER_ADMIN because username/email already exists: " + email);
        }

        Admin admin = new Admin();
        admin.setUsername(email);
        admin.setEmail(email);
        emailVerificationService.markAdminEmailVerified(admin, java.time.Instant.now());
        admin.setPassword(passwordEncoder.encode(password));
        admin.setDisplayName(displayName == null ? "System Owner" : displayName);
        admin.setRoleTitle("Super Admin");
        admin.setUserStatus(StaffUserStatus.ACTIVE);
        admin.setRequirePasswordChange(Boolean.TRUE);
        admin.setRoles(new HashSet<>(List.of(
                resolveRole("ADMIN", "Admin role"),
                resolveRole("SUPER_ADMIN", "Super admin role")
        )));
        adminRepository.save(admin);
        log.info("Bootstrapped initial SUPER_ADMIN account for {}", email);
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

    private Role resolveRole(String roleName, String description) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(roleName);
                    role.setDescription(description);
                    return roleRepository.save(role);
                });
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
