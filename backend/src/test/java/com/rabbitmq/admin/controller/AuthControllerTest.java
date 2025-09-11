package com.rabbitmq.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.dto.JwtAuthenticationResponse;
import com.rabbitmq.admin.dto.LoginRequest;
import com.rabbitmq.admin.dto.RefreshTokenRequest;
import com.rabbitmq.admin.dto.UserInfo;
import com.rabbitmq.admin.model.UserRole;

import com.rabbitmq.admin.service.AuthenticationService;
import com.rabbitmq.admin.security.JwtTokenProvider;
import com.rabbitmq.admin.security.CustomUserDetailsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;

import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for AuthController.
 */
@WebMvcTest(controllers = AuthController.class, excludeAutoConfiguration = {
                org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
})
@ActiveProfiles("test")
class AuthControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private AuthenticationService authenticationService;

        @MockitoBean
        private JwtTokenProvider jwtTokenProvider;

        @MockitoBean
        private CustomUserDetailsService customUserDetailsService;

        @Autowired
        private ObjectMapper objectMapper;

        private LoginRequest validLoginRequest;
        private RefreshTokenRequest validRefreshRequest;
        private JwtAuthenticationResponse authResponse;
        private UserInfo userInfo;

        @BeforeEach
        void setUp() {
                validLoginRequest = new LoginRequest("testuser", "password123");
                validRefreshRequest = new RefreshTokenRequest("valid.refresh.token");

                userInfo = new UserInfo(
                                UUID.randomUUID(),
                                "testuser",
                                UserRole.USER,
                                LocalDateTime.now());

                authResponse = new JwtAuthenticationResponse(
                                "access.token",
                                "refresh.token",
                                userInfo);
        }

        @Test
        void login_WithValidCredentials_ShouldReturnTokens() throws Exception {
                // Given
                when(authenticationService.login(any(LoginRequest.class))).thenReturn(authResponse);

                // When & Then
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(validLoginRequest)))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.accessToken").value("access.token"))
                                .andExpect(jsonPath("$.refreshToken").value("refresh.token"))
                                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                                .andExpect(jsonPath("$.user.username").value("testuser"))
                                .andExpect(jsonPath("$.user.role").value("USER"));
        }

        @Test
        void login_WithInvalidCredentials_ShouldReturn401() throws Exception {
                // Given
                when(authenticationService.login(any(LoginRequest.class)))
                                .thenThrow(new BadCredentialsException("Invalid username or password"));

                // When & Then
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(validLoginRequest)))
                                .andExpect(status().isUnauthorized())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.error").value("Unauthorized"))
                                .andExpect(jsonPath("$.message").value("Invalid username or password"));
        }

        @Test
        void login_WithInvalidInput_ShouldReturn400() throws Exception {
                // Given
                LoginRequest invalidRequest = new LoginRequest("", "123"); // Invalid username and password

                // When & Then
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(invalidRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.error").value("Validation Failed"))
                                .andExpect(jsonPath("$.details.username").exists())
                                .andExpect(jsonPath("$.details.password").exists());
        }

        @Test
        void refreshToken_WithValidToken_ShouldReturnNewTokens() throws Exception {
                // Given
                when(authenticationService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(authResponse);

                // When & Then
                mockMvc.perform(post("/api/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(validRefreshRequest)))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.accessToken").value("access.token"))
                                .andExpect(jsonPath("$.refreshToken").value("refresh.token"));
        }

        @Test
        void refreshToken_WithInvalidToken_ShouldReturn401() throws Exception {
                // Given
                when(authenticationService.refreshToken(any(RefreshTokenRequest.class)))
                                .thenThrow(new BadCredentialsException("Invalid refresh token"));

                // When & Then
                mockMvc.perform(post("/api/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(validRefreshRequest)))
                                .andExpect(status().isUnauthorized())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.error").value("Unauthorized"))
                                .andExpect(jsonPath("$.message").value("Invalid refresh token"));
        }

        @Test
        void refreshToken_WithEmptyToken_ShouldReturn400() throws Exception {
                // Given
                RefreshTokenRequest emptyRequest = new RefreshTokenRequest("");

                // When & Then
                mockMvc.perform(post("/api/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(emptyRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.error").value("Validation Failed"))
                                .andExpect(jsonPath("$.details.refreshToken").exists());
        }

        @Test
        void validateToken_WithValidToken_ShouldReturnValidationInfo() throws Exception {
                // Given
                when(authenticationService.isTokenValid("valid.token")).thenReturn(true);
                when(authenticationService.getTokenExpirationTime("valid.token")).thenReturn(3600000L);

                // When & Then
                mockMvc.perform(get("/api/auth/validate")
                                .header("Authorization", "Bearer valid.token"))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.valid").value(true))
                                .andExpect(jsonPath("$.expiresIn").value(3600000));
        }

        @Test
        void validateToken_WithoutToken_ShouldReturnInvalid() throws Exception {
                // When & Then
                mockMvc.perform(get("/api/auth/validate"))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.valid").value(false))
                                .andExpect(jsonPath("$.expiresIn").value(0));
        }

        @Test
        void health_ShouldReturnHealthStatus() throws Exception {
                // When & Then
                mockMvc.perform(get("/api/auth/health"))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.status").value("UP"))
                                .andExpect(jsonPath("$.service").value("Authentication Service"));
        }
}