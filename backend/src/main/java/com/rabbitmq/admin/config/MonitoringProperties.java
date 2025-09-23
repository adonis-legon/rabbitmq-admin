package com.rabbitmq.admin.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for monitoring and performance settings.
 */
@Component
@ConfigurationProperties(prefix = "app.monitoring")
public class MonitoringProperties {

    private Performance performance = new Performance();
    private Health health = new Health();

    public Performance getPerformance() {
        return performance;
    }

    public void setPerformance(Performance performance) {
        this.performance = performance;
    }

    public Health getHealth() {
        return health;
    }

    public void setHealth(Health health) {
        this.health = health;
    }

    public static class Performance {
        /**
         * Threshold in milliseconds for considering an operation as slow.
         */
        private long slowThresholdMs = 2000;

        /**
         * Threshold in milliseconds for considering an operation as critically slow.
         */
        private long criticalThresholdMs = 5000;

        public long getSlowThresholdMs() {
            return slowThresholdMs;
        }

        public void setSlowThresholdMs(long slowThresholdMs) {
            this.slowThresholdMs = slowThresholdMs;
        }

        public long getCriticalThresholdMs() {
            return criticalThresholdMs;
        }

        public void setCriticalThresholdMs(long criticalThresholdMs) {
            this.criticalThresholdMs = criticalThresholdMs;
        }
    }

    public static class Health {
        /**
         * Interval in minutes for health checks.
         */
        private int checkIntervalMinutes = 2;

        /**
         * Timeout in seconds for health check operations.
         */
        private int timeoutSeconds = 10;

        public int getCheckIntervalMinutes() {
            return checkIntervalMinutes;
        }

        public void setCheckIntervalMinutes(int checkIntervalMinutes) {
            this.checkIntervalMinutes = checkIntervalMinutes;
        }

        public int getTimeoutSeconds() {
            return timeoutSeconds;
        }

        public void setTimeoutSeconds(int timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
        }
    }
}