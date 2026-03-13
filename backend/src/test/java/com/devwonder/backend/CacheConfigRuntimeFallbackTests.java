package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.ApplicationContext;
import org.springframework.data.redis.connection.RedisConnectionFactory;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:cache_runtime_fallback;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "app.rate-limit.enabled=false",
        "jwt.secret=0123456789abcdef0123456789abcdef",
        "spring.data.redis.host="
})
class CacheConfigRuntimeFallbackTests {

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void fallsBackToInMemoryCacheWhenRedisHostIsBlank() {
        assertThat(cacheManager).isInstanceOf(ConcurrentMapCacheManager.class);
        assertThat(applicationContext.getBeansOfType(RedisConnectionFactory.class)).isEmpty();
    }
}
