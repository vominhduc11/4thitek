package com.devwonder.backend.service;

import com.devwonder.backend.dto.pagination.PagedResponse;
import com.devwonder.backend.dto.publicapi.PublicDealerResponse;
import com.devwonder.backend.dto.publicapi.PublicProductDetailResponse;
import com.devwonder.backend.dto.publicapi.PublicProductSummaryResponse;
import com.devwonder.backend.dto.publicapi.WarrantyLookupResponse;
import com.devwonder.backend.config.CacheNames;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.entity.enums.PublishStatus;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.support.WarrantyDateSupport;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PublicApiService {

    private final ProductRepository productRepository;
    private final DealerRepository dealerRepository;
    private final WarrantyRegistrationRepository warrantyRegistrationRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    @Cacheable(CacheNames.PUBLIC_HOMEPAGE_PRODUCTS)
    public List<PublicProductSummaryResponse> getHomepageProducts() {
        return productRepository.findTop6ByIsDeletedFalseAndShowOnHomepageTrueAndPublishStatusOrderByUpdatedAtDesc(PublishStatus.PUBLISHED)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(CacheNames.PUBLIC_FEATURED_PRODUCTS)
    public List<PublicProductSummaryResponse> getFeaturedProducts() {
        return productRepository.findTop6ByIsDeletedFalseAndIsFeaturedTrueAndPublishStatusOrderByUpdatedAtDesc(PublishStatus.PUBLISHED)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(CacheNames.PUBLIC_PRODUCTS)
    public List<PublicProductSummaryResponse> getProducts() {
        return productRepository.findByIsDeletedFalseAndPublishStatusOrderByNameAsc(PublishStatus.PUBLISHED)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLIC_PRODUCTS, key = "'search:' + (#query == null ? '' : #query) + ':' + (#minPrice == null ? '' : #minPrice) + ':' + (#maxPrice == null ? '' : #maxPrice)")
    public List<PublicProductSummaryResponse> searchProducts(
            String query,
            Double minPrice,
            Double maxPrice
    ) {
        String normalizedQuery = normalize(query);
        validateSearchRange(minPrice, maxPrice);

        BigDecimal minPriceBd = minPrice != null ? BigDecimal.valueOf(minPrice) : null;
        BigDecimal maxPriceBd = maxPrice != null ? BigDecimal.valueOf(maxPrice) : null;

        return productRepository.searchPublished(PublishStatus.PUBLISHED, normalizedQuery, minPriceBd, maxPriceBd)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLIC_PRODUCT_BY_ID, key = "#id")
    public PublicProductDetailResponse getProduct(Long id) {
        Product product = productRepository.findByIdAndIsDeletedFalseAndPublishStatus(id, PublishStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return toDetail(product, safeStock(product));
    }

    @Transactional(readOnly = true)
    @Cacheable(CacheNames.PUBLIC_DEALERS)
    public List<PublicDealerResponse> getDealers() {
        return dealerRepository.findAllByCustomerStatusOrderByCreatedAtDesc(CustomerStatus.ACTIVE).stream()
                .map(this::toDealer)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<PublicDealerResponse> getDealersPaged(int page, int size) {
        var pageable = PageRequest.of(validatePage(page), validatePageSize(size), Sort.by("createdAt").descending());
        var dealerPage = dealerRepository.findAllByCustomerStatus(CustomerStatus.ACTIVE, pageable);
        return PagedResponse.from(dealerPage.map(this::toDealer), "createdAt");
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLIC_WARRANTY_LOOKUP, key = "#serial == null ? '' : #serial.trim().toUpperCase()")
    public WarrantyLookupResponse lookupWarranty(String serial) {
        String normalizedSerial = normalizeSerial(serial);
        WarrantyRegistration registration = warrantyRegistrationRepository.findByProductSerialSerialIgnoreCase(normalizedSerial)
                .orElse(null);
        if (registration == null) {
            return new WarrantyLookupResponse(
                    "invalid",
                    null,
                    normalizedSerial,
                    null,
                    null,
                    0L,
                    null
            );
        }

        ProductSerial productSerial = registration.getProductSerial();
        Product product = productSerial == null ? null : productSerial.getProduct();
        WarrantyStatus resolvedStatus = resolveWarrantyStatus(registration);
        return new WarrantyLookupResponse(
                resolvedStatus.name(),
                product == null ? null : product.getName(),
                productSerial == null ? normalizedSerial : productSerial.getSerial(),
                registration.getPurchaseDate(),
                toLocalDate(registration.getWarrantyEnd()),
                computeRemainingDays(registration.getWarrantyEnd()),
                registration.getWarrantyCode()
        );
    }

    private WarrantyStatus resolveWarrantyStatus(WarrantyRegistration registration) {
        if (registration.getStatus() == WarrantyStatus.VOID) {
            return WarrantyStatus.VOID;
        }
        if (WarrantyDateSupport.isExpired(registration.getWarrantyEnd())) {
            return WarrantyStatus.EXPIRED;
        }
        if (registration.getStatus() == WarrantyStatus.EXPIRED) {
            return WarrantyStatus.EXPIRED;
        }
        return WarrantyStatus.ACTIVE;
    }

    private long computeRemainingDays(Instant warrantyEnd) {
        return WarrantyDateSupport.remainingDays(warrantyEnd);
    }

    @Transactional(readOnly = true)
    public PagedResponse<PublicProductSummaryResponse> getProductsPaged(int page, int size) {
        var pageable = PageRequest.of(validatePage(page), validatePageSize(size), Sort.by("name").ascending());
        var productPage = productRepository.findByIsDeletedFalseAndPublishStatusOrderByNameAsc(
                PublishStatus.PUBLISHED, pageable);
        return PagedResponse.from(productPage.map(this::toSummary), "name");
    }

    private PublicProductSummaryResponse toSummary(Product product) {
        int stock = safeStock(product);
        return new PublicProductSummaryResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getShortDescription(),
                extractImage(product),
                product.getRetailPrice() == null ? 0L : product.getRetailPrice().longValue(),
                stock,
                product.getWarrantyPeriod() == null ? 12 : product.getWarrantyPeriod()
        );
    }

    private PublicProductDetailResponse toDetail(Product product, int availableStock) {
        return new PublicProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getShortDescription(),
                extractDescriptionText(product),
                extractImage(product),
                product.getRetailPrice() == null ? 0L : product.getRetailPrice().longValue(),
                product.getSpecifications(),
                product.getVideos(),
                product.getDescriptions(),
                availableStock,
                product.getWarrantyPeriod() == null ? 12 : product.getWarrantyPeriod()
        );
    }

    private PublicDealerResponse toDealer(Dealer dealer) {
        return new PublicDealerResponse(
                dealer.getId(),
                dealer.getBusinessName(),
                dealer.getContactName(),
                dealer.getAddressLine(),
                dealer.getCity(),
                dealer.getDistrict(),
                dealer.getPhone(),
                dealer.getEmail()
        );
    }

    private String extractImage(Product product) {
        if (product == null || product.getImage() == null || product.getImage().isEmpty()) {
            return null;
        }
        Object imageUrl = product.getImage().get("imageUrl");
        return imageUrl == null ? toJson(product.getImage()) : imageUrl.toString();
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private String extractDescriptionText(Product product) {
        if (product == null) {
            return null;
        }

        String descriptionFromContent = extractDescriptionText(product.getDescriptions(), "description");
        if (descriptionFromContent != null) {
            return descriptionFromContent;
        }

        descriptionFromContent = extractDescriptionText(product.getDescriptions(), null);
        if (descriptionFromContent != null) {
            return descriptionFromContent;
        }

        return normalize(product.getShortDescription());
    }

    private String extractDescriptionText(List<Map<String, Object>> items, String preferredType) {
        if (items == null) {
            return null;
        }

        for (Map<String, Object> item : items) {
            if (item == null) {
                continue;
            }

            String type = normalize(asText(item.get("type")));
            if (preferredType != null && !preferredType.equalsIgnoreCase(type)) {
                continue;
            }

            String candidate = firstNonBlank(
                    asText(item.get("text")),
                    asText(item.get("description")),
                    asText(item.get("content")),
                    asText(item.get("value"))
            );
            if (candidate != null) {
                return candidate;
            }
        }

        return null;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }

    private String asText(Object value) {
        return value == null ? null : value.toString();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeSerial(String serial) {
        String normalized = normalize(serial);
        if (normalized == null) {
            return null;
        }
        return normalized.toUpperCase(Locale.ROOT);
    }

    private int validatePage(int page) {
        if (page < 0) {
            throw new BadRequestException("page must be greater than or equal to 0");
        }
        return page;
    }

    private int validatePageSize(int size) {
        if (size <= 0) {
            throw new BadRequestException("size must be greater than 0");
        }
        return Math.min(size, 100);
    }

    private void validateSearchRange(Double minPrice, Double maxPrice) {
        if (minPrice != null && minPrice < 0) {
            throw new BadRequestException("minPrice must be greater than or equal to 0");
        }
        if (maxPrice != null && maxPrice < 0) {
            throw new BadRequestException("maxPrice must be greater than or equal to 0");
        }
        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            throw new BadRequestException("minPrice must not be greater than maxPrice");
        }
    }

    private int safeStock(Product product) {
        return product == null || product.getStock() == null ? 0 : Math.max(0, product.getStock());
    }

    private LocalDate toLocalDate(Instant instant) {
        if (instant == null) {
            return null;
        }
        return instant.atZone(WarrantyDateSupport.APP_ZONE).toLocalDate();
    }
}
