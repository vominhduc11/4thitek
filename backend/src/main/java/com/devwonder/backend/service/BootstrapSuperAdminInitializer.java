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

    @Value("${app.bootstrap-super-admin.enabled:true}")
    private boolean bootstrapEnabled;

    @Value("${app.bootstrap-super-admin.email:}")
    private String bootstrapEmail;

    @Value("${app.bootstrap-super-admin.password:}")
    private String bootstrapPassword;

    @Value("${app.bootstrap-super-admin.name:System Owner}")
    private String bootstrapName;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!bootstrapEnabled) {
            return;
        }
        if (adminRepository.existsByRoles_Name("SUPER_ADMIN")) {
            return;
        }

        String email = normalize(bootstrapEmail);
        String password = normalize(bootstrapPassword);
        String displayName = normalize(bootstrapName);
        if (email == null || password == null) {
            log.warn("Skipping SUPER_ADMIN bootstrap because app.bootstrap-super-admin.email/password are not configured.");
            return;
        }
        AccountValidationSupport.assertStrongPassword(password, "app.bootstrap-super-admin.password");
        if (accountRepository.existsByUsername(email) || accountRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalStateException("Cannot bootstrap SUPER_ADMIN because username/email already exists: " + email);
        }

        Admin admin = new Admin();
        admin.setUsername(email);
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setDisplayName(displayName == null ? "System Owner" : displayName);
        admin.setRoleTitle("Super Admin");
        admin.setUserStatus(StaffUserStatus.ACTIVE);
        admin.setRequireLoginEmailConfirmation(Boolean.TRUE);
        admin.setRoles(new HashSet<>(List.of(
                resolveRole("ADMIN", "Admin role"),
                resolveRole("SUPER_ADMIN", "Super admin role")
        )));
        adminRepository.save(admin);
        log.info("Bootstrapped initial SUPER_ADMIN account for {}", email);
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
