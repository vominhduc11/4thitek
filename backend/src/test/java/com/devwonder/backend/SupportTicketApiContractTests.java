package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
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
        "spring.datasource.url=jdbc:h2:mem:support_ticket_api_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=support.admin@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Support Admin",
        "app.mail.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class SupportTicketApiContractTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerSupportTicketRepository.deleteAll();
        dealerRepository.deleteAll();

        Admin admin = adminRepository.findByUsername("support.admin@example.com").orElseThrow();
        admin.setPassword(passwordEncoder.encode("ChangedPass#456"));
        admin.setRequirePasswordChange(false);
        adminRepository.save(admin);
    }

    @Test
    void supportTicketApiAcceptsAndReturnsSpecEnumValues() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("support-ticket");

        MvcResult createResult = createSupportTicket(dealerToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("returnOrder"))
                .andExpect(jsonPath("$.data.priority").value("normal"))
                .andExpect(jsonPath("$.data.status").value("open"))
                .andReturn();

        Long ticketId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data")
                .path("id")
                .asLong();

        String adminToken = login("support.admin@example.com", "ChangedPass#456");

        mockMvc.perform(updateSupportTicketRequest(ticketId, adminToken, """
                        {
                          "status": "in_progress"
                        }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("in_progress"))
                .andExpect(jsonPath("$.data.messages.length()").value(2));
    }

    @Test
    void supportTicketWorkflowEnforcesTransitionPolicyAndTimelineReset() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("support-ticket-flow");
        Long ticketId = readTicketId(createSupportTicket(dealerToken).andExpect(status().isOk()).andReturn());
        String adminToken = login("support.admin@example.com", "ChangedPass#456");

        JsonNode inProgress = readData(mockMvc.perform(updateSupportTicketRequest(ticketId, adminToken, """
                        {
                          "status": "in_progress"
                        }
                        """))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(inProgress.path("status").asText()).isEqualTo("in_progress");
        assertThat(inProgress.path("resolvedAt").isNull()).isTrue();
        assertThat(inProgress.path("closedAt").isNull()).isTrue();

        JsonNode resolved = readData(mockMvc.perform(updateSupportTicketRequest(ticketId, adminToken, """
                        {
                          "status": "resolved"
                        }
                        """))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(resolved.path("status").asText()).isEqualTo("resolved");
        assertThat(resolved.path("resolvedAt").asText()).isNotBlank();
        assertThat(resolved.path("closedAt").isNull()).isTrue();

        JsonNode reopened = readData(mockMvc.perform(updateSupportTicketRequest(ticketId, adminToken, """
                        {
                          "status": "in_progress"
                        }
                        """))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(reopened.path("status").asText()).isEqualTo("in_progress");
        assertThat(reopened.path("resolvedAt").isNull()).isTrue();
        assertThat(reopened.path("closedAt").isNull()).isTrue();

        JsonNode closed = readData(mockMvc.perform(updateSupportTicketRequest(ticketId, adminToken, """
                        {
                          "status": "closed"
                        }
                        """))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(closed.path("status").asText()).isEqualTo("closed");
        assertThat(closed.path("resolvedAt").asText()).isNotBlank();
        assertThat(closed.path("closedAt").asText()).isNotBlank();

        mockMvc.perform(updateSupportTicketRequest(ticketId, adminToken, """
                        {
                          "status": "in_progress"
                        }
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Support ticket transition from CLOSED to IN_PROGRESS is not allowed"));
    }

    @Test
    void publicReplyMustGoThroughMessageEndpointInsteadOfTicketPatch() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("support-ticket-reply");
        Long ticketId = readTicketId(createSupportTicket(dealerToken).andExpect(status().isOk()).andReturn());
        String adminToken = login("support.admin@example.com", "ChangedPass#456");

        JsonNode updated = readData(mockMvc.perform(updateSupportTicketRequest(ticketId, adminToken, """
                        {
                          "status": "in_progress"
                        }
                        """))
                .andExpect(status().isOk())
                .andReturn());

        assertThat(updated.path("messages").size()).isEqualTo(2);

        JsonNode replied = readData(mockMvc.perform(post("/api/v1/admin/support-tickets/{id}/messages", ticketId)
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + adminToken)
                        .content("""
                                {
                                  "message": "Đã tiếp nhận và đang xử lý."
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(replied.path("messages").size()).isEqualTo(3);
        assertThat(replied.path("messages").get(2).path("authorRole").asText()).isEqualTo("admin");
        assertThat(replied.path("messages").get(2).path("message").asText()).isEqualTo("Đã tiếp nhận và đang xử lý.");
    }

    @Test
    void supportTicketThreadSupportsAssigneeInternalNoteAndDealerFollowUp() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("support-ticket-thread");
        Long ticketId = readTicketId(createSupportTicket(dealerToken).andExpect(status().isOk()).andReturn());
        Admin admin = adminRepository.findByUsername("support.admin@example.com").orElseThrow();
        String adminToken = login("support.admin@example.com", "ChangedPass#456");

        JsonNode assigned = readData(mockMvc.perform(updateSupportTicketRequest(ticketId, adminToken, """
                        {
                          "status": "in_progress",
                          "assigneeId": %d
                        }
                        """.formatted(admin.getId())))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(assigned.path("assigneeId").asLong()).isEqualTo(admin.getId());

        JsonNode adminMessage = readData(mockMvc.perform(post("/api/v1/admin/support-tickets/{id}/messages", ticketId)
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + adminToken)
                        .content("""
                                {
                                  "message": "Đã kiểm tra và đang xử lý nội bộ.",
                                  "internalNote": true
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(adminMessage.path("messages").size()).isEqualTo(4);
        assertThat(adminMessage.path("messages").get(3).path("internalNote").asBoolean()).isTrue();

        JsonNode dealerFollowUp = readData(mockMvc.perform(post("/api/v1/dealer/support-tickets/{id}/messages", ticketId)
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + dealerToken)
                        .content("""
                                {
                                  "message": "Nhờ cập nhật thêm tiến độ xử lý."
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(dealerFollowUp.path("messages").size()).isEqualTo(2);
        assertThat(dealerFollowUp.path("messages").get(0).path("authorRole").asText()).isEqualTo("dealer");
        assertThat(dealerFollowUp.path("messages").get(1).path("authorRole").asText()).isEqualTo("dealer");

        mockMvc.perform(get("/api/v1/admin/support-tickets")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].messages.length()").value(5));
    }

    @Test
    void supportTicketApiPersistsContextDataAndAttachments() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("support-ticket-attachments");

        JsonNode created = readData(mockMvc.perform(post("/api/v1/dealer/support-tickets")
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + dealerToken)
                        .content("""
                                {
                                  "category": "payment",
                                  "priority": "high",
                                  "subject": "Need payment review",
                                  "message": "Please verify this transfer.",
                                  "contextData": {
                                    "orderCode": "ORD-2026-001",
                                    "transactionCode": "FT123456",
                                    "paidAmount": 22000,
                                    "paymentReference": "Thanh toan don ORD-2026-001"
                                  },
                                  "attachments": [
                                    {
                                      "url": "/api/v1/upload/support/evidence/dealers/example-proof.png",
                                      "fileName": "example-proof.png"
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn());

        assertThat(created.path("contextData").path("orderCode").asText()).isEqualTo("ORD-2026-001");
        assertThat(created.path("messages").get(0).path("attachments").size()).isEqualTo(1);
        assertThat(created.path("messages").get(0).path("attachments").get(0).path("fileName").asText())
                .isEqualTo("example-proof.png");
    }

    private org.springframework.test.web.servlet.ResultActions createSupportTicket(String dealerToken) throws Exception {
        return mockMvc.perform(post("/api/v1/dealer/support-tickets")
                .contentType(APPLICATION_JSON)
                .header("Authorization", "Bearer " + dealerToken)
                .content("""
                        {
                          "category": "returnOrder",
                          "priority": "normal",
                          "subject": "Need return",
                          "message": "Need return workflow."
                        }
                        """));
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder updateSupportTicketRequest(
            Long ticketId,
            String adminToken,
            String body
    ) {
        return patch("/api/v1/admin/support-tickets/{id}", ticketId)
                .contentType(APPLICATION_JSON)
                .header("Authorization", "Bearer " + adminToken)
                .content(body);
    }

    private Long readTicketId(MvcResult result) throws Exception {
        return readData(result).path("id").asLong();
    }

    private JsonNode readData(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
    }

    private String registerDealerAndExtractAccessToken(String prefix) throws Exception {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        long phoneSuffix = Math.floorMod(UUID.randomUUID().getMostSignificantBits(), 1_000_000_000L);
        String username = prefix + "." + unique;
        String email = prefix + "." + unique + "@example.com";
        String password = "Dealer#123";

        mockMvc.perform(post("/api/v1/auth/register-dealer")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "%s",
                                  "businessName": "Support Dealer %s",
                                  "contactName": "Support Dealer %s",
                                  "taxCode": "TAX-%s",
                                  "phone": "0%s",
                                  "email": "%s",
                                  "addressLine": "123 Support Street",
                                  "district": "District 1",
                                  "city": "Ho Chi Minh City",
                                  "country": "Vietnam"
                                }
                                """.formatted(
                                username,
                                password,
                                unique,
                                unique,
                                unique,
                                "%09d".formatted(phoneSuffix),
                                email
                        )))
                .andExpect(status().isOk());

        Dealer dealer = dealerRepository.findByUsername(username).orElseThrow();
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        dealerRepository.save(dealer);

        return login(email, password);
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
}
