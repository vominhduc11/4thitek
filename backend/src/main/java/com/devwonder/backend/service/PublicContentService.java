package com.devwonder.backend.service;

import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PublicContentService {

    private static final String DEFAULT_LANGUAGE = "vi";

    private final ObjectMapper objectMapper;

    private Map<String, Object> siteContent = Map.of();

    @PostConstruct
    void loadSiteContent() {
        try (InputStream inputStream = new ClassPathResource("site-content.json").getInputStream()) {
            siteContent = objectMapper.readValue(inputStream, new TypeReference<>() {});
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load public site content", ex);
        }
    }

    @Cacheable(cacheNames = CacheNames.PUBLIC_CONTENT, key = "#section + ':' + #language")
    public Map<String, Object> getSection(String section, String language) {
        Map<String, Object> sectionContent = asMap(siteContent.get(section));
        if (sectionContent.isEmpty()) {
            throw new ResourceNotFoundException("Content section not found");
        }

        Map<String, Object> localizedContent = asMap(sectionContent.get(normalizeLanguage(language)));
        if (localizedContent.isEmpty()) {
            localizedContent = asMap(sectionContent.get(DEFAULT_LANGUAGE));
        }
        if (localizedContent.isEmpty()) {
            throw new ResourceNotFoundException("Content language not found");
        }

        return new LinkedHashMap<>(localizedContent);
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
            return (Map<String, Object>) map;
        }
        return Map.of();
    }
}
