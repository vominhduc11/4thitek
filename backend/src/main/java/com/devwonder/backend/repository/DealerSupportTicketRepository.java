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

    @EntityGraph(attributePaths = {"dealer", "assignee", "messages"})
    Optional<DealerSupportTicket> findTopByDealerIdOrderByCreatedAtDesc(Long dealerId);

    @EntityGraph(attributePaths = {"dealer", "assignee", "messages"})
    Page<DealerSupportTicket> findByDealerIdOrderByCreatedAtDesc(Long dealerId, Pageable pageable);

    @EntityGraph(attributePaths = {"dealer", "assignee", "messages"})
    Page<DealerSupportTicket> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"dealer", "assignee", "messages"})
    Optional<DealerSupportTicket> findById(Long id);
}
