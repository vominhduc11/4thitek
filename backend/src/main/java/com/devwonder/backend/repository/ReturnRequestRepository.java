package com.devwonder.backend.repository;

import com.devwonder.backend.entity.ReturnRequest;
import com.devwonder.backend.entity.enums.ReturnRequestStatus;
import com.devwonder.backend.entity.enums.ReturnRequestType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    boolean existsByRequestCode(String requestCode);

    @EntityGraph(attributePaths = {"dealer", "order", "supportTicket"})
    Page<ReturnRequest> findByDealerIdOrderByCreatedAtDesc(Long dealerId, Pageable pageable);

    @EntityGraph(attributePaths = {"dealer", "order", "supportTicket"})
    Optional<ReturnRequest> findByIdAndDealerId(Long id, Long dealerId);

    @EntityGraph(attributePaths = {
            "dealer",
            "order",
            "supportTicket",
            "items",
            "items.orderItem",
            "items.product",
            "items.productSerial"
    })
    @Query("select rr from ReturnRequest rr where rr.id = :id")
    Optional<ReturnRequest> findDetailById(@Param("id") Long id);

    @EntityGraph(attributePaths = {
            "dealer",
            "order",
            "supportTicket",
            "items",
            "items.orderItem",
            "items.product",
            "items.productSerial"
    })
    @Query("select rr from ReturnRequest rr where rr.id = :id and rr.dealer.id = :dealerId")
    Optional<ReturnRequest> findDetailByIdAndDealerId(
            @Param("id") Long id,
            @Param("dealerId") Long dealerId
    );

    @EntityGraph(attributePaths = {"dealer", "order", "supportTicket"})
    @Query(
            value = """
                    select distinct rr
                    from ReturnRequest rr
                    join rr.dealer d
                    join rr.order o
                    left join rr.items i
                    left join i.productSerial ps
                    where (:status is null or rr.status = :status)
                      and (:type is null or rr.type = :type)
                      and (
                        :dealerQuery is null
                        or lower(coalesce(d.businessName, '')) like :dealerQuery
                        or lower(coalesce(d.contactName, '')) like :dealerQuery
                        or lower(coalesce(d.username, '')) like :dealerQuery
                        or lower(coalesce(d.email, '')) like :dealerQuery
                      )
                      and (:orderCode is null or lower(coalesce(o.orderCode, '')) like :orderCode)
                      and (:serialQuery is null or lower(coalesce(ps.serial, '')) like :serialQuery)
                    order by rr.createdAt desc
                    """,
            countQuery = """
                    select count(distinct rr)
                    from ReturnRequest rr
                    join rr.dealer d
                    join rr.order o
                    left join rr.items i
                    left join i.productSerial ps
                    where (:status is null or rr.status = :status)
                      and (:type is null or rr.type = :type)
                      and (
                        :dealerQuery is null
                        or lower(coalesce(d.businessName, '')) like :dealerQuery
                        or lower(coalesce(d.contactName, '')) like :dealerQuery
                        or lower(coalesce(d.username, '')) like :dealerQuery
                        or lower(coalesce(d.email, '')) like :dealerQuery
                      )
                      and (:orderCode is null or lower(coalesce(o.orderCode, '')) like :orderCode)
                      and (:serialQuery is null or lower(coalesce(ps.serial, '')) like :serialQuery)
                    """
    )
    Page<ReturnRequest> findAdminPage(
            @Param("status") ReturnRequestStatus status,
            @Param("type") ReturnRequestType type,
            @Param("dealerQuery") String dealerQuery,
            @Param("orderCode") String orderCode,
            @Param("serialQuery") String serialQuery,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"dealer", "order", "supportTicket"})
    @Query(
            value = """
                    select distinct rr
                    from ReturnRequest rr
                    join rr.order o
                    left join rr.items i
                    left join i.productSerial ps
                    where rr.dealer.id = :dealerId
                      and (:status is null or rr.status = :status)
                      and (:type is null or rr.type = :type)
                      and (:orderCode is null or lower(coalesce(o.orderCode, '')) like :orderCode)
                      and (:serialQuery is null or lower(coalesce(ps.serial, '')) like :serialQuery)
                    order by rr.createdAt desc
                    """,
            countQuery = """
                    select count(distinct rr)
                    from ReturnRequest rr
                    join rr.order o
                    left join rr.items i
                    left join i.productSerial ps
                    where rr.dealer.id = :dealerId
                      and (:status is null or rr.status = :status)
                      and (:type is null or rr.type = :type)
                      and (:orderCode is null or lower(coalesce(o.orderCode, '')) like :orderCode)
                      and (:serialQuery is null or lower(coalesce(ps.serial, '')) like :serialQuery)
                    """
    )
    Page<ReturnRequest> findDealerPage(
            @Param("dealerId") Long dealerId,
            @Param("status") ReturnRequestStatus status,
            @Param("type") ReturnRequestType type,
            @Param("orderCode") String orderCode,
            @Param("serialQuery") String serialQuery,
            Pageable pageable
    );
}
