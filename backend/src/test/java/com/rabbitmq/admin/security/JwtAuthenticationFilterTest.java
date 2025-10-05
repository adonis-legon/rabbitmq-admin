package com.rabbitmq.admin.security;

import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for JWT Authentication Filter.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private User testUser;
    private String validToken;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setPasswordHash("hashedpassword");
        testUser.setRole(UserRole.USER);
        testUser.setCreatedAt(LocalDateTime.now());

        validToken = "valid.jwt.token";
    }

    @Test
    void doFilterInternal_WithValidToken_ShouldSetAuthentication() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);
        when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.1");
        when(request.getHeader("User-Agent")).thenReturn("Mozilla/5.0");
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUserIdFromToken(validToken)).thenReturn(testUser.getId().toString());
        when(userDetailsService.loadUserById(testUser.getId())).thenReturn(UserPrincipal.create(testUser));

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(testUser.getUsername(),
                ((UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_WithInvalidToken_ShouldNotSetAuthentication() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid.token");
        when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.1");
        when(request.getHeader("User-Agent")).thenReturn("Mozilla/5.0");
        when(tokenProvider.validateToken("invalid.token")).thenReturn(false);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserById(any());
    }

    @Test
    void doFilterInternal_WithNoToken_ShouldNotSetAuthentication() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.1");
        when(request.getHeader("User-Agent")).thenReturn("Mozilla/5.0");

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verify(tokenProvider, never()).validateToken(any());
        verify(userDetailsService, never()).loadUserById(any());
    }

    @Test
    void doFilterInternal_WithMalformedAuthHeader_ShouldNotSetAuthentication() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("InvalidHeader");
        when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.1");
        when(request.getHeader("User-Agent")).thenReturn("Mozilla/5.0");

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verify(tokenProvider, never()).validateToken(any());
    }

    @Test
    void doFilterInternal_WithException_ShouldContinueFilterChain() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);
        when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.1");
        when(request.getHeader("User-Agent")).thenReturn("Mozilla/5.0");
        when(tokenProvider.validateToken(validToken)).thenThrow(new RuntimeException("Token validation error"));

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }
}