package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.support.SupportTicketAttachmentPayload;
import com.devwonder.backend.dto.support.SupportTicketAttachmentResponse;
import com.devwonder.backend.dto.support.SupportTicketContextPayload;
import com.devwonder.backend.exception.BadRequestException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class SupportTicketPayloadSupport {

    private static final int MAX_ATTACHMENTS = 6;

    private final ObjectMapper objectMapper;

    public SupportTicketPayloadSupport(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public SupportTicketContextPayload normalizeContext(SupportTicketContextPayload contextData) {
        if (contextData == null) {
            return null;
        }
        SupportTicketContextPayload normalized = new SupportTicketContextPayload(
                DealerRequestSupport.normalize(contextData.orderCode()),
                DealerRequestSupport.normalize(contextData.transactionCode()),
                normalizeAmount(contextData.paidAmount()),
                DealerRequestSupport.normalize(contextData.paymentReference()),
                DealerRequestSupport.normalize(contextData.serial()),
                DealerRequestSupport.normalize(contextData.returnReason())
        );
        if (normalized.orderCode() == null
                && normalized.transactionCode() == null
                && normalized.paidAmount() == null
                && normalized.paymentReference() == null
                && normalized.serial() == null
                && normalized.returnReason() == null) {
            return null;
        }
        return normalized;
    }

    public List<SupportTicketAttachmentPayload> normalizeAttachments(List<SupportTicketAttachmentPayload> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }
        Map<String, SupportTicketAttachmentPayload> normalizedByUrl = new LinkedHashMap<>();
        for (SupportTicketAttachmentPayload attachment : attachments) {
            if (attachment == null) {
                continue;
            }
            String url = DealerRequestSupport.normalize(attachment.url());
            if (url == null) {
                continue;
            }
            if (!DealerRequestSupport.isValidUrlOrUploadPath(url)) {
                throw new BadRequestException("attachment url is invalid");
            }
            String fileName = normalizeAttachmentFileName(attachment.fileName(), url);
            normalizedByUrl.put(url, new SupportTicketAttachmentPayload(url, fileName));
        }
        if (normalizedByUrl.size() > MAX_ATTACHMENTS) {
            throw new BadRequestException("attachments must contain at most " + MAX_ATTACHMENTS + " items");
        }
        return List.copyOf(normalizedByUrl.values());
    }

    public String writeContext(SupportTicketContextPayload contextData) {
        SupportTicketContextPayload normalized = normalizeContext(contextData);
        if (normalized == null) {
            return null;
        }
        return writeValue(normalized);
    }

    public String writeAttachments(List<SupportTicketAttachmentPayload> attachments) {
        List<SupportTicketAttachmentPayload> normalized = normalizeAttachments(attachments);
        if (normalized.isEmpty()) {
            return null;
        }
        return writeValue(normalized);
    }

    public SupportTicketContextPayload readContext(String raw) {
        String normalized = DealerRequestSupport.normalize(raw);
        if (normalized == null) {
            return null;
        }
        try {
            SupportTicketContextPayload parsed = objectMapper.readValue(normalized, SupportTicketContextPayload.class);
            return normalizeContext(parsed);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Stored support ticket context is invalid", ex);
        }
    }

    public List<SupportTicketAttachmentResponse> readAttachments(String raw) {
        String normalized = DealerRequestSupport.normalize(raw);
        if (normalized == null) {
            return List.of();
        }
        try {
            List<SupportTicketAttachmentPayload> parsed = objectMapper.readValue(
                    normalized,
                    new TypeReference<List<SupportTicketAttachmentPayload>>() {
                    }
            );
            List<SupportTicketAttachmentPayload> attachments = normalizeAttachments(parsed);
            List<SupportTicketAttachmentResponse> responses = new ArrayList<>(attachments.size());
            for (SupportTicketAttachmentPayload attachment : attachments) {
                responses.add(new SupportTicketAttachmentResponse(attachment.url(), attachment.fileName()));
            }
            return List.copyOf(responses);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Stored support ticket attachments are invalid", ex);
        }
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            return null;
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("paidAmount must not be negative");
        }
        return amount.stripTrailingZeros();
    }

    private String writeValue(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to serialize support ticket payload", ex);
        }
    }

    private String normalizeAttachmentFileName(String rawFileName, String url) {
        String normalized = DealerRequestSupport.normalize(rawFileName);
        if (normalized != null) {
            normalized = extractFileName(normalized);
        }
        if (normalized != null) {
            return normalized;
        }
        return extractFileName(url);
    }

    private String extractFileName(String value) {
        String normalized = DealerRequestSupport.normalize(value);
        if (normalized == null) {
            return null;
        }

        String pathCandidate = normalized;
        if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
            try {
                pathCandidate = URI.create(normalized).getPath();
            } catch (IllegalArgumentException ignored) {
                pathCandidate = normalized;
            }
        } else {
            int queryIndex = pathCandidate.indexOf('?');
            if (queryIndex >= 0) {
                pathCandidate = pathCandidate.substring(0, queryIndex);
            }
            int fragmentIndex = pathCandidate.indexOf('#');
            if (fragmentIndex >= 0) {
                pathCandidate = pathCandidate.substring(0, fragmentIndex);
            }
        }

        String slashNormalized = pathCandidate.replace('\\', '/');
        int lastSlash = slashNormalized.lastIndexOf('/');
        String fileName = lastSlash >= 0 ? slashNormalized.substring(lastSlash + 1) : slashNormalized;
        return DealerRequestSupport.normalize(fileName);
    }
}
