package com.rabbitmq.admin.integration;

import com.rabbitmq.admin.model.*;
import com.rabbitmq.admin.repository.AuditRepository;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@TestPropertySource(properties = {
                "app.audit.write-operations.enabled=true",
                "app.audit.write-operations.async-processing=false"
})
@Transactional
class AuditControllerIntegrationTest extends IntegrationTestBase {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private AuditRepository auditRepository;

        @Autowired
        private ClusterConnectionRepository clusterConnectionRepository;

        private ClusterConnection testCluster;
        private User testUser;
        private User adminUser;

        @BeforeEach
        @Override
        void setUpTestData() {
                super.setUpTestData();

                auditRepository.deleteAll();
                clusterConnectionRepository.deleteAll();

                testCluster = new ClusterConnection();
                testCluster.setName("test-cluster");
                testCluster.setApiUrl("http://localhost:15672");
                testCluster.setUsername("guest");
                testCluster.setPassword("guest");
                testCluster = clusterConnectionRepository.save(testCluster);

                testUser = userRepository.findByUsernameIgnoreCase(testUserUsername).orElseThrow();
                adminUser = userRepository.findByUsernameIgnoreCase(testAdminUsername).orElseThrow();

                createTestAuditRecords();
        }

        private void createTestAuditRecords() {
                Instant now = Instant.now();

                Audit audit1 = new Audit(
                                testUser,
                                testCluster,
                                AuditOperationType.CREATE_EXCHANGE,
                                "exchange",
                                "test.exchange",
                                "{\"type\":\"direct\",\"durable\":true}",
                                AuditOperationStatus.SUCCESS,
                                null,
                                now.minusSeconds(3600),
                                "192.168.1.100",
                                "Mozilla/5.0");
                auditRepository.save(audit1);

                Audit audit2 = new Audit(
                                adminUser,
                                testCluster,
                                AuditOperationType.DELETE_QUEUE,
                                "queue",
                                "test.queue",
                                "{\"messages\":0,\"consumers\":0}",
                                AuditOperationStatus.SUCCESS,
                                null,
                                now.minusSeconds(1800),
                                "192.168.1.101",
                                "curl/7.68.0");
                auditRepository.save(audit2);
        }

        @Test
        void getAuditRecords_WithAdminToken_ShouldReturnAllRecords() throws Exception {
                mockMvc.perform(get("/api/audits")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.items", hasSize(2)))
                                .andExpect(jsonPath("$.totalItems", is(2)))
                                .andExpect(jsonPath("$.page", is(1)))
                                .andExpect(jsonPath("$.pageSize", is(50)));
        }

        @Test
        void getAuditRecords_WithRegularUserToken_ShouldReturnForbidden() throws Exception {
                mockMvc.perform(get("/api/audits")
                                .header("Authorization", "Bearer " + authToken))
                                .andExpect(status().isForbidden());
        }

        @Test
        void getAuditRecords_WithoutToken_ShouldReturnUnauthorized() throws Exception {
                mockMvc.perform(get("/api/audits"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void getAuditConfiguration_WithAdminToken_ShouldReturnConfiguration() throws Exception {
                mockMvc.perform(get("/api/audits/config")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
        }

        @Test
        void getAuditConfiguration_WithRegularUserToken_ShouldReturnForbidden() throws Exception {
                mockMvc.perform(get("/api/audits/config")
                                .header("Authorization", "Bearer " + authToken))
                                .andExpect(status().isForbidden());
        }
}
