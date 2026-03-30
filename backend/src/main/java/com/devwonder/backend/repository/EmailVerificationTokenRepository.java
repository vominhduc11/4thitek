package com.devwonder.backend.repository;

import com.devwonder.backend.entity.EmailVerificationToken;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    void deleteByAccountId(Long accountId);

    void deleteByAccountIdAndIdNot(Long accountId, Long id);

    void deleteByExpiresAtBefore(Instant instant);
}
