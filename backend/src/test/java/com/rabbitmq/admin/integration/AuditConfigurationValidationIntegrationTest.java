package com.rabbitmq.admin.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.config.AuditConfigurationProperties;
import com.rabbitmq.admin.dto.AuditConfigurationDto;
import com.rabbitmq.admin.dto.CreateQueueRequest;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.repository.AuditRepository;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import com.rabbitmq.admin.service.RabbitMQResourceService;
import com.rabbitmq.admin.service.WriteAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import reactor.core.publisher.Mono;

import java.util.HashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for audit configuration validation and management.
 * Tests configuration property binding, validation, and runtime behavior.
 * 
 * Covers requirements: 2.1, 2.3
 */
class AuditConfigurationValidationIntegrationTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext applicationContext;

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
        testCluster.setName("config-test-cluster");
        testCluster.setApiUrl("http://localhost:15672");
        testCluster.setUsername("guest");
        testCluster.setPassword("guest");
        testCluster = clusterConnectionRepository.save(testCluster);
    }

    @Nested
    @DisplayName("Configuration Property Validation")
    @SpringBootTest
    @TestPropertySource(properties = {
            "app.audit.write-operations.enabled=true",
            "app.audit.write-operations.retention-days=90",
            "app.audit.write-operations.batch-size=100",
            "app.audit.write-operations.async-processing=false"
    })
    class ConfigurationPropertyValidation {

        @Autowired
        private AuditConfigurationProperties auditConfigProperties;

        @Test
        @DisplayName("Should bind configuration properties correctly")
        void configurationProperties_ShouldBindCorrectly() {
            // Then - Verify all properties are bound correctly
            assertThat(auditConfigProperties.isEnabled()).isTrue();
            assertThat(auditConfigProperties.getRetentionDays()).isEqualTo(90);
            assertThat(auditConfigProperties.getBatchSize()).isEqualTo(100);
            assertThat(auditConfigProperties.isAsyncProcessing()).isFalse();
        }

        @Test
        @DisplayName("Should expose configuration via API endpoint")
        void configurationEndpoint_ShouldExposeConfiguration() throws Exception {
            // When & Then
            mockMvc.perform(get("/api/audits/config")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.enabled", is(true)))
                    .andExpect(jsonPath("$.retentionDays", is(90)))
                    .andExpect(jsonPath("$.batchSize", is(100)))
                    .andExpect(jsonPath("$.asyncProcessing", is(false)));
        }

        @Test
        @DisplayName("Should create WriteAuditService bean when enabled")
        void enabledConfiguration_ShouldCreateAuditServiceBean() {
            // Then - Verify WriteAuditService bean exists
            assertThat(applicationContext.containsBean("writeAuditService")).isTrue();
            WriteAuditService auditService = applicationContext.getBean(WriteAuditService.class);
            assertThat(auditService).isNotNull();
        }

        @Test
        @DisplayName("Should audit operations when configuration is enabled")
        void enabledConfiguration_ShouldAuditOperations() throws Exception {
            // Given
            when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());

            CreateQueueRequest request = new CreateQueueRequest();
            request.setName("config-enabled-test-queue");
            request.setVhost("/");
            request.setDurable(true);
            request.setAutoDelete(false);
            request.setExclusive(false);
            request.setArguments(new HashMap<>());

            // When
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                    .header("Authorization", "Bearer " + authToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            // Then - Verify audit record was created
            assertThat(auditRepository.findAll()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Disabled Configuration Behavior")
    @SpringBootTest
    @TestPropertySource(properties = {
            "app.audit.write-operations.enabled=false"
    })
    class DisabledConfigurationBehavior {

        @Test
        @DisplayName("Should not create WriteAuditService bean when disabled")
        void disabledConfiguration_ShouldNotCreateAuditServiceBean() {
            // Then - Verify WriteAuditService bean does not exist
            assertThat(applicationContext.containsBean("writeAuditService")).isFalse();
        }

        @Test
        @DisplayName("Should not audit operations when configuration is disabled")
        void disabledConfiguration_ShouldNotAuditOperations() throws Exception {
            // Given
            when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());

            CreateQueueRequest request = new CreateQueueRequest();
            request.setName("config-disabled-test-queue");
            request.setVhost("/");
            request.setDurable(true);
            request.setAutoDelete(false);
            request.setExclusive(false);
            request.setArguments(new HashMap<>());

            // When
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                    .header("Authorization", "Bearer " + authToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            // Then - Verify no audit record was created
            assertThat(auditRepository.findAll()).isEmpty();
        }

        @Test
        @DisplayName("Should return disabled configuration via API endpoint")
        void disabledConfigurationEndpoint_ShouldReturnDisabledStatus() throws Exception {
            // When & Then
            mockMvc.perform(get("/api/audits/config")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.enabled", is(false)));
        }
    }

    @Nested
    @DisplayName("Configuration Validation Errors")
    @SpringBootTest
    @TestPropertySource(properties = {
            "app.audit.write-operations.enabled=true",
            "app.audit.write-operations.retention-days=-1", // Invalid negative value
            "app.audit.write-operations.batch-size=0" // Invalid zero value
    })
    class ConfigurationValidationErrors {

        @Test
        @DisplayName("Should handle invalid retention days configuration")
        void invalidRetentionDays_ShouldHandleGracefully() throws Exception {
            // When & Then - Should still expose configuration but with validation warnings
            mockMvc.perform(get("/api/audits/config")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.enabled", is(true)));

            // Note: In a real application, you might want to add validation
            // that prevents negative retention days or provides warnings
        }

        @Test
        @DisplayName("Should handle invalid batch size configuration")
        void invalidBatchSize_ShouldHandleGracefully() throws Exception {
            // When & Then - Should still function but may use default values
            mockMvc.perform(get("/api/audits/config")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.enabled", is(true)));
        }
    }

    @Nested
    @DisplayName("Default Configuration Behavior")
    @SpringBootTest
    @TestPropertySource(properties = {
    // No audit configuration properties set - should use defaults
    })
    class DefaultConfigurationBehavior {

        @Test
        @DisplayName("Should use default configuration when no properties are set")
        void noConfiguration_ShouldUseDefaults() throws Exception {
            // When & Then - Should use default values (disabled by default)
            mockMvc.perform(get("/api/audits/config")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.enabled", is(false))); // Default is disabled
        }

        @Test
        @DisplayName("Should not audit operations with default configuration")
        void defaultConfiguration_ShouldNotAuditOperations() throws Exception {
            // Given
            when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());

            CreateQueueRequest request = new CreateQueueRequest();
            request.setName("default-config-test-queue");
            request.setVhost("/");
            request.setDurable(true);

            // When
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                    .header("Authorization", "Bearer " + authToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            // Then - Verify no audit record was created (default is disabled)
            assertThat(auditRepository.findAll()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Configuration Security")
    class ConfigurationSecurity {

        @Test
        @DisplayName("Should require admin role to access configuration")
        void configurationAccess_ShouldRequireAdminRole() throws Exception {
            // When & Then - Regular user should be denied
            mockMvc.perform(get("/api/audits/config")
                    .header("Authorization", "Bearer " + authToken))
                    .andExpect(status().isForbidden());

            // And - Admin user should have access
            mockMvc.perform(get("/api/audits/config")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk());

            // And - Unauthenticated requests should be denied
            mockMvc.perform(get("/api/audits/config"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should not allow configuration modification via API")
        void configurationModification_ShouldNotBeAllowed() throws Exception {
            // Given
            AuditConfigurationDto configUpdate = new AuditConfigurationDto();
            configUpdate.setEnabled(false);
            configUpdate.setRetentionDays(30);

            // When & Then - Should not allow PUT/POST to configuration endpoint
            mockMvc.perform(put("/api/audits/config")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(configUpdate)))
                    .andExpect(status().isMethodNotAllowed());

            mockMvc.perform(post("/api/audits/config")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(configUpdate)))
                    .andExpect(status().isMethodNotAllowed());
        }
    }

    @Nested
    @DisplayName("Configuration Documentation and Examples")
    @SpringBootTest
    @TestPropertySource(properties = {
            "app.audit.write-operations.enabled=true",
            "app.audit.write-operations.retention-days=30",
            "app.audit.write-operations.batch-size=50",
            "app.audit.write-operations.async-processing=true"
    })
    class ConfigurationDocumentationAndExamples {

        @Test
        @DisplayName("Should provide complete configuration information")
        void configurationEndpoint_ShouldProvideCompleteInformation() throws Exception {
            // When & Then
            mockMvc.perform(get("/api/audits/config")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.enabled", is(true)))
                    .andExpect(jsonPath("$.retentionDays", is(30)))
                    .andExpect(jsonPath("$.batchSize", is(50)))
                    .andExpect(jsonPath("$.asyncProcessing", is(true)));
        }

        @Test
        @DisplayName("Should demonstrate production-ready configuration")
        void productionConfiguration_ShouldWorkCorrectly() throws Exception {
            // Given - Production-like configuration is already set in @TestPropertySource
            when(rabbitMQResourceService.createQueue(any(), any(), any())).thenReturn(Mono.empty());

            CreateQueueRequest request = new CreateQueueRequest();
            request.setName("production-config-test-queue");
            request.setVhost("/");
            request.setDurable(true);

            // When - Execute operation
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                    .header("Authorization", "Bearer " + authToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            // Then - Verify audit record was created with production configuration
            assertThat(auditRepository.findAll()).hasSize(1);

            // And - Verify configuration is accessible
            mockMvc.perform(get("/api/audits/config")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.enabled", is(true)))
                    .andExpect(jsonPath("$.retentionDays", is(30)))
                    .andExpect(jsonPath("$.batchSize", is(50)))
                    .andExpect(jsonPath("$.asyncProcessing", is(true)));
        }

        @Test
        @DisplayName("Should validate configuration values are within acceptable ranges")
        void configurationValidation_ShouldValidateRanges() throws Exception {
            // When & Then - Current configuration should be valid
            mockMvc.perform(get("/api/audits/config")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.retentionDays", allOf(greaterThan(0), lessThanOrEqualTo(365))))
                    .andExpect(jsonPath("$.batchSize", allOf(greaterThan(0), lessThanOrEqualTo(1000))));
        }
    }
}