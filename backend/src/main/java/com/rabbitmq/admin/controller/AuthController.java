package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.dto.JwtAuthenticationResponse;
import com.rabbitmq.admin.dto.LoginRequest;
import com.rabbitmq.admin.dto.RefreshTokenRequest;
import com.rabbitmq.admin.dto.UserInfo;
import com.rabbitmq.admin.security.UserPrincipal;
import com.rabbitmq.admin.service.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for authentication operations.
 * Handles login, logout, token refresh, and user info endpoints.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationService authenticationService;

    /**
     * Authenticate user and return JWT tokens
     */
    @PostMapping("/login")
    public ResponseEntity<JwtAuthenticationResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            JwtAuthenticationResponse response = authenticationService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            logger.warn("Login attempt failed for username: {}", loginRequest.getUsername());
            throw e;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    @PostMapping("/refresh")
    public ResponseEntity<JwtAuthenticationResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest refreshTokenRequest) {
        try {
            JwtAuthenticationResponse response = authenticationService.refreshToken(refreshTokenRequest);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            logger.warn("Token refresh failed");
            throw e;
        }
    }

    /**
     * Get current authenticated user information
     */
    @GetMapping("/me")
    public ResponseEntity<UserInfo> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserInfo userInfo = UserInfo.fromUser(userPrincipal.getUser());
        return ResponseEntity.ok(userInfo);
    }

    /**
     * Logout current user
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        authenticationService.logout(userPrincipal.getUsername());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Validate current token
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(HttpServletRequest request) {
        String token = getJwtFromRequest(request);

        Map<String, Object> response = new HashMap<>();
        if (StringUtils.hasText(token)) {
            boolean isValid = authenticationService.isTokenValid(token);
            long expirationTime = authenticationService.getTokenExpirationTime(token);

            response.put("valid", isValid);
            response.put("expiresIn", expirationTime);
        } else {
            response.put("valid", false);
            response.put("expiresIn", 0);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Health check endpoint for authentication service
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Authentication Service");
        return ResponseEntity.ok(response);
    }

    /**
     * Extract JWT token from request header
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}