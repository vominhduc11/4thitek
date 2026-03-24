package com.devwonder.backend.repository;

import com.devwonder.backend.entity.Blog;
import com.devwonder.backend.entity.enums.BlogStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {
    List<Blog> findByIsDeletedFalseOrderByCreatedAtDesc();

    List<Blog> findTop6ByIsDeletedFalseAndShowOnHomepageTrueOrderByCreatedAtDesc();

    List<Blog> findByCategoryBlogIdAndIsDeletedFalseOrderByCreatedAtDesc(Long categoryId);

    List<Blog> findTop4ByCategoryBlogIdAndIsDeletedFalseAndIdNotOrderByCreatedAtDesc(Long categoryId, Long id);

    Optional<Blog> findByIdAndIsDeletedFalse(Long id);

    List<Blog> findByIsDeletedFalseAndStatusOrderByCreatedAtDesc(BlogStatus status);

    List<Blog> findTop6ByIsDeletedFalseAndShowOnHomepageTrueAndStatusOrderByCreatedAtDesc(BlogStatus status);

    List<Blog> findByCategoryBlogIdAndIsDeletedFalseAndStatusOrderByCreatedAtDesc(Long categoryId, BlogStatus status);

    List<Blog> findTop4ByCategoryBlogIdAndIsDeletedFalseAndStatusAndIdNotOrderByCreatedAtDesc(
            Long categoryId,
            BlogStatus status,
            Long id
    );

    Optional<Blog> findByIdAndIsDeletedFalseAndStatus(Long id, BlogStatus status);

    @Query("""
            select b
            from Blog b
            where b.isDeleted = false
              and b.status = :status
              and (
                lower(b.title) like lower(concat('%', :query, '%'))
                or lower(coalesce(b.description, '')) like lower(concat('%', :query, '%'))
              )
            order by b.createdAt desc
            """)
    List<Blog> search(@Param("query") String query, @Param("status") BlogStatus status);

    @Query("""
            select count(b)
            from Blog b
            where (b.isDeleted = false or b.isDeleted is null)
              and b.status = :status
            """)
    long countActiveByStatus(@Param("status") BlogStatus status);

    @Query("""
            select count(b)
            from Blog b
            where (b.isDeleted = false or b.isDeleted is null)
              and (b.status is null or b.status <> :status)
            """)
    long countActiveByStatusNot(@Param("status") BlogStatus status);

    @Query("""
            select b
            from Blog b
            where b.isDeleted = false
              and b.status = 'SCHEDULED'
              and b.scheduledAt is not null
              and b.scheduledAt <= :now
            """)
    List<Blog> findScheduledBlogsDueBy(@Param("now") Instant now);
}
