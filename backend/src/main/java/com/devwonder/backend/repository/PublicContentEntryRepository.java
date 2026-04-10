package com.devwonder.backend.repository;

import com.devwonder.backend.entity.PublicContentEntry;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublicContentEntryRepository extends JpaRepository<PublicContentEntry, Long> {

    Optional<PublicContentEntry> findByContentKeyAndLocaleAndPublishedTrue(String contentKey, String locale);

    Optional<PublicContentEntry> findByContentKeyAndLocale(String contentKey, String locale);

    List<PublicContentEntry> findAllByOrderByContentKeyAscLocaleAsc();
}
