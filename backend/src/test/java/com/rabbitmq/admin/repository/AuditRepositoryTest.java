package com.rabbitmq.admin.repository;

import com.rabbitmq.admin.model.Audit;
import com.rabbitmq.admin.model.AuditOperationType;
import com.rabbitmq.admin.model.AuditOperationStatus;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for AuditRepository using @DataJpaTest.
 * Tests all custom query methods and repository functionality.
 */
@DataJpaTest
@ActiveProfiles("test")
class AuditRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private AuditRepository auditRepository;

    private User adminUser;
    private User regularUser1;
    private User regularUser2;
    private ClusterConnection cluster1;
    private ClusterConnection cluster2;
    private Audit audit1;
    private Audit audit2;
    private Audit audit3;
    private Audit audit4;
    private Audit audit5;

    @BeforeEach
    void setUp() {
        // Create test users
        adminUser = new User("admin", "hashedPassword123", UserRole.ADMINISTRATOR);
        regularUser1 = new User("user1", "hashedPassword456", UserRole.USER);
        regularUser2 = new User("testuser", "hashedPassword789", UserRole.USER);

        // Create test cluster connections
        cluster1 = new ClusterConnection("Production Cluster", "http://localhost:15672", "admin", "password");
        cluster2 = new ClusterConnection("Test Cluster", "http://localhost:15673", "admin", "password");

        // Persist entities
        entityManager.persistAndFlush(adminUser);
        entityManager.persistAndFlush(regularUser1);
        entityManager.persistAndFlush(regularUser2);
        entityManager.persistAndFlush(cluster1);
        entityManager.persistAndFlush(cluster2);

        // Create test audit records with different timestamps
        Instant now = Instant.now();
        Instant oneHourAgo = now.minus(1, ChronoUnit.HOURS);
        Instant oneDayAgo = now.minus(1, ChronoUnit.DAYS);
        Instant oneWeekAgo = now.minus(7, ChronoUnit.DAYS);
        Instant twoHoursAgo = now.minus(2, ChronoUnit.HOURS);

        // Audit 1: Recent successful exchange creation by admin
        audit1 = new Audit(adminUser, cluster1, AuditOperationType.CREATE_EXCHANGE,
                "exchange", "test.exchange", AuditOperationStatus.SUCCESS, now);
        audit1.setResourceDetails("{\"type\":\"direct\",\"durable\":true}");
        audit1.setClientIp("192.168.1.100");

        // Audit 2: Failed queue creation by user1
        audit2 = new Audit(regularUser1, cluster1, AuditOperationType.CREATE_QUEUE,
                "queue", "test.queue", AuditOperationStatus.FAILURE, oneHourAgo);
        audit2.setErrorMessage("Queue already exists");
        audit2.setClientIp("192.168.1.101");

        // Audit 3: Successful queue deletion by user2
        audit3 = new Audit(regularUser2, cluster2, AuditOperationType.DELETE_QUEUE,
                "queue", "old.queue", AuditOperationStatus.SUCCESS, oneDayAgo);
        audit3.setResourceDetails("{\"messages\":0,\"consumers\":0}");

        // Audit 4: Successful message publish by user1
        audit4 = new Audit(regularUser1, cluster2, AuditOperationType.PUBLISH_MESSAGE_EXCHANGE,
                "message", "notification.exchange", AuditOperationStatus.SUCCESS, oneWeekAgo);
        audit4.setResourceDetails("{\"routing_key\":\"info\",\"payload_size\":256}");

        // Audit 5: Partial binding creation by admin
        audit5 = new Audit(adminUser, cluster1, AuditOperationType.CREATE_BINDING_EXCHANGE,
                "binding", "test.binding", AuditOperationStatus.PARTIAL, twoHoursAgo);
        audit5.setErrorMessage("Some bindings failed to create");

        // Persist audit records
        entityManager.persistAndFlush(audit1);
        entityManager.persistAndFlush(audit2);
        entityManager.persistAndFlush(audit3);
        entityManager.persistAndFlush(audit4);
        entityManager.persistAndFlush(audit5);

        entityManager.clear();
    }

    @Test
    void findByUserUsernameContainingIgnoreCase_ShouldReturnMatchingRecords() {
        Pageable pageable = PageRequest.of(0, 10);

        // Test exact match
        Page<Audit> result = auditRepository.findByUserUsernameContainingIgnoreCase("admin", pageable);
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).extracting(audit -> audit.getUser().getUsername())
                .containsOnly("admin");

        // Test partial match
        result = auditRepository.findByUserUsernameContainingIgnoreCase("user", pageable);
        assertThat(result.getContent()).hasSize(3);
        assertThat(result.getContent()).extracting(audit -> audit.getUser().getUsername())
                .containsExactlyInAnyOrder("user1", "user1", "testuser");

        // Test case insensitive
        result = auditRepository.findByUserUsernameContainingIgnoreCase("ADMIN", pageable);
        assertThat(result.getContent()).hasSize(2);

        // Test no match
        result = auditRepository.findByUserUsernameContainingIgnoreCase("nonexistent", pageable);
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void findByClusterNameContainingIgnoreCase_ShouldReturnMatchingRecords() {
        Pageable pageable = PageRequest.of(0, 10);

        // Test exact match
        Page<Audit> result = auditRepository.findByClusterNameContainingIgnoreCase("Production Cluster", pageable);
        assertThat(result.getContent()).hasSize(3);

        // Test partial match
        result = auditRepository.findByClusterNameContainingIgnoreCase("Test", pageable);
        assertThat(result.getContent()).hasSize(2);

        // Test case insensitive
        result = auditRepository.findByClusterNameContainingIgnoreCase("PRODUCTION", pageable);
        assertThat(result.getContent()).hasSize(3);

        // Test no match
        result = auditRepository.findByClusterNameContainingIgnoreCase("nonexistent", pageable);
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void findByOperationType_ShouldReturnMatchingRecords() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Audit> result = auditRepository.findByOperationType(AuditOperationType.CREATE_EXCHANGE, pageable);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getOperationType()).isEqualTo(AuditOperationType.CREATE_EXCHANGE);

        result = auditRepository.findByOperationType(AuditOperationType.CREATE_QUEUE, pageable);
        assertThat(result.getContent()).hasSize(1);

        result = auditRepository.findByOperationType(AuditOperationType.DELETE_EXCHANGE, pageable);
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void findByStatus_ShouldReturnMatchingRecords() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Audit> result = auditRepository.findByStatus(AuditOperationStatus.SUCCESS, pageable);
        assertThat(result.getContent()).hasSize(3);
        assertThat(result.getContent()).allMatch(audit -> audit.getStatus() == AuditOperationStatus.SUCCESS);

        result = auditRepository.findByStatus(AuditOperationStatus.FAILURE, pageable);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(AuditOperationStatus.FAILURE);

        result = auditRepository.findByStatus(AuditOperationStatus.PARTIAL, pageable);
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void findByTimestampBetween_ShouldReturnRecordsInRange() {
        Pageable pageable = PageRequest.of(0, 10);
        Instant now = Instant.now();
        Instant twoHoursAgo = now.minus(2, ChronoUnit.HOURS);
        Instant thirtyMinutesAgo = now.minus(30, ChronoUnit.MINUTES);

        Page<Audit> result = auditRepository.findByTimestampBetween(twoHoursAgo, now, pageable);
        assertThat(result.getContent()).hasSize(2); // audit1 and audit5

        result = auditRepository.findByTimestampBetween(thirtyMinutesAgo, now, pageable);
        assertThat(result.getContent()).hasSize(1); // only audit1

        // Test with no results
        Instant futureTime = now.plus(1, ChronoUnit.HOURS);
        result = auditRepository.findByTimestampBetween(futureTime, futureTime.plus(1, ChronoUnit.HOURS), pageable);
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void findByResourceNameContainingIgnoreCase_ShouldReturnMatchingRecords() {
        Pageable pageable = PageRequest.of(0, 10);

        // Test exact match
        Page<Audit> result = auditRepository.findByResourceNameContainingIgnoreCase("test.exchange", pageable);
        assertThat(result.getContent()).hasSize(1);

        // Test partial match
        result = auditRepository.findByResourceNameContainingIgnoreCase("test", pageable);
        assertThat(result.getContent()).hasSize(3); // test.exchange, test.queue, test.binding

        // Test case insensitive
        result = auditRepository.findByResourceNameContainingIgnoreCase("TEST", pageable);
        assertThat(result.getContent()).hasSize(3);

        // Test no match
        result = auditRepository.findByResourceNameContainingIgnoreCase("nonexistent", pageable);
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void findByResourceTypeIgnoreCase_ShouldReturnMatchingRecords() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Audit> result = auditRepository.findByResourceTypeIgnoreCase("queue", pageable);
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allMatch(audit -> audit.getResourceType().equalsIgnoreCase("queue"));

        result = auditRepository.findByResourceTypeIgnoreCase("EXCHANGE", pageable);
        assertThat(result.getContent()).hasSize(1);

        result = auditRepository.findByResourceTypeIgnoreCase("nonexistent", pageable);
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void findByUserId_ShouldReturnUserRecords() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Audit> result = auditRepository.findByUserId(adminUser.getId(), pageable);
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allMatch(audit -> audit.getUser().getId().equals(adminUser.getId()));

        result = auditRepository.findByUserId(regularUser1.getId(), pageable);
        assertThat(result.getContent()).hasSize(2);

        result = auditRepository.findByUserId(UUID.randomUUID(), pageable);
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void findByClusterId_ShouldReturnClusterRecords() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Audit> result = auditRepository.findByClusterId(cluster1.getId(), pageable);
        assertThat(result.getContent()).hasSize(3);
        assertThat(result.getContent()).allMatch(audit -> audit.getCluster().getId().equals(cluster1.getId()));

        result = auditRepository.findByClusterId(cluster2.getId(), pageable);
        assertThat(result.getContent()).hasSize(2);

        result = auditRepository.findByClusterId(UUID.randomUUID(), pageable);
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void findByTimestampAfter_ShouldReturnRecordsAfterTimestamp() {
        Pageable pageable = PageRequest.of(0, 10);
        Instant twoHoursAgo = Instant.now().minus(2, ChronoUnit.HOURS);

        Page<Audit> result = auditRepository.findByTimestampAfter(twoHoursAgo, pageable);
        assertThat(result.getContent()).hasSize(2); // audit1 and audit5

        Instant oneMinuteAgo = Instant.now().minus(1, ChronoUnit.MINUTES);
        result = auditRepository.findByTimestampAfter(oneMinuteAgo, pageable);
        assertThat(result.getContent()).hasSize(1); // only audit1
    }

    @Test
    void findByTimestampBefore_ShouldReturnRecordsBeforeTimestamp() {
        Pageable pageable = PageRequest.of(0, 10);
        Instant threeHoursAgo = Instant.now().minus(3, ChronoUnit.HOURS);

        Page<Audit> result = auditRepository.findByTimestampBefore(threeHoursAgo, pageable);
        assertThat(result.getContent()).hasSize(2); // audit3 and audit4

        // Test with list version for cleanup
        List<Audit> oldRecords = auditRepository.findByTimestampBefore(threeHoursAgo);
        assertThat(oldRecords).hasSize(2);
    }

    @Test
    @Disabled("Repository filtering deprecated - use service layer instead")
    void findWithFilters_ShouldApplyBasicFilters() {
        Pageable pageable = PageRequest.of(0, 10);

        // Test with all null parameters (should return all records)
        Page<Audit> result = auditRepository.findWithFilters(null, null, null, null, pageable);
        assertThat(result.getContent()).hasSize(5);

        // Test with operation type filter
        result = auditRepository.findWithFilters(AuditOperationType.CREATE_QUEUE, null, null, null, pageable);
        assertThat(result.getContent()).hasSize(1);

        // Test with status filter
        result = auditRepository.findWithFilters(null, AuditOperationStatus.FAILURE, null, null, pageable);
        assertThat(result.getContent()).hasSize(1);

        // Test with time range filter
        Instant now = Instant.now();
        Instant oneHourAgo = now.minus(1, ChronoUnit.HOURS);
        result = auditRepository.findWithFilters(null, null, oneHourAgo, now, pageable);
        assertThat(result.getContent()).hasSize(1); // Only audit1 is within the last hour

        // Test with multiple filters combined
        result = auditRepository.findWithFilters(null, AuditOperationStatus.SUCCESS, null, null, pageable);
        assertThat(result.getContent()).hasSize(4);
        assertThat(result.getContent().get(0).getCluster().getName()).isEqualTo("Production Cluster");
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(AuditOperationStatus.SUCCESS);
    }

    @Test
    void countByOperationType_ShouldReturnCorrectCount() {
        long createExchangeCount = auditRepository.countByOperationType(AuditOperationType.CREATE_EXCHANGE);
        assertThat(createExchangeCount).isEqualTo(1);

        long createQueueCount = auditRepository.countByOperationType(AuditOperationType.CREATE_QUEUE);
        assertThat(createQueueCount).isEqualTo(1);

        long deleteExchangeCount = auditRepository.countByOperationType(AuditOperationType.DELETE_EXCHANGE);
        assertThat(deleteExchangeCount).isEqualTo(0);
    }

    @Test
    void countByStatus_ShouldReturnCorrectCount() {
        long successCount = auditRepository.countByStatus(AuditOperationStatus.SUCCESS);
        assertThat(successCount).isEqualTo(3);

        long failureCount = auditRepository.countByStatus(AuditOperationStatus.FAILURE);
        assertThat(failureCount).isEqualTo(1);

        long partialCount = auditRepository.countByStatus(AuditOperationStatus.PARTIAL);
        assertThat(partialCount).isEqualTo(1);
    }

    @Test
    void countByUserId_ShouldReturnCorrectCount() {
        long adminCount = auditRepository.countByUserId(adminUser.getId());
        assertThat(adminCount).isEqualTo(2);

        long user1Count = auditRepository.countByUserId(regularUser1.getId());
        assertThat(user1Count).isEqualTo(2);

        long user2Count = auditRepository.countByUserId(regularUser2.getId());
        assertThat(user2Count).isEqualTo(1);

        long nonExistentCount = auditRepository.countByUserId(UUID.randomUUID());
        assertThat(nonExistentCount).isEqualTo(0);
    }

    @Test
    void countByClusterId_ShouldReturnCorrectCount() {
        long cluster1Count = auditRepository.countByClusterId(cluster1.getId());
        assertThat(cluster1Count).isEqualTo(3);

        long cluster2Count = auditRepository.countByClusterId(cluster2.getId());
        assertThat(cluster2Count).isEqualTo(2);

        long nonExistentCount = auditRepository.countByClusterId(UUID.randomUUID());
        assertThat(nonExistentCount).isEqualTo(0);
    }

    @Test
    void findMostRecent_ShouldReturnRecordsOrderedByTimestamp() {
        Pageable pageable = PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "timestamp"));

        Page<Audit> result = auditRepository.findMostRecent(pageable);
        assertThat(result.getContent()).hasSize(3);

        // Verify ordering (most recent first)
        List<Audit> audits = result.getContent();
        for (int i = 0; i < audits.size() - 1; i++) {
            assertThat(audits.get(i).getTimestamp()).isAfterOrEqualTo(audits.get(i + 1).getTimestamp());
        }
    }

    @Test
    void findFailedOperations_ShouldReturnOnlyFailedRecords() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Audit> result = auditRepository.findFailedOperations(pageable);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(AuditOperationStatus.FAILURE);
        assertThat(result.getContent().get(0).getErrorMessage()).isEqualTo("Queue already exists");
    }

    @Test
    void findSuccessfulOperations_ShouldReturnOnlySuccessfulRecords() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Audit> result = auditRepository.findSuccessfulOperations(pageable);
        assertThat(result.getContent()).hasSize(3);
        assertThat(result.getContent()).allMatch(audit -> audit.getStatus() == AuditOperationStatus.SUCCESS);
    }

    @Test
    void findByUserIdAndClusterId_ShouldReturnMatchingRecords() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Audit> result = auditRepository.findByUserIdAndClusterId(adminUser.getId(), cluster1.getId(), pageable);
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allMatch(audit -> audit.getUser().getId().equals(adminUser.getId()) &&
                audit.getCluster().getId().equals(cluster1.getId()));

        result = auditRepository.findByUserIdAndClusterId(regularUser1.getId(), cluster2.getId(), pageable);
        assertThat(result.getContent()).hasSize(1);

        result = auditRepository.findByUserIdAndClusterId(adminUser.getId(), cluster2.getId(), pageable);
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void save_ShouldPersistAuditRecord() {
        Audit newAudit = new Audit(regularUser1, cluster1, AuditOperationType.PURGE_QUEUE,
                "queue", "temp.queue", AuditOperationStatus.SUCCESS, Instant.now());
        newAudit.setResourceDetails("{\"messages_purged\":100}");

        Audit savedAudit = auditRepository.save(newAudit);

        assertThat(savedAudit.getId()).isNotNull();
        assertThat(savedAudit.getCreatedAt()).isNotNull();
        assertThat(savedAudit.getOperationType()).isEqualTo(AuditOperationType.PURGE_QUEUE);
        assertThat(savedAudit.getResourceDetails()).isEqualTo("{\"messages_purged\":100}");
    }

    @Test
    void findById_ShouldReturnAuditRecord_WhenExists() {
        Optional<Audit> foundAudit = auditRepository.findById(audit1.getId());
        assertThat(foundAudit).isPresent();
        assertThat(foundAudit.get().getOperationType()).isEqualTo(AuditOperationType.CREATE_EXCHANGE);
    }

    @Test
    void findById_ShouldReturnEmpty_WhenNotExists() {
        Optional<Audit> foundAudit = auditRepository.findById(UUID.randomUUID());
        assertThat(foundAudit).isEmpty();
    }

    @Test
    void findAll_ShouldReturnAllAuditRecords() {
        List<Audit> allAudits = auditRepository.findAll();
        assertThat(allAudits).hasSize(5);
    }

    @Test
    void delete_ShouldRemoveAuditRecord() {
        UUID auditId = audit1.getId();
        auditRepository.deleteById(auditId);

        Optional<Audit> deletedAudit = auditRepository.findById(auditId);
        assertThat(deletedAudit).isEmpty();

        // Verify total count decreased
        List<Audit> remainingAudits = auditRepository.findAll();
        assertThat(remainingAudits).hasSize(4);
    }

    @Test
    @Disabled("Repository filtering deprecated - use service layer instead")
    void findWithFilters_ShouldHandlePagination() {
        // Create additional audit records to test pagination
        for (int i = 0; i < 10; i++) {
            Audit audit = new Audit(regularUser1, cluster1, AuditOperationType.CREATE_QUEUE,
                    "queue", "queue" + i, AuditOperationStatus.SUCCESS, Instant.now());
            entityManager.persistAndFlush(audit);
        }

        Pageable firstPage = PageRequest.of(0, 5);
        Pageable secondPage = PageRequest.of(1, 5);

        Page<Audit> firstResult = auditRepository.findWithFilters(null, null, null, null, firstPage);
        Page<Audit> secondResult = auditRepository.findWithFilters(null, null, null, null, secondPage);

        assertThat(firstResult.getContent()).hasSize(5);
        assertThat(secondResult.getContent()).hasSize(5);
        assertThat(firstResult.getTotalElements()).isEqualTo(15); // 5 original + 10 new
        assertThat(firstResult.getTotalPages()).isEqualTo(3);
        assertThat(firstResult.hasNext()).isTrue();
        assertThat(secondResult.hasNext()).isTrue();
    }

    @Test
    @Disabled("Repository filtering deprecated - use service layer instead")
    void findWithFilters_ShouldHandleSorting() {
        Pageable sortedPageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "timestamp"));

        Page<Audit> result = auditRepository.findWithFilters(null, null, null, null, sortedPageable);

        assertThat(result.getContent()).hasSize(5);

        // Verify sorting (most recent first)
        List<Audit> audits = result.getContent();
        for (int i = 0; i < audits.size() - 1; i++) {
            assertThat(audits.get(i).getTimestamp()).isAfterOrEqualTo(audits.get(i + 1).getTimestamp());
        }
    }
}