package com.rabbitmq.admin.config;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Comprehensive validation tests for AuditConfigurationProperties.
 * Tests all validation constraints and edge cases for audit configuration.
 */
@DisplayName("Audit Configuration Validation Tests")
class AuditConfigurationValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Nested
    @DisplayName("Enabled Property Validation")
    class EnabledPropertyValidation {

        @Test
        @DisplayName("Should pass validation when enabled is true")
        void shouldPassValidation_WhenEnabledIsTrue() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setEnabled(true);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Should pass validation when enabled is false")
        void shouldPassValidation_WhenEnabledIsFalse() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setEnabled(false);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Should fail validation when enabled is null")
        void shouldFailValidation_WhenEnabledIsNull() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setEnabled(null);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).hasSize(1);
            ConstraintViolation<AuditConfigurationProperties> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("enabled");
            assertThat(violation.getMessage()).contains("must not be null");
        }
    }

    @Nested
    @DisplayName("Retention Days Validation")
    class RetentionDaysValidation {

        @ParameterizedTest
        @ValueSource(ints = { 1, 7, 30, 90, 365, 1000 })
        @DisplayName("Should pass validation for valid retention days")
        void shouldPassValidation_ForValidRetentionDays(int retentionDays) {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setRetentionDays(retentionDays);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }

        @ParameterizedTest
        @ValueSource(ints = { 0, -1, -10, -100 })
        @DisplayName("Should fail validation for invalid retention days")
        void shouldFailValidation_ForInvalidRetentionDays(int retentionDays) {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setRetentionDays(retentionDays);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).hasSize(1);
            ConstraintViolation<AuditConfigurationProperties> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("retentionDays");
            assertThat(violation.getMessage()).isEqualTo(
                    "Retention days must be at least 1. Consider using 7 days for development or 90+ days for production.");
        }

        @Test
        @DisplayName("Should pass validation when retention days is null (uses default)")
        void shouldPassValidation_WhenRetentionDaysIsNull() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setRetentionDays(null);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }
    }

    @Nested
    @DisplayName("Batch Size Validation")
    class BatchSizeValidation {

        @ParameterizedTest
        @ValueSource(ints = { 1, 10, 50, 100, 500, 1000 })
        @DisplayName("Should pass validation for valid batch sizes")
        void shouldPassValidation_ForValidBatchSizes(int batchSize) {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setBatchSize(batchSize);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }

        @ParameterizedTest
        @ValueSource(ints = { 0, -1, -10, -100 })
        @DisplayName("Should fail validation for invalid batch sizes")
        void shouldFailValidation_ForInvalidBatchSizes(int batchSize) {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setBatchSize(batchSize);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).hasSize(1);
            ConstraintViolation<AuditConfigurationProperties> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("batchSize");
            assertThat(violation.getMessage()).isEqualTo(
                    "Batch size must be at least 1. Consider using 10 for development or 100+ for production.");
        }

        @Test
        @DisplayName("Should pass validation when batch size is null (uses default)")
        void shouldPassValidation_WhenBatchSizeIsNull() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setBatchSize(null);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }
    }

    @Nested
    @DisplayName("Async Processing Validation")
    class AsyncProcessingValidation {

        @Test
        @DisplayName("Should pass validation when async processing is true")
        void shouldPassValidation_WhenAsyncProcessingIsTrue() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setAsyncProcessing(true);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Should pass validation when async processing is false")
        void shouldPassValidation_WhenAsyncProcessingIsFalse() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setAsyncProcessing(false);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Should fail validation when async processing is null")
        void shouldFailValidation_WhenAsyncProcessingIsNull() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setAsyncProcessing(null);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).hasSize(1);
            ConstraintViolation<AuditConfigurationProperties> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("asyncProcessing");
            assertThat(violation.getMessage()).contains("must not be null");
        }
    }

    @Nested
    @DisplayName("Multiple Validation Errors")
    class MultipleValidationErrors {

        @Test
        @DisplayName("Should report all validation errors when multiple properties are invalid")
        void shouldReportAllValidationErrors_WhenMultiplePropertiesAreInvalid() {
            // Given
            AuditConfigurationProperties config = new AuditConfigurationProperties();
            config.setEnabled(null);
            config.setRetentionDays(-1);
            config.setBatchSize(0);
            config.setAsyncProcessing(null);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).hasSize(4);

            // Verify all expected property paths are present
            Set<String> propertyPaths = violations.stream()
                    .map(v -> v.getPropertyPath().toString())
                    .collect(java.util.stream.Collectors.toSet());

            assertThat(propertyPaths).containsExactlyInAnyOrder(
                    "enabled", "retentionDays", "batchSize", "asyncProcessing");
        }

        @Test
        @DisplayName("Should pass validation when all properties are valid")
        void shouldPassValidation_WhenAllPropertiesAreValid() {
            // Given
            AuditConfigurationProperties config = createValidConfig();

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }
    }

    @Nested
    @DisplayName("Edge Cases and Boundary Values")
    class EdgeCasesAndBoundaryValues {

        @Test
        @DisplayName("Should fail validation for excessive retention days")
        void shouldFailValidation_ForExcessiveRetentionDays() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setRetentionDays(Integer.MAX_VALUE);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).hasSize(1);
            ConstraintViolation<AuditConfigurationProperties> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("retentionDays");
            assertThat(violation.getMessage()).isEqualTo(
                    "Retention days cannot exceed 36500 (100 years). Consider using a reasonable value like 365 days.");
        }

        @Test
        @DisplayName("Should fail validation for excessive batch size")
        void shouldFailValidation_ForExcessiveBatchSize() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setBatchSize(Integer.MAX_VALUE);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).hasSize(1);
            ConstraintViolation<AuditConfigurationProperties> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("batchSize");
            assertThat(violation.getMessage()).isEqualTo(
                    "Batch size cannot exceed 10000. Consider using a smaller value like 1000 for better memory management.");
        }

        @Test
        @DisplayName("Should handle maximum allowed retention days")
        void shouldHandleMaximumAllowedRetentionDays() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setRetentionDays(36500); // Maximum allowed value

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Should handle maximum allowed batch size")
        void shouldHandleMaximumAllowedBatchSize() {
            // Given
            AuditConfigurationProperties config = createValidConfig();
            config.setBatchSize(10000); // Maximum allowed value

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Should handle minimum valid values")
        void shouldHandleMinimumValidValues() {
            // Given
            AuditConfigurationProperties config = new AuditConfigurationProperties();
            config.setEnabled(false);
            config.setRetentionDays(1);
            config.setBatchSize(1);
            config.setAsyncProcessing(false);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }
    }

    @Nested
    @DisplayName("Configuration Scenarios")
    class ConfigurationScenarios {

        @Test
        @DisplayName("Should validate production-like configuration")
        void shouldValidateProductionLikeConfiguration() {
            // Given - Production configuration
            AuditConfigurationProperties config = new AuditConfigurationProperties();
            config.setEnabled(true);
            config.setRetentionDays(365); // 1 year retention
            config.setBatchSize(500); // Larger batch for performance
            config.setAsyncProcessing(true); // Async for performance

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Should validate development configuration")
        void shouldValidateDevelopmentConfiguration() {
            // Given - Development configuration
            AuditConfigurationProperties config = new AuditConfigurationProperties();
            config.setEnabled(true);
            config.setRetentionDays(7); // Short retention for dev
            config.setBatchSize(10); // Small batch for debugging
            config.setAsyncProcessing(false); // Sync for easier debugging

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Should validate disabled audit configuration")
        void shouldValidateDisabledAuditConfiguration() {
            // Given - Disabled audit configuration
            AuditConfigurationProperties config = new AuditConfigurationProperties();
            config.setEnabled(false);
            config.setRetentionDays(90); // Default values still valid
            config.setBatchSize(100);
            config.setAsyncProcessing(true);

            // When
            Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

            // Then
            assertThat(violations).isEmpty();
        }
    }

    /**
     * Creates a valid configuration for testing
     */
    private AuditConfigurationProperties createValidConfig() {
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setEnabled(true);
        config.setRetentionDays(90);
        config.setBatchSize(100);
        config.setAsyncProcessing(true);
        return config;
    }
}