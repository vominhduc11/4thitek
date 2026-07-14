package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.devwonder.backend.dto.admin.AdminBlogUpsertRequest;
import com.devwonder.backend.dto.admin.AdminProductUpsertRequest;
import com.devwonder.backend.dto.blog.PublicBlogDetailResponse;
import com.devwonder.backend.dto.publicapi.PublicProductDetailResponse;
import com.devwonder.backend.entity.CategoryBlog;
import com.devwonder.backend.entity.enums.BlogStatus;
import com.devwonder.backend.entity.enums.PublishStatus;
import com.devwonder.backend.repository.BlogRepository;
import com.devwonder.backend.repository.CategoryBlogRepository;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.PublicApiService;
import com.devwonder.backend.service.PublicBlogService;
import com.devwonder.backend.service.support.ProductStockSyncSupport;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;

/**
 * Bảo vệ dry-run "Live Preview": map bản nháp (chưa lưu) sang đúng public shape của
 * storefront, KHÔNG chạm DB cho product và chỉ tra category read-only cho blog.
 * Xem API_CONTRACT §5.1.
 */
class ProductBlogPreviewMappingTests {

    private final ProductRepository productRepository = mock(ProductRepository.class);
    private final BlogRepository blogRepository = mock(BlogRepository.class);
    private final DealerRepository dealerRepository = mock(DealerRepository.class);
    private final WarrantyRegistrationRepository warrantyRegistrationRepository =
            mock(WarrantyRegistrationRepository.class);
    private final ProductStockSyncSupport productStockSyncSupport = mock(ProductStockSyncSupport.class);
    private final CategoryBlogRepository categoryBlogRepository = mock(CategoryBlogRepository.class);

    private final PublicApiService publicApiService = new PublicApiService(
            productRepository,
            blogRepository,
            dealerRepository,
            warrantyRegistrationRepository,
            productStockSyncSupport,
            new ObjectMapper()
    );

    private final PublicBlogService publicBlogService = new PublicBlogService(
            blogRepository,
            categoryBlogRepository
    );

    @Test
    void previewProductMapsDraftToPublicDetailWithoutHittingRepositories() {
        AdminProductUpsertRequest request = new AdminProductUpsertRequest(
                "SKU-1",
                "Tai nghe SCS S-9",
                "Mô tả ngắn",
                Map.of("imageUrl", "https://cdn.example.com/s9.png"),
                List.of(Map.of("type", "description", "text", "Nội dung chi tiết")),
                List.of(Map.of("type", "youtube", "url", "https://youtu.be/abc")),
                List.of(Map.of("label", "Chống nước", "value", "IP67")),
                new BigDecimal("1990000"),
                7,
                24,
                Boolean.TRUE,
                Boolean.FALSE,
                Boolean.FALSE,
                PublishStatus.PUBLISHED
        );

        PublicProductDetailResponse response = publicApiService.previewProduct(request);

        assertThat(response.id()).isNull();
        assertThat(response.name()).isEqualTo("Tai nghe SCS S-9");
        assertThat(response.sku()).isEqualTo("SKU-1");
        assertThat(response.shortDescription()).isEqualTo("Mô tả ngắn");
        assertThat(response.description()).isEqualTo("Nội dung chi tiết");
        assertThat(response.image()).isEqualTo("https://cdn.example.com/s9.png");
        assertThat(response.price()).isEqualTo(1990000L);
        assertThat(response.stock()).isEqualTo(7);
        assertThat(response.warrantyMonths()).isEqualTo(24);
        assertThat(response.specifications()).isEqualTo(request.specifications());
        assertThat(response.videos()).isEqualTo(request.videos());
        assertThat(response.descriptions()).isEqualTo(request.descriptions());
    }

    @Test
    void previewProductToleratesMissingFields() {
        AdminProductUpsertRequest request = new AdminProductUpsertRequest(
                null, null, null, null, null, null, null, null, null, null, null, null, null, null
        );

        PublicProductDetailResponse response = publicApiService.previewProduct(request);

        assertThat(response.price()).isZero();
        assertThat(response.stock()).isZero();
        assertThat(response.warrantyMonths()).isEqualTo(12);
    }

    @Test
    void previewBlogMapsDraftUsingCategoryName() {
        AdminBlogUpsertRequest request = new AdminBlogUpsertRequest(
                null,
                "Hướng dẫn",
                "Cách kết nối intercom",
                "Mô tả bài viết",
                "https://cdn.example.com/blog.png",
                "Giới thiệu ngắn",
                BlogStatus.PUBLISHED,
                null,
                Boolean.TRUE,
                Boolean.FALSE
        );

        PublicBlogDetailResponse response = publicBlogService.previewBlog(request);

        assertThat(response.id()).isNull();
        assertThat(response.title()).isEqualTo("Cách kết nối intercom");
        assertThat(response.description()).isEqualTo("Mô tả bài viết");
        assertThat(response.image()).isEqualTo("https://cdn.example.com/blog.png");
        assertThat(response.category()).isEqualTo("Hướng dẫn");
        assertThat(response.introduction()).isEqualTo("Giới thiệu ngắn");
        assertThat(response.showOnHomepage()).isTrue();
        assertThat(response.createdAt()).isNotNull();
    }

    @Test
    void previewBlogResolvesCategoryNameByIdReadOnly() {
        CategoryBlog category = new CategoryBlog();
        category.setName("Tin tức");
        when(categoryBlogRepository.findById(5L)).thenReturn(Optional.of(category));

        AdminBlogUpsertRequest request = new AdminBlogUpsertRequest(
                5L, null, "Tiêu đề", "Mô tả", null, null, null, null, null, null
        );

        PublicBlogDetailResponse response = publicBlogService.previewBlog(request);

        assertThat(response.category()).isEqualTo("Tin tức");
    }
}
