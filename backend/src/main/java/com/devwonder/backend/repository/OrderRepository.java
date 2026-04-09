package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    @Query(
            value = """
                    select o
                    from Order o
                    where (o.isDeleted = false or o.isDeleted is null)
                    order by o.createdAt desc
                    """,
            countQuery = """
                    select count(o)
                    from Order o
                    where (o.isDeleted = false or o.isDeleted is null)
                    """
    )
    Page<Order> findVisibleByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    @Query("""
            select o
            from Order o
            where o.dealer.id = :dealerId
              and (o.isDeleted = false or o.isDeleted is null)
            order by o.createdAt desc
            """)
    List<Order> findVisibleByDealerIdOrderByCreatedAtDesc(@Param("dealerId") Long dealerId);

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    @Query(
            value = """
                    select o
                    from Order o
                    where (o.isDeleted = false or o.isDeleted is null)
                      and (:status is null or o.status = :status)
                    order by o.createdAt desc
                    """,
            countQuery = """
                    select count(o)
                    from Order o
                    where (o.isDeleted = false or o.isDeleted is null)
                      and (:status is null or o.status = :status)
                    """
    )
    Page<Order> findVisibleByStatusAndCreatedAtDesc(@Param("status") OrderStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    @Query(
            value = """
                    select o
                    from Order o
                    left join o.dealer d
                    where (o.isDeleted = false or o.isDeleted is null)
                      and (:status is null or o.status = :status)
                      and (
                        :query is null
                        or lower(coalesce(o.orderCode, '')) like :query
                        or lower(coalesce(d.businessName, '')) like :query
                        or lower(coalesce(d.contactName, '')) like :query
                        or lower(coalesce(d.username, '')) like :query
                        or lower(coalesce(d.email, '')) like :query
                        or lower(str(o.id)) like :query
                      )
                    order by o.createdAt desc
                    """,
            countQuery = """
                    select count(o)
                    from Order o
                    left join o.dealer d
                    where (o.isDeleted = false or o.isDeleted is null)
                      and (:status is null or o.status = :status)
                      and (
                        :query is null
                        or lower(coalesce(o.orderCode, '')) like :query
                        or lower(coalesce(d.businessName, '')) like :query
                        or lower(coalesce(d.contactName, '')) like :query
                        or lower(coalesce(d.username, '')) like :query
                        or lower(coalesce(d.email, '')) like :query
                        or lower(str(o.id)) like :query
                      )
                    """
    )
    Page<Order> findVisibleByStatusAndQueryOrderByCreatedAtDesc(
            @Param("status") OrderStatus status,
            @Param("query") String query,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    @Query(
            value = """
                    select o
                    from Order o
                    where o.dealer.id = :dealerId
                      and (o.isDeleted = false or o.isDeleted is null)
                    """,
            countQuery = """
                    select count(o)
                    from Order o
                    where o.dealer.id = :dealerId
                      and (o.isDeleted = false or o.isDeleted is null)
                    """
    )
    Page<Order> findVisibleByDealerId(@Param("dealerId") Long dealerId, Pageable pageable);

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    @Query("""
            select o
            from Order o
            where o.id = :id
              and o.dealer.id = :dealerId
              and (o.isDeleted = false or o.isDeleted is null)
            """)
    Optional<Order> findVisibleByIdAndDealerId(
            @Param("id") Long id,
            @Param("dealerId") Long dealerId
    );

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select o
            from Order o
            where o.id = :id
              and o.dealer.id = :dealerId
              and (o.isDeleted = false or o.isDeleted is null)
            """)
    Optional<Order> findVisibleByIdAndDealerIdForUpdate(
            @Param("id") Long id,
            @Param("dealerId") Long dealerId
    );

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select o
            from Order o
            where o.id = :id
            """)
    Optional<Order> findByIdForUpdate(@Param("id") Long id);

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    Optional<Order> findFirstByOrderCodeIgnoreCase(String orderCode);

    /**
     * Idempotency lookup scoped to a specific dealer: returns the order created with
     * {@code idempotencyKey} by {@code dealerId} within the configured TTL window.
     * Scoping by dealer prevents cross-dealer data exposure when two dealers
     * coincidentally use the same idempotency key within the TTL window.
     * Used by {@link com.devwonder.backend.service.IdempotencyStore}.
     */
    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    Optional<Order> findByIdempotencyKeyAndDealerIdAndCreatedAtAfter(
            String idempotencyKey, Long dealerId, Instant ttlCutoff);

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select o
            from Order o
            where lower(o.orderCode) = lower(:orderCode)
            """)
    Optional<Order> findByOrderCodeIgnoreCaseForUpdate(@Param("orderCode") String orderCode);

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    @Query("""
            select o
            from Order o
            where o.dealer.id = :dealerId
              and (o.isDeleted = false or o.isDeleted is null)
              and o.status <> :cancelledStatus
            order by o.createdAt desc
            """)
    List<Order> findVisibleByDealerIdAndStatusNotOrderByCreatedAtDesc(
            @Param("dealerId") Long dealerId,
            @Param("cancelledStatus") OrderStatus cancelledStatus
    );

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "dealer", "payments"})
    @Query("""
            select o
            from Order o
            where (o.isDeleted = false or o.isDeleted is null)
              and o.status = com.devwonder.backend.entity.enums.OrderStatus.COMPLETED
              and coalesce(o.completedAt, o.updatedAt, o.createdAt) >= :startInclusive
            order by coalesce(o.completedAt, o.updatedAt, o.createdAt) desc
            """)
    List<Order> findRevenueOrdersFrom(@Param("startInclusive") Instant startInclusive);

    @Query("""
            select count(o)
            from Order o
            where (o.isDeleted = false or o.isDeleted is null)
            """)
    long countVisibleOrders();

    @Query("""
            select count(o)
            from Order o
            where (o.isDeleted = false or o.isDeleted is null)
              and o.status = :status
            """)
    long countVisibleOrdersByStatus(@Param("status") OrderStatus status);

    @Query("""
            select count(o)
            from Order o
            where (o.isDeleted = false or o.isDeleted is null)
              and o.staleReviewRequired = true
            """)
    long countByStaleReviewRequired();

    /**
     * Finds PENDING orders belonging to SUSPENDED dealers whose suspension timestamp
     * is before the given grace period cutoff (i.e., suspended more than 24h ago).
     * PendingOrderTimeoutJob still applies the recorded-money guard before deciding
     * whether the order can auto-cancel or must go to manual finance review.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select o
            from Order o
            where o.status = com.devwonder.backend.entity.enums.OrderStatus.PENDING
              and (o.isDeleted = false or o.isDeleted is null)
              and o.dealer is not null
              and o.dealer.customerStatus = com.devwonder.backend.entity.enums.CustomerStatus.SUSPENDED
              and o.dealer.suspendedAt is not null
              and o.dealer.suspendedAt < :graceCutoff
            """)
    List<Order> findPendingOrdersOfSuspendedDealersBefore(@Param("graceCutoff") Instant graceCutoff);

    @Query("""
            select p.id, p.name, p.sku, coalesce(sum(oi.quantity), 0)
            from OrderItem oi
            join oi.order o
            left join oi.product p
            where (o.isDeleted = false or o.isDeleted is null)
              and o.status = :status
            group by p.id, p.name, p.sku
            order by coalesce(sum(oi.quantity), 0) desc
            """)
    List<Object[]> findTopProductsForDashboard(
            @Param("status") OrderStatus status,
            Pageable pageable
    );

    /**
     * Finds PENDING orders whose createdAt is before the given cutoff (for timeout job).
     * Uses SELECT FOR UPDATE to avoid concurrent processing.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select o
            from Order o
            where o.status = com.devwonder.backend.entity.enums.OrderStatus.PENDING
              and (o.isDeleted = false or o.isDeleted is null)
              and o.createdAt < :cutoff
            """)
    List<Order> findPendingOrdersCreatedBefore(@Param("cutoff") Instant cutoff);

    /**
     * Finds PENDING orders whose createdAt is between warningFrom and warningTo (for warning notifications).
     */
    @Query("""
            select o
            from Order o
            where o.status = com.devwonder.backend.entity.enums.OrderStatus.PENDING
              and (o.isDeleted = false or o.isDeleted is null)
              and o.createdAt >= :warningFrom
              and o.createdAt < :warningTo
            """)
    List<Order> findPendingOrdersInWarningWindow(
            @Param("warningFrom") Instant warningFrom,
            @Param("warningTo") Instant warningTo
    );

}
