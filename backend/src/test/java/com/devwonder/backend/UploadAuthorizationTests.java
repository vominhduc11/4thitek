package com.devwonder.backend;

import static java.nio.charset.StandardCharsets.UTF_8;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.security.JWTUtils;
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
        "spring.datasource.url=jdbc:h2:mem:upload_authorization;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=upload.admin@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Upload Admin",
        "app.upload.dir=target/test-uploads/upload-authorization"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class UploadAuthorizationTests {

    private static final byte[] SAMPLE_PNG_BYTES = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+lmLsAAAAASUVORK5CYII="
    );
    private static final byte[] SAMPLE_PDF_BYTES = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
            .getBytes(UTF_8);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JWTUtils jwtUtils;

    @BeforeEach
    void prepareAdminAccount() {
        Admin admin = adminRepository.findByUsername("upload.admin@example.com").orElseThrow();
        admin.setPassword(passwordEncoder.encode("ChangedPass#456"));
        admin.setRequirePasswordChange(false);
        adminRepository.save(admin);
    }

    @Test
    void dealerCannotUploadProductAssets() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("dealer-products");

        mockMvc.perform(multipart("/api/v1/upload/products")
                        .file(sampleImage("product-upload.png"))
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCannotUploadPdfAsProductAsset() throws Exception {
        String adminToken = login("upload.admin@example.com", "ChangedPass#456");

        mockMvc.perform(multipart("/api/v1/upload/products")
                        .file(samplePdf("product-spec.pdf"))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unsupported file extension for this upload category: pdf"));
    }

    @Test
    void adminCannotUploadPdfAsBlogAsset() throws Exception {
        String adminToken = login("upload.admin@example.com", "ChangedPass#456");

        mockMvc.perform(multipart("/api/v1/upload/blogs")
                        .file(samplePdf("blog-attachment.pdf"))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unsupported file extension for this upload category: pdf"));
    }

    @Test
    void dealerCanUploadOwnAvatarIntoScopedFolder() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("dealer-avatar");

        mockMvc.perform(multipart("/api/v1/upload/dealer-avatars")
                        .file(sampleImage("dealer-avatar.png"))
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.url").value(containsString("/api/v1/upload/avatars/dealers/")))
                .andExpect(jsonPath("$.data.fileName").value("dealer-avatar.png"))
                .andExpect(jsonPath("$.data.storedPath").value(containsString("avatars/dealers/")));
    }

    @Test
    void underReviewDealerCannotUploadOwnAvatar() throws Exception {
        Dealer dealer = registerDealer("dealer-avatar-review", CustomerStatus.UNDER_REVIEW);
        String dealerToken = jwtUtils.generateToken(dealer);

        mockMvc.perform(multipart("/api/v1/upload/dealer-avatars")
                        .file(sampleImage("dealer-avatar-review.png"))
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void underReviewDealerCannotUploadPaymentProof() throws Exception {
        Dealer dealer = registerDealer("dealer-proof-review", CustomerStatus.UNDER_REVIEW);
        String dealerToken = jwtUtils.generateToken(dealer);

        mockMvc.perform(multipart("/api/v1/upload/payment-proofs")
                        .file(sampleImage("dealer-proof-review.png"))
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminUploadsAvatarIntoAdminScopedFolder() throws Exception {
        String adminToken = login("upload.admin@example.com", "ChangedPass#456");
        Admin admin = adminRepository.findByUsername("upload.admin@example.com").orElseThrow();

        mockMvc.perform(multipart("/api/v1/upload/avatars")
                        .file(sampleImage("admin-avatar.png"))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.url").value(containsString("/api/v1/upload/avatars/" + admin.getId() + "/")))
                .andExpect(jsonPath("$.data.fileName").value("admin-avatar.png"))
                .andExpect(jsonPath("$.data.storedPath").value(containsString("avatars/" + admin.getId() + "/")));
    }

    @Test
    void dealerCannotDeleteAdminManagedProductAsset() throws Exception {
        String adminToken = login("upload.admin@example.com", "ChangedPass#456");
        String dealerToken = registerDealerAndExtractAccessToken("dealer-delete");

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/upload/products")
                        .file(sampleImage("admin-product.png"))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode uploadPayload = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String uploadedUrl = uploadPayload.path("data").path("url").asText();

        mockMvc.perform(delete("/api/v1/upload")
                        .param("url", uploadedUrl)
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied"));
    }

    @Test
    void localProductAssetsArePubliclyReadableWithoutAuthentication() throws Exception {
        String adminToken = login("upload.admin@example.com", "ChangedPass#456");

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/upload/products")
                        .file(sampleImage("public-product.png"))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode uploadPayload = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String uploadedUrl = uploadPayload.path("data").path("url").asText();

        mockMvc.perform(get(uploadedUrl))
                .andExpect(status().isOk())
                .andExpect(content().bytes(SAMPLE_PNG_BYTES));
    }

    @Test
    void localUploadsUseAuthenticatedInternalReadRoute() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("dealer-fetch");

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/upload/dealer-avatars")
                        .file(sampleImage("dealer-fetch.png"))
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.url").value(containsString("/api/v1/upload/avatars/dealers/")))
                .andReturn();

        JsonNode uploadPayload = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String uploadedUrl = uploadPayload.path("data").path("url").asText();

        mockMvc.perform(get(uploadedUrl))
                .andExpect(status().isForbidden());

        mockMvc.perform(get(uploadedUrl)
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(content().bytes(SAMPLE_PNG_BYTES));

        mockMvc.perform(get(uploadedUrl.replace("/api/v1/upload/", "/uploads/")))
                .andExpect(status().isNotFound());
    }

    @Test
    void dealerCanStillUploadPdfPaymentProof() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("dealer-proof-pdf");

        mockMvc.perform(multipart("/api/v1/upload/payment-proofs")
                        .file(samplePdf("proof.pdf"))
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.url").value(containsString("/api/v1/upload/payments/proofs/dealers/")))
                .andExpect(jsonPath("$.data.fileName").value("proof.pdf"))
                .andExpect(jsonPath("$.data.storedPath").value(containsString(".pdf")));
    }

    @Test
    void supportUploadResponseSeparatesDisplayNameFromStoredPath() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("dealer-support-upload");

        mockMvc.perform(multipart("/api/v1/upload/support-tickets")
                        .file(sampleImage("evidence-proof.png"))
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.url").value(containsString("/api/v1/upload/support/evidence/dealers/")))
                .andExpect(jsonPath("$.data.fileName").value("evidence-proof.png"))
                .andExpect(jsonPath("$.data.storedPath").value(containsString("support/evidence/dealers/")));
    }

    @Test
    void supportUploadResponseDecodesPercentEncodedDisplayNames() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("dealer-support-upload-encoded");

        mockMvc.perform(multipart("/api/v1/upload/support-tickets")
                        .file(new MockMultipartFile(
                                "file",
                                "Ng%C6%B0%E1%BB%9Di%20d%C3%B9ng%20-%20minh%20ch%E1%BB%A9ng.pdf",
                                "application/pdf",
                                SAMPLE_PDF_BYTES))
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fileName").value("Người dùng - minh chứng.pdf"));
    }

    @Test
    void dealerCanReadAdminSupportEvidenceUploads() throws Exception {
        String adminToken = login("upload.admin@example.com", "ChangedPass#456");
        String dealerToken = registerDealerAndExtractAccessToken("dealer-support-read");

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/upload/support-tickets")
                        .file(sampleImage("admin-support-image.png"))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode uploadPayload = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String uploadedUrl = uploadPayload.path("data").path("url").asText();

        mockMvc.perform(get(uploadedUrl)
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andExpect(content().bytes(SAMPLE_PNG_BYTES));
    }

    @Test
    void dealerCannotReadAnotherDealersSupportEvidencePath() throws Exception {
        String dealerToken = registerDealerAndExtractAccessToken("dealer-support-private");

        mockMvc.perform(get("/api/v1/upload/support/evidence/dealers/999/private-proof.png")
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void suspendedDealerCannotReadOrDeleteOwnUploadAfterSuspension() throws Exception {
        Dealer dealer = registerDealer("dealer-suspended-upload", CustomerStatus.ACTIVE);
        String dealerToken = login(dealer.getEmail(), "Dealer#123");

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/upload/dealer-avatars")
                        .file(sampleImage("dealer-suspended.png"))
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isOk())
                .andReturn();

        String uploadedUrl = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .path("data")
                .path("url")
                .asText();

        dealer.setCustomerStatus(CustomerStatus.SUSPENDED);
        dealerRepository.save(dealer);

        mockMvc.perform(get(uploadedUrl)
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/v1/upload")
                        .param("url", uploadedUrl)
                        .header("Authorization", "Bearer " + dealerToken))
                .andExpect(status().isUnauthorized());
    }

    private MockMultipartFile sampleImage(String fileName) {
        return new MockMultipartFile("file", fileName, "image/png", SAMPLE_PNG_BYTES);
    }

    private MockMultipartFile samplePdf(String fileName) {
        return new MockMultipartFile("file", fileName, "application/pdf", SAMPLE_PDF_BYTES);
    }

    private String registerDealerAndExtractAccessToken(String prefix) throws Exception {
        Dealer dealer = registerDealer(prefix, CustomerStatus.ACTIVE);
        return login(dealer.getEmail(), "Dealer#123");
    }

    private Dealer registerDealer(String prefix, CustomerStatus status) throws Exception {
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
                                  "businessName": "Upload Dealer %s",
                                  "contactName": "Boundary Dealer %s",
                                  "taxCode": "TAX-%s",
                                  "phone": "0%s",
                                  "email": "%s",
                                  "addressLine": "123 Upload Street",
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
        dealer.setCustomerStatus(status);
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

