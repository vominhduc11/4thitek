package com.devwonder.backend;

import static java.nio.charset.StandardCharsets.UTF_8;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:rate_limit_upload_method_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.rate-limit.enabled=true",
        "app.rate-limit.upload-requests=1",
        "app.rate-limit.upload-window-seconds=60",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=rate.limit.upload@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Rate Limit Upload",
        "app.upload.dir=target/test-uploads/rate-limit-upload-method"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class RateLimitUploadMethodContractTests {

    private static final byte[] SAMPLE_PNG_BYTES = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+lmLsAAAAASUVORK5CYII="
    );

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void uploadRateLimitAppliesToPostsButNotAuthenticatedReads() throws Exception {
        String adminToken = login("rate.limit.upload@example.com", "InitPass#123");

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/upload/avatars")
                        .file(sampleImage("admin-avatar-1.png"))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode payload = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String uploadedUrl = payload.path("data").path("url").asText();

        mockMvc.perform(get(uploadedUrl)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get(uploadedUrl)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(multipart("/api/v1/upload/avatars")
                        .file(sampleImage("admin-avatar-2.png"))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isTooManyRequests());
    }

    private MockMultipartFile sampleImage(String fileName) {
        return new MockMultipartFile("file", fileName, "image/png", SAMPLE_PNG_BYTES);
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
