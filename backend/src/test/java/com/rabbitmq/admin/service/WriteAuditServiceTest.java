package com.rabbitmq.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rabbitmq.admin.config.AuditConfigurationProperties;
import com.rabbitmq.admin.dto.AuditDto;
import com.rabbitmq.admin.dto.AuditFilterRequest;
import com.rabbitmq.admin.model.*;
import com.rabbitmq.admin.repository.AuditRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentMatchers;

@ExtendWith(MockitoExtension.class)
class WriteAuditServiceTest {

    @Mock
    private AuditRepository auditRepository;

    @Mock
    private ResourceAuditService resourceAuditService;

    @Mock
    private AuditConfigurationProperties auditConfig;

    private ObjectMapper objectMapper;
    private WriteAuditService writeAuditService;

    private User testUser;
    private ClusterConnection testCluster;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        writeAuditService = new WriteAuditService(auditRepository, resourceAuditService, auditConfig, objectMapper);

        // Setup test data
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");

        testCluster = new ClusterConnection();
        testCluster.setId(UUID.randomUUID());
        testCluster.setName("test-cluster");

        // Setup default config behavior with lenient stubbing
        lenient().when(auditConfig.isEnabled()).thenReturn(true);
        lenient().when(auditConfig.isAsyncProcessing()).thenReturn(false);
    }

    @Test
    void auditWriteOperation_SyncProcessing_Success() {
        // Given
        Map<String, Object> details = Map.of("exchangeType", "direct", "durable", true);

        // When
        writeAuditService.auditWriteOperation(
                testUser, testCluster, AuditOperationType.CREATE_EXCHANGE,
                "exchange", "test.exchange", details, AuditOperationStatus.SUCCESS, null);

        // Then
        ArgumentCaptor<Audit> auditCaptor = ArgumentCaptor.forClass(Audit.class);
        verify(auditRepository).save(auditCaptor.capture());

        Audit savedAudit = auditCaptor.getValue();
        assertThat(savedAudit.getUser()).isEqualTo(testUser);
        assertThat(savedAudit.getCluster()).isEqualTo(testCluster);
        assertThat(savedAudit.getOperationType()).isEqualTo(AuditOperationType.CREATE_EXCHANGE);
        assertThat(savedAudit.getResourceType()).isEqualTo("exchange");
        assertThat(savedAudit.getResourceName()).isEqualTo("test.exchange");
        assertThat(savedAudit.getStatus()).isEqualTo(AuditOperationStatus.SUCCESS);
        assertThat(savedAudit.getResourceDetails()).contains("exchangeType");
        assertThat(savedAudit.getTimestamp()).isNotNull();

        // Verify ResourceAuditService was called for dual logging
        verify(resourceAuditService).logResourceAccess(
                eq("testuser"), eq(testCluster.getId()), eq("exchange"),
                eq("WRITE_CREATE_EXCHANGE"), ArgumentMatchers.<Map<String, Object>>any());
    }

    @Test
    void auditWriteOperation_WithFailureStatus_LogsFailure() {
        // Given
        String errorMessage = "Exchange creation failed";

        // When
        writeAuditService.auditWriteOperation(
                testUser, testCluster, AuditOperationType.CREATE_EXCHANGE,
                "exchange", "test.exchange", null, AuditOperationStatus.FAILURE, errorMessage);

        // Then
        ArgumentCaptor<Audit> auditCaptor = ArgumentCaptor.forClass(Audit.class);
        verify(auditRepository).save(auditCaptor.capture());

        Audit savedAudit = auditCaptor.getValue();
        assertThat(savedAudit.getStatus()).isEqualTo(AuditOperationStatus.FAILURE);
        assertThat(savedAudit.getErrorMessage()).isEqualTo(errorMessage);

        // Verify ResourceAuditService was called for failure logging
        verify(resourceAuditService).logResourceAccessFailure(
                eq("testuser"), eq(testCluster.getId()), eq("exchange"),
                eq("WRITE_CREATE_EXCHANGE"), eq(errorMessage), eq("WRITE_OPERATION_FAILURE"));
    }

    @Test
    void auditWriteOperation_WithMDCContext_CapturesClientInfo() {
        // Given
        String clientIp = "192.168.1.100";
        String userAgent = "Mozilla/5.0";

        try {
            MDC.put("clientIp", clientIp);
            MDC.put("userAgent", userAgent);

            // When
            writeAuditService.auditWriteOperation(
                    testUser, testCluster, AuditOperationType.CREATE_QUEUE,
                    "queue", "test.queue", null, AuditOperationStatus.SUCCESS, null);

            // Then
            ArgumentCaptor<Audit> auditCaptor = ArgumentCaptor.forClass(Audit.class);
            verify(auditRepository).save(auditCaptor.capture());

            Audit savedAudit = auditCaptor.getValue();
            assertThat(savedAudit.getClientIp()).isEqualTo(clientIp);
            assertThat(savedAudit.getUserAgent()).isEqualTo(userAgent);

        } finally {
            MDC.clear();
        }
    }

    @Test
    void auditWriteOperation_AsyncProcessing_CallsAsyncMethod() {
        // Given
        when(auditConfig.isAsyncProcessing()).thenReturn(true);

        // When
        writeAuditService.auditWriteOperation(
                testUser, testCluster, AuditOperationType.DELETE_EXCHANGE,
                "exchange", "test.exchange", null, AuditOperationStatus.SUCCESS, null);

        // Then - verify repository is eventually called (async behavior)
        // Note: In a real async test, we'd need to wait or use @Async test
        // configuration
        verify(auditRepository, timeout(1000)).save(any(Audit.class));
    }

    @Test
    void auditWriteOperation_RepositoryException_DoesNotThrow() {
        // Given
        when(auditRepository.save(any(Audit.class))).thenThrow(new RuntimeException("Database error"));

        // When & Then - should not throw exception
        writeAuditService.auditWriteOperation(
                testUser, testCluster, AuditOperationType.CREATE_EXCHANGE,
                "exchange", "test.exchange", null, AuditOperationStatus.SUCCESS, null);

        // Verify the operation was attempted
        verify(auditRepository).save(any(Audit.class));
    }

    @Test
    void getAuditRecords_NoFilters_ReturnsAllRecords() {
        // Given
        Audit audit1 = createTestAudit(AuditOperationType.CREATE_EXCHANGE, "exchange1");
        Audit audit2 = createTestAudit(AuditOperationType.CREATE_QUEUE, "queue1");
        Page<Audit> auditPage = new PageImpl<>(List.of(audit1, audit2));

        Pageable pageable = PageRequest.of(0, 10);
        when(auditRepository.findAll(pageable)).thenReturn(auditPage);

        // When
        Page<AuditDto> result = writeAuditService.getAuditRecords(null, pageable);

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getOperationType()).isEqualTo(AuditOperationType.CREATE_EXCHANGE);
        assertThat(result.getContent().get(1).getOperationType()).isEqualTo(AuditOperationType.CREATE_QUEUE);

        verify(auditRepository).findAll(pageable);
    }

    @Test
    void getAuditRecords_WithDateRangeFilter_PassesCorrectDates() {
        // Given
        Instant startTime = Instant.parse("2023-01-01T00:00:00Z");
        Instant endTime = Instant.parse("2023-12-31T23:59:59Z");

        AuditFilterRequest filterRequest = new AuditFilterRequest();
        filterRequest.setStartTime(startTime);
        filterRequest.setEndTime(endTime);

        Page<Audit> auditPage = new PageImpl<>(List.of());
        Pageable pageable = PageRequest.of(0, 10);

        when(auditRepository.findByTimestampBetween(eq(startTime), eq(endTime), eq(pageable)))
                .thenReturn(auditPage);

        // When
        writeAuditService.getAuditRecords(filterRequest, pageable);

        // Then
        verify(auditRepository).findByTimestampBetween(eq(startTime), eq(endTime), eq(pageable));
    }

    @Test
    void getAuditRecords_RepositoryException_ThrowsRuntimeException() {
        // Given
        when(auditRepository.findAll(any(Pageable.class)))
                .thenThrow(new RuntimeException("Database connection failed"));

        Pageable pageable = PageRequest.of(0, 10);

        // When & Then
        assertThatThrownBy(() -> writeAuditService.getAuditRecords(null, pageable))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Failed to retrieve audit records");
    }

    @Test
    void convertToDto_WithResourceDetails_ParsesJsonCorrectly() {
        // Given
        Map<String, Object> details = Map.of("exchangeType", "direct", "durable", true);
        Audit audit = createTestAudit(AuditOperationType.CREATE_EXCHANGE, "exchange1");
        try {
            audit.setResourceDetails(objectMapper.writeValueAsString(details));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        Page<Audit> auditPage = new PageImpl<>(List.of(audit));
        when(auditRepository.findAll(any(Pageable.class))).thenReturn(auditPage);

        // When
        Page<AuditDto> result = writeAuditService.getAuditRecords(null, PageRequest.of(0, 10));

        // Then
        AuditDto dto = result.getContent().get(0);
        assertThat(dto.getResourceDetails()).isNotNull();
        assertThat(dto.getResourceDetails().get("exchangeType")).isEqualTo("direct");
        assertThat(dto.getResourceDetails().get("durable")).isEqualTo(true);
    }

    @Test
    void convertToDto_WithInvalidJson_HandlesGracefully() {
        // Given
        Audit audit = createTestAudit(AuditOperationType.CREATE_EXCHANGE, "exchange1");
        audit.setResourceDetails("invalid json {");

        Page<Audit> auditPage = new PageImpl<>(List.of(audit));
        when(auditRepository.findAll(any(Pageable.class))).thenReturn(auditPage);

        // When
        Page<AuditDto> result = writeAuditService.getAuditRecords(null, PageRequest.of(0, 10));

        // Then
        AuditDto dto = result.getContent().get(0);
        assertThat(dto.getResourceDetails()).isNotNull();
        assertThat(dto.getResourceDetails().get("raw")).isEqualTo("invalid json {");
    }

    @Test
    void isAuditEnabled_ReturnsConfigValue() {
        // Given
        when(auditConfig.isEnabled()).thenReturn(true);

        // When
        boolean result = writeAuditService.isAuditEnabled();

        // Then
        assertThat(result).isTrue();
        verify(auditConfig).isEnabled();
    }

    @Test
    void getAuditConfiguration_ReturnsConfig() {
        // When
        AuditConfigurationProperties result = writeAuditService.getAuditConfiguration();

        // Then
        assertThat(result).isEqualTo(auditConfig);
    }

    @Test
    void auditWriteOperationSync_WithNullDetails_HandlesCorrectly() {
        // When
        writeAuditService.auditWriteOperationSync(
                testUser, testCluster, AuditOperationType.DELETE_QUEUE,
                "queue", "test.queue", null, AuditOperationStatus.SUCCESS, null);

        // Then
        ArgumentCaptor<Audit> auditCaptor = ArgumentCaptor.forClass(Audit.class);
        verify(auditRepository).save(auditCaptor.capture());

        Audit savedAudit = auditCaptor.getValue();
        assertThat(savedAudit.getResourceDetails()).isNull();
    }

    @Test
    void auditWriteOperationSync_WithEmptyDetails_HandlesCorrectly() {
        // When
        writeAuditService.auditWriteOperationSync(
                testUser, testCluster, AuditOperationType.PURGE_QUEUE,
                "queue", "test.queue", new HashMap<>(), AuditOperationStatus.SUCCESS, null);

        // Then
        ArgumentCaptor<Audit> auditCaptor = ArgumentCaptor.forClass(Audit.class);
        verify(auditRepository).save(auditCaptor.capture());

        Audit savedAudit = auditCaptor.getValue();
        assertThat(savedAudit.getResourceDetails()).isNull();
    }

    private Audit createTestAudit(AuditOperationType operationType, String resourceName) {
        Audit audit = new Audit();
        audit.setId(UUID.randomUUID());
        audit.setUser(testUser);
        audit.setCluster(testCluster);
        audit.setOperationType(operationType);
        audit.setResourceType("exchange");
        audit.setResourceName(resourceName);
        audit.setStatus(AuditOperationStatus.SUCCESS);
        audit.setTimestamp(Instant.now());
        audit.setCreatedAt(Instant.now());
        return audit;
    }
}