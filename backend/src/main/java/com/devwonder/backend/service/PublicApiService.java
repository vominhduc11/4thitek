package com.devwonder.backend.service;

import com.devwonder.backend.dto.publicapi.PublicDealerResponse;
import com.devwonder.backend.dto.publicapi.PublicProductDetailResponse;
import com.devwonder.backend.dto.publicapi.PublicProductSummaryResponse;
import com.devwonder.backend.dto.publicapi.WarrantyLookupCustomerResponse;
import com.devwonder.backend.dto.publicapi.WarrantyLookupProductSerialResponse;
import com.devwonder.backend.dto.publicapi.WarrantyLookupResponse;
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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
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
    public List<PublicProductSummaryResponse> getHomepageProducts() {
        return productRepository.findTop6ByIsDeletedFalseAndShowOnHomepageTrueAndPublishStatusOrderByUpdatedAtDesc(PublishStatus.PUBLISHED)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicProductSummaryResponse> getProducts() {
        return productRepository.findByIsDeletedFalseAndPublishStatusOrderByNameAsc(PublishStatus.PUBLISHED)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
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
    public PublicProductDetailResponse getProduct(Long id) {
        Product product = productRepository.findByIdAndIsDeletedFalseAndPublishStatus(id, PublishStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return toDetail(product);
    }

    @Transactional(readOnly = true)
    public List<PublicDealerResponse> getDealers() {
        return dealerRepository.findAll().stream()
                .map(this::toDealer)
                .toList();
    }

    @Transactional(readOnly = true)
    public WarrantyLookupResponse lookupWarranty(String serial) {
        WarrantyRegistration registration = warrantyRegistrationRepository.findByProductSerialSerialIgnoreCase(serial)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty not found"));
        ProductSerial productSerial = registration.getProductSerial();
        Product product = productSerial == null ? null : productSerial.getProduct();
        WarrantyStatus resolvedStatus = resolveWarrantyStatus(registration);
        return new WarrantyLookupResponse(
                registration.getId(),
                productSerial == null ? null : productSerial.getId(),
                registration.getCustomer() == null ? null : registration.getCustomer().getId(),
                registration.getWarrantyCode(),
                resolvedStatus.name(),
                registration.getPurchaseDate(),
                registration.getWarrantyStart(),
                registration.getWarrantyEnd(),
                computeRemainingDays(registration.getWarrantyEnd()),
                registration.getCreatedAt(),
                new WarrantyLookupCustomerResponse(
                        registration.getCustomerName(),
                        registration.getCustomerPhone(),
                        registration.getCustomerEmail(),
                        registration.getCustomerAddress()
                ),
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
        Instant warrantyEnd = registration.getWarrantyEnd();
        if (warrantyEnd != null && warrantyEnd.isBefore(Instant.now())) {
            return WarrantyStatus.EXPIRED;
        }
        if (registration.getStatus() == WarrantyStatus.EXPIRED) {
            return WarrantyStatus.EXPIRED;
        }
        return WarrantyStatus.ACTIVE;
    }

    private long computeRemainingDays(Instant warrantyEnd) {
        if (warrantyEnd == null) {
            return 0L;
        }
        long days = ChronoUnit.DAYS.between(
                Instant.now().atZone(ZoneOffset.UTC).toLocalDate(),
                warrantyEnd.atZone(ZoneOffset.UTC).toLocalDate()
        );
        return Math.max(0L, days);
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
                product.getShortDescription(),
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

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
