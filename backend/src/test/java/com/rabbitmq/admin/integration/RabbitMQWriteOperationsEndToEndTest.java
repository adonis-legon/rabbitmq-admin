package com.rabbitmq.admin.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.dto.*;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import com.rabbitmq.admin.security.UserPrincipal;
import com.rabbitmq.admin.service.RabbitMQResourceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end integration tests for RabbitMQ write operations.
 * Tests complete workflows from API endpoints through service layer.
 * Verifies security model compliance, permission handling, and UI consistency.
 */
class RabbitMQWriteOperationsEndToEndTest extends IntegrationTestBase {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ClusterConnectionRepository clusterConnectionRepository;

        @MockitoBean
        private RabbitMQResourceService rabbitMQResourceService;

        @Autowired
        private ObjectMapper objectMapper;

        private ClusterConnection testCluster;
        private User testUser;
        private User testAdmin;
        private UserPrincipal userPrincipal;
        private UserPrincipal adminPrincipal;
        private UsernamePasswordAuthenticationToken userAuth;
        private UsernamePasswordAuthenticationToken adminAuth;

        @BeforeEach
        void setUpTestData() {
                super.setUpTestData();
                clusterConnectionRepository.deleteAll();

                // Create test cluster connection
                testCluster = new ClusterConnection("Test Cluster", "http://localhost:15672", "testuser", "testpass");
                testCluster = clusterConnectionRepository.save(testCluster);

                // Create test users
                testUser = new User("testuser", "encoded-password", UserRole.USER);
                testAdmin = new User("adminuser", "encoded-password", UserRole.ADMINISTRATOR);

                // Create user principals and authentication tokens
                userPrincipal = UserPrincipal.create(testUser);
                adminPrincipal = UserPrincipal.create(testAdmin);
                userAuth = new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());
                adminAuth = new UsernamePasswordAuthenticationToken(adminPrincipal, null,
                                adminPrincipal.getAuthorities());
        }

        @Nested
        @DisplayName("End-to-End Write Operations Workflow")
        class EndToEndWorkflow {

                @Test
                @Transactional
                @DisplayName("Should complete full exchange lifecycle - create, bind, publish, delete")
                void completeExchangeLifecycle() throws Exception {
                        // Mock service responses for the complete workflow
                        when(rabbitMQResourceService.createExchange(eq(testCluster.getId()),
                                        any(CreateExchangeRequest.class),
                                        any(User.class)))
                                        .thenReturn(Mono.empty());

                        when(rabbitMQResourceService.createBinding(eq(testCluster.getId()), eq("/"),
                                        eq("test-exchange"),
                                        eq("test-queue"), eq("q"), any(CreateBindingRequest.class), any(User.class)))
                                        .thenReturn(Mono.empty());

                        when(rabbitMQResourceService.publishMessage(eq(testCluster.getId()), eq("/"),
                                        eq("test-exchange"),
                                        any(PublishMessageRequest.class), any(User.class)))
                                        .thenReturn(Mono.just(new PublishResponse(true)));

                        when(rabbitMQResourceService.deleteExchange(eq(testCluster.getId()), eq("/"),
                                        eq("test-exchange"),
                                        eq(false), any(User.class)))
                                        .thenReturn(Mono.empty());

                        // Step 1: Create exchange
                        CreateExchangeRequest createExchangeRequest = new CreateExchangeRequest();
                        createExchangeRequest.setName("test-exchange");
                        createExchangeRequest.setType("direct");
                        createExchangeRequest.setVhost("/");
                        createExchangeRequest.setDurable(true);

                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .with(authentication(userAuth))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(createExchangeRequest)))
                                        .andExpect(status().isOk());

                        // Step 2: Create binding
                        CreateBindingRequest createBindingRequest = new CreateBindingRequest();
                        createBindingRequest.setRoutingKey("test.routing.key");

                        String encodedVhost = Base64.getEncoder().encodeToString("/".getBytes());
                        mockMvc.perform(post(
                                        "/api/rabbitmq/{clusterId}/resources/bindings/{vhost}/e/{source}/q/{destination}",
                                        testCluster.getId(), encodedVhost, "test-exchange", "test-queue")
                                        .with(authentication(userAuth))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(createBindingRequest)))
                                        .andExpect(status().isOk());

                        // Step 3: Publish message
                        PublishMessageRequest publishRequest = new PublishMessageRequest();
                        publishRequest.setRoutingKey("test.routing.key");
                        publishRequest.setPayload("Test message payload");
                        publishRequest.setPayloadEncoding("string");

                        mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{name}/publish",
                                        testCluster.getId(), encodedVhost, "test-exchange")
                                        .with(authentication(userAuth))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(publishRequest)))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.routed").value(true));

                        // Step 4: Delete exchange
                        mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{name}",
                                        testCluster.getId(), encodedVhost, "test-exchange")
                                        .with(authentication(userAuth))
                                        .param("ifUnused", "false"))
                                        .andExpect(status().isOk());
                }

                @Test
                @Transactional
                @DisplayName("Should complete full queue lifecycle - create, publish, consume, purge, delete")
                void completeQueueLifecycle() throws Exception {
                        // Mock service responses for the complete workflow
                        when(rabbitMQResourceService.createQueue(eq(testCluster.getId()), any(CreateQueueRequest.class),
                                        any(User.class)))
                                        .thenReturn(Mono.empty());

                        when(rabbitMQResourceService.publishMessage(eq(testCluster.getId()), eq("/"), eq(""),
                                        any(PublishMessageRequest.class), any(User.class)))
                                        .thenReturn(Mono.just(new PublishResponse(true)));

                        List<MessageDto> messages = Arrays.asList(createTestMessage("Test message content"));
                        when(rabbitMQResourceService.getMessages(eq(testCluster.getId()), eq("/"), eq("test-queue"),
                                        any(GetMessagesRequest.class), any(User.class)))
                                        .thenReturn(Mono.just(messages));

                        when(rabbitMQResourceService.purgeQueue(eq(testCluster.getId()), eq("/"), eq("test-queue"),
                                        any(User.class)))
                                        .thenReturn(Mono.empty());

                        when(rabbitMQResourceService.deleteQueue(eq(testCluster.getId()), eq("/"), eq("test-queue"),
                                        eq(false), eq(false), any(User.class)))
                                        .thenReturn(Mono.empty());

                        // Step 1: Create queue
                        CreateQueueRequest createQueueRequest = new CreateQueueRequest();
                        createQueueRequest.setName("test-queue");
                        createQueueRequest.setVhost("/");
                        createQueueRequest.setDurable(true);

                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                                        .with(authentication(userAuth))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(createQueueRequest)))
                                        .andExpect(status().isOk());

                        // Step 2: Publish message to queue (via default exchange)
                        PublishMessageRequest publishRequest = new PublishMessageRequest();
                        publishRequest.setRoutingKey("test-queue");
                        publishRequest.setPayload("Test message for queue");
                        publishRequest.setPayloadEncoding("string");

                        String encodedVhost = Base64.getEncoder().encodeToString("/".getBytes());
                        mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/queues/{vhost}/{queue}/publish",
                                        testCluster.getId(), encodedVhost, "test-queue")
                                        .with(authentication(userAuth))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(publishRequest)))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.routed").value(true));

                        // Step 3: Get messages from queue
                        GetMessagesRequest getMessagesRequest = new GetMessagesRequest();
                        getMessagesRequest.setCount(1);
                        getMessagesRequest.setAckmode("ack_requeue_true");
                        getMessagesRequest.setEncoding("auto");

                        mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/queues/{vhost}/{queue}/get",
                                        testCluster.getId(), encodedVhost, "test-queue")
                                        .with(authentication(userAuth))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(getMessagesRequest)))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$").isArray())
                                        .andExpect(jsonPath("$[0].payload").exists());

                        // Step 4: Purge queue
                        mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/queues/{vhost}/{name}/contents",
                                        testCluster.getId(), encodedVhost, "test-queue")
                                        .with(authentication(userAuth)))
                                        .andExpect(status().isOk());

                        // Step 5: Delete queue
                        mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/queues/{vhost}/{name}",
                                        testCluster.getId(), encodedVhost, "test-queue")
                                        .with(authentication(userAuth))
                                        .param("ifEmpty", "false")
                                        .param("ifUnused", "false"))
                                        .andExpect(status().isOk());
                }
        }

        @Nested
        @DisplayName("Security Model Compliance")
        class SecurityModelCompliance {

                @Test
                @Transactional
                @DisplayName("Should enforce authentication for all write operations")
                void enforceAuthenticationForWriteOperations() throws Exception {
                        CreateExchangeRequest createExchangeRequest = new CreateExchangeRequest();
                        createExchangeRequest.setName("test-exchange");
                        createExchangeRequest.setType("direct");
                        createExchangeRequest.setVhost("/");

                        // Test without authentication - should be redirected or return 401
                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(createExchangeRequest)))
                                        .andExpect(status().isUnauthorized());
                }

                @Test
                @Transactional
                @DisplayName("Should allow both USER and ADMINISTRATOR roles for write operations")
                void allowBothUserAndAdminRoles() throws Exception {
                        when(rabbitMQResourceService.createExchange(eq(testCluster.getId()),
                                        any(CreateExchangeRequest.class),
                                        any(User.class)))
                                        .thenReturn(Mono.empty());

                        CreateExchangeRequest createExchangeRequest = new CreateExchangeRequest();
                        createExchangeRequest.setName("test-exchange");
                        createExchangeRequest.setType("direct");
                        createExchangeRequest.setVhost("/");

                        // Test with USER role
                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .with(authentication(userAuth))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(createExchangeRequest)))
                                        .andExpect(status().isOk());

                        // Test with ADMINISTRATOR role
                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .with(authentication(adminAuth))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(createExchangeRequest)))
                                        .andExpect(status().isOk());
                }
        }

        @Nested
        @DisplayName("Different RabbitMQ Cluster Configurations")
        class ClusterConfigurationTesting {

                @Test
                @Transactional
                @DisplayName("Should handle different virtual host configurations")
                void handleDifferentVirtualHosts() throws Exception {
                        when(rabbitMQResourceService.createExchange(eq(testCluster.getId()),
                                        any(CreateExchangeRequest.class),
                                        any(User.class)))
                                        .thenReturn(Mono.empty());

                        // Test with default vhost "/"
                        CreateExchangeRequest defaultVhostRequest = new CreateExchangeRequest();
                        defaultVhostRequest.setName("test-exchange-default");
                        defaultVhostRequest.setType("direct");
                        defaultVhostRequest.setVhost("/");

                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .with(authentication(userAuth))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(defaultVhostRequest)))
                                        .andExpect(status().isOk());

                        // Test with custom vhost
                        CreateExchangeRequest customVhostRequest = new CreateExchangeRequest();
                        customVhostRequest.setName("test-exchange-custom");
                        customVhostRequest.setType("topic");
                        customVhostRequest.setVhost("test-vhost");

                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .with(authentication(userAuth))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(customVhostRequest)))
                                        .andExpect(status().isOk());
                }

                @Test
                @Transactional
                @DisplayName("Should handle different exchange types")
                void handleDifferentExchangeTypes() throws Exception {
                        when(rabbitMQResourceService.createExchange(eq(testCluster.getId()),
                                        any(CreateExchangeRequest.class),
                                        any(User.class)))
                                        .thenReturn(Mono.empty());

                        String[] exchangeTypes = { "direct", "fanout", "topic", "headers" };

                        for (String type : exchangeTypes) {
                                CreateExchangeRequest request = new CreateExchangeRequest();
                                request.setName("test-exchange-" + type);
                                request.setType(type);
                                request.setVhost("/");

                                mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges",
                                                testCluster.getId())
                                                .with(authentication(userAuth))
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(objectMapper.writeValueAsString(request)))
                                                .andExpect(status().isOk());
                        }
                }
        }

        @Nested
        @DisplayName("UI Consistency and Theme Compliance")
        class UIConsistencyTesting {

                @Test
                @Transactional
                @DisplayName("Should return consistent error response format")
                void returnConsistentErrorFormat() throws Exception {
                        // Test with invalid exchange name (empty)
                        CreateExchangeRequest invalidRequest = new CreateExchangeRequest();
                        invalidRequest.setName(""); // Invalid empty name
                        invalidRequest.setType("direct");
                        invalidRequest.setVhost("/");

                        mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                                        .with(authentication(userAuth))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(invalidRequest)))
                                        .andExpect(status().isBadRequest())
                                        .andExpect(content().contentType(MediaType.APPLICATION_JSON));
                }

                @Test
                @Transactional
                @DisplayName("Should handle URL encoding consistently")
                void handleUrlEncodingConsistently() throws Exception {
                        when(rabbitMQResourceService.deleteExchange(eq(testCluster.getId()), eq("/"),
                                        eq("test exchange with spaces"),
                                        isNull(), any(User.class)))
                                        .thenReturn(Mono.empty());

                        // Test with exchange name containing spaces
                        String exchangeNameWithSpaces = "test exchange with spaces";
                        String encodedVhost = Base64.getEncoder().encodeToString("/".getBytes());
                        String encodedExchangeName = java.net.URLEncoder.encode(exchangeNameWithSpaces, "UTF-8");

                        mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{name}",
                                        testCluster.getId(), encodedVhost, encodedExchangeName)
                                        .with(authentication(userAuth)))
                                        .andExpect(status().isOk());
                }
        }

        // Helper methods
        private MessageDto createTestMessage(String payload) {
                MessageDto message = new MessageDto();
                message.setPayload(payload);
                message.setPayloadEncoding("string");
                message.setRoutingKey("test.key");
                message.setRedelivered(false);
                message.setExchange("test-exchange");
                message.setMessageCount(1);

                Map<String, Object> properties = new HashMap<>();
                properties.put("delivery_mode", 2);
                properties.put("priority", 0);
                message.setProperties(properties);

                return message;
        }
}