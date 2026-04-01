package com.devwonder.backend.service;

import com.devwonder.backend.config.OrderProperties;
import com.devwonder.backend.entity.Order;
import com.devwonder.backend.repository.OrderRepository;
import java.time.Instant;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * DB-backed idempotency key store for order creation.
 *
 * <p>Previously used a {@code ConcurrentHashMap} which was lost on restart and incorrect
 * for multi-instance deployments. This implementation delegates directly to the
 * {@code orders.idempotency_key} column which already carries a unique DB constraint,
 * making it restart-safe and consistent across instances without an additional table.
 *
 * <p>TTL semantics are preserved: {@link #get} returns a hit only when the order was
 * created within the configured window ({@code app.order.idempotency-ttl-minutes}).
 * After the TTL expires the same key can be used to create a fresh order, exactly as
 * the in-memory implementation behaved.
 *
 * <p>The lookup is scoped to the requesting dealer ({@code dealerId}) to prevent
 * cross-dealer data exposure: if two dealers coincidentally use the same key within
 * the TTL window, each dealer only matches their own order.
 *
 * <p>{@link #put} is intentionally a no-op: the idempotency key is stored on the
 * {@code Order} entity at creation time by
 * {@link com.devwonder.backend.service.support.DealerOrderWorkflowSupport}, so the
 * DB already holds the entry by the time {@code put} would be called.
 *
 * <p>The scheduled {@link #evictExpired} is also a no-op: there are no separate rows
 * to clean up. Expired idempotency entries age out naturally as orders are never
 * returned by {@link #get} once past the TTL window.
 *
 * Per BUSINESS_LOGIC.md Section 3.4 [Policy]:
 *   - Client sends X-Idempotency-Key (UUID v4) with every order creation request.
 *   - Duplicate key within TTL returns cached orderId, does NOT create new order.
 *   - Missing key → 400 Bad Request (enforced in controller).
 */
@Component
public class IdempotencyStore {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyStore.class);

    private final OrderRepository orderRepository;
    private final OrderProperties orderProperties;

    public IdempotencyStore(OrderRepository orderRepository, OrderProperties orderProperties) {
        this.orderRepository = orderRepository;
        this.orderProperties = orderProperties;
    }

    /**
     * Returns the cached orderId if an order with this key was created by {@code dealerId}
     * within the TTL window. Returns empty if the key is unknown, belongs to a different
     * dealer, or the TTL has expired.
     *
     * <p>Scoping by dealerId prevents cross-dealer data exposure: two dealers using the
     * same key within the TTL window each see only their own order.
     */
    public Optional<Long> get(String idempotencyKey, Long dealerId) {
        if (idempotencyKey == null || dealerId == null) {
            return Optional.empty();
        }
        Instant ttlCutoff = Instant.now().minusSeconds(orderProperties.getIdempotencyTtlMinutes() * 60L);
        return orderRepository
                .findByIdempotencyKeyAndDealerIdAndCreatedAtAfter(idempotencyKey, dealerId, ttlCutoff)
                .map(Order::getId);
    }

    /**
     * No-op: the Order entity stores its own idempotency key at creation time.
     * This method is retained for API compatibility with callers in
     * {@link com.devwonder.backend.service.DealerPortalService}.
     */
    public void put(String idempotencyKey, Long orderId) {
        // intentionally empty — key is already persisted on the Order row
    }

    /**
     * No-op: DB-backed storage requires no in-process eviction.
     * Expired entries are naturally excluded by the TTL cutoff in {@link #get}.
     */
    @Scheduled(fixedDelayString = "${app.rate-limit.cleanup-interval-ms:300000}")
    public void evictExpired() {
        log.debug("IdempotencyStore evictExpired: no-op (DB-backed, TTL enforced at query time)");
    }
}
