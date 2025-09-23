package com.rabbitmq.admin.config;

import com.rabbitmq.admin.security.CustomUserDetailsService;
import com.rabbitmq.admin.security.JwtAuthenticationEntryPoint;
import com.rabbitmq.admin.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
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

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration for JWT-based authentication and authorization.
 * Configures role-based access control with @PreAuthorize support.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Password encoder using BCrypt with strength 12
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * Authentication manager bean
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    /**
     * DAO authentication provider with custom user details service
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * CORS configuration
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Main security filter chain configuration
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // Public auth endpoints
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/refresh").permitAll()
                        .requestMatchers("/api/auth/validate").permitAll()
                        .requestMatchers("/api/auth/health").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/actuator/info").permitAll()

                        // Static resources (frontend)
                        .requestMatchers("/", "/static/**", "/assets/**", "/*.js", "/*.css", "/*.ico", "/*.png",
                                "/*.jpg", "/*.gif")
                        .permitAll()
                        .requestMatchers("/index.html", "/manifest.json").permitAll()

                        // Frontend routes (let React Router handle authentication)
                        .requestMatchers("/dashboard", "/dashboard/**", "/users", "/users/**", "/clusters",
                                "/clusters/**", "/login", "/login/**", "/resources", "/resources/**")
                        .permitAll()

                        // Admin-only endpoints
                        .requestMatchers("/api/users/**").hasRole("ADMINISTRATOR")
                        .requestMatchers("/api/clusters/create").hasRole("ADMINISTRATOR")
                        .requestMatchers("/api/clusters/*/edit").hasRole("ADMINISTRATOR")
                        .requestMatchers("/api/clusters/*/delete").hasRole("ADMINISTRATOR")
                        .requestMatchers("/api/clusters/*/test").hasRole("ADMINISTRATOR")

                        // User endpoints (allow both roles - method-level @PreAuthorize will handle
                        // specifics)
                        .requestMatchers("/api/clusters/my/**").hasAnyRole("USER", "ADMINISTRATOR")

                        // Remaining admin cluster endpoints
                        .requestMatchers("/api/clusters/**").hasRole("ADMINISTRATOR")

                        // Protected auth endpoints (require authentication)
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/auth/logout").authenticated()

                        // RabbitMQ resource endpoints (both roles)
                        .requestMatchers("/api/rabbitmq/**").authenticated()

                        // All other requests require authentication
                        .anyRequest().authenticated());

        // Add JWT authentication filter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}