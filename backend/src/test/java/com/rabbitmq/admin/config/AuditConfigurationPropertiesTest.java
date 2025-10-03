package com.rabbitmq.admin.config;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class AuditConfigurationPropertiesTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void defaultConstructor_SetsDefaultValues() {
        // When
        AuditConfigurationProperties config = new AuditConfigurationProperties();

        // Then
        assertThat(config.getEnabled()).isFalse();
        assertThat(config.getRetentionDays()).isEqualTo(90);
        assertThat(config.getBatchSize()).isEqualTo(100);
        assertThat(config.getAsyncProcessing()).isTrue();
    }

    @Test
    void constructor_WithAllFields_SetsAllValues() {
        // Given
        Boolean enabled = true;
        Integer retentionDays = 30;
        Integer batchSize = 50;
        Boolean asyncProcessing = false;

        // When
        AuditConfigurationProperties config = new AuditConfigurationProperties(
                enabled, retentionDays, batchSize, asyncProcessing);

        // Then
        assertThat(config.getEnabled()).isEqualTo(enabled);
        assertThat(config.getRetentionDays()).isEqualTo(retentionDays);
        assertThat(config.getBatchSize()).isEqualTo(batchSize);
        assertThat(config.getAsyncProcessing()).isEqualTo(asyncProcessing);
    }

    @Test
    void isEnabled_WithTrueValue_ReturnsTrue() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setEnabled(true);

        // When
        boolean result = config.isEnabled();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void isEnabled_WithFalseValue_ReturnsFalse() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setEnabled(false);

        // When
        boolean result = config.isEnabled();

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void isEnabled_WithNullValue_ReturnsFalse() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setEnabled(null);

        // When
        boolean result = config.isEnabled();

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void isAsyncProcessing_WithTrueValue_ReturnsTrue() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setAsyncProcessing(true);

        // When
        boolean result = config.isAsyncProcessing();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void isAsyncProcessing_WithFalseValue_ReturnsFalse() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setAsyncProcessing(false);

        // When
        boolean result = config.isAsyncProcessing();

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void isAsyncProcessing_WithNullValue_ReturnsFalse() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setAsyncProcessing(null);

        // When
        boolean result = config.isAsyncProcessing();

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void validation_WithValidValues_PassesValidation() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setEnabled(true);
        config.setRetentionDays(30);
        config.setBatchSize(50);
        config.setAsyncProcessing(true);

        // When
        Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    void validation_WithNullEnabled_FailsValidation() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setEnabled(null);

        // When
        Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getPropertyPath().toString()).isEqualTo("enabled");
    }

    @Test
    void validation_WithNullAsyncProcessing_FailsValidation() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setAsyncProcessing(null);

        // When
        Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getPropertyPath().toString()).isEqualTo("asyncProcessing");
    }

    @Test
    void validation_WithZeroRetentionDays_FailsValidation() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setRetentionDays(0);

        // When
        Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Retention days must be at least 1");
    }

    @Test
    void validation_WithNegativeRetentionDays_FailsValidation() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setRetentionDays(-1);

        // When
        Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Retention days must be at least 1");
    }

    @Test
    void validation_WithZeroBatchSize_FailsValidation() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setBatchSize(0);

        // When
        Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Batch size must be at least 1");
    }

    @Test
    void validation_WithNegativeBatchSize_FailsValidation() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();
        config.setBatchSize(-1);

        // When
        Set<ConstraintViolation<AuditConfigurationProperties>> violations = validator.validate(config);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Batch size must be at least 1");
    }

    @Test
    void validation_WithMinimumValidValues_PassesValidation() {
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

    @Test
    void toString_WithAllValues_ReturnsFormattedString() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties(
                true, 30, 50, false);

        // When
        String result = config.toString();

        // Then
        assertThat(result).contains("AuditConfigurationProperties{");
        assertThat(result).contains("enabled=true");
        assertThat(result).contains("retentionDays=30");
        assertThat(result).contains("batchSize=50");
        assertThat(result).contains("asyncProcessing=false");
    }

    @Test
    void settersAndGetters_WorkCorrectly() {
        // Given
        AuditConfigurationProperties config = new AuditConfigurationProperties();

        // When
        config.setEnabled(true);
        config.setRetentionDays(60);
        config.setBatchSize(200);
        config.setAsyncProcessing(false);

        // Then
        assertThat(config.getEnabled()).isTrue();
        assertThat(config.getRetentionDays()).isEqualTo(60);
        assertThat(config.getBatchSize()).isEqualTo(200);
        assertThat(config.getAsyncProcessing()).isFalse();
    }
}