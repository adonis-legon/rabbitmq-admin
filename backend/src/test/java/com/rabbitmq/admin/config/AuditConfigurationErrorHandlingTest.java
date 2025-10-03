package com.rabbitmq.admin.config;

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
 * Tests for audit configuration error handling and misconfiguration scenarios.
 * Verifies proper error messages and graceful handling of invalid
 * configurations.
 */
@DisplayName("Audit Configuration Error Handling Tests")
class AuditConfigurationErrorHandlingTest {

    @Nested
    @DisplayName("Valid Configuration Loading")
    @SpringBootTest
    @ActiveProfiles("test")
    @TestPropertySource(properties = {
            "app.audit.write-operations.enabled=true",
            "app.audit.write-operations.retention-days=30",
            "app.audit.write-operations.batch-size=50",
            "app.audit.write-operations.async-processing=false"
    })
    class ValidConfigurationLoading {

        @Autowired
        private ApplicationContext applicationContext;

        @Autowired
        private AuditConfigurationProperties auditConfigurationProperties;

        @Test
        @DisplayName("Should load valid configuration successfully")
        void shouldLoadValidConfigurationSuccessfully() {
            // Verify application context loads successfully
            assertThat(applicationContext).isNotNull();

            // Verify configuration properties are loaded correctly
            assertThat(auditConfigurationProperties).isNotNull();
            assertThat(auditConfigurationProperties.getEnabled()).isTrue();
            assertThat(auditConfigurationProperties.getRetentionDays()).isEqualTo(30);
            assertThat(auditConfigurationProperties.getBatchSize()).isEqualTo(50);
            assertThat(auditConfigurationProperties.getAsyncProcessing()).isFalse();
        }
    }

    @Nested
    @DisplayName("Default Configuration Loading")
    @SpringBootTest
    @ActiveProfiles("test")
    class DefaultConfigurationLoading {

        @Autowired
        private AuditConfigurationProperties auditConfigurationProperties;

        @Test
        @DisplayName("Should load default configuration when no properties are specified")
        void shouldLoadDefaultConfigurationWhenNoPropertiesSpecified() {
            // Verify default values are loaded
            assertThat(auditConfigurationProperties).isNotNull();
            assertThat(auditConfigurationProperties.getEnabled()).isFalse();
            assertThat(auditConfigurationProperties.getRetentionDays()).isEqualTo(90);
            assertThat(auditConfigurationProperties.getBatchSize()).isEqualTo(100);
            assertThat(auditConfigurationProperties.getAsyncProcessing()).isTrue();
        }
    }

    @Nested
    @DisplayName("Environment Variable Configuration")
    @SpringBootTest
    @ActiveProfiles("test")
    @TestPropertySource(properties = {
            "app.audit.write-operations.enabled=${AUDIT_WRITE_OPERATIONS_ENABLED:true}",
            "app.audit.write-operations.retention-days=${AUDIT_RETENTION_DAYS:60}",
            "app.audit.write-operations.batch-size=${AUDIT_BATCH_SIZE:200}",
            "app.audit.write-operations.async-processing=${AUDIT_ASYNC_PROCESSING:false}"
    })
    class EnvironmentVariableConfiguration {

        @Autowired
        private AuditConfigurationProperties auditConfigurationProperties;

        @Test
        @DisplayName("Should use default values when environment variables are not set")
        void shouldUseDefaultValuesWhenEnvironmentVariablesNotSet() {
            // Verify default values from property placeholders are used
            assertThat(auditConfigurationProperties).isNotNull();
            assertThat(auditConfigurationProperties.getEnabled()).isTrue();
            assertThat(auditConfigurationProperties.getRetentionDays()).isEqualTo(60);
            assertThat(auditConfigurationProperties.getBatchSize()).isEqualTo(200);
            assertThat(auditConfigurationProperties.getAsyncProcessing()).isFalse();
        }
    }

    @Nested
    @DisplayName("Partial Configuration")
    @SpringBootTest
    @ActiveProfiles("test")
    @TestPropertySource(properties = {
            "app.audit.write-operations.enabled=true",
            "app.audit.write-operations.retention-days=45"
    // batch-size and async-processing not specified - should use defaults
    })
    class PartialConfiguration {

        @Autowired
        private AuditConfigurationProperties auditConfigurationProperties;

        @Test
        @DisplayName("Should use defaults for unspecified properties")
        void shouldUseDefaultsForUnspecifiedProperties() {
            // Verify specified properties are loaded
            assertThat(auditConfigurationProperties.getEnabled()).isTrue();
            assertThat(auditConfigurationProperties.getRetentionDays()).isEqualTo(45);

            // Verify unspecified properties use defaults
            assertThat(auditConfigurationProperties.getBatchSize()).isEqualTo(100);
            assertThat(auditConfigurationProperties.getAsyncProcessing()).isTrue();
        }
    }

    @Nested
    @DisplayName("Configuration Validation Messages")
    class ConfigurationValidationMessages {

        @Test
        @DisplayName("Should provide clear error message for invalid retention days")
        void shouldProvideErrorMessageForInvalidRetentionDays() {
            // Given
            AuditConfigurationProperties config = new AuditConfigurationProperties();
            config.setRetentionDays(-5);

            // When/Then
            jakarta.validation.ValidatorFactory factory = jakarta.validation.Validation.buildDefaultValidatorFactory();
            jakarta.validation.Validator validator = factory.getValidator();
            var violations = validator.validate(config);

            assertThat(violations).hasSize(1);
            var violation = violations.iterator().next();
            assertThat(violation.getMessage()).isEqualTo(
                    "Retention days must be at least 1. Consider using 7 days for development or 90+ days for production.");
            assertThat(violation.getPropertyPath().toString()).isEqualTo("retentionDays");
        }

        @Test
        @DisplayName("Should provide clear error message for invalid batch size")
        void shouldProvideErrorMessageForInvalidBatchSize() {
            // Given
            AuditConfigurationProperties config = new AuditConfigurationProperties();
            config.setBatchSize(0);

            // When/Then
            jakarta.validation.ValidatorFactory factory = jakarta.validation.Validation.buildDefaultValidatorFactory();
            jakarta.validation.Validator validator = factory.getValidator();
            var violations = validator.validate(config);

            assertThat(violations).hasSize(1);
            var violation = violations.iterator().next();
            assertThat(violation.getMessage()).isEqualTo(
                    "Batch size must be at least 1. Consider using 10 for development or 100+ for production.");
            assertThat(violation.getPropertyPath().toString()).isEqualTo("batchSize");
        }

        @Test
        @DisplayName("Should provide clear error message for null enabled property")
        void shouldProvideErrorMessageForNullEnabledProperty() {
            // Given
            AuditConfigurationProperties config = new AuditConfigurationProperties();
            config.setEnabled(null);

            // When/Then
            jakarta.validation.ValidatorFactory factory = jakarta.validation.Validation.buildDefaultValidatorFactory();
            jakarta.validation.Validator validator = factory.getValidator();
            var violations = validator.validate(config);

            assertThat(violations).hasSize(1);
            var violation = violations.iterator().next();
            assertThat(violation.getMessage()).contains("must not be null");
            assertThat(violation.getPropertyPath().toString()).isEqualTo("enabled");
        }

        @Test
        @DisplayName("Should provide clear error message for null async processing property")
        void shouldProvideErrorMessageForNullAsyncProcessingProperty() {
            // Given
            AuditConfigurationProperties config = new AuditConfigurationProperties();
            config.setAsyncProcessing(null);

            // When/Then
            jakarta.validation.ValidatorFactory factory = jakarta.validation.Validation.buildDefaultValidatorFactory();
            jakarta.validation.Validator validator = factory.getValidator();
            var violations = validator.validate(config);

            assertThat(violations).hasSize(1);
            var violation = violations.iterator().next();
            assertThat(violation.getMessage()).contains("must not be null");
            assertThat(violation.getPropertyPath().toString()).isEqualTo("asyncProcessing");
        }
    }

    @Nested
    @DisplayName("Configuration Boundary Testing")
    class ConfigurationBoundaryTesting {

        @Test
        @DisplayName("Should handle minimum valid values correctly")
        void shouldHandleMinimumValidValuesCorrectly() {
            // Given
            AuditConfigurationProperties config = new AuditConfigurationProperties();
            config.setEnabled(false);
            config.setRetentionDays(1);
            config.setBatchSize(1);
            config.setAsyncProcessing(false);

            // When/Then
            jakarta.validation.ValidatorFactory factory = jakarta.validation.Validation.buildDefaultValidatorFactory();
            jakarta.validation.Validator validator = factory.getValidator();
            var violations = validator.validate(config);

            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Should handle large valid values correctly")
        void shouldHandleLargeValidValuesCorrectly() {
            // Given
            AuditConfigurationProperties config = new AuditConfigurationProperties();
            config.setEnabled(true);
            config.setRetentionDays(10000);
            config.setBatchSize(10000);
            config.setAsyncProcessing(true);

            // When/Then
            jakarta.validation.ValidatorFactory factory = jakarta.validation.Validation.buildDefaultValidatorFactory();
            jakarta.validation.Validator validator = factory.getValidator();
            var violations = validator.validate(config);

            assertThat(violations).isEmpty();
        }
    }

    @Nested
    @DisplayName("Configuration Consistency")
    class ConfigurationConsistency {

        @Test
        @DisplayName("Should maintain configuration consistency across multiple instances")
        void shouldMaintainConfigurationConsistencyAcrossMultipleInstances() {
            // Given
            AuditConfigurationProperties config1 = new AuditConfigurationProperties(true, 30, 50, false);
            AuditConfigurationProperties config2 = new AuditConfigurationProperties(true, 30, 50, false);

            // When/Then
            assertThat(config1.getEnabled()).isEqualTo(config2.getEnabled());
            assertThat(config1.getRetentionDays()).isEqualTo(config2.getRetentionDays());
            assertThat(config1.getBatchSize()).isEqualTo(config2.getBatchSize());
            assertThat(config1.getAsyncProcessing()).isEqualTo(config2.getAsyncProcessing());

            assertThat(config1.isEnabled()).isEqualTo(config2.isEnabled());
            assertThat(config1.isAsyncProcessing()).isEqualTo(config2.isAsyncProcessing());
        }

        @Test
        @DisplayName("Should handle configuration changes correctly")
        void shouldHandleConfigurationChangesCorrectly() {
            // Given
            AuditConfigurationProperties config = new AuditConfigurationProperties();

            // Initial state
            assertThat(config.getEnabled()).isFalse();
            assertThat(config.isEnabled()).isFalse();

            // When
            config.setEnabled(true);

            // Then
            assertThat(config.getEnabled()).isTrue();
            assertThat(config.isEnabled()).isTrue();

            // When
            config.setEnabled(false);

            // Then
            assertThat(config.getEnabled()).isFalse();
            assertThat(config.isEnabled()).isFalse();
        }
    }
}