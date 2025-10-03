package com.rabbitmq.admin.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * JWT authentication filter that validates JWT tokens and sets up Spring
 * Security context.
 * This filter runs once per request and validates the JWT token from the
 * Authorization header.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        String requestPath = request.getRequestURI();
        logger.debug("JWT Filter processing request: {} {}", request.getMethod(), requestPath);

        // Extract and set client IP for audit logging
        setClientIpInMDC(request);

        // Extract and set user agent for audit logging
        setUserAgentInMDC(request);

        try {
            String jwt = getJwtFromRequest(request);
            logger.debug("JWT token present: {}", jwt != null);

            if (StringUtils.hasText(jwt)) {
                logger.debug("Validating JWT token for path: {}", requestPath);
                boolean isValid = tokenProvider.validateToken(jwt);
                logger.debug("JWT token valid: {}", isValid);

                if (isValid) {
                    String userId = tokenProvider.getUserIdFromToken(jwt);
                    logger.debug("JWT user ID: {}", userId);

                    // Load user details and create authentication token
                    UserDetails userDetails = customUserDetailsService.loadUserById(UUID.fromString(userId));
                    logger.debug("User details loaded: {}, authorities: {}", userDetails.getUsername(),
                            userDetails.getAuthorities());

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("Authentication set in security context for user: {}", userDetails.getUsername());
                }
            } else {
                logger.debug("No JWT token found in request to: {}", requestPath);
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context for path: " + requestPath, ex);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Clean up MDC to prevent memory leaks
            MDC.remove("clientIp");
            MDC.remove("userAgent");
        }
    }

    /**
     * Extract JWT token from the Authorization header
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * Extract client IP address from request headers and set in MDC for audit
     * logging
     */
    private void setClientIpInMDC(HttpServletRequest request) {
        String clientIp = null;

        // Check X-Forwarded-For header first (for proxied requests)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            clientIp = xForwardedFor.split(",")[0].trim();
        }

        // Fallback to X-Real-IP header
        if (!StringUtils.hasText(clientIp)) {
            clientIp = request.getHeader("X-Real-IP");
        }

        // Fallback to remote address
        if (!StringUtils.hasText(clientIp)) {
            clientIp = request.getRemoteAddr();
        }

        if (StringUtils.hasText(clientIp)) {
            MDC.put("clientIp", clientIp);
        }
    }

    /**
     * Extract User-Agent header and set in MDC for audit logging
     */
    private void setUserAgentInMDC(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        if (StringUtils.hasText(userAgent)) {
            MDC.put("userAgent", userAgent);
        }
    }
}