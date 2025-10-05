package com.rabbitmq.admin.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test to verify AuditConfigurationProperties are properly loaded
 * by Spring Boot
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.audit.write-operations.enabled=true",
        "app.audit.write-operations.retention-days=30",
        "app.audit.write-operations.batch-size=50",
        "app.audit.write-operations.async-processing=false"
})
class AuditConfigurationIntegrationTest {

    @Autowired
    private AuditConfigurationProperties auditConfigurationProperties;

    @Test
    void auditConfigurationProperties_ShouldBeLoadedCorrectly() {
        // Verify that the configuration properties are properly loaded
        assertThat(auditConfigurationProperties).isNotNull();
        assertThat(auditConfigurationProperties.getEnabled()).isTrue();
        assertThat(auditConfigurationProperties.getRetentionDays()).isEqualTo(30);
        assertThat(auditConfigurationProperties.getBatchSize()).isEqualTo(50);
        assertThat(auditConfigurationProperties.getAsyncProcessing()).isFalse();
    }

    @Test
    void auditConfigurationProperties_ConvenienceMethods_ShouldWork() {
        // Test convenience methods
        assertThat(auditConfigurationProperties.isEnabled()).isTrue();
        assertThat(auditConfigurationProperties.isAsyncProcessing()).isFalse();
    }
}