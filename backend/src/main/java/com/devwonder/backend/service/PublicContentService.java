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
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
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

        return resolveSection(normalizedSection, normalizedLanguage)
                .orElseThrow(() -> new ResourceNotFoundException("Content section not found"));
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
            Object parsed = objectMapper.readValue(payload, Object.class);
            if (!(parsed instanceof Map<?, ?> map)) {
                throw new IllegalStateException("Stored public content payload root must be a JSON object");
            }
            return castToMap(map);
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
            if (!(normalized instanceof Map<?, ?> map)) {
                throw new BadRequestException("payload root must be a JSON object");
            }
            return objectMapper.writeValueAsString(castToMap(map));
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
            return castToMap(map);
        }
        return Map.of();
    }

    private Optional<Map<String, Object>> resolveSection(String section, String language) {
        return resolveDbSection(section, language)
                .or(() -> resolveDbSection(section, DEFAULT_LANGUAGE))
                .or(() -> resolveBundledSection(section, language))
                .or(() -> resolveBundledSection(section, DEFAULT_LANGUAGE));
    }

    private Optional<Map<String, Object>> resolveDbSection(String section, String language) {
        return publicContentEntryRepository.findByContentKeyAndLocaleAndPublishedTrue(section, language)
                .flatMap(entry -> tryParseDbPayload(section, language, entry.getPayload()));
    }

    private Optional<Map<String, Object>> tryParseDbPayload(String section, String language, String payload) {
        try {
            return Optional.of(parsePayload(payload));
        } catch (IllegalStateException ex) {
            log.warn(
                    "Ignoring invalid public content payload from DB for section '{}' and lang '{}': {}",
                    section,
                    language,
                    ex.getMessage()
            );
            return Optional.empty();
        }
    }

    private Optional<Map<String, Object>> resolveBundledSection(String section, String language) {
        return Optional.ofNullable(bundledSiteContent.get(section))
                .map(this::asMap)
                .filter(localizedContent -> !localizedContent.isEmpty())
                .map(localizedContent -> localizedContent.get(language))
                .flatMap(this::asBundledPayload);
    }

    private Optional<Map<String, Object>> asBundledPayload(Object value) {
        Map<String, Object> payload = asMap(value);
        return payload.isEmpty() ? Optional.empty() : Optional.of(payload);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castToMap(Map<?, ?> value) {
        return new LinkedHashMap<>((Map<String, Object>) value);
    }
}
