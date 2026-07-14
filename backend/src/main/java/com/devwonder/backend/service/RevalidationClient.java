package com.devwonder.backend.service;

import com.devwonder.backend.event.RevalidateContentEvent;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.client.RestClient;

/**
 * Goi webhook ISR on-demand cua main-fe (POST /api/revalidate) khi du lieu public thay doi.
 *
 * - Chay AFTER_COMMIT: dam bao DB da commit truoc khi main-fe re-fetch → khong cache lai
 *   du lieu cu.
 * - @Async fire-and-forget: loi mang chi ghi log, khong chan nghiep vu admin.
 * - Neu REVALIDATE_SECRET rong (chua cau hinh): bo qua, main-fe van tu lam tuoi theo ISR
 *   time-based (fallback).
 */
@Service
@Slf4j
public class RevalidationClient {

    private static final String SECRET_HEADER = "x-revalidate-secret";

    private final RestClient restClient;
    private final String endpoint;
    private final String secret;

    public RevalidationClient(
            @Value("${app.revalidate.base-url:http://main-fe:3000}") String baseUrl,
            @Value("${app.revalidate.secret:}") String secret) {
        String normalizedBase = (baseUrl == null ? "" : baseUrl.trim()).replaceAll("/+$", "");
        this.endpoint = normalizedBase + "/api/revalidate";
        this.secret = secret == null ? "" : secret.trim();
        this.restClient = RestClient.builder().build();
    }

    @Async("revalidationTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onContentChanged(RevalidateContentEvent event) {
        revalidate(event.tags());
    }

    private void revalidate(Set<String> tags) {
        if (secret.isEmpty()) {
            log.debug("Revalidation skipped: app.revalidate.secret (REVALIDATE_SECRET) not configured");
            return;
        }
        if (tags == null || tags.isEmpty()) {
            return;
        }
        try {
            restClient.post()
                    .uri(endpoint)
                    .header(SECRET_HEADER, secret)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("tags", List.copyOf(tags)))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Revalidated main-fe tags={}", tags);
        } catch (Exception ex) {
            log.warn("Failed to revalidate main-fe tags={}: {}", tags, ex.getMessage());
        }
    }
}
