package com.rabbitmq.admin.integration;

import com.rabbitmq.admin.config.ValidationConfig;
import com.rabbitmq.admin.dto.PagedResponse;
import com.rabbitmq.admin.dto.ConnectionDto;
import com.rabbitmq.admin.dto.PaginationRequest;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.security.UserPrincipal;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import com.rabbitmq.admin.service.RabbitMQResourceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;

/**
 * Integration tests for RabbitMQ Resource Controller endpoints.
 * Tests complete API flow with authentication and database integration.
 */
@Import(ValidationConfig.class)
class RabbitMQResourceControllerIntegrationTest extends IntegrationTestBase {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ClusterConnectionRepository clusterConnectionRepository;

        @MockitoBean
        private RabbitMQResourceService rabbitMQResourceService;

        private ClusterConnection testCluster;

        @BeforeEach
        void setUpTestData() {
                // Call parent setup first
                super.setUpTestData();

                // Clear existing cluster data
                clusterConnectionRepository.deleteAll();

                // Create test cluster connection using constructor
                testCluster = new ClusterConnection("Test Cluster", "http://localhost:15672", "testuser", "testpass");
                testCluster = clusterConnectionRepository.save(testCluster);
        }

        @Test
        @Transactional
        void getConnections_ShouldReturnConnections_WhenServiceReturnsData() throws Exception {
                // Given
                ClusterConnection cluster = new ClusterConnection();
                cluster.setName("test-cluster");
                cluster.setApiUrl("http://localhost:15672");
                cluster.setUsername("testuser");
                cluster.setPassword("testpass");
                cluster.setActive(true);
                cluster = clusterConnectionRepository.save(cluster);

                List<ConnectionDto> connections = new ArrayList<>();
                ConnectionDto connection = new ConnectionDto();
                connection.setName("connection1");
                connection.setHost("127.0.0.1");
                connection.setState("running");
                connections.add(connection);

                PagedResponse<ConnectionDto> pagedResponse = new PagedResponse<ConnectionDto>(connections, 1, 10, 1);

                when(rabbitMQResourceService.getConnections(eq(cluster.getId()), any(PaginationRequest.class),
                                any(User.class)))
                                .thenReturn(Mono.just(pagedResponse));

                // Create a test user and UserPrincipal (similar to what JWT authentication
                // would provide)
                User testUser = new User("testuser", "encoded-password", UserRole.USER);
                UserPrincipal userPrincipal = UserPrincipal.create(testUser);

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userPrincipal, null, userPrincipal.getAuthorities());

                // When & Then - Direct synchronous request
                mockMvc.perform(get("/api/rabbitmq/{clusterId}/resources/connections", cluster.getId())
                                .with(authentication(auth))
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.items").isArray())
                                .andExpect(jsonPath("$.totalItems").value(1));
        }
}
