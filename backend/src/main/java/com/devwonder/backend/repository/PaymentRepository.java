package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Payment;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    @EntityGraph(attributePaths = {"order"})
    List<Payment> findByOrderIdOrderByPaidAtDescIdDesc(Long orderId);

    boolean existsByOrderIdAndAmountAndCreatedAtAfter(Long orderId, BigDecimal amount, Instant createdAt);

    boolean existsByTransactionCodeIgnoreCase(String transactionCode);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.order.id = :orderId")
    BigDecimal sumAmountByOrderId(@Param("orderId") Long orderId);
}
