package com.devwonder.backend.config;

import com.devwonder.backend.security.JWTAuthFilter;
import com.devwonder.backend.security.AdminPasswordChangeRequiredFilter;
import com.devwonder.backend.security.OurUserDetailsService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Autowired
    private OurUserDetailsService ourUserDetailsService;

    @Autowired
    private JWTAuthFilter jwtAuthFilter;

    @Autowired
    private AdminPasswordChangeRequiredFilter adminPasswordChangeRequiredFilter;

    @Autowired
    private CorsOriginPatternValidator corsOriginPatternValidator;

    @Value("${app.cors.allow-credentials:true}")
    private boolean corsAllowCredentials;

    @Value("${app.docs.public-enabled:false}")
    private boolean docsPublicEnabled;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(request -> {
                    var registry = request
                        .requestMatchers(
                                "/api/v1/admin/users",
                                "/api/v1/admin/users/**"
                        )
                        .hasAuthority("SUPER_ADMIN")
                        .requestMatchers("/api/v1/admin/settings").hasAuthority("SUPER_ADMIN")
                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/api/auth/**",
                                "/uploads/**",
                                "/api/v1/content/**",
                                "/api/v1/blog/**",
                                "/api/v1/product/**",
                                "/api/v1/warranty/check/**",
                                "/api/v1/webhooks/sepay",
                                "/api/v1/health",
                                "/actuator/health",
                                "/ws/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/user/dealer").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/user/dealer/page").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/upload/**").permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/upload/products",
                                "/api/v1/upload/blogs",
                                "/api/v1/upload/avatars"
                        ).hasAnyAuthority("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/upload/dealer-avatars",
                                "/api/v1/upload/payment-proofs"
                        ).hasAnyAuthority("DEALER", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/warranty-activation"
                        ).hasAuthority("DEALER")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/upload").hasAnyAuthority("DEALER", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/v1/admin/**").hasAnyAuthority("ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/v1/dealer/**").hasAuthority("DEALER")
                        .anyRequest().authenticated();
                    if (docsPublicEnabled) {
                        registry.requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll();
                    }
                })
                .sessionManagement(manager -> manager.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(daoAuthenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(adminPasswordChangeRequiredFilter, JWTAuthFilter.class);
        return httpSecurity.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(corsOriginPatternValidator.allowedOriginPatterns());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(corsAllowCredentials);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private DaoAuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(ourUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
