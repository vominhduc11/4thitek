package com.devwonder.backend.config;

import com.devwonder.backend.security.JWTAuthFilter;
import com.devwonder.backend.security.AdminPasswordChangeRequiredFilter;
import com.devwonder.backend.security.OurUserDetailsService;
import java.util.Arrays;
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

    @Value("${app.cors.allowed-origin-patterns:}")
    private String allowedOriginPatterns;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(request -> request
                        .requestMatchers(
                                "/admin/users",
                                "/admin/users/**",
                                "/api/admin/users",
                                "/api/admin/users/**",
                                "/api/v1/admin/users",
                                "/api/v1/admin/users/**"
                        )
                        .hasAuthority("SUPER_ADMIN")
                        .requestMatchers(
                                "/auth/**",
                                "/api/auth/**",
                                "/api/v1/auth/**",
                                "/public/**",
                                "/uploads/**",
                                "/api/content/**",
                                "/api/v1/content/**",
                                "/api/blog/**",
                                "/api/v1/blog/**",
                                "/api/product/**",
                                "/api/v1/product/**",
                                "/api/warranty/check/**",
                                "/api/v1/warranty/check/**",
                                "/api/webhooks/sepay",
                                "/api/v1/webhooks/sepay",
                                "/api/health",
                                "/api/v1/health",
                                "/actuator/health",
                                "/ws/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/register-customer", "/api/v1/auth/register-customer").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/user/dealer", "/api/v1/user/dealer").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/user/dealer/page", "/api/v1/user/dealer/page").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/user/dealer", "/api/v1/user/dealer").permitAll()
                        .requestMatchers("/api/upload/**", "/api/v1/upload/**").authenticated()
                        .requestMatchers("/admin/**", "/api/admin/**", "/api/v1/admin/**").hasAnyAuthority("ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/customer/**", "/api/v1/customer/**").hasAnyAuthority("CUSTOMER", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/user/**", "/api/dealer/**", "/api/v1/dealer/**").hasAnyAuthority("USER", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/adminuser/**").hasAnyAuthority("USER", "ADMIN", "SUPER_ADMIN")
                        .anyRequest().authenticated())
                .sessionManagement(manager -> manager.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(daoAuthenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(adminPasswordChangeRequiredFilter, JWTAuthFilter.class);
        return httpSecurity.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(parseAllowedOriginPatterns());
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private List<String> parseAllowedOriginPatterns() {
        return Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
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
