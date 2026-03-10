package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.admin.AdminBlogUpsertRequest;
import com.devwonder.backend.dto.admin.AdminProductUpsertRequest;
import com.devwonder.backend.entity.Blog;
import com.devwonder.backend.entity.CategoryBlog;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.enums.BlogStatus;
import com.devwonder.backend.entity.enums.PublishStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ConflictException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.CategoryBlogRepository;
import com.devwonder.backend.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminWriteSupport {

    private final ProductRepository productRepository;
    private final CategoryBlogRepository categoryBlogRepository;

    public void applyProduct(Product product, AdminProductUpsertRequest request, boolean creating) {
        String sku = normalize(request.sku());
        if (creating && sku == null) {
            throw new BadRequestException("sku is required");
        }
        if (sku != null && productRepository.existsBySkuAndIdNot(sku, product.getId() == null ? -1L : product.getId())) {
            throw new ConflictException("SKU already exists");
        }
        if (sku != null) {
            product.setSku(sku);
        }
        if (request.name() != null) {
            product.setName(requireNonBlank(request.name(), "name"));
        }
        if (request.shortDescription() != null) {
            product.setShortDescription(requireNonBlank(request.shortDescription(), "shortDescription"));
        }
        if (request.image() != null) {
            product.setImage(request.image());
        }
        if (request.descriptions() != null) {
            product.setDescriptions(List.copyOf(request.descriptions()));
        }
        if (request.videos() != null) {
            product.setVideos(List.copyOf(request.videos()));
        }
        if (request.specifications() != null) {
            product.setSpecifications(List.copyOf(request.specifications()));
        }
        if (request.retailPrice() != null) {
            product.setRetailPrice(request.retailPrice());
        }
        if (request.stock() != null) {
            product.setStock(Math.max(0, request.stock()));
        }
        if (request.warrantyPeriod() != null) {
            product.setWarrantyPeriod(Math.max(0, request.warrantyPeriod()));
        }
        if (request.showOnHomepage() != null) {
            product.setShowOnHomepage(request.showOnHomepage());
        }
        if (request.isFeatured() != null) {
            product.setIsFeatured(request.isFeatured());
        }
        if (request.isDeleted() != null) {
            product.setIsDeleted(request.isDeleted());
        } else if (creating) {
            product.setIsDeleted(false);
        }
        if (request.publishStatus() != null) {
            product.setPublishStatus(request.publishStatus());
        } else if (creating) {
            product.setPublishStatus(PublishStatus.DRAFT);
        }
    }

    public void applyBlog(Blog blog, AdminBlogUpsertRequest request, boolean creating) {
        if (request.title() != null) {
            blog.setTitle(requireNonBlank(request.title(), "title"));
        } else if (creating) {
            throw new BadRequestException("title is required");
        }
        if (request.description() != null) {
            blog.setDescription(requireNonBlank(request.description(), "description"));
        } else if (creating) {
            throw new BadRequestException("description is required");
        }
        if (request.image() != null) {
            blog.setImage(requireNonBlank(request.image(), "image"));
        }
        if (request.introduction() != null) {
            blog.setIntroduction(requireNonBlank(request.introduction(), "introduction"));
        }
        if (request.status() != null) {
            blog.setStatus(request.status());
        } else if (creating) {
            blog.setStatus(BlogStatus.DRAFT);
        }
        if (request.showOnHomepage() != null) {
            blog.setShowOnHomepage(request.showOnHomepage());
        } else if (creating) {
            blog.setShowOnHomepage(false);
        }
        if (request.isDeleted() != null) {
            blog.setIsDeleted(request.isDeleted());
        } else if (creating) {
            blog.setIsDeleted(false);
        }
        CategoryBlog categoryBlog = resolveCategory(request.categoryId(), request.categoryName(), creating);
        if (categoryBlog != null || creating) {
            blog.setCategoryBlog(categoryBlog);
        }
    }

    public BigDecimal requirePositivePercent(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("percent must be greater than 0");
        }
        return value;
    }

    private CategoryBlog resolveCategory(Long categoryId, String categoryName, boolean creating) {
        if (categoryId != null) {
            return categoryBlogRepository.findById(categoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }
        String normalizedName = normalize(categoryName);
        if (normalizedName != null) {
            return categoryBlogRepository.findByNameIgnoreCase(normalizedName)
                    .orElseGet(() -> {
                        CategoryBlog categoryBlog = new CategoryBlog();
                        categoryBlog.setName(normalizedName);
                        return categoryBlogRepository.save(categoryBlog);
                    });
        }
        if (creating) {
            throw new BadRequestException("categoryId or categoryName is required");
        }
        return null;
    }

    private String requireNonBlank(String value, String fieldName) {
        String normalized = normalize(value);
        if (normalized == null) {
            throw new BadRequestException(fieldName + " must not be blank");
        }
        return normalized;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
