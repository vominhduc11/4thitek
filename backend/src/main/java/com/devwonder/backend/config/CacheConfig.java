package com.devwonder.backend.config;

import java.util.List;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(List.of(
                        CacheNames.ADMIN_DASHBOARD,
                        CacheNames.PUBLIC_HOMEPAGE_PRODUCTS,
                        CacheNames.PUBLIC_FEATURED_PRODUCTS,
                        CacheNames.PUBLIC_PRODUCTS,
                        CacheNames.PUBLIC_PRODUCT_BY_ID,
                        CacheNames.PUBLIC_PRODUCT_RELATED,
                        CacheNames.PUBLIC_DEALERS,
                        CacheNames.PUBLIC_WARRANTY_LOOKUP,
                        CacheNames.PUBLIC_HOMEPAGE_BLOGS,
                        CacheNames.PUBLIC_BLOGS,
                        CacheNames.PUBLIC_BLOG_BY_ID,
                        CacheNames.PUBLIC_BLOG_RELATED,
                        CacheNames.PUBLIC_BLOG_CATEGORIES,
                        CacheNames.PUBLIC_BLOGS_BY_CATEGORY,
                        CacheNames.PUBLIC_CONTENT
                ).toArray(String[]::new)
        );
    }
}
