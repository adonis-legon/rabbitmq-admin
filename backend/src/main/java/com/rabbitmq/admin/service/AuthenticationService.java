package com.rabbitmq.admin.service;

import com.rabbitmq.admin.config.UserSecurityProperties;
import com.rabbitmq.admin.dto.JwtAuthenticationResponse;
import com.rabbitmq.admin.dto.LoginRequest;
import com.rabbitmq.admin.dto.RefreshTokenRequest;
import com.rabbitmq.admin.dto.UserInfo;
import com.rabbitmq.admin.exception.LoginAttemptsExceededException;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.repository.UserRepository;
import com.rabbitmq.admin.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for handling authentication operations including login, logout, and
 * token refresh.
 */
@Service
public class AuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSecurityProperties userSecurityProperties;

    /**
     * Authenticate user and generate JWT tokens
     */
    @org.springframework.transaction.annotation.Transactional(noRollbackFor = { LoginAttemptsExceededException.class,
            LockedException.class })
    public JwtAuthenticationResponse login(LoginRequest loginRequest) {
        // Get user first to check if locked
        User user = userRepository.findByUsernameIgnoreCase(loginRequest.getUsername())
                .orElse(null);

        // Check if user locking is enabled and user exists
        if (userSecurityProperties.isEnabled() && user != null) {
            // Check if user is locked
            if (user.isLocked()) {
                // Check for auto-unlock
                if (userSecurityProperties.getAutoUnlockMinutes() > 0 && user.getLockedAt() != null) {
                    LocalDateTime unlockTime = user.getLockedAt()
                            .plusMinutes(userSecurityProperties.getAutoUnlockMinutes());
                    if (LocalDateTime.now().isAfter(unlockTime)) {
                        // Auto-unlock the user
                        user.unlockUser();
                        userRepository.save(user);
                        logger.info("User {} auto-unlocked after {} minutes", user.getUsername(),
                                userSecurityProperties.getAutoUnlockMinutes());
                    } else {
                        logger.warn("Login attempt for locked user: {}", loginRequest.getUsername());
                        throw new LockedException("Account is locked. Please contact an administrator.");
                    }
                } else {
                    logger.warn("Login attempt for locked user: {}", loginRequest.getUsername());
                    throw new LockedException("Account is locked. Please contact an administrator.");
                }
            }
        }

        try {
            // Authenticate user credentials
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()));

            // Reset failed attempts and unlock user on successful login
            if (userSecurityProperties.isEnabled() && user != null) {
                user.resetFailedLoginAttempts();
                user.unlockUser(); // Also unlock the user on successful authentication
                userRepository.save(user);
            }

            // Re-fetch user if it was null (shouldn't happen after successful auth)
            if (user == null) {
                user = userRepository.findByUsernameIgnoreCase(loginRequest.getUsername())
                        .orElseThrow(() -> new BadCredentialsException("User not found"));
            }

            // Generate tokens
            String accessToken = tokenProvider.generateToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(user);

            logger.info("User {} successfully authenticated", user.getUsername());

            return new JwtAuthenticationResponse(
                    accessToken,
                    refreshToken,
                    UserInfo.fromUser(user));

        } catch (AuthenticationException e) {
            // Handle failed login attempt - update user attempts and save in same
            // transaction
            if (userSecurityProperties.isEnabled() && user != null && !user.isLocked()) {
                // Increment failed attempts
                user.incrementFailedLoginAttempts();

                // Check if user should be locked
                if (user.getFailedLoginAttempts() >= userSecurityProperties.getMaxFailedAttempts()) {
                    user.lockUser();
                    userRepository.save(user);
                    logger.warn("User {} locked after {} failed login attempts", user.getUsername(),
                            user.getFailedLoginAttempts());
                    throw new LockedException(
                            "Account is locked due to too many failed login attempts. Please contact an administrator.");
                } else {
                    // Save the updated attempt count
                    userRepository.save(user);

                    logger.warn("Failed login attempt for user: {} (attempt {}/{})",
                            user.getUsername(), user.getFailedLoginAttempts(),
                            userSecurityProperties.getMaxFailedAttempts());

                    // Provide detailed information about remaining attempts
                    int remainingAttempts = userSecurityProperties.getMaxFailedAttempts()
                            - user.getFailedLoginAttempts();
                    String message = remainingAttempts == 1
                            ? "Invalid username or password. Warning: You have 1 attempt remaining before your account is locked."
                            : String.format(
                                    "Invalid username or password. Warning: You have %d attempts remaining before your account is locked.",
                                    remainingAttempts);

                    throw new LoginAttemptsExceededException(message,
                            user.getFailedLoginAttempts(),
                            userSecurityProperties.getMaxFailedAttempts());
                }
            }

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