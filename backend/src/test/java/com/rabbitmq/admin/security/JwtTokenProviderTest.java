package com.rabbitmq.admin.security;

import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private User testUser;

    @BeforeEach
    void setUp() {
        // Use a test secret key
        String testSecretKey = "test-secret-key-for-jwt-token-provider-testing-purposes-256-bit";
        long testExpiration = 86400000; // 24 hours

        jwtTokenProvider = new JwtTokenProvider(testSecretKey, testExpiration);

        // Create test user
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setPasswordHash("hashedpassword");
        testUser.setRole(UserRole.USER);
        testUser.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void generateTokenFromUser_ShouldCreateValidToken() {
        // When
        String token = jwtTokenProvider.generateTokenFromUser(testUser);

        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    void generateToken_FromAuthentication_ShouldCreateValidToken() {
        // Given
        UserPrincipal userPrincipal = UserPrincipal.create(testUser);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userPrincipal);

        // When
        String token = jwtTokenProvider.generateToken(authentication);

        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    void generateRefreshToken_ShouldCreateValidRefreshToken() {
        // When
        String refreshToken = jwtTokenProvider.generateRefreshToken(testUser);

        // Then
        assertNotNull(refreshToken);
        assertFalse(refreshToken.isEmpty());
        assertTrue(jwtTokenProvider.validateToken(refreshToken));
        assertTrue(jwtTokenProvider.isRefreshToken(refreshToken));
    }

    @Test
    void getUserIdFromToken_ShouldReturnCorrectUserId() {
        // Given
        String token = jwtTokenProvider.generateTokenFromUser(testUser);

        // When
        String userId = jwtTokenProvider.getUserIdFromToken(token);

        // Then
        assertEquals(testUser.getId().toString(), userId);
    }

    @Test
    void getUsernameFromToken_ShouldReturnCorrectUsername() {
        // Given
        String token = jwtTokenProvider.generateTokenFromUser(testUser);

        // When
        String username = jwtTokenProvider.getUsernameFromToken(token);

        // Then
        assertEquals(testUser.getUsername(), username);
    }

    @Test
    void getRoleFromToken_ShouldReturnCorrectRole() {
        // Given
        String token = jwtTokenProvider.generateTokenFromUser(testUser);

        // When
        String role = jwtTokenProvider.getRoleFromToken(token);

        // Then
        assertEquals(testUser.getRole().name(), role);
    }

    @Test
    void validateToken_WithValidToken_ShouldReturnTrue() {
        // Given
        String token = jwtTokenProvider.generateTokenFromUser(testUser);

        // When
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then
        assertTrue(isValid);
    }

    @Test
    void validateToken_WithInvalidToken_ShouldReturnFalse() {
        // Given
        String invalidToken = "invalid.jwt.token";

        // When
        boolean isValid = jwtTokenProvider.validateToken(invalidToken);

        // Then
        assertFalse(isValid);
    }

    @Test
    void validateToken_WithMalformedToken_ShouldReturnFalse() {
        // Given
        String malformedToken = "malformed-token";

        // When
        boolean isValid = jwtTokenProvider.validateToken(malformedToken);

        // Then
        assertFalse(isValid);
    }

    @Test
    void isTokenExpired_WithValidToken_ShouldReturnFalse() {
        // Given
        String token = jwtTokenProvider.generateTokenFromUser(testUser);

        // When
        boolean isExpired = jwtTokenProvider.isTokenExpired(token);

        // Then
        assertFalse(isExpired);
    }

    @Test
    void isTokenExpired_WithInvalidToken_ShouldReturnTrue() {
        // Given
        String invalidToken = "invalid.jwt.token";

        // When
        boolean isExpired = jwtTokenProvider.isTokenExpired(invalidToken);

        // Then
        assertTrue(isExpired);
    }

    @Test
    void getExpirationDateFromToken_ShouldReturnFutureDate() {
        // Given
        String token = jwtTokenProvider.generateTokenFromUser(testUser);

        // When
        Date expirationDate = jwtTokenProvider.getExpirationDateFromToken(token);

        // Then
        assertNotNull(expirationDate);
        assertTrue(expirationDate.after(new Date()));
    }

    @Test
    void getTimeUntilExpiration_WithValidToken_ShouldReturnPositiveValue() {
        // Given
        String token = jwtTokenProvider.generateTokenFromUser(testUser);

        // When
        long timeUntilExpiration = jwtTokenProvider.getTimeUntilExpiration(token);

        // Then
        assertTrue(timeUntilExpiration > 0);
    }

    @Test
    void getTimeUntilExpiration_WithInvalidToken_ShouldReturnZero() {
        // Given
        String invalidToken = "invalid.jwt.token";

        // When
        long timeUntilExpiration = jwtTokenProvider.getTimeUntilExpiration(invalidToken);

        // Then
        assertEquals(0, timeUntilExpiration);
    }

    @Test
    void isRefreshToken_WithAccessToken_ShouldReturnFalse() {
        // Given
        String accessToken = jwtTokenProvider.generateTokenFromUser(testUser);

        // When
        boolean isRefreshToken = jwtTokenProvider.isRefreshToken(accessToken);

        // Then
        assertFalse(isRefreshToken);
    }

    @Test
    void isRefreshToken_WithRefreshToken_ShouldReturnTrue() {
        // Given
        String refreshToken = jwtTokenProvider.generateRefreshToken(testUser);

        // When
        boolean isRefreshToken = jwtTokenProvider.isRefreshToken(refreshToken);

        // Then
        assertTrue(isRefreshToken);
    }

    @Test
    void generateTokenFromUser_WithAdministratorRole_ShouldIncludeCorrectRole() {
        // Given
        testUser.setRole(UserRole.ADMINISTRATOR);

        // When
        String token = jwtTokenProvider.generateTokenFromUser(testUser);

        // Then
        String role = jwtTokenProvider.getRoleFromToken(token);
        assertEquals(UserRole.ADMINISTRATOR.name(), role);
    }
}