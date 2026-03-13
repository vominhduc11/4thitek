package com.devwonder.backend.service;

import com.devwonder.backend.dto.publicapi.PublicDealerResponse;
import com.devwonder.backend.dto.publicapi.PublicProductDetailResponse;
import com.devwonder.backend.dto.publicapi.PublicProductSummaryResponse;
import com.devwonder.backend.dto.publicapi.WarrantyLookupProductSerialResponse;
import com.devwonder.backend.dto.publicapi.WarrantyLookupResponse;
import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.Product;
import com.devwonder.backend.entity.ProductSerial;
import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.PublishStatus;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.ProductRepository;
import com.devwonder.backend.repository.WarrantyRegistrationRepository;
import com.devwonder.backend.service.support.WarrantyDateSupport;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Comparator;
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

        return productRepository.findByIsDeletedFalseAndPublishStatusOrderByNameAsc(PublishStatus.PUBLISHED)
                .stream()
                .filter(product -> matchesQuery(product, normalizedQuery))
                .filter(product -> matchesMinPrice(product, minPrice))
                .filter(product -> matchesMaxPrice(product, maxPrice))
                .sorted(Comparator.comparing(Product::getName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLIC_PRODUCT_BY_ID, key = "#id")
    public PublicProductDetailResponse getProduct(Long id) {
        Product product = productRepository.findByIdAndIsDeletedFalseAndPublishStatus(id, PublishStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return toDetail(product);
    }

    @Transactional(readOnly = true)
    @Cacheable(CacheNames.PUBLIC_DEALERS)
    public List<PublicDealerResponse> getDealers() {
        return dealerRepository.findAll().stream()
                .map(this::toDealer)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLIC_WARRANTY_LOOKUP, key = "#serial")
    public WarrantyLookupResponse lookupWarranty(String serial) {
        WarrantyRegistration registration = warrantyRegistrationRepository.findByProductSerialSerialIgnoreCase(serial)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty not found"));
        ProductSerial productSerial = registration.getProductSerial();
        Product product = productSerial == null ? null : productSerial.getProduct();
        WarrantyStatus resolvedStatus = resolveWarrantyStatus(registration);
        return new WarrantyLookupResponse(
                registration.getId(),
                productSerial == null ? null : productSerial.getId(),
                registration.getWarrantyCode(),
                resolvedStatus.name(),
                registration.getPurchaseDate(),
                registration.getWarrantyStart(),
                registration.getWarrantyEnd(),
                computeRemainingDays(registration.getWarrantyEnd()),
                registration.getCreatedAt(),
                registration.getCustomerName(),
                new WarrantyLookupProductSerialResponse(
                        productSerial == null ? null : productSerial.getId(),
                        productSerial == null ? null : productSerial.getSerial(),
                        product == null ? null : product.getName(),
                        product == null ? null : product.getSku(),
                        productSerial == null || productSerial.getStatus() == null ? null : productSerial.getStatus().name(),
                        extractImage(product)
                )
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

    private PublicProductSummaryResponse toSummary(Product product) {
        return new PublicProductSummaryResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getShortDescription(),
                extractImage(product),
                product.getRetailPrice() == null ? 0 : product.getRetailPrice().doubleValue(),
                product.getStock() == null ? 0 : product.getStock(),
                product.getWarrantyPeriod() == null ? 12 : product.getWarrantyPeriod()
        );
    }

    private PublicProductDetailResponse toDetail(Product product) {
        return new PublicProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getShortDescription(),
                extractDescriptionText(product),
                extractImage(product),
                product.getRetailPrice() == null ? 0 : product.getRetailPrice().doubleValue(),
                toJson(product.getSpecifications()),
                toJson(product.getVideos()),
                toJson(product.getDescriptions()),
                product.getStock() == null ? 0 : product.getStock(),
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

    private boolean matchesQuery(Product product, String normalizedQuery) {
        if (normalizedQuery == null) {
            return true;
        }
        return containsIgnoreCase(product.getName(), normalizedQuery)
                || containsIgnoreCase(product.getSku(), normalizedQuery)
                || containsIgnoreCase(product.getShortDescription(), normalizedQuery);
    }

    private boolean matchesMinPrice(Product product, Double minPrice) {
        if (minPrice == null) {
            return true;
        }
        double effectivePrice = product.getRetailPrice() == null ? 0D : product.getRetailPrice().doubleValue();
        return effectivePrice >= minPrice;
    }

    private boolean matchesMaxPrice(Product product, Double maxPrice) {
        if (maxPrice == null) {
            return true;
        }
        double effectivePrice = product.getRetailPrice() == null ? 0D : product.getRetailPrice().doubleValue();
        return effectivePrice <= maxPrice;
    }

    private boolean containsIgnoreCase(String source, String term) {
        if (term == null) {
            return true;
        }
        return source != null && source.toLowerCase().contains(term.toLowerCase());
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
}
