package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.BulkDiscount;
import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.BulkDiscountRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:admin_discount_rule_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=discount.owner@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Discount Owner",
        "app.mail.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AdminDiscountRuleContractTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private BulkDiscountRepository bulkDiscountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        bulkDiscountRepository.deleteAll();
        Admin admin = adminRepository.findByUsername("discount.owner@example.com").orElseThrow();
        admin.setPassword(passwordEncoder.encode("ChangedPass#456"));
        admin.setRequirePasswordChange(false);
        adminRepository.save(admin);
    }

    @Test
    void listResponseGeneratesRangeLabelsFromCanonicalQuantities() throws Exception {
        String accessToken = login("discount.owner@example.com", "ChangedPass#456");
        bulkDiscountRepository.save(rule(1, 10, 10, DiscountRuleStatus.ACTIVE));
        bulkDiscountRepository.save(rule(51, null, 40, DiscountRuleStatus.ACTIVE));

        mockMvc.perform(get("/api/v1/admin/discount-rules")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].fromQuantity").value(1))
                .andExpect(jsonPath("$.data[0].toQuantity").value(10))
                .andExpect(jsonPath("$.data[0].rangeLabel").value("1 - 10"))
                .andExpect(jsonPath("$.data[1].fromQuantity").value(51))
                .andExpect(jsonPath("$.data[1].rangeLabel").value("51+"));
    }

    @Test
    void createActiveOverlapIsRejected() throws Exception {
        String accessToken = login("discount.owner@example.com", "ChangedPass#456");
        bulkDiscountRepository.save(rule(1, 10, 10, DiscountRuleStatus.ACTIVE));

        mockMvc.perform(post("/api/v1/admin/discount-rules")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "fromQuantity": 10,
                                  "toQuantity": 20,
                                  "percent": 20,
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Active discount tiers overlap at boundary between 1 - 10 and 10 - 20"));
    }

    @Test
    void secondActiveOpenEndedRuleIsRejected() throws Exception {
        String accessToken = login("discount.owner@example.com", "ChangedPass#456");
        bulkDiscountRepository.save(rule(21, null, 30, DiscountRuleStatus.ACTIVE));

        mockMvc.perform(post("/api/v1/admin/discount-rules")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "fromQuantity": 51,
                                  "toQuantity": null,
                                  "percent": 40,
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Only one active open-ended discount tier is allowed"));
    }

    @Test
    void invalidPercentIsRejected() throws Exception {
        String accessToken = login("discount.owner@example.com", "ChangedPass#456");

        mockMvc.perform(post("/api/v1/admin/discount-rules")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "fromQuantity": 21,
                                  "toQuantity": 21,
                                  "percent": 0,
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.percent").value("percent must be greater than 0"));
    }

    @Test
    void draftRuleCanBeCreatedThenActivatedWithValidUpdateFlow() throws Exception {
        String accessToken = login("discount.owner@example.com", "ChangedPass#456");
        bulkDiscountRepository.save(rule(1, 10, 10, DiscountRuleStatus.ACTIVE));

        MvcResult createResult = mockMvc.perform(post("/api/v1/admin/discount-rules")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "fromQuantity": 10,
                                  "toQuantity": 20,
                                  "percent": 20,
                                  "status": "DRAFT"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andReturn();

        JsonNode payload = objectMapper.readTree(createResult.getResponse().getContentAsString()).path("data");
        long ruleId = payload.path("id").asLong();

        mockMvc.perform(put("/api/v1/admin/discount-rules/{id}", ruleId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "fromQuantity": 11,
                                  "toQuantity": 20,
                                  "percent": 20,
                                  "status": "DRAFT"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rangeLabel").value("11 - 20"));

        mockMvc.perform(patch("/api/v1/admin/discount-rules/{id}/status", ruleId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.rangeLabel").value("11 - 20"));

        List<BulkDiscount> savedRules = bulkDiscountRepository.findAll().stream()
                .sorted(Comparator.comparing(BulkDiscount::getFromQuantity))
                .toList();
        assertThat(savedRules).hasSize(2);
        assertThat(savedRules.get(1).getStatus()).isEqualTo(DiscountRuleStatus.ACTIVE);
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

    private static BulkDiscount rule(int fromQuantity, Integer toQuantity, int percent, DiscountRuleStatus status) {
        BulkDiscount rule = new BulkDiscount();
        rule.setFromQuantity(fromQuantity);
        rule.setToQuantity(toQuantity);
        rule.setDiscountPercent(BigDecimal.valueOf(percent));
        rule.setStatus(status);
        return rule;
    }
}
