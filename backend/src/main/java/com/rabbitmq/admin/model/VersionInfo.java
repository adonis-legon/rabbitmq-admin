package com.rabbitmq.admin.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public record VersionInfo(
        String version,
        String buildTimestamp,
        String name,
        String description,
        boolean isSnapshot) {
    public String getDisplayVersion() {
        return isSnapshot ? version.replace("-SNAPSHOT", "") + " (dev)" : version;
    }

    public String getShortVersion() {
        return version.replace("-SNAPSHOT", "");
    }

    public LocalDateTime getBuildDate() {
        try {
            return LocalDateTime.parse(buildTimestamp, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }
}