package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Order;
import com.devwonder.backend.entity.enums.OrderStatus;
import com.devwonder.backend.entity.enums.PaymentMethod;
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
              and o.paymentMethod = :paymentMethod
            order by o.createdAt desc
            """)
    List<Order> findVisibleByDealerIdAndStatusNotAndPaymentMethodOrderByCreatedAtDesc(
            @Param("dealerId") Long dealerId,
            @Param("cancelledStatus") OrderStatus cancelledStatus,
            @Param("paymentMethod") PaymentMethod paymentMethod
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

    /**
     * Finds PENDING orders belonging to SUSPENDED dealers whose suspension timestamp
     * is before the given grace period cutoff (i.e., suspended more than 24h ago).
     * Used by PendingOrderTimeoutJob to auto-cancel on dealer suspension grace expiry.
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

    @Query(value = """
            with order_metrics as (
                select
                    o.id as order_id,
                    coalesce(sum(oi.quantity), 0) as total_items,
                    coalesce(sum(oi.quantity * oi.unit_price), 0) as subtotal,
                    count(distinct oi.id_product) as product_count,
                    min(oi.id_product) as single_product_id,
                    coalesce(o.paid_amount, 0) as paid_amount
                from orders o
                join order_items oi on oi.id_order = o.id
                where o.id_dealer = :dealerId
                  and coalesce(o.is_deleted, false) = false
                  and o.status <> 'CANCELLED'
                  and o.payment_method = 'DEBT'
                group by o.id, o.paid_amount
            ),
            matched_rules as (
                select
                    om.order_id,
                    bd.discount_percent,
                    row_number() over (
                        partition by om.order_id
                        order by
                            case when bd.id_product is not null then 1 else 0 end desc,
                            coalesce(bd.min_quantity, 0) desc,
                            coalesce(bd.discount_percent, 0) desc,
                            bd.updated_at desc nulls last,
                            bd.created_at desc nulls last,
                            bd.id desc nulls last
                    ) as rn
                from order_metrics om
                join bulk_discounts bd on bd.status = 'ACTIVE'
                where (bd.min_quantity is null or bd.min_quantity <= om.total_items)
                  and (bd.max_quantity is null or bd.max_quantity >= om.total_items)
                  and (
                        bd.id_product is null
                        or (om.product_count = 1 and om.single_product_id = bd.id_product)
                  )
            ),
            order_totals as (
                select
                    om.order_id,
                    om.subtotal,
                    om.paid_amount,
                    coalesce(
                        round(
                            om.subtotal * least(greatest(coalesce(mr.discount_percent, 0), 0), 100) / 100,
                            0
                        ),
                        0
                    ) as discount_amount
                from order_metrics om
                left join matched_rules mr
                    on mr.order_id = om.order_id
                   and mr.rn = 1
            )
            select coalesce(sum(
                case
                    when ((subtotal - discount_amount) + round((subtotal - discount_amount) * 0.1, 0) - paid_amount) > 0
                        then ((subtotal - discount_amount) + round((subtotal - discount_amount) * 0.1, 0) - paid_amount)
                    else 0
                end
            ), 0)
            from order_totals
            """, nativeQuery = true)
    BigDecimal calculateOutstandingDebtForDealer(@Param("dealerId") Long dealerId);
}
