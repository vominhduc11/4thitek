package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.dto.admin.UpdateAdminSettingsRequest;
import com.devwonder.backend.dto.dealer.CreateDealerOrderItemRequest;
import com.devwonder.backend.dto.dealer.CreateDealerOrderRequest;
import com.devwonder.backend.dto.dealer.RecordPaymentRequest;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.Role;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.OrderRepository;
import com.devwonder.backend.repository.PaymentRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.devwonder.backend.repository.RoleRepository;
import com.devwonder.backend.service.AdminSettingsService;
import com.devwonder.backend.service.DealerPortalService;
import com.devwonder.backend.service.MailService;
import com.devwonder.backend.service.SepayService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Properties;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:admin_settings_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=settings.admin@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Settings Admin",
        "app.mail.enabled=true",
        "app.mail.from=prop-mail@4thitek.local",
        "app.mail.from-name=Property Sender",
        "sepay.enabled=false",
        "sepay.webhook-token=property-token",
        "sepay.bank-name=Property Bank",
        "sepay.account-number=000111222",
        "sepay.account-holder=PROPERTY HOLDER",
        "app.rate-limit.enabled=false",
        "app.rate-limit.auth-requests=9",
        "app.rate-limit.auth-window-seconds=61",
        "app.rate-limit.password-reset-requests=7",
        "app.rate-limit.password-reset-window-seconds=301",
        "app.rate-limit.warranty-lookup-requests=31",
        "app.rate-limit.warranty-lookup-window-seconds=62",
        "app.rate-limit.upload-requests=21",
        "app.rate-limit.upload-window-seconds=63",
        "app.rate-limit.webhook-requests=121",
        "app.rate-limit.webhook-window-seconds=64"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AdminSettingsContractTests {

    private static final String MASKED_PROPERTY_TOKEN = "********oken";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AdminSettingsService adminSettingsService;

    @Autowired
    private SepayService sepayService;

    @Autowired
    private MailService mailService;

    @Autowired
    private DealerPortalService dealerPortalService;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @MockBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    void setUp() {
        Admin admin = adminRepository.findByUsername("settings.admin@example.com").orElseThrow();
        admin.setPassword(passwordEncoder.encode("ChangedPass#456"));
        admin.setRequirePasswordChange(false);
        adminRepository.save(admin);

        paymentRepository.deleteAll();
        orderRepository.deleteAll();
        productSerialRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();

        when(javaMailSender.createMimeMessage())
                .thenAnswer(ignored -> new MimeMessage(Session.getInstance(new Properties())));
    }

    @Test
    void adminSettingsEndpointReturnsExpandedBusinessLogicContract() throws Exception {
        String adminToken = login("settings.admin@example.com", "ChangedPass#456");

        mockMvc.perform(get("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.emailConfirmation").value(true))
                .andExpect(jsonPath("$.data.sessionTimeoutMinutes").value(30))
                .andExpect(jsonPath("$.data.orderAlerts").value(true))
                .andExpect(jsonPath("$.data.inventoryAlerts").value(true))
                .andExpect(jsonPath("$.data.vatPercent").value(10))
                .andExpect(jsonPath("$.data.sepay.enabled").value(false))
                .andExpect(jsonPath("$.data.sepay.webhookToken").value(MASKED_PROPERTY_TOKEN))
                .andExpect(jsonPath("$.data.sepay.bankName").value("Property Bank"))
                .andExpect(jsonPath("$.data.sepay.accountNumber").value("000111222"))
                .andExpect(jsonPath("$.data.sepay.accountHolder").value("PROPERTY HOLDER"))
                .andExpect(jsonPath("$.data.emailSettings.enabled").value(true))
                .andExpect(jsonPath("$.data.emailSettings.from").value("prop-mail@4thitek.local"))
                .andExpect(jsonPath("$.data.emailSettings.fromName").value("Property Sender"))
                .andExpect(jsonPath("$.data.rateLimitOverrides.enabled").value(false))
                .andExpect(jsonPath("$.data.rateLimitOverrides.auth.requests").value(9))
                .andExpect(jsonPath("$.data.rateLimitOverrides.auth.windowSeconds").value(61))
                .andExpect(jsonPath("$.data.rateLimitOverrides.passwordReset.requests").value(7))
                .andExpect(jsonPath("$.data.rateLimitOverrides.passwordReset.windowSeconds").value(301))
                .andExpect(jsonPath("$.data.rateLimitOverrides.warrantyLookup.requests").value(31))
                .andExpect(jsonPath("$.data.rateLimitOverrides.warrantyLookup.windowSeconds").value(62))
                .andExpect(jsonPath("$.data.rateLimitOverrides.upload.requests").value(21))
                .andExpect(jsonPath("$.data.rateLimitOverrides.upload.windowSeconds").value(63))
                .andExpect(jsonPath("$.data.rateLimitOverrides.webhook.requests").value(121))
                .andExpect(jsonPath("$.data.rateLimitOverrides.webhook.windowSeconds").value(64));
    }

    @Test
    void updatingOtherSettingsDoesNotOverwriteStoredWebhookSecretWithMaskedPlaceholder() throws Exception {
        String adminToken = login("settings.admin@example.com", "ChangedPass#456");

        mockMvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionTimeoutMinutes": 60,
                                  "sepay": {
                                    "webhookToken": "%s"
                                  }
                                }
                                """.formatted(MASKED_PROPERTY_TOKEN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sessionTimeoutMinutes").value(60))
                .andExpect(jsonPath("$.data.sepay.webhookToken").value(MASKED_PROPERTY_TOKEN));

        assertThat(adminSettingsService.getSepaySettings().webhookToken()).isEqualTo("property-token");
    }

    @Test
    void updatingSettingsOverridesSepayDealerPaymentAndMailRuntimeBehavior() throws Exception {
        adminSettingsService.updateSettings(new UpdateAdminSettingsRequest(
                false,
                45,
                false,
                false,
                8,
                new UpdateAdminSettingsRequest.SepaySettings(
                        true,
                        "override-token",
                        "Override Bank",
                        "999888777",
                        "OVERRIDE HOLDER"
                ),
                new UpdateAdminSettingsRequest.EmailSettings(
                        true,
                        "ops@4thitek.local",
                        "Ops Sender"
                ),
                null
        ));

        assertThat(adminSettingsService.getVatPercent()).isEqualTo(8);

        var instructions = sepayService.getBankTransferInstructions();
        assertThat(instructions.bankName()).isEqualTo("Override Bank");
        assertThat(instructions.accountNumber()).isEqualTo("999888777");
        assertThat(instructions.accountHolder()).isEqualTo("OVERRIDE HOLDER");
        assertThat(adminSettingsService.getEffectiveSettings().vatPercent()).isEqualTo(8);

        Dealer dealer = dealerRepository.save(createDealer("settings-dealer@example.com"));
        Product product = productRepository.save(createProduct("SKU-SETTINGS-001"));
        productSerialRepository.save(createAvailableSerial(product, "SERIAL-SETTINGS-001"));

        var createdOrder = dealerPortalService.createOrder(
                dealer.getUsername(),
                new CreateDealerOrderRequest(
                        PaymentMethod.BANK_TRANSFER,
                        "Dealer receiver",
                        "123 Settings Street",
                        "0900000000",
                        0,
                        "Settings-driven SePay block",
                        List.of(new CreateDealerOrderItemRequest(product.getId(), 1, product.getRetailPrice()))
                ),
                UUID.randomUUID().toString()
        );

        assertThatThrownBy(() -> dealerPortalService.recordPayment(
                dealer.getUsername(),
                createdOrder.id(),
                new RecordPaymentRequest(
                        createdOrder.totalAmount(),
                        PaymentMethod.BANK_TRANSFER,
                        "Manual dealer payment",
                        "SETTINGS-TX-001",
                        "Should be blocked by admin settings",
                        null,
                        Instant.parse("2026-03-10T02:00:00Z")
                )
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("SePay webhook");

        Mockito.clearInvocations(javaMailSender);
        mailService.sendText("recipient@example.com", "Runtime mail", "Body");

        ArgumentCaptor<MimeMessage> messageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender).send(messageCaptor.capture());
        InternetAddress fromAddress = (InternetAddress) messageCaptor.getValue().getFrom()[0];
        assertThat(fromAddress.getAddress()).isEqualTo("ops@4thitek.local");
        assertThat(fromAddress.getPersonal()).isEqualTo("Ops Sender");
    }

    @Test
    void updatingSettingsCanOverrideAuthRateLimitAtRuntime() throws Exception {
        String adminToken = login("settings.admin@example.com", "ChangedPass#456");

        mockMvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "rateLimitOverrides": {
                                    "enabled": true,
                                    "auth": {
                                      "requests": 1,
                                      "windowSeconds": 60
                                    }
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rateLimitOverrides.enabled").value(true))
                .andExpect(jsonPath("$.data.rateLimitOverrides.auth.requests").value(1))
                .andExpect(jsonPath("$.data.rateLimitOverrides.auth.windowSeconds").value(60));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "missing@example.com",
                                  "password": "WrongPass#123"
                                }
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "missing@example.com",
                                  "password": "WrongPass#123"
                                }
                                """))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void enablingSepayRequiresConfiguredWebhookAndBankFields() throws Exception {
        String adminToken = login("settings.admin@example.com", "ChangedPass#456");

        mockMvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "sepay": {
                                    "enabled": true,
                                    "webhookToken": "   ",
                                    "bankName": "   ",
                                    "accountNumber": "   ",
                                    "accountHolder": "   "
                                  }
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.data['sepay.webhookToken']").value("sepay.webhookToken is required when enabled"))
                .andExpect(jsonPath("$.data['sepay.bankName']").value("sepay.bankName is required when enabled"))
                .andExpect(jsonPath("$.data['sepay.accountNumber']").value("sepay.accountNumber is required when enabled"))
                .andExpect(jsonPath("$.data['sepay.accountHolder']").value("sepay.accountHolder is required when enabled"));
    }

    @Test
    void genericAdminCannotReadOrUpdateSettings() throws Exception {
        createGenericAdmin("limited.admin@example.com", "LimitedPass#123");
        String adminToken = login("limited.admin@example.com", "LimitedPass#123");

        mockMvc.perform(get("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionTimeoutMinutes": 60
                                }
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void enablingMailRequiresFromName() throws Exception {
        String adminToken = login("settings.admin@example.com", "ChangedPass#456");

        mockMvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "emailSettings": {
                                    "enabled": true,
                                    "from": "ops@4thitek.local",
                                    "fromName": "   "
                                  }
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.data['emailSettings.fromName']").value("emailSettings.fromName is required when enabled"));
    }

    private String login(String username, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "%s"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode payload = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return payload.path("data").path("accessToken").asText();
    }

    private Dealer createDealer(String username) {
        Dealer dealer = new Dealer();
        dealer.setUsername(username);
        dealer.setEmail(username);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Dealer " + username);
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        return dealer;
    }

    private Product createProduct(String sku) {
        Product product = new Product();
        product.setSku(sku);
        product.setName("Product " + sku);
        product.setShortDescription("Settings contract product");
        product.setRetailPrice(BigDecimal.valueOf(100_000));
        product.setStock(100);
        product.setIsDeleted(false);
        return product;
    }

    private ProductSerial createAvailableSerial(Product product, String serialValue) {
        ProductSerial serial = new ProductSerial();
        serial.setProduct(product);
        serial.setSerial(serialValue);
        serial.setStatus(ProductSerialStatus.AVAILABLE);
        return serial;
    }

    private void createGenericAdmin(String username, String password) {
        Admin admin = new Admin();
        admin.setUsername(username);
        admin.setEmail(username);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setDisplayName("Limited Admin");
        admin.setRoleTitle("Admin");
        admin.setUserStatus(StaffUserStatus.ACTIVE);
        admin.setRequirePasswordChange(false);
        admin.setEmailVerified(true);
        admin.setEmailVerifiedAt(java.time.Instant.now());
        admin.setRoles(new HashSet<>(Set.of(resolveRole("ADMIN", "Admin role"))));
        adminRepository.save(admin);
    }

    private Role resolveRole(String name, String description) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = new Role();
            role.setName(name);
            role.setDescription(description);
            return roleRepository.save(role);
        });
    }
}
