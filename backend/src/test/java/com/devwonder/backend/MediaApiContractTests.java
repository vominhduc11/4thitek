package com.devwonder.backend;

import static java.nio.charset.StandardCharsets.UTF_8;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.DealerSupportTicketRepository;
import com.devwonder.backend.repository.MediaAssetRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:media_api_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=media.admin@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Media Admin",
        "app.upload.dir=target/test-uploads/media-api"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class MediaApiContractTests {

    private static final byte[] SAMPLE_PNG_BYTES = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+lmLsAAAAASUVORK5CYII="
    );
    private static final byte[] SAMPLE_PDF_BYTES = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
            .getBytes(UTF_8);
    private static final byte[] SAMPLE_MP4_BYTES = new byte[]{
            0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
            0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32
    };

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DealerSupportTicketRepository dealerSupportTicketRepository;

    @Autowired
    private MediaAssetRepository mediaAssetRepository;

    @BeforeEach
    void setUp() {
        dealerSupportTicketRepository.deleteAll();
        mediaAssetRepository.deleteAll();

        Admin admin = adminRepository.findByUsername("media.admin@example.com").orElseThrow();
        admin.setPassword(passwordEncoder.encode("ChangedPass#456"));
        admin.setRequirePasswordChange(false);
        adminRepository.save(admin);
    }

    @Test
    void uploadSessionRejectsUnsupportedExtensionAndOversizedImage() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("media-invalid");

        mockMvc.perform(post("/api/v1/media/upload-session")
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + dealerToken)
                        .content("""
                                {
                                  "fileName": "virus.exe",
                                  "contentType": "application/octet-stream",
                                  "sizeBytes": 100,
                                  "category": "support_ticket"
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/media/upload-session")
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + dealerToken)
                        .content("""
                                {
                                  "fileName": "too-large.png",
                                  "contentType": "image/png",
                                  "sizeBytes": 10485761,
                                  "category": "support_ticket"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void uploadAndFinalizeImageVideoPdfAndLinkToSupportTicket() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("media-allowed");

        long imageId = createUploadSession(dealerToken, "proof.png", "image/png", SAMPLE_PNG_BYTES.length);
        uploadSessionContent(dealerToken, imageId, "proof.png", "image/png", SAMPLE_PNG_BYTES);
        mockMvc.perform(post("/api/v1/media/finalize")
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + dealerToken)
                        .content("""
                                {
                                  "mediaAssetId": %d
                                }
                                """.formatted(imageId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(imageId))
                .andExpect(jsonPath("$.data.mediaType").value("image"));

        long pdfId = createUploadSession(dealerToken, "payment-proof.pdf", "application/pdf", SAMPLE_PDF_BYTES.length);
        uploadSessionContent(dealerToken, pdfId, "payment-proof.pdf", "application/pdf", SAMPLE_PDF_BYTES);
        mockMvc.perform(post("/api/v1/media/finalize")
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + dealerToken)
                        .content("""
                                {
                                  "mediaAssetId": %d
                                }
                                """.formatted(pdfId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(pdfId))
                .andExpect(jsonPath("$.data.mediaType").value("document"));

        long videoId = createUploadSession(dealerToken, "evidence.mp4", "video/mp4", SAMPLE_MP4_BYTES.length);
        uploadSessionContent(dealerToken, videoId, "evidence.mp4", "video/mp4", SAMPLE_MP4_BYTES);
        mockMvc.perform(post("/api/v1/media/finalize")
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + dealerToken)
                        .content("""
                                {
                                  "mediaAssetId": %d
                                }
                                """.formatted(videoId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(videoId))
                .andExpect(jsonPath("$.data.mediaType").value("video"));

        MvcResult ticketResult = mockMvc.perform(post("/api/v1/dealer/support-tickets")
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + dealerToken)
                        .content("""
                                {
                                  "category": "payment",
                                  "priority": "normal",
                                  "subject": "Media evidence",
                                  "message": "See attachments",
                                  "mediaAssetIds": [%d, %d, %d]
                                }
                                """.formatted(imageId, pdfId, videoId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.messages[0].attachments.length()").value(3))
                .andExpect(jsonPath("$.data.messages[0].attachments[0].id").value(imageId))
                .andExpect(jsonPath("$.data.messages[0].attachments[1].id").value(pdfId))
                .andExpect(jsonPath("$.data.messages[0].attachments[2].id").value(videoId))
                .andReturn();

        long ticketId = objectMapper.readTree(ticketResult.getResponse().getContentAsString())
                .path("data")
                .path("id")
                .asLong();
        assertThat(ticketId).isPositive();
    }

    @Test
    void uploadContentMismatchIsRejected() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("media-mismatch");
        long mediaAssetId = createUploadSession(dealerToken, "proof.png", "image/png", SAMPLE_PDF_BYTES.length);

        mockMvc.perform(multipart("/api/v1/media/upload-session/{id}/content", mediaAssetId)
                        .file(new MockMultipartFile("file", "proof.png", "image/png", SAMPLE_PDF_BYTES))
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void dealerCannotAccessOtherDealerMediaButAdminCan() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("media-owner");
        String otherDealerToken = registerDealerAndExtractAccessToken("media-other");
        String adminToken = login("media.admin@example.com", "ChangedPass#456");

        long mediaAssetId = createUploadSession(dealerToken, "proof.png", "image/png", SAMPLE_PNG_BYTES.length);
        uploadSessionContent(dealerToken, mediaAssetId, "proof.png", "image/png", SAMPLE_PNG_BYTES);
        mockMvc.perform(post("/api/v1/media/finalize")
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + dealerToken)
                        .content("""
                                {
                                  "mediaAssetId": %d
                                }
                                """.formatted(mediaAssetId)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/media/{id}/download", mediaAssetId)
                        .header("Authorization", "Bearer " + otherDealerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/media/{id}/download", mediaAssetId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().bytes(SAMPLE_PNG_BYTES));
    }

    private long createUploadSession(String token, String fileName, String contentType, int sizeBytes) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/media/upload-session")
                        .contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + token)
                        .content("""
                                {
                                  "fileName": "%s",
                                  "contentType": "%s",
                                  "sizeBytes": %d,
                                  "category": "support_ticket"
                                }
                                """.formatted(fileName, contentType, sizeBytes)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsString());
        return payload.path("data").path("mediaAssetId").asLong();
    }

    private void uploadSessionContent(String token, long mediaAssetId, String fileName, String contentType, byte[] bytes) throws Exception {
        mockMvc.perform(multipart("/api/v1/media/upload-session/{id}/content", mediaAssetId)
                        .file(new MockMultipartFile("file", fileName, contentType, bytes))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(mediaAssetId));
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
                                  "businessName": "Media Dealer %s",
                                  "contactName": "Media Dealer %s",
                                  "taxCode": "TAX-%s",
                                  "phone": "0%s",
                                  "email": "%s",
                                  "addressLine": "123 Media Street",
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
