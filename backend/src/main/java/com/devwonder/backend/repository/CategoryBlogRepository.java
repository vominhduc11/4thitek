package com.devwonder.backend.repository;

import com.devwonder.backend.entity.CategoryBlog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryBlogRepository extends JpaRepository<CategoryBlog, Long> {
    java.util.Optional<CategoryBlog> findByNameIgnoreCase(String name);
}
