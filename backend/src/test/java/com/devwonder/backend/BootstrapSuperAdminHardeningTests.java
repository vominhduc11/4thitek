package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.RoleRepository;
import com.devwonder.backend.service.BootstrapSuperAdminInitializer;
import com.devwonder.backend.service.EmailVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class BootstrapSuperAdminHardeningTests {

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailVerificationService emailVerificationService;

    @Mock
    private Environment environment;

    private BootstrapSuperAdminInitializer initializer;

    @BeforeEach
    void setUp() {
        initializer = new BootstrapSuperAdminInitializer(
                adminRepository,
                accountRepository,
                roleRepository,
                passwordEncoder,
                emailVerificationService,
                environment
        );
        ReflectionTestUtils.setField(initializer, "bootstrapName", "System Owner");
        ReflectionTestUtils.setField(initializer, "allowProductionBootstrap", false);
    }

    @Test
    void disabledBootstrapSkipsAllWork() throws Exception {
        ReflectionTestUtils.setField(initializer, "bootstrapEnabled", false);

        initializer.run(new DefaultApplicationArguments(new String[0]));

        verifyNoInteractions(adminRepository, accountRepository, roleRepository, passwordEncoder, emailVerificationService, environment);
    }

    @Test
    void enabledBootstrapWithoutCredentialsFailsFast() {
        ReflectionTestUtils.setField(initializer, "bootstrapEnabled", true);
        ReflectionTestUtils.setField(initializer, "bootstrapEmail", " ");
        ReflectionTestUtils.setField(initializer, "bootstrapPassword", " ");
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(false);
        when(adminRepository.existsByRoles_Name("SUPER_ADMIN")).thenReturn(false);

        assertThatThrownBy(() -> initializer.run(new DefaultApplicationArguments(new String[0])))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("enabled but app.bootstrap-super-admin.email/password are missing");
    }

    @Test
    void enabledBootstrapInProductionWithoutOverrideIsBlocked() {
        ReflectionTestUtils.setField(initializer, "bootstrapEnabled", true);
        ReflectionTestUtils.setField(initializer, "bootstrapEmail", "owner@example.com");
        ReflectionTestUtils.setField(initializer, "bootstrapPassword", "InitPass#123");
        ReflectionTestUtils.setField(initializer, "allowProductionBootstrap", false);
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(true);

        assertThatThrownBy(() -> initializer.run(new DefaultApplicationArguments(new String[0])))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("blocked when production profile is active");

        verifyNoInteractions(adminRepository, accountRepository, roleRepository, passwordEncoder, emailVerificationService);
    }
}
