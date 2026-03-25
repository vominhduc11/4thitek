package com.devwonder.backend.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.SerializationException;
import org.springframework.util.StringUtils;

@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(
            ObjectProvider<RedisConnectionFactory> redisConnectionFactoryProvider,
            @Value("${spring.data.redis.host:}") String redisHost,
            @Value("${app.cache.public.ttl-minutes:30}") long publicTtlMinutes
    ) {
        RedisConnectionFactory redisConnectionFactory = redisConnectionFactoryProvider.getIfAvailable();
        if (redisConnectionFactory != null && StringUtils.hasText(redisHost)) {
            RedisCacheConfiguration configuration = RedisCacheConfiguration.defaultCacheConfig()
                    .entryTtl(Duration.ofMinutes(Math.max(publicTtlMinutes, 1)))
                    .disableCachingNullValues()
                    .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                            buildRedisSerializer()
                    ));
            return RedisCacheManager.builder(redisConnectionFactory)
                    .cacheDefaults(configuration)
                    .transactionAware()
                    .build();
        }

        return new ConcurrentMapCacheManager(List.of(
                        CacheNames.ADMIN_DASHBOARD,
                        CacheNames.PUBLIC_HOMEPAGE_PRODUCTS,
                        CacheNames.PUBLIC_FEATURED_PRODUCTS,
                        CacheNames.PUBLIC_PRODUCTS,
                        CacheNames.PUBLIC_PRODUCT_BY_ID,
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

    private static GenericJackson2JsonRedisSerializer buildRedisSerializer() {
        ObjectMapper om = new ObjectMapper();
        om.registerModule(new JavaTimeModule());
        om.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.EVERYTHING,
                JsonTypeInfo.As.WRAPPER_ARRAY
        );
        return new GenericJackson2JsonRedisSerializer(om) {
            @Override
            public byte[] serialize(Object value) throws SerializationException {
                if (value == null) {
                    return new byte[0];
                }
                try {
                    // Use writerFor(Object.class) so Jackson includes root-level type wrapper
                    return om.writerFor(Object.class).writeValueAsBytes(value);
                } catch (JsonProcessingException ex) {
                    throw new SerializationException("Could not write JSON: " + ex.getMessage(), ex);
                }
            }
        };
    }
}
