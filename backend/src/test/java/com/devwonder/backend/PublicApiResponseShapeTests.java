package com.devwonder.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Blog;
import com.devwonder.backend.entity.CategoryBlog;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.BlogStatus;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.PublishStatus;
import com.devwonder.backend.repository.BlogRepository;
import com.devwonder.backend.repository.CategoryBlogRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.ProductRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Guards the JSON field names of public API responses consumed by main-fe and dealer.
 *
 * <p>Existing contract tests verify <em>behaviour</em> (filters, error messages).
 * These tests verify <em>shape</em>: that every field the frontends depend on is
 * present in the serialised response under exactly the expected key name.
 *
 * <p>A failing test here means a field was renamed or removed in a DTO. Any such
 * change requires a corresponding update in every client that reads that field.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:public_api_shape;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.cache.type=none",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class PublicApiResponseShapeTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BlogRepository blogRepository;

    @Autowired
    private CategoryBlogRepository categoryBlogRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @BeforeEach
    void setUp() {
        blogRepository.deleteAll();
        categoryBlogRepository.deleteAll();
        productRepository.deleteAll();
        dealerRepository.deleteAll();
    }

    // ── Products ──────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/product/products — all 8 fields of PublicProductSummaryResponse
     * must be present in each item.
     *
     * <p>main-fe product card reads: id, name, sku, shortDescription, image, price,
     * stock, warrantyMonths. Renaming any of these breaks the UI silently.
     */
    @Test
    void productListResponseContainsAllRequiredFields() throws Exception {
        productRepository.save(createPublishedProduct("SHAPE-LIST-001", "Shape List Product"));

        mockMvc.perform(get("/api/v1/product/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").isNumber())
                .andExpect(jsonPath("$.data[0].name").isString())
                .andExpect(jsonPath("$.data[0].sku").isString())
                .andExpect(jsonPath("$.data[0].price").isNumber())
                .andExpect(jsonPath("$.data[0].stock").isNumber())
                .andExpect(jsonPath("$.data[0].warrantyMonths").isNumber())
                // shortDescription and image are nullable — assert key presence, not value
                .andExpect(jsonPath("$.data[0].shortDescription").hasJsonPath())
                .andExpect(jsonPath("$.data[0].image").hasJsonPath());
    }

    /**
     * GET /api/v1/product/{id} — all 12 fields of PublicProductDetailResponse.
     *
     * <p>Detail-only fields (description, specifications, videos, descriptions) are
     * nullable but must be serialised as JSON keys, not omitted entirely.
     */
    @Test
    void productDetailResponseContainsAllRequiredFields() throws Exception {
        Long id = productRepository.save(createPublishedProduct("SHAPE-DETAIL-001", "Shape Detail Product")).getId();

        mockMvc.perform(get("/api/v1/product/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.name").isString())
                .andExpect(jsonPath("$.data.sku").isString())
                .andExpect(jsonPath("$.data.price").isNumber())
                .andExpect(jsonPath("$.data.stock").isNumber())
                .andExpect(jsonPath("$.data.warrantyMonths").isNumber())
                // Nullable detail fields — must exist as JSON keys
                .andExpect(jsonPath("$.data.shortDescription").hasJsonPath())
                .andExpect(jsonPath("$.data.image").hasJsonPath())
                .andExpect(jsonPath("$.data.description").hasJsonPath())
                .andExpect(jsonPath("$.data.specifications").hasJsonPath())
                .andExpect(jsonPath("$.data.videos").hasJsonPath())
                .andExpect(jsonPath("$.data.descriptions").hasJsonPath());
    }

    // ── Blogs ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/blog/blogs — all 6 fields of PublicBlogSummaryResponse.
     *
     * <p>main-fe blog card reads: id, title, description, image, category, createdAt.
     */
    @Test
    void blogListResponseContainsAllRequiredFields() throws Exception {
        CategoryBlog category = new CategoryBlog();
        category.setName("Test Category");
        categoryBlogRepository.save(category);

        Blog blog = new Blog();
        blog.setTitle("Shape Test Blog");
        blog.setDescription("Test blog description");
        blog.setStatus(BlogStatus.PUBLISHED);
        blog.setIsDeleted(false);
        blog.setCategoryBlog(category);
        blogRepository.save(blog);

        mockMvc.perform(get("/api/v1/blog/blogs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").isNumber())
                .andExpect(jsonPath("$.data[0].title").isString())
                .andExpect(jsonPath("$.data[0].category").isString())
                .andExpect(jsonPath("$.data[0].createdAt").exists())
                // description and image are nullable — must be serialised as JSON keys
                .andExpect(jsonPath("$.data[0].description").hasJsonPath())
                .andExpect(jsonPath("$.data[0].image").hasJsonPath());
    }

    // ── Dealers ───────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/user/dealer/page — wrapper shape + all 8 fields of PublicDealerResponse.
     *
     * <p>Verifies both the PagedResponse envelope (items, totalElements, totalPages,
     * page, size) and the dealer item fields (id, businessName, contactName,
     * address, city, district, phone, email).
     */
    @Test
    void dealerPageResponseContainsEnvelopeAndItemFields() throws Exception {
        dealerRepository.save(createActiveDealer("shape-dealer@example.com"));

        mockMvc.perform(get("/api/v1/user/dealer/page")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                // PagedResponse envelope
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.totalElements").isNumber())
                .andExpect(jsonPath("$.data.totalPages").isNumber())
                .andExpect(jsonPath("$.data.page").isNumber())
                .andExpect(jsonPath("$.data.size").isNumber())
                // Dealer item fields
                .andExpect(jsonPath("$.data.items[0].id").isNumber())
                .andExpect(jsonPath("$.data.items[0].businessName").hasJsonPath())
                .andExpect(jsonPath("$.data.items[0].email").isString())
                .andExpect(jsonPath("$.data.items[0].contactName").hasJsonPath())
                .andExpect(jsonPath("$.data.items[0].address").hasJsonPath())
                .andExpect(jsonPath("$.data.items[0].city").hasJsonPath())
                .andExpect(jsonPath("$.data.items[0].district").hasJsonPath())
                .andExpect(jsonPath("$.data.items[0].phone").hasJsonPath());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Product createPublishedProduct(String sku, String name) {
        Product product = new Product();
        product.setSku(sku);
        product.setName(name);
        product.setShortDescription("Short description for " + name);
        product.setRetailPrice(new BigDecimal("1500000"));
        product.setStock(5);
        product.setWarrantyPeriod(12);
        product.setPublishStatus(PublishStatus.PUBLISHED);
        product.setIsDeleted(false);
        return product;
    }

    private Dealer createActiveDealer(String email) {
        Dealer dealer = new Dealer();
        dealer.setUsername(email);
        dealer.setEmail(email);
        dealer.setPassword("encoded-password");
        dealer.setBusinessName("Shape Test Dealer");
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        return dealer;
    }
}
