package com.devwonder.backend;

import static java.nio.charset.StandardCharsets.UTF_8;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.service.FileStorageService;
import java.io.ByteArrayInputStream;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:upload_asset_public_s3;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.storage.provider=s3",
        "app.bootstrap-super-admin.enabled=false"
})
@AutoConfigureMockMvc
class UploadAssetPublicS3Tests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FileStorageService fileStorageService;

    @Test
    void s3UploadsArePubliclyServedWithLongCacheHeaders() throws Exception {
        byte[] body = "file-body".getBytes(UTF_8);
        when(fileStorageService.open("products/spec-sheet.png"))
                .thenReturn(new FileStorageService.StoredFile(
                        new ByteArrayInputStream(body),
                        "image/png",
                        body.length
                ));

        mockMvc.perform(get("/uploads/products/spec-sheet.png"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("max-age=31536000")))
                .andExpect(content().bytes(body));
    }

    @Test
    void s3PaymentProofIsNotPubliclyServedViaUploadsEndpoint() throws Exception {
        mockMvc.perform(get("/uploads/payments/proofs/dealers/12/private-proof.png"))
                .andExpect(status().isNotFound());
    }

    @Test
    void s3DealerAvatarIsNotPubliclyServedViaUploadsEndpoint() throws Exception {
        mockMvc.perform(get("/uploads/avatars/dealers/42/avatar.png"))
                .andExpect(status().isNotFound());
    }

    @Test
    void s3AdminAvatarIsNotPubliclyServedViaUploadsEndpoint() throws Exception {
        mockMvc.perform(get("/uploads/avatars/7/profile.png"))
                .andExpect(status().isNotFound());
    }

    @Test
    void s3ProductAssetIsPubliclyServedViaUploadsEndpoint() throws Exception {
        byte[] body = "img".getBytes(UTF_8);
        when(fileStorageService.open("products/thumbnail.webp"))
                .thenReturn(new FileStorageService.StoredFile(
                        new ByteArrayInputStream(body),
                        "image/webp",
                        body.length
                ));

        mockMvc.perform(get("/uploads/products/thumbnail.webp"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(body));
    }

    @Test
    void s3BlogAssetIsPubliclyServedViaUploadsEndpoint() throws Exception {
        byte[] body = "blog-img".getBytes(UTF_8);
        when(fileStorageService.open("blogs/cover.jpg"))
                .thenReturn(new FileStorageService.StoredFile(
                        new ByteArrayInputStream(body),
                        "image/jpeg",
                        body.length
                ));

        mockMvc.perform(get("/uploads/blogs/cover.jpg"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(body));
    }
}
