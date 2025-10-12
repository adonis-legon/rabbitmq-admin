package com.rabbitmq.admin;

import com.rabbitmq.admin.config.AuditConfigurationProperties;
import com.rabbitmq.admin.config.AuditRetentionConfigurationProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAspectJAutoProxy
@EnableConfigurationProperties({ AuditConfigurationProperties.class, AuditRetentionConfigurationProperties.class })
@org.springframework.scheduling.annotation.EnableScheduling
public class RabbitMQAdminApplication {

    public static void main(String[] args) {
        // Allow encoded slashes in URLs for Tomcat
        System.setProperty("org.apache.tomcat.util.buf.UDecoder.ALLOW_ENCODED_SLASH", "true");
        System.setProperty("org.apache.catalina.connector.CoyoteAdapter.ALLOW_BACKSLASH", "true");

        SpringApplication.run(RabbitMQAdminApplication.class, args);
    }
}