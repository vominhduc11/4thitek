package com.devwonder.backend;

import static java.nio.charset.StandardCharsets.UTF_8;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.repository.AdminRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void prepareAdminAccount() {
        Admin admin = adminRepository.findByUsername("upload.admin@example.com").orElseThrow();
        admin.setPassword(passwordEncoder.encode("ChangedPass#456"));
        admin.setRequireLoginEmailConfirmation(false);
        adminRepository.save(admin);
    }

    @Test
    void customerCannotUploadProductAssets() throws Exception {
        String customerToken = registerCustomerAndExtractAccessToken("cust-products");

        mockMvc.perform(multipart("/api/upload/products")
                        .file(sampleImage("product-upload.png"))
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCanUploadOwnAvatarIntoScopedFolder() throws Exception {
        String customerToken = registerCustomerAndExtractAccessToken("cust-avatar");

        mockMvc.perform(multipart("/api/upload/customer-avatars")
                        .file(sampleImage("customer-avatar.png"))
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.url").value(containsString("/uploads/avatars/customers/account-")))
                .andExpect(jsonPath("$.data.fileName").value(containsString("avatars/customers/account-")));
    }

    @Test
    void customerCannotDeleteAdminManagedProductAsset() throws Exception {
        String adminToken = login("upload.admin@example.com", "ChangedPass#456");
        String customerToken = registerCustomerAndExtractAccessToken("cust-delete");

        MvcResult uploadResult = mockMvc.perform(multipart("/api/upload/products")
                        .file(sampleImage("admin-product.png"))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode uploadPayload = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String uploadedUrl = uploadPayload.path("data").path("url").asText();

        mockMvc.perform(delete("/api/upload")
                        .param("url", uploadedUrl)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied"));
    }

    private MockMultipartFile sampleImage(String fileName) {
        return new MockMultipartFile("file", fileName, "image/png", "test-image".getBytes(UTF_8));
    }

    private String registerCustomerAndExtractAccessToken(String prefix) throws Exception {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        long phoneSuffix = Math.floorMod(UUID.randomUUID().getMostSignificantBits(), 1_000_000_000L);
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register-customer")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Upload Boundary %s",
                                  "phone": "0%s",
                                  "email": "%s@example.com",
                                  "username": "%s",
                                  "password": "Customer#123"
                                }
                                """.formatted(
                                unique,
                                "%09d".formatted(phoneSuffix),
                                prefix + unique,
                                prefix + unique
                        )))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode payload = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        return payload.path("data").path("accessToken").asText();
    }

    private String login(String username, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
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
