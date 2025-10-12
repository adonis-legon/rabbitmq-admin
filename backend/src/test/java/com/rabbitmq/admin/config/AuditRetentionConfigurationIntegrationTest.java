package com.rabbitmq.admin.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test to verify AuditRetentionConfigurationProperties are properly
 * loaded
 * by Spring Boot
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.audit.retention.enabled=true",
        "app.audit.retention.days=30",
        "app.audit.retention.clean-schedule=0 0 2 * * ?"
})
class AuditRetentionConfigurationIntegrationTest {

    @Autowired
    private AuditRetentionConfigurationProperties auditRetentionConfigurationProperties;

    @Test
    void auditRetentionConfigurationProperties_ShouldBeLoadedCorrectly() {
        // Verify that the configuration properties are properly loaded
        assertThat(auditRetentionConfigurationProperties).isNotNull();
        assertThat(auditRetentionConfigurationProperties.getEnabled()).isTrue();
        assertThat(auditRetentionConfigurationProperties.getDays()).isEqualTo(30);
        assertThat(auditRetentionConfigurationProperties.getCleanSchedule()).isEqualTo("0 0 2 * * ?");
    }

    @Test
    void auditRetentionConfigurationProperties_ConvenienceMethods_ShouldWork() {
        // Test convenience methods
        assertThat(auditRetentionConfigurationProperties.isEnabled()).isTrue();
        assertThat(auditRetentionConfigurationProperties.isValid()).isTrue();
        assertThat(auditRetentionConfigurationProperties.getConfigurationSummary())
                .contains("enabled=true")
                .contains("days=30")
                .contains("schedule='0 0 2 * * ?'");
    }
}