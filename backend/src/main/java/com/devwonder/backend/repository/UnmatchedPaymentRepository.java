package com.devwonder.backend.repository;

import com.devwonder.backend.entity.UnmatchedPayment;
import com.devwonder.backend.entity.enums.UnmatchedPaymentReason;
import com.devwonder.backend.entity.enums.UnmatchedPaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UnmatchedPaymentRepository extends JpaRepository<UnmatchedPayment, Long> {

    Page<UnmatchedPayment> findAll(Pageable pageable);

    Page<UnmatchedPayment> findByStatus(UnmatchedPaymentStatus status, Pageable pageable);

    Page<UnmatchedPayment> findByReason(UnmatchedPaymentReason reason, Pageable pageable);

    Page<UnmatchedPayment> findByStatusAndReason(UnmatchedPaymentStatus status, UnmatchedPaymentReason reason, Pageable pageable);

    long countByStatus(UnmatchedPaymentStatus status);
}
