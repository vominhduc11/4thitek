package com.devwonder.backend.repository;

import com.devwonder.backend.entity.AdminSettings;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminSettingsRepository extends JpaRepository<AdminSettings, Long> {
    Optional<AdminSettings> findFirstByOrderByIdAsc();
}
