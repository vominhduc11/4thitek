package com.devwonder.backend.service;

import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.dto.admin.AdminPublicContentSectionResponse;
import com.devwonder.backend.dto.admin.UpdateAdminPublicContentSectionRequest;
import com.devwonder.backend.entity.PublicContentEntry;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.PublicContentEntryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PublicContentService {

    private static final String DEFAULT_LANGUAGE = "vi";

    private final ObjectMapper objectMapper;
    private final PublicContentEntryRepository publicContentEntryRepository;

    private Map<String, Object> bundledSiteContent = Map.of();

    @PostConstruct
    void loadSiteContent() {
        try (InputStream inputStream = new ClassPathResource("site-content.json").getInputStream()) {
            bundledSiteContent = objectMapper.readValue(inputStream, new TypeReference<>() {});
            seedMissingEntriesFromBundle();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load public site content", ex);
        }
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLIC_CONTENT, key = "#section + ':' + #language")
    public Map<String, Object> getSection(String section, String language) {
        String normalizedSection = normalizeSection(section);
        String normalizedLanguage = normalizeLanguage(language);

        PublicContentEntry localizedEntry = publicContentEntryRepository
                .findByContentKeyAndLocaleAndPublishedTrue(normalizedSection, normalizedLanguage)
                .orElseGet(() -> publicContentEntryRepository
                        .findByContentKeyAndLocaleAndPublishedTrue(normalizedSection, DEFAULT_LANGUAGE)
                        .orElseThrow(() -> new ResourceNotFoundException("Content section not found")));

        return parsePayload(localizedEntry.getPayload());
    }

    @Transactional(readOnly = true)
    public java.util.List<AdminPublicContentSectionResponse> getAdminSections() {
        return publicContentEntryRepository.findAllByOrderByContentKeyAscLocaleAsc()
                .stream()
                .map(this::toAdminResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminPublicContentSectionResponse getAdminSection(String section, String language) {
        return publicContentEntryRepository
                .findByContentKeyAndLocale(normalizeSection(section), normalizeLanguage(language))
                .map(this::toAdminResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Content section not found"));
    }

    @Transactional
    @CacheEvict(cacheNames = CacheNames.PUBLIC_CONTENT, allEntries = true)
    public AdminPublicContentSectionResponse upsertSection(
            String section,
            UpdateAdminPublicContentSectionRequest request
    ) {
        String normalizedSection = normalizeSection(section);
        String normalizedLanguage = normalizeLanguage(request.locale());
        String normalizedPayload = normalizePayload(request.payload());

        PublicContentEntry entry = publicContentEntryRepository
                .findByContentKeyAndLocale(normalizedSection, normalizedLanguage)
                .orElseGet(PublicContentEntry::new);
        entry.setContentKey(normalizedSection);
        entry.setLocale(normalizedLanguage);
        entry.setPayload(normalizedPayload);
        entry.setPublished(Boolean.TRUE.equals(request.published()));
        return toAdminResponse(publicContentEntryRepository.save(entry));
    }

    private void seedMissingEntriesFromBundle() {
        for (Map.Entry<String, Object> sectionEntry : bundledSiteContent.entrySet()) {
            String section = normalizeSection(sectionEntry.getKey());
            Map<String, Object> sectionContent = asMap(sectionEntry.getValue());
            if (sectionContent.isEmpty()) {
                continue;
            }

            for (Map.Entry<String, Object> localizedEntry : sectionContent.entrySet()) {
                String locale = normalizeLanguage(localizedEntry.getKey());
                if (publicContentEntryRepository.findByContentKeyAndLocale(section, locale).isPresent()) {
                    continue;
                }

                PublicContentEntry entry = new PublicContentEntry();
                entry.setContentKey(section);
                entry.setLocale(locale);
                entry.setPayload(writePayload(localizedEntry.getValue()));
                entry.setPublished(true);
                publicContentEntryRepository.save(entry);
            }
        }
    }

    private AdminPublicContentSectionResponse toAdminResponse(PublicContentEntry entry) {
        return new AdminPublicContentSectionResponse(
                entry.getId(),
                entry.getContentKey(),
                entry.getLocale(),
                entry.getPayload(),
                Boolean.TRUE.equals(entry.getPublished()),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }

    private Map<String, Object> parsePayload(String payload) {
        try {
            return objectMapper.readValue(payload, new TypeReference<>() {});
        } catch (IOException ex) {
            throw new IllegalStateException("Stored public content payload is invalid", ex);
        }
    }

    private String writePayload(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to serialize bundled public content", ex);
        }
    }

    private String normalizePayload(String payload) {
        try {
            Object normalized = objectMapper.readValue(payload, Object.class);
            if (!(normalized instanceof Map<?, ?>) && !(normalized instanceof java.util.List<?>)) {
                throw new BadRequestException("payload must be a JSON object or array");
            }
            return objectMapper.writeValueAsString(normalized);
        } catch (BadRequestException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new BadRequestException("payload must be valid JSON");
        }
    }

    private String normalizeSection(String section) {
        if (section == null || section.isBlank()) {
            throw new BadRequestException("section is required");
        }
        String normalized = section.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("[a-z0-9-]+")) {
            throw new BadRequestException("section contains unsupported characters");
        }
        return normalized;
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return DEFAULT_LANGUAGE;
        }
        String normalized = language.trim().toLowerCase(Locale.ROOT);
        return normalized.startsWith("en") ? "en" : "vi";
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return new LinkedHashMap<>((Map<String, Object>) map);
        }
        return Map.of();
    }
}
