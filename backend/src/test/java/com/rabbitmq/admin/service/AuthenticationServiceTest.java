package com.rabbitmq.admin.service;

import com.rabbitmq.admin.config.UserSecurityProperties;
import com.rabbitmq.admin.dto.JwtAuthenticationResponse;
import com.rabbitmq.admin.dto.LoginRequest;
import com.rabbitmq.admin.dto.RefreshTokenRequest;
import com.rabbitmq.admin.dto.UserInfo;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.repository.UserRepository;
import com.rabbitmq.admin.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

/**
 * Unit tests for AuthenticationService.
 */
@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserSecurityProperties userSecurityProperties;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthenticationService authenticationService;

    private User testUser;
    private LoginRequest loginRequest;
    private RefreshTokenRequest refreshTokenRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setPasswordHash("hashedpassword");
        testUser.setRole(UserRole.USER);
        testUser.setCreatedAt(LocalDateTime.now());

        loginRequest = new LoginRequest("testuser", "password123");
        refreshTokenRequest = new RefreshTokenRequest("valid.refresh.token");

        // Default lenient mock behavior for UserSecurityProperties
        lenient().when(userSecurityProperties.isEnabled()).thenReturn(false);
        lenient().when(userSecurityProperties.getMaxFailedAttempts()).thenReturn(3);
        lenient().when(userSecurityProperties.getAutoUnlockMinutes()).thenReturn(0);
    }

    @Test
    void login_WithValidCredentials_ShouldReturnTokens() {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByUsernameIgnoreCase("testuser"))
                .thenReturn(Optional.of(testUser));
        when(tokenProvider.generateToken(authentication)).thenReturn("access.token");
        when(tokenProvider.generateRefreshToken(testUser)).thenReturn("refresh.token");

        // When
        JwtAuthenticationResponse response = authenticationService.login(loginRequest);

        // Then
        assertNotNull(response);
        assertEquals("access.token", response.getAccessToken());
        assertEquals("refresh.token", response.getRefreshToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("testuser", response.getUser().getUsername());
        assertEquals(UserRole.USER, response.getUser().getRole());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByUsernameIgnoreCase("testuser");
        verify(tokenProvider).generateToken(authentication);
        verify(tokenProvider).generateRefreshToken(testUser);
    }

    @Test
    void login_WithInvalidCredentials_ShouldThrowException() {
        // Given
        when(userRepository.findByUsernameIgnoreCase("testuser"))
                .thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        // When & Then
        assertThrows(BadCredentialsException.class, () -> {
            authenticationService.login(loginRequest);
        });

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByUsernameIgnoreCase("testuser");
        verify(tokenProvider, never()).generateToken(any());
    }

    @Test
    void login_WithUserNotFound_ShouldThrowException() {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByUsernameIgnoreCase("testuser"))
                .thenReturn(Optional.empty());

        // When & Then
        assertThrows(BadCredentialsException.class, () -> {
            authenticationService.login(loginRequest);
        });

        verify(userRepository, times(2)).findByUsernameIgnoreCase("testuser");
        verify(tokenProvider, never()).generateToken(any());
    }

    @Test
    void refreshToken_WithValidToken_ShouldReturnNewTokens() {
        // Given
        when(tokenProvider.validateToken("valid.refresh.token")).thenReturn(true);
        when(tokenProvider.isRefreshToken("valid.refresh.token")).thenReturn(true);
        when(tokenProvider.getUserIdFromToken("valid.refresh.token")).thenReturn(testUser.getId().toString());
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(tokenProvider.generateTokenFromUser(testUser)).thenReturn("new.access.token");
        when(tokenProvider.generateRefreshToken(testUser)).thenReturn("new.refresh.token");

        // When
        JwtAuthenticationResponse response = authenticationService.refreshToken(refreshTokenRequest);

        // Then
        assertNotNull(response);
        assertEquals("new.access.token", response.getAccessToken());
        assertEquals("new.refresh.token", response.getRefreshToken());
        assertEquals("testuser", response.getUser().getUsername());

        verify(tokenProvider).validateToken("valid.refresh.token");
        verify(tokenProvider).isRefreshToken("valid.refresh.token");
        verify(tokenProvider).getUserIdFromToken("valid.refresh.token");
        verify(userRepository).findById(testUser.getId());
        verify(tokenProvider).generateTokenFromUser(testUser);
        verify(tokenProvider).generateRefreshToken(testUser);
    }

    @Test
    void refreshToken_WithInvalidToken_ShouldThrowException() {
        // Given
        when(tokenProvider.validateToken("invalid.refresh.token")).thenReturn(false);

        RefreshTokenRequest invalidRequest = new RefreshTokenRequest("invalid.refresh.token");

        // When & Then
        assertThrows(BadCredentialsException.class, () -> {
            authenticationService.refreshToken(invalidRequest);
        });

        verify(tokenProvider).validateToken("invalid.refresh.token");
        verify(tokenProvider, never()).isRefreshToken(any());
    }

    @Test
    void refreshToken_WithAccessToken_ShouldThrowException() {
        // Given
        when(tokenProvider.validateToken("access.token")).thenReturn(true);
        when(tokenProvider.isRefreshToken("access.token")).thenReturn(false);

        RefreshTokenRequest accessTokenRequest = new RefreshTokenRequest("access.token");

        // When & Then
        assertThrows(BadCredentialsException.class, () -> {
            authenticationService.refreshToken(accessTokenRequest);
        });

        verify(tokenProvider).validateToken("access.token");
        verify(tokenProvider).isRefreshToken("access.token");
        verify(userRepository, never()).findById(any());
    }

    @Test
    void getCurrentUser_WithValidToken_ShouldReturnUserInfo() {
        // Given
        String validToken = "valid.token";
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUserIdFromToken(validToken)).thenReturn(testUser.getId().toString());
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

        // When
        UserInfo userInfo = authenticationService.getCurrentUser(validToken);

        // Then
        assertNotNull(userInfo);
        assertEquals(testUser.getId(), userInfo.getId());
        assertEquals(testUser.getUsername(), userInfo.getUsername());
        assertEquals(testUser.getRole(), userInfo.getRole());

        verify(tokenProvider).validateToken(validToken);
        verify(tokenProvider).getUserIdFromToken(validToken);
        verify(userRepository).findById(testUser.getId());
    }

    @Test
    void getCurrentUser_WithInvalidToken_ShouldThrowException() {
        // Given
        String invalidToken = "invalid.token";
        when(tokenProvider.validateToken(invalidToken)).thenReturn(false);

        // When & Then
        assertThrows(BadCredentialsException.class, () -> {
            authenticationService.getCurrentUser(invalidToken);
        });

        verify(tokenProvider).validateToken(invalidToken);
        verify(tokenProvider, never()).getUserIdFromToken(any());
        verify(userRepository, never()).findById(any());
    }

    @Test
    void isTokenValid_WithValidToken_ShouldReturnTrue() {
        // Given
        String validToken = "valid.token";
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.isTokenExpired(validToken)).thenReturn(false);

        // When
        boolean isValid = authenticationService.isTokenValid(validToken);

        // Then
        assertTrue(isValid);
        verify(tokenProvider).validateToken(validToken);
        verify(tokenProvider).isTokenExpired(validToken);
    }

    @Test
    void isTokenValid_WithExpiredToken_ShouldReturnFalse() {
        // Given
        String expiredToken = "expired.token";
        when(tokenProvider.validateToken(expiredToken)).thenReturn(true);
        when(tokenProvider.isTokenExpired(expiredToken)).thenReturn(true);

        // When
        boolean isValid = authenticationService.isTokenValid(expiredToken);

        // Then
        assertFalse(isValid);
        verify(tokenProvider).validateToken(expiredToken);
        verify(tokenProvider).isTokenExpired(expiredToken);
    }

    @Test
    void getTokenExpirationTime_WithValidToken_ShouldReturnTime() {
        // Given
        String validToken = "valid.token";
        long expectedTime = 3600000L;
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getTimeUntilExpiration(validToken)).thenReturn(expectedTime);

        // When
        long expirationTime = authenticationService.getTokenExpirationTime(validToken);

        // Then
        assertEquals(expectedTime, expirationTime);
        verify(tokenProvider).validateToken(validToken);
        verify(tokenProvider).getTimeUntilExpiration(validToken);
    }

    @Test
    void logout_ShouldLogEvent() {
        // When
        authenticationService.logout("testuser");

        // Then - no exception should be thrown, method should complete successfully
        // This is mainly for logging purposes in a stateless JWT system
    }
}