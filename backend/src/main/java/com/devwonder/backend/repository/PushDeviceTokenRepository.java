package com.devwonder.backend.repository;

import com.devwonder.backend.entity.PushDeviceToken;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushDeviceTokenRepository extends JpaRepository<PushDeviceToken, Long> {

    Optional<PushDeviceToken> findByToken(String token);

    Optional<PushDeviceToken> findByAccountIdAndToken(Long accountId, String token);

    List<PushDeviceToken> findByAccountIdAndActiveTrue(Long accountId);
}
