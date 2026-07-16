package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.enums.ProductSerialStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.ProductSerialRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
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

/**
 * Contract vòng đời thùng rác sản phẩm (BUSINESS_LOGIC / STATE_MACHINES §9):
 * isDeleted là cờ trash canonical — DELETE chỉ chuyển vào thùng rác, list mặc định
 * ẩn record trash, includeDeleted=true trả về, restore đưa về DRAFT, và
 * DELETE /{id}/permanent chỉ xóa thật khi đã ở thùng rác và không còn tham chiếu.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:admin_product_trash;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=trash.admin@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Trash Admin",
        "app.mail.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AdminProductTrashContractTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSerialRepository productSerialRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        Admin admin = adminRepository.findByUsername("trash.admin@example.com").orElseThrow();
        admin.setPassword(passwordEncoder.encode("ChangedPass#456"));
        admin.setRequirePasswordChange(false);
        adminRepository.save(admin);
        productSerialRepository.deleteAll();
        productRepository.deleteAll();
    }

    @Test
    void deleteMovesToTrashAndDefaultListHidesIt() throws Exception {
        String token = login();
        long id = createProduct(token, "TRASH-SKU-1", "PUBLISHED");

        mockMvc.perform(delete("/api/v1/admin/products/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        assertThat(listSkus(token, false)).doesNotContain("TRASH-SKU-1");

        JsonNode trashed = findProduct(token, true, "TRASH-SKU-1");
        assertThat(trashed).isNotNull();
        assertThat(trashed.path("isDeleted").asBoolean()).isTrue();
        assertThat(trashed.path("publishStatus").asText()).isEqualTo("DRAFT");
    }

    @Test
    void restoreReturnsTrashedProductToDefaultList() throws Exception {
        String token = login();
        long id = createProduct(token, "TRASH-SKU-2", "DRAFT");

        mockMvc.perform(delete("/api/v1/admin/products/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/admin/products/" + id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content("{\"isDeleted\": false}"))
                .andExpect(status().isOk());

        JsonNode restored = findProduct(token, false, "TRASH-SKU-2");
        assertThat(restored).isNotNull();
        assertThat(restored.path("isDeleted").asBoolean()).isFalse();
        assertThat(restored.path("publishStatus").asText()).isEqualTo("DRAFT");
    }

    @Test
    void permanentDeleteRequiresTrashFirst() throws Exception {
        String token = login();
        long id = createProduct(token, "TRASH-SKU-3", "DRAFT");

        mockMvc.perform(delete("/api/v1/admin/products/" + id + "/permanent")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        assertThat(listSkus(token, true)).contains("TRASH-SKU-3");
    }

    @Test
    void permanentDeleteIsBlockedWhileSerialsReferenceTheProduct() throws Exception {
        String token = login();
        long id = createProduct(token, "TRASH-SKU-4", "DRAFT");

        Product product = productRepository.findById(id).orElseThrow();
        ProductSerial serial = new ProductSerial();
        serial.setSerial("SN-TRASH-4-001");
        serial.setStatus(ProductSerialStatus.AVAILABLE);
        serial.setProduct(product);
        productSerialRepository.save(serial);

        mockMvc.perform(delete("/api/v1/admin/products/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/admin/products/" + id + "/permanent")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());

        assertThat(listSkus(token, true)).contains("TRASH-SKU-4");
    }

    @Test
    void permanentDeleteRemovesUnreferencedTrashedProduct() throws Exception {
        String token = login();
        long id = createProduct(token, "TRASH-SKU-5", "DRAFT");

        mockMvc.perform(delete("/api/v1/admin/products/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/admin/products/" + id + "/permanent")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        assertThat(listSkus(token, true)).doesNotContain("TRASH-SKU-5");
        assertThat(productRepository.findById(id)).isEmpty();
    }

    private long createProduct(String token, String sku, String publishStatus) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "sku": "%s",
                                  "name": "Sản phẩm %s",
                                  "retailPrice": 150000,
                                  "publishStatus": "%s"
                                }
                                """.formatted(sku, sku, publishStatus)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsString());
        return payload.path("data").path("id").asLong();
    }

    private List<String> listSkus(String token, boolean includeDeleted) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/admin/products")
                        .queryParam("includeDeleted", String.valueOf(includeDeleted))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        List<String> skus = new ArrayList<>();
        data.forEach(node -> skus.add(node.path("sku").asText()));
        return skus;
    }

    private JsonNode findProduct(String token, boolean includeDeleted, String sku) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/admin/products")
                        .queryParam("includeDeleted", String.valueOf(includeDeleted))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        for (JsonNode node : data) {
            if (sku.equals(node.path("sku").asText())) {
                return node;
            }
        }
        return null;
    }

    private String login() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "trash.admin@example.com",
                                  "password": "ChangedPass#456"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode payload = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return payload.path("data").path("accessToken").asText();
    }
}
