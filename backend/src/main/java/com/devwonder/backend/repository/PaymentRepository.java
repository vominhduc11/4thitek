package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Payment;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {
    @EntityGraph(attributePaths = {"order"})
    List<Payment> findByOrderIdOrderByPaidAtDescIdDesc(Long orderId);

    boolean existsByOrderIdAndAmountAndCreatedAtAfter(Long orderId, BigDecimal amount, Instant createdAt);

    boolean existsByTransactionCodeIgnoreCase(String transactionCode);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.order.id = :orderId")
    BigDecimal sumAmountByOrderId(@Param("orderId") Long orderId);

    @EntityGraph(attributePaths = {"order", "order.dealer"})
    @Query("""
            select p
            from Payment p
            join p.order o
            join o.dealer d
            where coalesce(p.paidAt, p.createdAt) >= :fromInclusive
              and coalesce(p.paidAt, p.createdAt) < :toExclusive
            order by coalesce(p.paidAt, p.createdAt) desc, p.id desc
            """)
    List<Payment> findPaymentsRecordedBetween(
            @Param("fromInclusive") Instant fromInclusive,
            @Param("toExclusive") Instant toExclusive
    );
}
