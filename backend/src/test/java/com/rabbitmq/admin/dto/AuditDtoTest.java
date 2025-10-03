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
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class AuditDtoTest {

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
    void constructor_WithRequiredFields_CreatesValidDto() {
        // Given
        UUID id = UUID.randomUUID();
        String username = "testuser";
        String clusterName = "test-cluster";
        AuditOperationType operationType = AuditOperationType.CREATE_EXCHANGE;
        String resourceType = "exchange";
        String resourceName = "test.exchange";
        AuditOperationStatus status = AuditOperationStatus.SUCCESS;
        Instant timestamp = Instant.now();

        // When
        AuditDto dto = new AuditDto(id, username, clusterName, operationType,
                resourceType, resourceName, status, timestamp);

        // Then
        assertThat(dto.getId()).isEqualTo(id);
        assertThat(dto.getUsername()).isEqualTo(username);
        assertThat(dto.getClusterName()).isEqualTo(clusterName);
        assertThat(dto.getOperationType()).isEqualTo(operationType);
        assertThat(dto.getResourceType()).isEqualTo(resourceType);
        assertThat(dto.getResourceName()).isEqualTo(resourceName);
        assertThat(dto.getStatus()).isEqualTo(status);
        assertThat(dto.getTimestamp()).isEqualTo(timestamp);
    }

    @Test
    void constructor_WithAllFields_CreatesCompleteDto() {
        // Given
        UUID id = UUID.randomUUID();
        String username = "testuser";
        String clusterName = "test-cluster";
        AuditOperationType operationType = AuditOperationType.CREATE_EXCHANGE;
        String resourceType = "exchange";
        String resourceName = "test.exchange";
        Map<String, Object> resourceDetails = Map.of("exchangeType", "direct", "durable", true);
        AuditOperationStatus status = AuditOperationStatus.SUCCESS;
        String errorMessage = null;
        Instant timestamp = Instant.now();
        String clientIp = "192.168.1.100";
        String userAgent = "Mozilla/5.0";
        Instant createdAt = Instant.now();

        // When
        AuditDto dto = new AuditDto(id, username, clusterName, operationType,
                resourceType, resourceName, resourceDetails,
                status, errorMessage, timestamp, clientIp,
                userAgent, createdAt);

        // Then
        assertThat(dto.getId()).isEqualTo(id);
        assertThat(dto.getUsername()).isEqualTo(username);
        assertThat(dto.getClusterName()).isEqualTo(clusterName);
        assertThat(dto.getOperationType()).isEqualTo(operationType);
        assertThat(dto.getResourceType()).isEqualTo(resourceType);
        assertThat(dto.getResourceName()).isEqualTo(resourceName);
        assertThat(dto.getResourceDetails()).isEqualTo(resourceDetails);
        assertThat(dto.getStatus()).isEqualTo(status);
        assertThat(dto.getErrorMessage()).isEqualTo(errorMessage);
        assertThat(dto.getTimestamp()).isEqualTo(timestamp);
        assertThat(dto.getClientIp()).isEqualTo(clientIp);
        assertThat(dto.getUserAgent()).isEqualTo(userAgent);
        assertThat(dto.getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    void validation_WithValidData_PassesValidation() {
        // Given
        AuditDto dto = createValidDto();

        // When
        Set<ConstraintViolation<AuditDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    void validation_WithBlankUsername_FailsValidation() {
        // Given
        AuditDto dto = createValidDto();
        dto.setUsername("");

        // When
        Set<ConstraintViolation<AuditDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Username is required");
    }

    @Test
    void validation_WithBlankClusterName_FailsValidation() {
        // Given
        AuditDto dto = createValidDto();
        dto.setClusterName("");

        // When
        Set<ConstraintViolation<AuditDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Cluster name is required");
    }

    @Test
    void validation_WithNullOperationType_FailsValidation() {
        // Given
        AuditDto dto = createValidDto();
        dto.setOperationType(null);

        // When
        Set<ConstraintViolation<AuditDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Operation type is required");
    }

    @Test
    void validation_WithBlankResourceType_FailsValidation() {
        // Given
        AuditDto dto = createValidDto();
        dto.setResourceType("");

        // When
        Set<ConstraintViolation<AuditDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Resource type is required");
    }

    @Test
    void validation_WithBlankResourceName_FailsValidation() {
        // Given
        AuditDto dto = createValidDto();
        dto.setResourceName("");

        // When
        Set<ConstraintViolation<AuditDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Resource name is required");
    }

    @Test
    void validation_WithNullStatus_FailsValidation() {
        // Given
        AuditDto dto = createValidDto();
        dto.setStatus(null);

        // When
        Set<ConstraintViolation<AuditDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Operation status is required");
    }

    @Test
    void validation_WithNullTimestamp_FailsValidation() {
        // Given
        AuditDto dto = createValidDto();
        dto.setTimestamp(null);

        // When
        Set<ConstraintViolation<AuditDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Timestamp is required");
    }

    @Test
    void validation_WithTooLongUsername_FailsValidation() {
        // Given
        AuditDto dto = createValidDto();
        dto.setUsername("a".repeat(101)); // Exceeds 100 character limit

        // When
        Set<ConstraintViolation<AuditDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Username must not exceed 100 characters");
    }

    @Test
    void validation_WithTooLongErrorMessage_FailsValidation() {
        // Given
        AuditDto dto = createValidDto();
        dto.setErrorMessage("a".repeat(1001)); // Exceeds 1000 character limit

        // When
        Set<ConstraintViolation<AuditDto>> violations = validator.validate(dto);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("Error message must not exceed 1000 characters");
    }

    @Test
    void jsonSerialization_WithCompleteDto_SerializesCorrectly() throws Exception {
        // Given
        AuditDto dto = createValidDto();
        dto.setResourceDetails(Map.of("exchangeType", "direct", "durable", true));
        dto.setErrorMessage("Test error");
        dto.setClientIp("192.168.1.100");
        dto.setUserAgent("Mozilla/5.0");

        // When
        String json = objectMapper.writeValueAsString(dto);

        // Then
        assertThat(json).contains("\"username\":\"testuser\"");
        assertThat(json).contains("\"clusterName\":\"test-cluster\"");
        assertThat(json).contains("\"operationType\":\"CREATE_EXCHANGE\"");
        assertThat(json).contains("\"resourceType\":\"exchange\"");
        assertThat(json).contains("\"resourceName\":\"test.exchange\"");
        assertThat(json).contains("\"status\":\"SUCCESS\"");
        assertThat(json).contains("\"exchangeType\":\"direct\"");
        assertThat(json).contains("\"durable\":true");
        assertThat(json).contains("\"errorMessage\":\"Test error\"");
        assertThat(json).contains("\"clientIp\":\"192.168.1.100\"");
        assertThat(json).contains("\"userAgent\":\"Mozilla/5.0\"");
    }

    @Test
    void jsonDeserialization_WithValidJson_DeserializesCorrectly() throws Exception {
        // Given
        String json = """
                {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "username": "testuser",
                    "clusterName": "test-cluster",
                    "operationType": "CREATE_EXCHANGE",
                    "resourceType": "exchange",
                    "resourceName": "test.exchange",
                    "resourceDetails": {"exchangeType": "direct", "durable": true},
                    "status": "SUCCESS",
                    "errorMessage": null,
                    "timestamp": "2023-01-01T12:00:00.000Z",
                    "clientIp": "192.168.1.100",
                    "userAgent": "Mozilla/5.0",
                    "createdAt": "2023-01-01T12:00:00.000Z"
                }
                """;

        // When
        AuditDto dto = objectMapper.readValue(json, AuditDto.class);

        // Then
        assertThat(dto.getUsername()).isEqualTo("testuser");
        assertThat(dto.getClusterName()).isEqualTo("test-cluster");
        assertThat(dto.getOperationType()).isEqualTo(AuditOperationType.CREATE_EXCHANGE);
        assertThat(dto.getResourceType()).isEqualTo("exchange");
        assertThat(dto.getResourceName()).isEqualTo("test.exchange");
        assertThat(dto.getStatus()).isEqualTo(AuditOperationStatus.SUCCESS);
        assertThat(dto.getResourceDetails()).containsEntry("exchangeType", "direct");
        assertThat(dto.getResourceDetails()).containsEntry("durable", true);
        assertThat(dto.getClientIp()).isEqualTo("192.168.1.100");
        assertThat(dto.getUserAgent()).isEqualTo("Mozilla/5.0");
    }

    @Test
    void toString_WithValidDto_ReturnsFormattedString() {
        // Given
        AuditDto dto = createValidDto();

        // When
        String result = dto.toString();

        // Then
        assertThat(result).contains("AuditDto{");
        assertThat(result).contains("username='testuser'");
        assertThat(result).contains("clusterName='test-cluster'");
        assertThat(result).contains("operationType=CREATE_EXCHANGE");
        assertThat(result).contains("resourceType='exchange'");
        assertThat(result).contains("resourceName='test.exchange'");
        assertThat(result).contains("status=SUCCESS");
    }

    private AuditDto createValidDto() {
        return new AuditDto(
                UUID.randomUUID(),
                "testuser",
                "test-cluster",
                AuditOperationType.CREATE_EXCHANGE,
                "exchange",
                "test.exchange",
                AuditOperationStatus.SUCCESS,
                Instant.now());
    }
}