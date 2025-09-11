package com.rabbitmq.admin.service;

import com.rabbitmq.admin.dto.JwtAuthenticationResponse;
import com.rabbitmq.admin.dto.LoginRequest;
import com.rabbitmq.admin.dto.RefreshTokenRequest;
import com.rabbitmq.admin.dto.UserInfo;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.repository.UserRepository;
import com.rabbitmq.admin.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for handling authentication operations including login, logout, and
 * token refresh.
 */
@Service
@Transactional
public class AuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    /**
     * Authenticate user and generate JWT tokens
     */
    public JwtAuthenticationResponse login(LoginRequest loginRequest) {
        try {
            // Authenticate user credentials
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()));

            // Get user from database
            User user = userRepository.findByUsernameIgnoreCase(loginRequest.getUsername())
                    .orElseThrow(() -> new BadCredentialsException("User not found"));

            // Generate tokens
            String accessToken = tokenProvider.generateToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(user);

            logger.info("User {} successfully authenticated", user.getUsername());

            return new JwtAuthenticationResponse(
                    accessToken,
                    refreshToken,
                    UserInfo.fromUser(user));

        } catch (AuthenticationException e) {
            logger.warn("Authentication failed for user: {}", loginRequest.getUsername());
            throw new BadCredentialsException("Invalid username or password");
        }
    }

    /**
     * Refresh access token using refresh token
     */
    public JwtAuthenticationResponse refreshToken(RefreshTokenRequest refreshTokenRequest) {
        String refreshToken = refreshTokenRequest.getRefreshToken();

        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        if (!tokenProvider.isRefreshToken(refreshToken)) {
            throw new BadCredentialsException("Token is not a refresh token");
        }

        // Get user from refresh token
        String userId = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        // Generate new tokens
        String newAccessToken = tokenProvider.generateTokenFromUser(user);
        String newRefreshToken = tokenProvider.generateRefreshToken(user);

        logger.info("Tokens refreshed for user: {}", user.getUsername());

        return new JwtAuthenticationResponse(
                newAccessToken,
                newRefreshToken,
                UserInfo.fromUser(user));
    }

    /**
     * Get current user information from token
     */
    public UserInfo getCurrentUser(String token) {
        if (!tokenProvider.validateToken(token)) {
            throw new BadCredentialsException("Invalid token");
        }

        String userId = tokenProvider.getUserIdFromToken(token);
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        return UserInfo.fromUser(user);
    }

    /**
     * Logout user (in a stateless JWT system, this is mainly for logging purposes)
     */
    public void logout(String username) {
        logger.info("User {} logged out", username);
        // In a stateless JWT system, logout is handled client-side by removing the
        // token
        // Here we just log the event for audit purposes
    }

    /**
     * Validate if a token is still valid and not expired
     */
    public boolean isTokenValid(String token) {
        return tokenProvider.validateToken(token) && !tokenProvider.isTokenExpired(token);
    }

    /**
     * Get remaining time until token expires (in milliseconds)
     */
    public long getTokenExpirationTime(String token) {
        if (!tokenProvider.validateToken(token)) {
            return 0;
        }
        return tokenProvider.getTimeUntilExpiration(token);
    }
}