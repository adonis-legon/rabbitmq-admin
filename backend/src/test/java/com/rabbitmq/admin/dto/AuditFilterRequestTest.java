package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rabbitmq.admin.model.AuditOperationStatus;
import com.rabbitmq.admin.model.AuditOperationType;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class AuditFilterRequestTest {

    private Validator validator;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void constructor_WithAllFields_CreatesCompleteFilter() {
        // Given
        String username = "testuser";
        String clusterName = "test-cluster";
        AuditOperationType operationType = AuditOperationType.CREATE_EXCHANGE;
        AuditOperationStatus status = AuditOperationStatus.SUCCESS;
        String resourceName = "test.exchange";
        String resourceType = "exchange";
        Instant startTime = Instant.parse("2023-01-01T00:00:00Z");
        Instant endTime = Instant.parse("2023-12-31T23:59:59Z");

        // When
        AuditFilterRequest filter = new AuditFilterRequest(username, clusterName, operationType,
                status, resourceName, resourceType,
                startTime, endTime);

        // Then
        assertThat(filter.getUsername()).isEqualTo(username);
        assertThat(filter.getClusterName()).isEqualTo(clusterName);
        assertThat(filter.getOperationType()).isEqualTo(operationType);
        assertThat(filter.getStatus()).isEqualTo(status);
        assertThat(filter.getResourceName()).isEqualTo(resourceName);
        assertThat(filter.getResourceType()).isEqualTo(resourceType);
        assertThat(filter.getStartTime()).isEqualTo(startTime);
        assertThat(filter.getEndTime()).isEqualTo(endTime);
    }

    @Test
    void hasFilters_WithNoFilters_ReturnsFalse() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();

        // When
        boolean result = filter.hasFilters();

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void hasFilters_WithUsername_ReturnsTrue() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setUsername("testuser");

        // When
        boolean result = filter.hasFilters();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void hasFilters_WithClusterName_ReturnsTrue() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setClusterName("test-cluster");

        // When
        boolean result = filter.hasFilters();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void hasFilters_WithOperationType_ReturnsTrue() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setOperationType(AuditOperationType.CREATE_EXCHANGE);

        // When
        boolean result = filter.hasFilters();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void hasFilters_WithStatus_ReturnsTrue() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setStatus(AuditOperationStatus.SUCCESS);

        // When
        boolean result = filter.hasFilters();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void hasFilters_WithResourceName_ReturnsTrue() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setResourceName("test.exchange");

        // When
        boolean result = filter.hasFilters();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void hasFilters_WithResourceType_ReturnsTrue() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setResourceType("exchange");

        // When
        boolean result = filter.hasFilters();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void hasFilters_WithStartTime_ReturnsTrue() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setStartTime(Instant.now());

        // When
        boolean result = filter.hasFilters();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void hasFilters_WithEndTime_ReturnsTrue() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setEndTime(Instant.now());

        // When
        boolean result = filter.hasFilters();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void hasDateRangeFilter_WithNoDateFilters_ReturnsFalse() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setUsername("testuser");

        // When
        boolean result = filter.hasDateRangeFilter();

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void hasDateRangeFilter_WithStartTime_ReturnsTrue() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setStartTime(Instant.now());

        // When
        boolean result = filter.hasDateRangeFilter();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void hasDateRangeFilter_WithEndTime_ReturnsTrue() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setEndTime(Instant.now());

        // When
        boolean result = filter.hasDateRangeFilter();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void hasDateRangeFilter_WithBothTimes_ReturnsTrue() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setStartTime(Instant.parse("2023-01-01T00:00:00Z"));
        filter.setEndTime(Instant.parse("2023-12-31T23:59:59Z"));

        // When
        boolean result = filter.hasDateRangeFilter();

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void validation_WithValidData_PassesValidation() {
        // Given
        AuditFilterRequest filter = createValidFilter();

        // When
        Set<ConstraintViolation<AuditFilterRequest>> violations = validator.validate(filter);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    void validation_WithTooLongUsername_FailsValidation() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setUsername("a".repeat(101)); // Exceeds 100 character limit

        // When
        Set<ConstraintViolation<AuditFilterRequest>> violations = validator.validate(filter);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
                .contains("Username filter must not exceed 100 characters");
    }

    @Test
    void validation_WithTooLongClusterName_FailsValidation() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setClusterName("a".repeat(201)); // Exceeds 200 character limit

        // When
        Set<ConstraintViolation<AuditFilterRequest>> violations = validator.validate(filter);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
                .contains("Cluster name filter must not exceed 200 characters");
    }

    @Test
    void validation_WithTooLongResourceName_FailsValidation() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setResourceName("a".repeat(501)); // Exceeds 500 character limit

        // When
        Set<ConstraintViolation<AuditFilterRequest>> violations = validator.validate(filter);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
                .contains("Resource name filter must not exceed 500 characters");
    }

    @Test
    void validation_WithTooLongResourceType_FailsValidation() {
        // Given
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setResourceType("a".repeat(501)); // Exceeds 500 character limit

        // When
        Set<ConstraintViolation<AuditFilterRequest>> violations = validator.validate(filter);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
                .contains("Resource type filter must not exceed 500 characters");
    }

    @Test
    void jsonSerialization_WithCompleteFilter_SerializesCorrectly() throws Exception {
        // Given
        AuditFilterRequest filter = createValidFilter();

        // When
        String json = objectMapper.writeValueAsString(filter);

        // Then
        assertThat(json).contains("\"username\":\"testuser\"");
        assertThat(json).contains("\"clusterName\":\"test-cluster\"");
        assertThat(json).contains("\"operationType\":\"CREATE_EXCHANGE\"");
        assertThat(json).contains("\"status\":\"SUCCESS\"");
        assertThat(json).contains("\"resourceName\":\"test.exchange\"");
        assertThat(json).contains("\"resourceType\":\"exchange\"");
        assertThat(json).contains("\"startTime\":");
        assertThat(json).contains("\"endTime\":");
    }

    @Test
    void jsonDeserialization_WithValidJson_DeserializesCorrectly() throws Exception {
        // Given
        String json = """
                {
                    "username": "testuser",
                    "clusterName": "test-cluster",
                    "operationType": "CREATE_EXCHANGE",
                    "status": "SUCCESS",
                    "resourceName": "test.exchange",
                    "resourceType": "exchange",
                    "startTime": "2023-01-01T00:00:00.000Z",
                    "endTime": "2023-12-31T23:59:59.000Z"
                }
                """;

        // When
        AuditFilterRequest filter = objectMapper.readValue(json, AuditFilterRequest.class);

        // Then
        assertThat(filter.getUsername()).isEqualTo("testuser");
        assertThat(filter.getClusterName()).isEqualTo("test-cluster");
        assertThat(filter.getOperationType()).isEqualTo(AuditOperationType.CREATE_EXCHANGE);
        assertThat(filter.getStatus()).isEqualTo(AuditOperationStatus.SUCCESS);
        assertThat(filter.getResourceName()).isEqualTo("test.exchange");
        assertThat(filter.getResourceType()).isEqualTo("exchange");
        assertThat(filter.getStartTime()).isEqualTo(Instant.parse("2023-01-01T00:00:00.000Z"));
        assertThat(filter.getEndTime()).isEqualTo(Instant.parse("2023-12-31T23:59:59.000Z"));
    }

    @Test
    void toString_WithValidFilter_ReturnsFormattedString() {
        // Given
        AuditFilterRequest filter = createValidFilter();

        // When
        String result = filter.toString();

        // Then
        assertThat(result).contains("AuditFilterRequest{");
        assertThat(result).contains("username='testuser'");
        assertThat(result).contains("clusterName='test-cluster'");
        assertThat(result).contains("operationType=CREATE_EXCHANGE");
        assertThat(result).contains("status=SUCCESS");
        assertThat(result).contains("resourceName='test.exchange'");
        assertThat(result).contains("resourceType='exchange'");
    }

    private AuditFilterRequest createValidFilter() {
        return new AuditFilterRequest(
                "testuser",
                "test-cluster",
                AuditOperationType.CREATE_EXCHANGE,
                AuditOperationStatus.SUCCESS,
                "test.exchange",
                "exchange",
                Instant.parse("2023-01-01T00:00:00Z"),
                Instant.parse("2023-12-31T23:59:59Z"));
    }
}