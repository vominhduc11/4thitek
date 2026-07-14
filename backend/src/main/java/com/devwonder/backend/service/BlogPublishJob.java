package com.devwonder.backend.service;

import com.devwonder.backend.config.CacheNames;
import com.devwonder.backend.entity.Blog;
import com.devwonder.backend.entity.enums.BlogStatus;
import com.devwonder.backend.event.RevalidateContentEvent;
import com.devwonder.backend.repository.BlogRepository;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled job that auto-publishes blogs whose scheduledAt time has passed.
 * Runs every minute. On publish, clears all public blog caches.
 */
@Component
@RequiredArgsConstructor
public class BlogPublishJob {

    private static final Logger log = LoggerFactory.getLogger(BlogPublishJob.class);

    private final BlogRepository blogRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    @CacheEvict(cacheNames = {
            CacheNames.PUBLIC_HOMEPAGE_BLOGS,
            CacheNames.PUBLIC_BLOGS,
            CacheNames.PUBLIC_BLOG_BY_ID,
            CacheNames.PUBLIC_BLOG_RELATED,
            CacheNames.PUBLIC_BLOG_CATEGORIES,
            CacheNames.PUBLIC_BLOGS_BY_CATEGORY
    }, allEntries = true)
    public void publishDueBlogs() {
        List<Blog> dueBlogs = blogRepository.findScheduledBlogsDueBy(Instant.now());
        if (dueBlogs.isEmpty()) {
            return;
        }
        log.info("Blog publish job started: dueCount={}", dueBlogs.size());
        Set<String> tags = new LinkedHashSet<>();
        tags.add("blogs");
        for (Blog blog : dueBlogs) {
            blog.setStatus(BlogStatus.PUBLISHED);
            blog.setScheduledAt(null);
            blogRepository.save(blog);
            tags.add("blog:" + blog.getId());
            log.info("Auto-published scheduled blog id={}, title={}", blog.getId(), blog.getTitle());
        }
        // ISR on-demand: bai hen gio khong len den khi het ISR fallback neu khong revalidate.
        // RevalidationClient lang nghe AFTER_COMMIT nen main-fe re-fetch sau khi commit.
        eventPublisher.publishEvent(new RevalidateContentEvent(tags));
        log.info("Blog publish job completed: publishedCount={}", dueBlogs.size());
    }
}
