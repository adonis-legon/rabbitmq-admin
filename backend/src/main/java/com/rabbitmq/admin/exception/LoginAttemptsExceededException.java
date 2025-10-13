package com.rabbitmq.admin.exception;

import org.springframework.security.authentication.BadCredentialsException;

/**
 * Exception thrown when a user has failed login attempts but is not yet locked.
 * Provides information about remaining attempts before account lockout.
 */
public class LoginAttemptsExceededException extends BadCredentialsException {

    private final int currentAttempts;
    private final int maxAttempts;
    private final int remainingAttempts;

    public LoginAttemptsExceededException(String message, int currentAttempts, int maxAttempts) {
        super(message);
        this.currentAttempts = currentAttempts;
        this.maxAttempts = maxAttempts;
        this.remainingAttempts = Math.max(0, maxAttempts - currentAttempts);
    }

    public int getCurrentAttempts() {
        return currentAttempts;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public int getRemainingAttempts() {
        return remainingAttempts;
    }
}