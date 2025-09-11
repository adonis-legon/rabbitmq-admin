package com.rabbitmq.admin.service;

import com.rabbitmq.admin.model.VersionInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class VersionService {

    @Value("${app.version:unknown}")
    private String version;

    @Value("${app.build.timestamp:unknown}")
    private String buildTimestamp;

    @Value("${app.name:RabbitMQ Admin}")
    private String name;

    @Value("${app.description:RabbitMQ Admin Dashboard}")
    private String description;

    public VersionInfo getVersionInfo() {
        return new VersionInfo(
                version,
                buildTimestamp,
                name,
                description,
                version.contains("SNAPSHOT"));
    }
}