package com.rabbitmq.admin.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for user security settings.
 */
@Component
@ConfigurationProperties(prefix = "app.security.user-locking")
public class UserSecurityProperties {

    /**
     * Whether user locking is enabled
     */
    private boolean enabled = true;

    /**
     * Maximum number of failed login attempts before locking the user
     */
    private int maxFailedAttempts = 3;

    /**
     * Auto-unlock time in minutes (0 means manual unlock only)
     */
    private int autoUnlockMinutes = 0;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getMaxFailedAttempts() {
        return maxFailedAttempts;
    }

    public void setMaxFailedAttempts(int maxFailedAttempts) {
        this.maxFailedAttempts = maxFailedAttempts;
    }

    public int getAutoUnlockMinutes() {
        return autoUnlockMinutes;
    }

    public void setAutoUnlockMinutes(int autoUnlockMinutes) {
        this.autoUnlockMinutes = autoUnlockMinutes;
    }

    @Override
    public String toString() {
        return "UserSecurityProperties{" +
                "enabled=" + enabled +
                ", maxFailedAttempts=" + maxFailedAttempts +
                ", autoUnlockMinutes=" + autoUnlockMinutes +
                '}';
    }
}