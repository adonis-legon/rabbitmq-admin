package com.rabbitmq.admin.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.dto.CreateExchangeRequest;
import com.rabbitmq.admin.dto.CreateQueueRequest;
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
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Performance integration tests for audit operations.
 * Tests audit system performance under various load conditions.
 * 
 * Covers requirements: 6.3, 7.2
 */
@SpringBootTest
@TestPropertySource(properties = {
        "app.audit.write-operations.enabled=true",
        "app.audit.write-operations.async-processing=false",
        "app.audit.write-operations.batch-size=100"
})
@Transactional
class AuditPerformanceIntegrationTest extends IntegrationTestBase {

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

        auditRepository.deleteAll();
        clusterConnectionRepository.deleteAll();

        testCluster = new ClusterConnection();
        testCluster.setName("perf-test-cluster");
        testCluster.setApiUrl("http://localhost:15672");
        testCluster.setUsername("guest");
        testCluster.setPassword("guest");
        testCluster = clusterConnectionRepository.save(testCluster);
    }

    @Nested
    @DisplayName("Audit Record Creation Performance")
    class AuditRecordCreationPerformance {

        @Test
        @DisplayName("Should handle high volume of sequential write operations efficiently")
        void sequentialWriteOperations_ShouldPerformEfficiently() throws Exception {
            // Given
            when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());

            CreateQueueRequest request = new CreateQueueRequest();
            request.setVhost("/");
            request.setDurable(true);
            request.setAutoDelete(false);
            request.setExclusive(false);
            request.setArguments(new HashMap<>());

            int operationCount = 100;
            long startTime = System.currentTimeMillis();

            // When - Execute sequential operations
            for (int i = 0; i < operationCount; i++) {
                request.setName("perf-test-queue-" + i);
                mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isOk());
            }

            long totalTime = System.currentTimeMillis() - startTime;
            double averageTime = (double) totalTime / operationCount;

            // Then - Verify performance metrics
            assertThat(totalTime).isLessThan(60000); // Should complete within 60 seconds
            assertThat(averageTime).isLessThan(600); // Average operation should be under 600ms

            // And - Verify all audit records were created
            List<Audit> auditRecords = auditRepository.findAll();
            assertThat(auditRecords).hasSize(operationCount);

            System.out.println(String.format(
                    "Sequential Operations Performance: %d operations in %dms (avg: %.2fms per operation)",
                    operationCount, totalTime, averageTime));
        }

        @Test
        @DisplayName("Should handle concurrent write operations without performance degradation")
        void concurrentWriteOperations_ShouldMaintainPerformance() throws Exception {
            // Given
            when(rabbitMQResourceService.createExchange(any(), any(), any())).thenReturn(Mono.empty());

            int threadCount = 10;
            int operationsPerThread = 20;
            int totalOperations = threadCount * operationsPerThread;

            ExecutorService executor = Executors.newFixedThreadPool(threadCount);
            long startTime = System.currentTimeMillis();

            // When - Execute concurrent operations
            @SuppressWarnings("unchecked")
            CompletableFuture<Void>[] futures = new CompletableFuture[threadCount];

            for (int t = 0; t < threadCount; t++) {
                final int threadId = t;
                futures[t] = CompletableFuture.runAsync(() -> {
                    try {
                        for (int i = 0; i < operationsPerThread; i++) {
                            CreateExchangeRequest request = new CreateExchangeRequest();
                            request.setName("perf-test-exchange-" + threadId + "-" + i);
                            request.setType("direct");
                            request.setVhost("/");
                            request.setDurable(true);
                            request.setAutoDelete(false);
                            request.setInternal(false);
                            request.setArguments(new HashMap<>());

                            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                    .header("Authorization", "Bearer " + authToken)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(request)))
                                    .andExpect(status().isOk());
                        }
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                }, executor);
            }

            // Wait for all operations to complete
            CompletableFuture.allOf(futures).get(120, TimeUnit.SECONDS);
            long totalTime = System.currentTimeMillis() - startTime;
            double averageTime = (double) totalTime / totalOperations;

            executor.shutdown();

            // Then - Verify performance metrics
            assertThat(totalTime).isLessThan(120000); // Should complete within 2 minutes
            assertThat(averageTime).isLessThan(1000); // Average operation should be under 1 second

            // And - Verify all audit records were created
            List<Audit> auditRecords = auditRepository.findAll();
            assertThat(auditRecords).hasSize(totalOperations);

            System.out.println(String.format(
                    "Concurrent Operations Performance: %d operations (%d threads) in %dms (avg: %.2fms per operation)",
                    totalOperations, threadCount, totalTime, averageTime));
        }

        @Test
        @DisplayName("Should maintain consistent performance with mixed operation types")
        void mixedOperationTypes_ShouldMaintainConsistentPerformance() throws Exception {
            // Given
            when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());
            when(rabbitMQResourceService.createExchange(any(), any(), any())).thenReturn(Mono.empty());
            when(rabbitMQResourceService.deleteQueue(any(), any(), any(), any(), any(), any()))
                    .thenReturn(Mono.empty());

            int operationsPerType = 30;
            long startTime = System.currentTimeMillis();

            // When - Execute mixed operations
            // Create queues
            for (int i = 0; i < operationsPerType; i++) {
                CreateQueueRequest queueRequest = new CreateQueueRequest();
                queueRequest.setName("mixed-perf-queue-" + i);
                queueRequest.setVhost("/");
                queueRequest.setDurable(true);

                mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(queueRequest)))
                        .andExpect(status().isOk());
            }

            // Create exchanges
            for (int i = 0; i < operationsPerType; i++) {
                CreateExchangeRequest exchangeRequest = new CreateExchangeRequest();
                exchangeRequest.setName("mixed-perf-exchange-" + i);
                exchangeRequest.setType("topic");
                exchangeRequest.setVhost("/");
                exchangeRequest.setDurable(true);

                mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(exchangeRequest)))
                        .andExpect(status().isOk());
            }

            // Delete queues
            String encodedVhost = java.util.Base64.getEncoder().encodeToString("/".getBytes());
            for (int i = 0; i < operationsPerType; i++) {
                mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/queues/{vhost}/{name}",
                        testCluster.getId(), encodedVhost, "mixed-perf-queue-" + i)
                        .header("Authorization", "Bearer " + authToken)
                        .param("ifEmpty", "false")
                        .param("ifUnused", "false"))
                        .andExpect(status().isOk());
            }

            long totalTime = System.currentTimeMillis() - startTime;
            int totalOperations = operationsPerType * 3;
            double averageTime = (double) totalTime / totalOperations;

            // Then - Verify performance metrics
            assertThat(totalTime).isLessThan(90000); // Should complete within 90 seconds
            assertThat(averageTime).isLessThan(1000); // Average operation should be under 1 second

            // And - Verify all audit records were created
            List<Audit> auditRecords = auditRepository.findAll();
            assertThat(auditRecords).hasSize(totalOperations);

            // And - Verify different operation types are recorded
            long createQueueCount = auditRecords.stream()
                    .filter(r -> r.getOperationType() == AuditOperationType.CREATE_QUEUE)
                    .count();
            long createExchangeCount = auditRecords.stream()
                    .filter(r -> r.getOperationType() == AuditOperationType.CREATE_EXCHANGE)
                    .count();
            long deleteQueueCount = auditRecords.stream()
                    .filter(r -> r.getOperationType() == AuditOperationType.DELETE_QUEUE)
                    .count();

            assertThat(createQueueCount).isEqualTo(operationsPerType);
            assertThat(createExchangeCount).isEqualTo(operationsPerType);
            assertThat(deleteQueueCount).isEqualTo(operationsPerType);

            System.out.println(String.format(
                    "Mixed Operations Performance: %d operations in %dms (avg: %.2fms per operation)",
                    totalOperations, totalTime, averageTime));
        }
    }

    @Nested
    @DisplayName("Audit Record Retrieval Performance")
    class AuditRecordRetrievalPerformance {

        @Test
        @DisplayName("Should retrieve audit records efficiently with large datasets")
        void largeDatasetRetrieval_ShouldPerformEfficiently() throws Exception {
            // Given - Create large dataset of audit records
            createLargeAuditDataset(500);

            long startTime = System.currentTimeMillis();

            // When - Retrieve audit records with pagination
            mockMvc.perform(get("/api/audits")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("page", "0")
                    .param("pageSize", "50"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items", hasSize(50)))
                    .andExpect(jsonPath("$.totalItems", is(500)));

            long retrievalTime = System.currentTimeMillis() - startTime;

            // Then - Verify retrieval performance
            assertThat(retrievalTime).isLessThan(5000); // Should retrieve within 5 seconds

            System.out.println(String.format(
                    "Large Dataset Retrieval Performance: 50 records from 500 total in %dms",
                    retrievalTime));
        }

        @Test
        @DisplayName("Should handle complex filtering efficiently")
        void complexFiltering_ShouldPerformEfficiently() throws Exception {
            // Given - Create diverse audit dataset
            createDiverseAuditDataset(200);

            long startTime = System.currentTimeMillis();

            // When - Apply complex filters
            mockMvc.perform(get("/api/audits")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("username", testUserUsername)
                    .param("operationType", "CREATE_QUEUE")
                    .param("startTime", Instant.now().minusSeconds(3600).toString())
                    .param("endTime", Instant.now().toString())
                    .param("page", "0")
                    .param("pageSize", "25"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items", hasSize(lessThanOrEqualTo(25))));

            long filterTime = System.currentTimeMillis() - startTime;

            // Then - Verify filtering performance
            assertThat(filterTime).isLessThan(3000); // Should filter within 3 seconds

            System.out.println(String.format(
                    "Complex Filtering Performance: filtered 200 records in %dms",
                    filterTime));
        }

        @Test
        @DisplayName("Should handle sorting efficiently")
        void sorting_ShouldPerformEfficiently() throws Exception {
            // Given - Create audit dataset
            createLargeAuditDataset(300);

            long startTime = System.currentTimeMillis();

            // When - Sort by different fields
            mockMvc.perform(get("/api/audits")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("sortBy", "timestamp")
                    .param("sortDirection", "desc")
                    .param("page", "0")
                    .param("pageSize", "50"))
                    .andExpect(status().isOk());

            long sortTime = System.currentTimeMillis() - startTime;

            // Then - Verify sorting performance
            assertThat(sortTime).isLessThan(3000); // Should sort within 3 seconds

            System.out.println(String.format(
                    "Sorting Performance: sorted 300 records in %dms",
                    sortTime));
        }

        private void createLargeAuditDataset(int recordCount) throws Exception {
            when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());

            CreateQueueRequest request = new CreateQueueRequest();
            request.setVhost("/");
            request.setDurable(true);

            for (int i = 0; i < recordCount; i++) {
                request.setName("large-dataset-queue-" + i);
                mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isOk());
            }
        }

        private void createDiverseAuditDataset(int recordCount) throws Exception {
            when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());
            when(rabbitMQResourceService.createExchange(any(), any(), any())).thenReturn(Mono.empty());

            // Create mix of operations with different users
            for (int i = 0; i < recordCount; i++) {
                String authTokenToUse = (i % 2 == 0) ? authToken : adminToken;

                if (i % 3 == 0) {
                    // Create queue
                    CreateQueueRequest queueRequest = new CreateQueueRequest();
                    queueRequest.setName("diverse-queue-" + i);
                    queueRequest.setVhost("/");
                    queueRequest.setDurable(true);

                    mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                            .header("Authorization", "Bearer " + authTokenToUse)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(queueRequest)))
                            .andExpect(status().isOk());
                } else {
                    // Create exchange
                    CreateExchangeRequest exchangeRequest = new CreateExchangeRequest();
                    exchangeRequest.setName("diverse-exchange-" + i);
                    exchangeRequest.setType("direct");
                    exchangeRequest.setVhost("/");
                    exchangeRequest.setDurable(true);

                    mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                            .header("Authorization", "Bearer " + authTokenToUse)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(exchangeRequest)))
                            .andExpect(status().isOk());
                }
            }
        }
    }

    @Nested
    @DisplayName("Memory and Resource Usage")
    class MemoryAndResourceUsage {

        @Test
        @DisplayName("Should maintain reasonable memory usage during high volume operations")
        void highVolumeOperations_ShouldMaintainReasonableMemoryUsage() throws Exception {
            // Given
            when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());

            Runtime runtime = Runtime.getRuntime();
            long initialMemory = runtime.totalMemory() - runtime.freeMemory();

            CreateQueueRequest request = new CreateQueueRequest();
            request.setVhost("/");
            request.setDurable(true);

            // When - Execute high volume operations
            int operationCount = 200;
            for (int i = 0; i < operationCount; i++) {
                request.setName("memory-test-queue-" + i);
                mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isOk());

                // Force garbage collection periodically
                if (i % 50 == 0) {
                    System.gc();
                    Thread.sleep(100);
                }
            }

            System.gc();
            Thread.sleep(500);
            long finalMemory = runtime.totalMemory() - runtime.freeMemory();
            long memoryIncrease = finalMemory - initialMemory;

            // Then - Verify memory usage is reasonable
            assertThat(memoryIncrease).isLessThan(100 * 1024 * 1024); // Should not increase by more than 100MB

            // And - Verify all records were created
            List<Audit> auditRecords = auditRepository.findAll();
            assertThat(auditRecords).hasSize(operationCount);

            System.out.println(String.format(
                    "Memory Usage: %d operations increased memory by %.2f MB",
                    operationCount, memoryIncrease / (1024.0 * 1024.0)));
        }
    }
}