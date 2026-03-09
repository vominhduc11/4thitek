package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Order;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
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
    Optional<Order> findFirstByOrderCodeIgnoreCase(String orderCode);
}
