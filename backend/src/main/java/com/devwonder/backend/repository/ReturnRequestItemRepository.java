package com.devwonder.backend.repository;

import com.devwonder.backend.entity.ReturnRequestItem;
import com.devwonder.backend.entity.enums.ReturnRequestStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReturnRequestItemRepository extends JpaRepository<ReturnRequestItem, Long> {

    Optional<ReturnRequestItem> findByIdAndRequestId(Long id, Long requestId);

    @Query("""
            select distinct i.productSerial.id
            from ReturnRequestItem i
            where i.productSerial.id in :serialIds
              and i.request.status in :activeStatuses
            """)
    List<Long> findActiveSerialIds(
            @Param("serialIds") Collection<Long> serialIds,
            @Param("activeStatuses") Set<ReturnRequestStatus> activeStatuses
    );

    @Query("""
            select i.productSerial.id, i.request.id, i.request.requestCode
            from ReturnRequestItem i
            where i.productSerial.id in :serialIds
              and i.request.status in :activeStatuses
            """)
    List<Object[]> findActiveSerialRequestRefs(
            @Param("serialIds") Collection<Long> serialIds,
            @Param("activeStatuses") Set<ReturnRequestStatus> activeStatuses
    );
}
