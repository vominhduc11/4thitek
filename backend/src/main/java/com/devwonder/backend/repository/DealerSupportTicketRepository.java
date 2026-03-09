package com.devwonder.backend.repository;

import com.devwonder.backend.entity.DealerSupportTicket;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DealerSupportTicketRepository extends JpaRepository<DealerSupportTicket, Long> {
    boolean existsByTicketCode(String ticketCode);

    Optional<DealerSupportTicket> findTopByDealerIdOrderByCreatedAtDesc(Long dealerId);
}
