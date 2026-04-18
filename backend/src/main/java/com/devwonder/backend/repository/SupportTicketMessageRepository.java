package com.devwonder.backend.repository;

import com.devwonder.backend.entity.SupportTicketMessage;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupportTicketMessageRepository extends JpaRepository<SupportTicketMessage, Long> {

    @EntityGraph(attributePaths = {"ticket", "ticket.dealer"})
    Optional<SupportTicketMessage> findWithTicketById(Long id);

    @EntityGraph(attributePaths = {"ticket", "ticket.dealer"})
    List<SupportTicketMessage> findByIdIn(Collection<Long> ids);

    boolean existsByIdAndTicketDealerIdAndInternalNoteFalse(Long id, Long dealerId);
}
