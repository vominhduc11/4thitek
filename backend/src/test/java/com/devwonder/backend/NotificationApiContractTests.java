package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.dto.notify.NotifyResponse;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Notify;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.NotifyRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:notification_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=notifications.admin@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Notifications Admin",
        "app.mail.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class NotificationApiContractTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private NotifyRepository notifyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    @BeforeEach
    void setUp() {
        notifyRepository.deleteAll();
        dealerRepository.deleteAll();
        reset(messagingTemplate);

        Admin admin = adminRepository.findByUsername("notifications.admin@example.com").orElseThrow();
        admin.setPassword(passwordEncoder.encode("ChangedPass#456"));
        admin.setRequirePasswordChange(false);
        adminRepository.save(admin);
    }

    @Test
    void adminNotificationDispatchPersistsBodyAndDeepLinkAndPublishesDealerPayload() throws Exception {
        String adminToken = login("notifications.admin@example.com", "ChangedPass#456");
        Dealer dealer = registerActiveDealer("notify-contract");
        reset(messagingTemplate);

        mockMvc.perform(post("/api/v1/admin/notifications")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "audience": "DEALERS",
                                  "title": "Thông báo bảo hành",
                                  "body": "Mời kiểm tra quy trình bảo hành mới.",
                                  "type": "WARRANTY",
                                  "link": "https://4thitek.vn/warranty-policy",
                                  "deepLink": "/warranty"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.audience").value("DEALERS"))
                .andExpect(jsonPath("$.data.type").value("WARRANTY"))
                .andExpect(jsonPath("$.data.recipientCount").value(1));

        Notify saved = notifyRepository.findByAccountIdOrderByCreatedAtDesc(dealer.getId()).get(0);
        assertThat(saved.getTitle()).isEqualTo("Thông báo bảo hành");
        assertThat(saved.getContent()).isEqualTo("Mời kiểm tra quy trình bảo hành mới.");
        assertThat(saved.getLink()).isEqualTo("https://4thitek.vn/warranty-policy");
        assertThat(saved.getDeepLink()).isEqualTo("/warranty");

        ArgumentCaptor<Object> payloadCaptor = ArgumentCaptor.forClass(Object.class);
        verify(messagingTemplate).convertAndSendToUser(
                eq(dealer.getUsername()),
                eq("/queue/notifications"),
                payloadCaptor.capture()
        );

        Object payload = payloadCaptor.getValue();
        assertThat(payload).isInstanceOf(NotifyResponse.class);
        NotifyResponse notificationPayload = (NotifyResponse) payload;
        assertThat(notificationPayload.body()).isEqualTo("Mời kiểm tra quy trình bảo hành mới.");
        assertThat(notificationPayload.link()).isEqualTo("https://4thitek.vn/warranty-policy");
        assertThat(notificationPayload.deepLink()).isEqualTo("/warranty");
    }

    @Test
    void notificationReadApisExposeBodyAndDeepLinkContract() throws Exception {
        String adminToken = login("notifications.admin@example.com", "ChangedPass#456");
        Dealer dealer = registerActiveDealer("notify-read");
        String dealerToken = login(dealer.getEmail(), "Dealer#123");
        reset(messagingTemplate);

        mockMvc.perform(post("/api/v1/admin/notifications")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "audience": "ACCOUNTS",
                                  "accountIds": [%d],
                                  "title": "Khuyến mãi tháng 3",
                                  "body": "Xem danh sách sản phẩm đang ưu đãi.",
                                  "type": "PROMOTION",
                                  "link": "https://4thitek.vn/products",
                                  "deepLink": "/products"
                                }
                                """.formatted(dealer.getId())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/notifications/page")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].title").value("Khuyến mãi tháng 3"))
                .andExpect(jsonPath("$.data.items[0].body").value("Xem danh sách sản phẩm đang ưu đãi."))
                .andExpect(jsonPath("$.data.items[0].link").value("https://4thitek.vn/products"))
                .andExpect(jsonPath("$.data.items[0].deepLink").value("/products"))
                .andExpect(jsonPath("$.data.items[0].content").doesNotExist());

        mockMvc.perform(get("/api/v1/dealer/notifications")
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Khuyến mãi tháng 3"))
                .andExpect(jsonPath("$.data[0].body").value("Xem danh sách sản phẩm đang ưu đãi."))
                .andExpect(jsonPath("$.data[0].link").value("https://4thitek.vn/products"))
                .andExpect(jsonPath("$.data[0].deepLink").value("/products"))
                .andExpect(jsonPath("$.data[0].content").doesNotExist());
    }

    private Dealer registerActiveDealer(String prefix) throws Exception {
        String username = prefix + "@example.com";
        String email = "mail+" + prefix + "@example.com";

        mockMvc.perform(post("/api/v1/auth/register-dealer")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "Dealer#123",
                                  "businessName": "Dealer %s",
                                  "contactName": "Dealer %s",
                                  "taxCode": "TAX-%s",
                                  "phone": "0901234567",
                                  "email": "%s",
                                  "addressLine": "123 Notification Street",
                                  "district": "District 1",
                                  "city": "Ho Chi Minh City",
                                  "country": "Vietnam"
                                }
                                """.formatted(username, prefix, prefix, prefix, email)))
                .andExpect(status().isOk());

        Dealer dealer = dealerRepository.findByUsername(username).orElseThrow();
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        return dealerRepository.save(dealer);
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
