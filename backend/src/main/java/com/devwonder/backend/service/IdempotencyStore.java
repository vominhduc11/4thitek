package com.devwonder.backend.service;

import com.devwonder.backend.config.OrderProperties;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * In-memory idempotency key store for order creation.
 * Stores idempotencyKey → cached orderId mapping for configured TTL.
 * Cleanup runs every 5 minutes via scheduler.
 *
 * Per BUSINESS_LOGIC.md Section 3.4 [Policy]:
 *   - Client sends X-Idempotency-Key (UUID v4) with every order creation request.
 *   - Duplicate key within TTL returns cached orderId, does NOT create new order.
 *   - Missing key → 400 Bad Request (enforced in controller).
 */
@Component
public class IdempotencyStore {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyStore.class);

    private final OrderProperties orderProperties;
    // key → (orderId, expiresAt)
    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    public IdempotencyStore(OrderProperties orderProperties) {
        this.orderProperties = orderProperties;
    }

    /** Returns the cached orderId if the key exists and has not expired. */
    public Optional<Long> get(String idempotencyKey) {
        if (idempotencyKey == null) {
            return Optional.empty();
        }
        Entry entry = store.get(idempotencyKey);
        if (entry == null) {
            return Optional.empty();
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            store.remove(idempotencyKey);
            return Optional.empty();
        }
        return Optional.of(entry.orderId());
    }

    /** Stores the mapping. Overwrites any existing entry (safe — order already created). */
    public void put(String idempotencyKey, Long orderId) {
        if (idempotencyKey == null || orderId == null) {
            return;
        }
        Instant expiresAt = Instant.now().plusSeconds(orderProperties.getIdempotencyTtlMinutes() * 60);
        store.put(idempotencyKey, new Entry(orderId, expiresAt));
    }

    /** Scheduled cleanup of expired entries every 5 minutes. */
    @Scheduled(fixedDelayString = "${app.rate-limit.cleanup-interval-ms:300000}")
    public void evictExpired() {
        Instant now = Instant.now();
        int before = store.size();
        store.entrySet().removeIf(e -> now.isAfter(e.getValue().expiresAt()));
        int removed = before - store.size();
        if (removed > 0) {
            log.debug("IdempotencyStore evicted {} expired entries", removed);
        }
    }

    private record Entry(Long orderId, Instant expiresAt) {}
}
