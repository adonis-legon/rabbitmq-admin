package com.rabbitmq.admin.service;

import com.rabbitmq.admin.config.AuditRetentionConfigurationProperties;
import com.rabbitmq.admin.model.Audit;
import com.rabbitmq.admin.repository.AuditRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuditRetentionService.
 * Tests the scheduled cleanup functionality for audit records.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuditRetentionService Tests")
class AuditRetentionServiceTest {

    @Mock
    private AuditRepository auditRepository;

    @Mock
    private AuditRetentionConfigurationProperties auditRetentionProperties;

    private AuditRetentionService auditRetentionService;

    @BeforeEach
    void setUp() {
        auditRetentionService = new AuditRetentionService(auditRepository, auditRetentionProperties);
    }

    @Test
    void cleanupOldAuditRecords_WhenRetentionDisabled_ShouldSkipCleanup() {
        // Mock configuration properties - only mock what we need
        lenient().when(auditRetentionProperties.isEnabled()).thenReturn(false);

        // Execute
        auditRetentionService.cleanupOldAuditRecords();

        // Verify no repository interactions
        verify(auditRetentionProperties, atLeastOnce()).isEnabled();
        verifyNoInteractions(auditRepository);
    }

    @Test
    void cleanupOldAuditRecords_WhenRetentionEnabled_ShouldCleanupOldRecords() {
        // Mock configuration properties
        lenient().when(auditRetentionProperties.isEnabled()).thenReturn(true);
        lenient().when(auditRetentionProperties.getDays()).thenReturn(30);

        // Mock audit entities
        Audit oldAudit1 = createMockAudit(UUID.randomUUID(), Instant.now().minus(35, ChronoUnit.DAYS));
        Audit oldAudit2 = createMockAudit(UUID.randomUUID(), Instant.now().minus(40, ChronoUnit.DAYS));
        List<Audit> oldAudits = Arrays.asList(oldAudit1, oldAudit2);

        // Mock repository behavior
        when(auditRepository.findByTimestampBefore(any(Instant.class))).thenReturn(oldAudits);

        // Execute
        auditRetentionService.cleanupOldAuditRecords();

        // Verify interactions
        verify(auditRetentionProperties, atLeastOnce()).isEnabled();
        verify(auditRetentionProperties, atLeastOnce()).getDays();
        ArgumentCaptor<Instant> instantCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(auditRepository).findByTimestampBefore(instantCaptor.capture());

        // Verify the timestamp is reasonable (approximately 30 days ago, allow for
        // execution time)
        Instant actualInstant = instantCaptor.getValue();
        Instant now = Instant.now();
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);

        // Allow for a reasonable margin of error (1 minute) to account for test
        // execution time
        long differenceFromExpected = Math.abs(actualInstant.toEpochMilli() - thirtyDaysAgo.toEpochMilli());
        assertTrue(differenceFromExpected < 60000,
                "Timestamp should be approximately 30 days ago. Expected around: " + thirtyDaysAgo +
                        ", but was: " + actualInstant + ", difference: " + differenceFromExpected + "ms");

        verify(auditRepository).deleteAll(oldAudits);
    }

    @Test
    void cleanupOldAuditRecords_WithLargeBatch_ShouldHandleEfficientlyInBatches() {
        // Mock configuration properties
        lenient().when(auditRetentionProperties.isEnabled()).thenReturn(true);
        lenient().when(auditRetentionProperties.getDays()).thenReturn(7);

        // Create a large list of audit records (simulating batch processing scenario)
        List<Audit> largeAuditList = generateMockAudits(1000);

        // Mock repository behavior
        when(auditRepository.findByTimestampBefore(any(Instant.class))).thenReturn(largeAuditList);

        // Execute
        auditRetentionService.cleanupOldAuditRecords();

        // Verify interactions
        verify(auditRetentionProperties, atLeastOnce()).isEnabled();
        verify(auditRetentionProperties, atLeastOnce()).getDays();
        verify(auditRepository).findByTimestampBefore(any(Instant.class));
        verify(auditRepository).deleteAll(largeAuditList);
    }

    @Test
    void cleanupOldAuditRecords_WhenNoOldRecords_ShouldCompleteWithoutDeletion() {
        // Mock configuration properties
        lenient().when(auditRetentionProperties.isEnabled()).thenReturn(true);
        lenient().when(auditRetentionProperties.getDays()).thenReturn(30);

        // Mock repository behavior - no old records found
        when(auditRepository.findByTimestampBefore(any(Instant.class))).thenReturn(Collections.emptyList());

        // Execute
        auditRetentionService.cleanupOldAuditRecords();

        // Verify interactions
        verify(auditRetentionProperties, atLeastOnce()).isEnabled();
        verify(auditRetentionProperties, atLeastOnce()).getDays();
        verify(auditRepository).findByTimestampBefore(any(Instant.class));
        verify(auditRepository, never()).deleteAll(anyList());
    }

    @Test
    void cleanupOldAuditRecords_WhenRepositoryThrowsException_ShouldHandleGracefully() {
        // Mock configuration properties
        lenient().when(auditRetentionProperties.isEnabled()).thenReturn(true);
        lenient().when(auditRetentionProperties.getDays()).thenReturn(30);

        // Mock repository to throw exception
        when(auditRepository.findByTimestampBefore(any(Instant.class)))
                .thenThrow(new RuntimeException("Database connection failed"));

        // Execute (should not throw exception due to error handling)
        auditRetentionService.cleanupOldAuditRecords();

        // Verify interactions
        verify(auditRetentionProperties, atLeastOnce()).isEnabled();
        verify(auditRetentionProperties, atLeastOnce()).getDays();
        verify(auditRepository).findByTimestampBefore(any(Instant.class));
        // No deleteAll should be called due to exception
        verify(auditRepository, never()).deleteAll(anyList());
    }

    /**
     * Helper method to create a mock Audit entity.
     */
    private Audit createMockAudit(UUID id, Instant timestamp) {
        Audit audit = mock(Audit.class);
        lenient().when(audit.getId()).thenReturn(id);
        lenient().when(audit.getTimestamp()).thenReturn(timestamp);
        return audit;
    }

    /**
     * Helper method to generate a list of mock audit records.
     */
    private List<Audit> generateMockAudits(int count) {
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(i -> createMockAudit(
                        UUID.randomUUID(),
                        Instant.now().minus(40 + i, ChronoUnit.DAYS)))
                .collect(java.util.stream.Collectors.toList());
    }
}