package com.devwonder.backend.repository;

import com.devwonder.backend.entity.DealerSupportTicket;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DealerSupportTicketRepository extends JpaRepository<DealerSupportTicket, Long> {
    boolean existsByTicketCode(String ticketCode);

    @EntityGraph(attributePaths = {"dealer"})
    Optional<DealerSupportTicket> findTopByDealerIdOrderByCreatedAtDesc(Long dealerId);

    @EntityGraph(attributePaths = {"dealer"})
    Page<DealerSupportTicket> findByDealerIdOrderByCreatedAtDesc(Long dealerId, Pageable pageable);

    @EntityGraph(attributePaths = {"dealer"})
    Page<DealerSupportTicket> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
