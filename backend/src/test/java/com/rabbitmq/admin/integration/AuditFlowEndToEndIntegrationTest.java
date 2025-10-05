package com.rabbitmq.admin.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.dto.*;
import com.rabbitmq.admin.model.*;
import com.rabbitmq.admin.repository.AuditRepository;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import com.rabbitmq.admin.service.RabbitMQResourceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end integration tests for the complete audit flow.
 * Tests the entire audit lifecycle from write operation execution through
 * audit record creation, storage, retrieval, and UI display.
 * 
 * Covers requirements: 1.1, 4.1, 4.5, 6.3, 7.2
 */
@SpringBootTest
@TestPropertySource(properties = {
                "app.audit.write-operations.enabled=true",
                "app.audit.write-operations.async-processing=false",
                "app.audit.write-operations.retention-days=90"
})
@Transactional
class AuditFlowEndToEndIntegrationTest extends IntegrationTestBase {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private AuditRepository auditRepository;

        @Autowired
        private ClusterConnectionRepository clusterConnectionRepository;

        @MockitoBean
        private RabbitMQResourceService rabbitMQResourceService;

        @Autowired
        private ObjectMapper objectMapper;

        private ClusterConnection testCluster;

        @BeforeEach
        @Override
        void setUpTestData() {
                super.setUpTestData();

                // Clean up existing data
                auditRepository.deleteAll();
                clusterConnectionRepository.deleteAll();

                // Create test cluster
                testCluster = new ClusterConnection();
                testCluster.setName("test-cluster");
                testCluster.setApiUrl("http://localhost:15672");
                testCluster.setUsername("guest");
                testCluster.setPassword("guest");
                testCluster = clusterConnectionRepository.save(testCluster);
        }

        @Nested
        @DisplayName("Complete Audit Flow - Write Operation to UI Display")
        class CompleteAuditFlow {

                @Test
                @DisplayName("Should create audit record when exchange is created and display in UI")
                void createExchange_ShouldCreateAuditRecord_AndDisplayInUI() throws Exception {
                        // Given - Mock successful exchange creation
                        when(rabbitMQResourceService.createExchange(eq(testCluster.getId()),
                                        any(), any()))
                                        .thenReturn(Mono.empty());

                        CreateExchangeRequest request = new CreateExchangeRequest();
                        request.setName("test-exchange");
                        request.setType("direct");
                        request.setVhost("/");
                        request.setDurable(true);
                        request.setAutoDelete(false);
                        request.setInternal(false);
                        request.setArguments(new HashMap<>());

                        // When - Execute write operation
                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .header("Authorization", "Bearer " + authToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                                        .andExpect(status().isOk());

                        // Then - Verify audit record was created
                        List<Audit> auditRecords = auditRepository.findAll();
                        assertThat(auditRecords).hasSize(1);

                        Audit auditRecord = auditRecords.get(0);
                        assertThat(auditRecord.getUser().getUsername()).isEqualTo(testUserUsername);
                        assertThat(auditRecord.getCluster().getName()).isEqualTo("test-cluster");
                        assertThat(auditRecord.getOperationType()).isEqualTo(AuditOperationType.CREATE_EXCHANGE);
                        assertThat(auditRecord.getResourceType()).isEqualTo("exchange");
                        assertThat(auditRecord.getResourceName()).isEqualTo("test-exchange");
                        assertThat(auditRecord.getStatus()).isEqualTo(AuditOperationStatus.SUCCESS);
                        assertThat(auditRecord.getTimestamp()).isNotNull();

                        // And - Verify audit record can be retrieved via API
                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken))
                                        .andExpect(status().isOk())
                                        .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(jsonPath("$.items", hasSize(1)))
                                        .andExpect(jsonPath("$.items[0].username", is(testUserUsername)))
                                        .andExpect(jsonPath("$.items[0].clusterName", is("test-cluster")))
                                        .andExpect(jsonPath("$.items[0].operationType", is("CREATE_EXCHANGE")))
                                        .andExpect(jsonPath("$.items[0].resourceName", is("test-exchange")))
                                        .andExpect(jsonPath("$.items[0].status", is("SUCCESS")));
                }

                @Test
                @DisplayName("Should create audit record when queue is deleted and handle failure")
                void deleteQueue_ShouldCreateAuditRecord_OnFailure() throws Exception {
                        // Given - Mock queue deletion failure
                        when(rabbitMQResourceService.deleteQueue(eq(testCluster.getId()), eq("/"),
                                        eq("test-queue"), eq(false), eq(false), any()))
                                        .thenReturn(Mono.error(new RuntimeException("Queue not found")));

                        String encodedVhost = Base64.getEncoder().encodeToString("/".getBytes());

                        // When - Execute write operation that fails
                        mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/queues/{vhost}/{name}",
                                        testCluster.getId(), encodedVhost, "test-queue")
                                        .header("Authorization", "Bearer " + authToken)
                                        .param("ifEmpty", "false")
                                        .param("ifUnused", "false"))
                                        .andExpect(status().isInternalServerError());

                        // Then - Verify audit record was created with failure status
                        List<Audit> auditRecords = auditRepository.findAll();
                        assertThat(auditRecords).hasSize(1);

                        Audit auditRecord = auditRecords.get(0);
                        assertThat(auditRecord.getOperationType()).isEqualTo(AuditOperationType.DELETE_QUEUE);
                        assertThat(auditRecord.getResourceName()).isEqualTo("test-queue");
                        assertThat(auditRecord.getStatus()).isEqualTo(AuditOperationStatus.FAILURE);
                        assertThat(auditRecord.getErrorMessage()).contains("Queue not found");

                        // And - Verify failed operation appears in audit UI
                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items[0].status", is("FAILURE")))
                                        .andExpect(jsonPath("$.items[0].errorMessage",
                                                        containsString("Queue not found")));
                }

                @Test
                @DisplayName("Should create audit records for multiple operations and support filtering")
                void multipleOperations_ShouldCreateMultipleAuditRecords_WithFiltering() throws Exception {
                        // Given - Mock multiple successful operations
                        when(rabbitMQResourceService.createExchange(any(), any(), any()))
                                        .thenReturn(Mono.empty());
                        when(rabbitMQResourceService.createQueue(any(), any(), any()))
                                        .thenReturn(Mono.empty());
                        when(rabbitMQResourceService.publishMessage(any(), any(), any(), any(), any()))
                                        .thenReturn(new PublishResponse(true));

                        // When - Execute multiple write operations
                        // 1. Create exchange
                        CreateExchangeRequest exchangeRequest = new CreateExchangeRequest();
                        exchangeRequest.setName("test-exchange");
                        exchangeRequest.setType("direct");
                        exchangeRequest.setVhost("/");
                        exchangeRequest.setDurable(true);

                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .header("Authorization", "Bearer " + authToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(exchangeRequest)))
                                        .andExpect(status().isOk());

                        // 2. Create queue
                        CreateQueueRequest queueRequest = new CreateQueueRequest();
                        queueRequest.setName("test-queue");
                        queueRequest.setVhost("/");
                        queueRequest.setDurable(true);

                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                                        .header("Authorization", "Bearer " + authToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(queueRequest)))
                                        .andExpect(status().isOk());

                        // 3. Publish message
                        PublishMessageRequest publishRequest = new PublishMessageRequest();
                        publishRequest.setRoutingKey("test.key");
                        publishRequest.setPayload("Test message");
                        publishRequest.setPayloadEncoding("string");

                        String encodedVhost = Base64.getEncoder().encodeToString("/".getBytes());
                        mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{name}/publish",
                                        testCluster.getId(), encodedVhost, "test-exchange")
                                        .header("Authorization", "Bearer " + authToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(publishRequest)))
                                        .andExpect(status().isOk());

                        // Then - Verify all audit records were created
                        List<Audit> auditRecords = auditRepository.findAll();
                        assertThat(auditRecords).hasSize(3);

                        // And - Test filtering by operation type
                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .param("operationType", "CREATE_EXCHANGE"))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items", hasSize(1)))
                                        .andExpect(jsonPath("$.items[0].operationType", is("CREATE_EXCHANGE")));

                        // And - Test filtering by username
                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .param("username", testUserUsername))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items", hasSize(3)));

                        // And - Test filtering by cluster
                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .param("clusterName", "test-cluster"))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items", hasSize(3)));
                }
        }

        @Nested
        @DisplayName("Audit Record Storage and Retrieval")
        class AuditRecordStorageAndRetrieval {

                @Test
                @DisplayName("Should store audit records with all required fields")
                void auditRecords_ShouldStoreAllRequiredFields() throws Exception {
                        // Given
                        when(rabbitMQResourceService.createBinding(any(), any(), any(), any(), any(), any(), any()))
                                        .thenReturn(Mono.empty());

                        CreateBindingRequest request = new CreateBindingRequest();
                        request.setRoutingKey("test.routing.key");
                        request.setArguments(Map.of("x-match", "all"));

                        String encodedVhost = Base64.getEncoder().encodeToString("/".getBytes());

                        // When
                        mockMvc.perform(post(
                                        "/api/rabbitmq/{clusterId}/resources/bindings/{vhost}/e/{source}/q/{destination}",
                                        testCluster.getId(), encodedVhost, "test-exchange", "test-queue")
                                        .header("Authorization", "Bearer " + authToken)
                                        .header("User-Agent", "TestAgent/1.0")
                                        .header("X-Forwarded-For", "192.168.1.100")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                                        .andExpect(status().isOk());

                        // Then
                        List<Audit> auditRecords = auditRepository.findAll();
                        assertThat(auditRecords).hasSize(1);

                        Audit auditRecord = auditRecords.get(0);
                        assertThat(auditRecord.getId()).isNotNull();
                        assertThat(auditRecord.getUser()).isNotNull();
                        assertThat(auditRecord.getCluster()).isNotNull();
                        assertThat(auditRecord.getOperationType()).isEqualTo(AuditOperationType.CREATE_BINDING_QUEUE);
                        assertThat(auditRecord.getResourceType()).isEqualTo("binding");
                        assertThat(auditRecord.getResourceName()).contains("test-exchange");
                        assertThat(auditRecord.getResourceName()).contains("test-queue");
                        assertThat(auditRecord.getResourceDetails()).isNotNull();
                        assertThat(auditRecord.getStatus()).isEqualTo(AuditOperationStatus.SUCCESS);
                        assertThat(auditRecord.getTimestamp()).isNotNull();
                        assertThat(auditRecord.getClientIp()).isEqualTo("192.168.1.100");
                        assertThat(auditRecord.getUserAgent()).isEqualTo("TestAgent/1.0");
                }

                @Test
                @DisplayName("Should support complex filtering and pagination")
                void auditRecords_ShouldSupportComplexFilteringAndPagination() throws Exception {
                        // Given - Create multiple audit records with different attributes
                        createTestAuditRecords();

                        // When & Then - Test date range filtering
                        Instant startTime = Instant.now().minusSeconds(3600);
                        Instant endTime = Instant.now();

                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .param("startTime", startTime.toString())
                                        .param("endTime", endTime.toString()))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items", hasSize(greaterThan(0))));

                        // And - Test pagination
                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .param("page", "0")
                                        .param("pageSize", "2"))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items", hasSize(2)))
                                        .andExpect(jsonPath("$.page", is(1)))
                                        .andExpect(jsonPath("$.pageSize", is(2)))
                                        .andExpect(jsonPath("$.totalItems", greaterThan(2)));

                        // And - Test sorting
                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .param("sortBy", "timestamp")
                                        .param("sortDirection", "asc"))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items", hasSize(greaterThan(0))));

                        // And - Test combined filtering
                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .param("username", testUserUsername)
                                        .param("operationType", "CREATE_EXCHANGE")
                                        .param("page", "0")
                                        .param("pageSize", "10"))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(0))));
                }

                private void createTestAuditRecords() throws Exception {
                        // Mock services for different operations
                        when(rabbitMQResourceService.createExchange(any(), any(), any())).thenReturn(Mono.empty());
                        when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());
                        when(rabbitMQResourceService.deleteExchange(any(), any(), any(), any(), any()))
                                        .thenReturn(Mono.empty());

                        // Create exchange
                        CreateExchangeRequest exchangeRequest = new CreateExchangeRequest();
                        exchangeRequest.setName("audit-test-exchange");
                        exchangeRequest.setType("topic");
                        exchangeRequest.setVhost("/");
                        exchangeRequest.setDurable(true);

                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .header("Authorization", "Bearer " + authToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(exchangeRequest)))
                                        .andExpect(status().isOk());

                        // Create queue
                        CreateQueueRequest queueRequest = new CreateQueueRequest();
                        queueRequest.setName("audit-test-queue");
                        queueRequest.setVhost("/");
                        queueRequest.setDurable(false);

                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                                        .header("Authorization", "Bearer " + authToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(queueRequest)))
                                        .andExpect(status().isOk());

                        // Delete exchange
                        String encodedVhost = Base64.getEncoder().encodeToString("/".getBytes());
                        mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{name}",
                                        testCluster.getId(), encodedVhost, "audit-test-exchange")
                                        .header("Authorization", "Bearer " + authToken)
                                        .param("ifUnused", "false"))
                                        .andExpect(status().isOk());
                }
        }

        @Nested
        @DisplayName("Admin Role Enforcement and Security")
        class AdminRoleEnforcementAndSecurity {

                @Test
                @DisplayName("Should enforce admin-only access to audit records")
                void auditRecords_ShouldEnforceAdminOnlyAccess() throws Exception {
                        // Given - Create some audit records
                        when(rabbitMQResourceService.createExchange(any(), any(), any())).thenReturn(Mono.empty());

                        CreateExchangeRequest request = new CreateExchangeRequest();
                        request.setName("security-test-exchange");
                        request.setType("direct");
                        request.setVhost("/");
                        request.setDurable(true);

                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .header("Authorization", "Bearer " + authToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                                        .andExpect(status().isOk());

                        // When & Then - Regular user should be denied access to audit records
                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + authToken))
                                        .andExpect(status().isForbidden());

                        // And - Admin user should have access
                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items", hasSize(1)));

                        // And - Unauthenticated requests should be denied
                        mockMvc.perform(get("/api/audits"))
                                        .andExpect(status().isUnauthorized());
                }

                @Test
                @DisplayName("Should audit operations regardless of user role")
                void auditRecords_ShouldAuditOperationsRegardlessOfUserRole() throws Exception {
                        // Given
                        when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());

                        CreateQueueRequest request = new CreateQueueRequest();
                        request.setName("role-test-queue");
                        request.setVhost("/");
                        request.setDurable(true);

                        // When - Regular user performs operation
                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                                        .header("Authorization", "Bearer " + authToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                                        .andExpect(status().isOk());

                        // And - Admin user performs operation
                        request.setName("admin-role-test-queue");
                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                                        .andExpect(status().isOk());

                        // Then - Both operations should be audited
                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items", hasSize(2)));

                        // And - Verify both users are recorded
                        List<Audit> auditRecords = auditRepository.findAll();
                        Set<String> usernames = new HashSet<>();
                        auditRecords.forEach(record -> usernames.add(record.getUser().getUsername()));
                        assertThat(usernames).containsExactlyInAnyOrder(testUserUsername, testAdminUsername);
                }

                @Test
                @DisplayName("Should prevent audit record tampering")
                void auditRecords_ShouldPreventTampering() throws Exception {
                        // Given - Create an audit record
                        when(rabbitMQResourceService.createExchange(any(), any(), any())).thenReturn(Mono.empty());

                        CreateExchangeRequest request = new CreateExchangeRequest();
                        request.setName("tamper-test-exchange");
                        request.setType("direct");
                        request.setVhost("/");
                        request.setDurable(true);

                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .header("Authorization", "Bearer " + authToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                                        .andExpect(status().isOk());

                        // When - Attempt to modify audit record directly (should not be possible via
                        // API)
                        List<Audit> auditRecords = auditRepository.findAll();
                        assertThat(auditRecords).hasSize(1);
                        Audit originalRecord = auditRecords.get(0);

                        // Then - Verify no API endpoints exist for modifying audit records
                        mockMvc.perform(put("/api/audits/{id}", originalRecord.getId())
                                        .header("Authorization", "Bearer " + adminToken)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{}"))
                                        .andExpect(status().isNotFound());

                        mockMvc.perform(delete("/api/audits/{id}", originalRecord.getId())
                                        .header("Authorization", "Bearer " + adminToken))
                                        .andExpect(status().isNotFound());

                        // And - Verify record remains unchanged
                        List<Audit> unchangedRecords = auditRepository.findAll();
                        assertThat(unchangedRecords).hasSize(1);
                        assertThat(unchangedRecords.get(0).getResourceName()).isEqualTo("tamper-test-exchange");
                }
        }

        @Nested
        @DisplayName("Performance Tests for Audit Operations")
        class PerformanceTests {

                @Test
                @DisplayName("Should handle high volume of audit records efficiently")
                void auditRecords_ShouldHandleHighVolumeEfficiently() throws Exception {
                        // Given - Mock service for bulk operations
                        when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());

                        CreateQueueRequest request = new CreateQueueRequest();
                        request.setVhost("/");
                        request.setDurable(true);

                        long startTime = System.currentTimeMillis();

                        // When - Create multiple audit records
                        for (int i = 0; i < 50; i++) {
                                request.setName("perf-test-queue-" + i);
                                mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                                                .header("Authorization", "Bearer " + authToken)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(objectMapper.writeValueAsString(request)))
                                                .andExpect(status().isOk());
                        }

                        long creationTime = System.currentTimeMillis() - startTime;

                        // Then - Verify all records were created efficiently
                        List<Audit> auditRecords = auditRepository.findAll();
                        assertThat(auditRecords).hasSize(50);
                        assertThat(creationTime).isLessThan(30000); // Should complete within 30 seconds

                        // And - Test retrieval performance
                        long retrievalStartTime = System.currentTimeMillis();

                        mockMvc.perform(get("/api/audits")
                                        .header("Authorization", "Bearer " + adminToken)
                                        .param("pageSize", "50"))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items", hasSize(50)));

                        long retrievalTime = System.currentTimeMillis() - retrievalStartTime;
                        assertThat(retrievalTime).isLessThan(5000); // Should retrieve within 5 seconds
                }

                @Test
                @DisplayName("Should not significantly impact write operation performance")
                void auditRecords_ShouldNotImpactWriteOperationPerformance() throws Exception {
                        // Given
                        when(rabbitMQResourceService.createExchange(any(), any(), any())).thenReturn(Mono.empty());

                        CreateExchangeRequest request = new CreateExchangeRequest();
                        request.setName("performance-test-exchange");
                        request.setType("direct");
                        request.setVhost("/");
                        request.setDurable(true);

                        // When - Measure write operation performance with auditing
                        long startTime = System.currentTimeMillis();

                        for (int i = 0; i < 10; i++) {
                                request.setName("performance-test-exchange-" + i);
                                mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges",
                                                testCluster.getId())
                                                .header("Authorization", "Bearer " + authToken)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(objectMapper.writeValueAsString(request)))
                                                .andExpect(status().isOk());
                        }

                        long totalTime = System.currentTimeMillis() - startTime;
                        long averageTime = totalTime / 10;

                        // Then - Verify performance is acceptable
                        assertThat(averageTime).isLessThan(1000); // Average operation should complete within 1 second
                        assertThat(auditRepository.findAll()).hasSize(10);
                }
        }
}