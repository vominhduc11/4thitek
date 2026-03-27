package com.devwonder.backend.repository;

import com.devwonder.backend.entity.RefreshTokenSession;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RefreshTokenSessionRepository extends JpaRepository<RefreshTokenSession, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select session
            from RefreshTokenSession session
            where session.tokenId = :tokenId
            """)
    Optional<RefreshTokenSession> findByTokenIdForUpdate(@Param("tokenId") String tokenId);
}
