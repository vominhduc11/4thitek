package com.devwonder.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Conditional;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.util.StringUtils;

@Configuration
public class RedisConfig {

    @Bean(destroyMethod = "destroy")
    @Conditional(RedisHostConfiguredCondition.class)
    public RedisConnectionFactory redisConnectionFactory(
            @Value("${spring.data.redis.host:}") String redisHost,
            @Value("${spring.data.redis.port:6379}") int redisPort,
            @Value("${spring.data.redis.password:}") String redisPassword,
            @Value("${spring.data.redis.database:0}") int redisDatabase
    ) {
        RedisStandaloneConfiguration configuration = new RedisStandaloneConfiguration(redisHost.trim(), redisPort);
        configuration.setDatabase(Math.max(redisDatabase, 0));
        if (StringUtils.hasText(redisPassword)) {
            configuration.setPassword(RedisPassword.of(redisPassword));
        }
        return new LettuceConnectionFactory(configuration);
    }

    @Bean
    @Conditional(RedisHostConfiguredCondition.class)
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {
        return new StringRedisTemplate(redisConnectionFactory);
    }

    static final class RedisHostConfiguredCondition implements Condition {

        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            return StringUtils.hasText(context.getEnvironment().getProperty("spring.data.redis.host"));
        }
    }
}
