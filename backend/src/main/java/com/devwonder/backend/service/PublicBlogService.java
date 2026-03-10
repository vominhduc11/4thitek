package com.devwonder.backend.service;

import com.devwonder.backend.dto.blog.PublicBlogCategoryResponse;
import com.devwonder.backend.dto.blog.PublicBlogDetailResponse;
import com.devwonder.backend.dto.blog.PublicBlogSummaryResponse;
import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.entity.Blog;
import com.devwonder.backend.entity.CategoryBlog;
import com.devwonder.backend.entity.enums.BlogStatus;
import com.devwonder.backend.exception.ResourceNotFoundException;
import com.devwonder.backend.repository.BlogRepository;
import com.devwonder.backend.repository.CategoryBlogRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PublicBlogService {

    private final BlogRepository blogRepository;
    private final CategoryBlogRepository categoryBlogRepository;

    @Transactional(readOnly = true)
    @Cacheable(CacheNames.PUBLIC_HOMEPAGE_BLOGS)
    public List<PublicBlogSummaryResponse> getHomepageBlogs() {
        return blogRepository.findTop6ByIsDeletedFalseAndShowOnHomepageTrueAndStatusOrderByCreatedAtDesc(BlogStatus.PUBLISHED).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(CacheNames.PUBLIC_BLOGS)
    public List<PublicBlogSummaryResponse> getBlogs() {
        return blogRepository.findByIsDeletedFalseAndStatusOrderByCreatedAtDesc(BlogStatus.PUBLISHED).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLIC_BLOGS, key = "'search:' + (#query == null ? '' : #query)")
    public List<PublicBlogSummaryResponse> searchBlogs(String query) {
        if (query == null || query.isBlank()) {
            return getBlogs();
        }
        return blogRepository.search(query.trim(), BlogStatus.PUBLISHED).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLIC_BLOG_BY_ID, key = "#id")
    public PublicBlogDetailResponse getBlog(Long id) {
        Blog blog = blogRepository.findByIdAndIsDeletedFalseAndStatus(id, BlogStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));
        return toDetail(blog);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLIC_BLOG_RELATED, key = "#id + ':' + #limit")
    public List<PublicBlogSummaryResponse> getRelatedBlogs(Long id, int limit) {
        Blog blog = blogRepository.findByIdAndIsDeletedFalseAndStatus(id, BlogStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));
        if (blog.getCategoryBlog() == null || blog.getCategoryBlog().getId() == null) {
            return List.of();
        }
        return blogRepository.findTop4ByCategoryBlogIdAndIsDeletedFalseAndStatusAndIdNotOrderByCreatedAtDesc(
                        blog.getCategoryBlog().getId(),
                        BlogStatus.PUBLISHED,
                        id
                ).stream()
                .limit(Math.max(limit, 0))
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(CacheNames.PUBLIC_BLOG_CATEGORIES)
    public List<PublicBlogCategoryResponse> getCategories() {
        return categoryBlogRepository.findAll().stream()
                .map(category -> new PublicBlogCategoryResponse(category.getId(), category.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLIC_BLOGS_BY_CATEGORY, key = "#categoryId")
    public List<PublicBlogSummaryResponse> getBlogsByCategory(Long categoryId) {
        categoryBlogRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        return blogRepository.findByCategoryBlogIdAndIsDeletedFalseAndStatusOrderByCreatedAtDesc(categoryId, BlogStatus.PUBLISHED).stream()
                .map(this::toSummary)
                .toList();
    }

    private PublicBlogSummaryResponse toSummary(Blog blog) {
        return new PublicBlogSummaryResponse(
                blog.getId(),
                blog.getTitle(),
                blog.getDescription(),
                blog.getImage(),
                resolveCategory(blog.getCategoryBlog()),
                blog.getCreatedAt()
        );
    }

    private PublicBlogDetailResponse toDetail(Blog blog) {
        return new PublicBlogDetailResponse(
                blog.getId(),
                blog.getTitle(),
                blog.getDescription(),
                blog.getImage(),
                resolveCategory(blog.getCategoryBlog()),
                blog.getCreatedAt(),
                blog.getUpdatedAt(),
                blog.getIntroduction(),
                Boolean.TRUE.equals(blog.getShowOnHomepage())
        );
    }

    private String resolveCategory(CategoryBlog categoryBlog) {
        return categoryBlog == null ? null : categoryBlog.getName();
    }
}
