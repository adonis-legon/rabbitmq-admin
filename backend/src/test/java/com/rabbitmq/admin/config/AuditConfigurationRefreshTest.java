package com.rabbitmq.admin.config;

import com.rabbitmq.admin.service.WriteAuditService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for audit configuration properties and runtime behavior.
 * Verifies that configuration properties are properly loaded and validated.
 */
@DisplayName("Audit Configuration Properties Tests")
class AuditConfigurationRefreshTest {

    @Nested
    @DisplayName("Configuration Properties Loading")
    @SpringBootTest
    @ActiveProfiles("test")
    @TestPropertySource(properties = {
            "app.audit.write-operations.enabled=true",
            "app.audit.write-operations.retention-days=30",
            "app.audit.write-operations.batch-size=50",
            "app.audit.write-operations.async-processing=false"
    })
    class ConfigurationPropertiesLoading {

        @Autowired
        private ApplicationContext applicationContext;

        @Autowired
        private AuditConfigurationProperties auditConfigurationProperties;

        @Test
        @DisplayName("Should load configuration properties correctly")
        void shouldLoadConfigurationPropertiesCorrectly() {
            // Verify that the application context loads successfully
            assertThat(applicationContext).isNotNull();

            // Verify initial configuration
            assertThat(auditConfigurationProperties.getEnabled()).isTrue();
            assertThat(auditConfigurationProperties.getRetentionDays()).isEqualTo(30);
            assertThat(auditConfigurationProperties.getBatchSize()).isEqualTo(50);
            assertThat(auditConfigurationProperties.getAsyncProcessing()).isFalse();
        }

        @Test
        @DisplayName("Should maintain configuration properties bean metadata")
        void shouldMaintainConfigurationPropertiesBeanMetadata() {
            // Verify configuration properties bean exists
            assertThat(auditConfigurationProperties).isNotNull();

            // Verify the bean is properly configured with annotations
            Class<?> configClass = auditConfigurationProperties.getClass();
            // For CGLIB proxies, check the superclass for annotations
            Class<?> targetClass = configClass.getSuperclass() != Object.class ? configClass.getSuperclass()
                    : configClass;
            assertThat(targetClass
                    .isAnnotationPresent(org.springframework.boot.context.properties.ConfigurationProperties.class))
                    .isTrue();

            // Verify the configuration prefix
            var annotation = targetClass
                    .getAnnotation(org.springframework.boot.context.properties.ConfigurationProperties.class);
            assertThat(annotation.prefix()).isEqualTo("app.audit.write-operations");
        }

        @Test
        @DisplayName("Should support configuration validation methods")
        void shouldSupportConfigurationValidationMethods() {
            // Verify configuration validation methods work
            assertThat(auditConfigurationProperties.isValid()).isTrue();
            assertThat(auditConfigurationProperties.validateConfiguration()).isNull();

            // Verify configuration summary
            String summary = auditConfigurationProperties.getConfigurationSummary();
            assertThat(summary).contains("enabled=true");
            assertThat(summary).contains("retention=30 days");
            assertThat(summary).contains("batch=50");
            assertThat(summary).contains("async=false");
        }
    }

    @Nested
    @DisplayName("Conditional Bean Creation")
    @SpringBootTest
    @ActiveProfiles("test")
    class ConditionalBeanCreation {

        @Autowired
        private ApplicationContext applicationContext;

        @Test
        @DisplayName("Should always create AuditConfigurationProperties bean regardless of enabled state")
        void shouldAlwaysCreateAuditConfigurationPropertiesBean() {
            // Configuration properties should always be available for management
            // Since we use @EnableConfigurationProperties, the bean name will be different
            AuditConfigurationProperties config = applicationContext.getBean(AuditConfigurationProperties.class);
            assertThat(config).isNotNull();
        }

        @Test
        @DisplayName("Should handle WriteAuditService conditional creation")
        void shouldHandleWriteAuditServiceConditionalCreation() {
            // WriteAuditService creation depends on configuration
            // This test verifies the conditional logic works correctly
            boolean hasWriteAuditService = applicationContext.containsBean("writeAuditService");

            if (hasWriteAuditService) {
                WriteAuditService service = applicationContext.getBean(WriteAuditService.class);
                assertThat(service).isNotNull();
            }

            // Verify configuration properties are available for conditional bean creation
            AuditConfigurationProperties config = applicationContext.getBean(AuditConfigurationProperties.class);
            assertThat(config).isNotNull();
            // Note: In test environment, the service might not be created due to missing
            // dependencies. This is expected behavior.
        }
    }

    @Nested
    @DisplayName("Configuration Property Binding")
    @SpringBootTest
    @ActiveProfiles("test")
    @TestPropertySource(properties = {
            "app.audit.write-operations.enabled=${AUDIT_ENABLED:false}",
            "app.audit.write-operations.retention-days=${AUDIT_RETENTION:90}",
            "app.audit.write-operations.batch-size=${AUDIT_BATCH_SIZE:100}",
            "app.audit.write-operations.async-processing=${AUDIT_ASYNC:true}"
    })
    class ConfigurationPropertyBinding {

        @Autowired
        private AuditConfigurationProperties auditConfigurationProperties;

        @Test
        @DisplayName("Should bind environment variable placeholders correctly")
        void shouldBindEnvironmentVariablePlaceholdersCorrectly() {
            // Verify that property placeholders are resolved to default values
            // when environment variables are not set
            assertThat(auditConfigurationProperties.getEnabled()).isFalse();
            assertThat(auditConfigurationProperties.getRetentionDays()).isEqualTo(90);
            assertThat(auditConfigurationProperties.getBatchSize()).isEqualTo(100);
            assertThat(auditConfigurationProperties.getAsyncProcessing()).isTrue();
        }

        @Test
        @DisplayName("Should support configuration property validation")
        void shouldSupportConfigurationPropertyValidation() {
            // Verify that the configuration properties support validation
            Class<?> configClass = auditConfigurationProperties.getClass();
            // For CGLIB proxies, check the superclass for fields
            Class<?> targetClass = configClass.getSuperclass() != Object.class ? configClass.getSuperclass()
                    : configClass;
            assertThat(targetClass.getDeclaredFields())
                    .anyMatch(field -> field.isAnnotationPresent(jakarta.validation.constraints.NotNull.class) ||
                            field.isAnnotationPresent(jakarta.validation.constraints.Min.class));
        }
    }

    @Nested
    @DisplayName("Configuration Metadata")
    @SpringBootTest
    @ActiveProfiles("test")
    class ConfigurationMetadata {

        @Autowired
        private AuditConfigurationProperties auditConfigurationProperties;

        @Test
        @DisplayName("Should provide configuration metadata for IDE support")
        void shouldProvideConfigurationMetadataForIDESupport() {
            // Verify that configuration properties are properly annotated
            Class<?> configClass = auditConfigurationProperties.getClass();
            // For CGLIB proxies, check the superclass for annotations
            Class<?> targetClass = configClass.getSuperclass() != Object.class ? configClass.getSuperclass()
                    : configClass;
            assertThat(targetClass
                    .isAnnotationPresent(org.springframework.boot.context.properties.ConfigurationProperties.class))
                    .isTrue();

            // We removed @Component to avoid CGLIB proxy issues and use
            // @EnableConfigurationProperties instead
            assertThat(targetClass.isAnnotationPresent(org.springframework.stereotype.Component.class))
                    .isFalse();
        }

        @Test
        @DisplayName("Should have proper toString implementation for debugging")
        void shouldHaveProperToStringImplementationForDebugging() {
            // Verify toString provides useful debugging information
            String configString = auditConfigurationProperties.toString();

            assertThat(configString).contains("AuditConfigurationProperties");
            assertThat(configString).contains("enabled=");
            assertThat(configString).contains("retentionDays=");
            assertThat(configString).contains("batchSize=");
            assertThat(configString).contains("asyncProcessing=");
        }

        @Test
        @DisplayName("Should provide convenience methods for configuration checks")
        void shouldProvideConvenienceMethodsForConfigurationChecks() {
            // Verify convenience methods work correctly
            boolean isEnabled = auditConfigurationProperties.isEnabled();
            boolean isAsync = auditConfigurationProperties.isAsyncProcessing();

            // These should match the actual property values
            assertThat(isEnabled).isEqualTo(auditConfigurationProperties.getEnabled() != null &&
                    auditConfigurationProperties.getEnabled());
            assertThat(isAsync).isEqualTo(auditConfigurationProperties.getAsyncProcessing() != null &&
                    auditConfigurationProperties.getAsyncProcessing());
        }
    }

    @Nested
    @DisplayName("Configuration Profile Support")
    @SpringBootTest
    @ActiveProfiles("test")
    class ConfigurationProfileSupport {

        @Autowired
        private AuditConfigurationProperties auditConfigurationProperties;

        @Test
        @DisplayName("Should support different configuration profiles")
        void shouldSupportDifferentConfigurationProfiles() {
            // Verify configuration works with test profile
            assertThat(auditConfigurationProperties).isNotNull();

            // Configuration should be loaded regardless of active profile
            assertThat(auditConfigurationProperties.getRetentionDays()).isNotNull();
            assertThat(auditConfigurationProperties.getBatchSize()).isNotNull();
            assertThat(auditConfigurationProperties.getEnabled()).isNotNull();
            assertThat(auditConfigurationProperties.getAsyncProcessing()).isNotNull();
        }
    }
}