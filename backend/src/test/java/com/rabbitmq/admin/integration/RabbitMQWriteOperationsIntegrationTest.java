package com.rabbitmq.admin.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.config.ValidationConfig;
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
import org.springframework.context.annotation.Import;
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
 * Comprehensive integration tests for RabbitMQ write operations.
 * Tests all write operation endpoints with authentication, authorization,
 * error handling, and edge cases.
 * 
 * Note: These tests focus on controller layer integration, endpoint routing,
 * authentication, validation, and error handling. The actual RabbitMQ service
 * methods are mocked to isolate the integration testing concerns.
 */
@Import(ValidationConfig.class)
class RabbitMQWriteOperationsIntegrationTest extends IntegrationTestBase {

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
        // Call parent setup first
        super.setUpTestData();

        // Clear existing cluster data
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
        adminAuth = new UsernamePasswordAuthenticationToken(adminPrincipal, null, adminPrincipal.getAuthorities());
    }

    @Nested
    @DisplayName("Virtual Host Operations")
    class VirtualHostOperations {

        @Test
        @Transactional
        @DisplayName("Should get virtual hosts successfully")
        void getVirtualHosts_ShouldReturnVirtualHosts_WhenServiceReturnsData() throws Exception {
            // Given
            List<VirtualHostDto> virtualHosts = Arrays.asList(
                    createVirtualHostDto("/", "Default virtual host"),
                    createVirtualHostDto("test-vhost", "Test virtual host"));

            when(rabbitMQResourceService.getVirtualHosts(eq(testCluster.getId()), any(User.class)))
                    .thenReturn(Mono.just(virtualHosts));

            // When & Then
            mockMvc.perform(get("/api/rabbitmq/{clusterId}/vhosts", testCluster.getId())
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].name").value("/"))
                    .andExpect(jsonPath("$[1].name").value("test-vhost"));
        }

        @Test
        @Transactional
        @DisplayName("Should return 401 when not authenticated")
        void getVirtualHosts_ShouldReturn401_WhenNotAuthenticated() throws Exception {
            // When & Then
            mockMvc.perform(get("/api/rabbitmq/{clusterId}/vhosts", testCluster.getId())
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @Transactional
        @DisplayName("Should handle service errors gracefully")
        void getVirtualHosts_ShouldReturn500_WhenServiceThrowsException() throws Exception {
            // Given
            when(rabbitMQResourceService.getVirtualHosts(eq(testCluster.getId()), any(User.class)))
                    .thenReturn(Mono.error(new RuntimeException("RabbitMQ connection failed")));

            // When & Then
            mockMvc.perform(get("/api/rabbitmq/{clusterId}/vhosts", testCluster.getId())
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isInternalServerError());
        }
    }

    @Nested
    @DisplayName("Exchange Operations")
    class ExchangeOperations {

        @Test
        @Transactional
        @DisplayName("Should create exchange successfully")
        void createExchange_ShouldReturnOk_WhenValidRequest() throws Exception {
            // Given
            CreateExchangeRequest request = createExchangeRequest("test-exchange", "direct", "/");

            when(rabbitMQResourceService.createExchange(eq(testCluster.getId()), eq(request), any(User.class)))
                    .thenReturn(Mono.empty());

            // When & Then
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @Transactional
        @DisplayName("Should return 400 for invalid exchange request")
        void createExchange_ShouldReturn400_WhenInvalidRequest() throws Exception {
            // Given - invalid request with empty name
            CreateExchangeRequest request = createExchangeRequest("", "direct", "/");

            // When & Then
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.details.name").exists());
        }

        @Test
        @Transactional
        @DisplayName("Should delete exchange successfully")
        void deleteExchange_ShouldReturnOk_WhenValidRequest() throws Exception {
            // Given
            String vhost = Base64.getEncoder().encodeToString("/".getBytes());
            String exchangeName = "test-exchange";

            when(rabbitMQResourceService.deleteExchange(eq(testCluster.getId()), eq("/"),
                    eq(exchangeName), eq(true), any(User.class)))
                    .thenReturn(Mono.empty());

            // When & Then
            mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{name}",
                    testCluster.getId(), vhost, exchangeName)
                    .with(authentication(userAuth))
                    .param("ifUnused", "true"))
                    .andExpect(status().isOk());
        }

        @Test
        @Transactional
        @DisplayName("Should handle service errors during exchange creation")
        void createExchange_ShouldReturn500_WhenServiceThrowsException() throws Exception {
            // Given
            CreateExchangeRequest request = createExchangeRequest("test-exchange", "direct", "/");

            when(rabbitMQResourceService.createExchange(eq(testCluster.getId()), eq(request), any(User.class)))
                    .thenReturn(Mono.error(new RuntimeException("RabbitMQ API error")));

            // When & Then
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isInternalServerError());
        }
    }

    @Nested
    @DisplayName("Queue Operations")
    class QueueOperations {

        @Test
        @Transactional
        @DisplayName("Should create queue successfully")
        void createQueue_ShouldReturnOk_WhenValidRequest() throws Exception {
            // Given
            CreateQueueRequest request = createQueueRequest("test-queue", "/");

            when(rabbitMQResourceService.createQueue(eq(testCluster.getId()), eq(request), any(User.class)))
                    .thenReturn(Mono.empty());

            // When & Then
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @Transactional
        @DisplayName("Should return 400 for invalid queue request")
        void createQueue_ShouldReturn400_WhenInvalidRequest() throws Exception {
            // Given - invalid request with null name
            CreateQueueRequest request = createQueueRequest(null, "/");

            // When & Then
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.details.name").exists());
        }

        @Test
        @Transactional
        @DisplayName("Should delete queue successfully with conditions")
        void deleteQueue_ShouldReturnOk_WhenValidRequestWithConditions() throws Exception {
            // Given
            String vhost = Base64.getEncoder().encodeToString("/".getBytes());
            String queueName = "test-queue";

            when(rabbitMQResourceService.deleteQueue(eq(testCluster.getId()), eq("/"),
                    eq(queueName), eq(true), eq(true), any(User.class)))
                    .thenReturn(Mono.empty());

            // When & Then
            mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/queues/{vhost}/{name}",
                    testCluster.getId(), vhost, queueName)
                    .with(authentication(userAuth))
                    .param("ifEmpty", "true")
                    .param("ifUnused", "true"))
                    .andExpect(status().isOk());
        }

        @Test
        @Transactional
        @DisplayName("Should purge queue successfully")
        void purgeQueue_ShouldReturnOk_WhenValidRequest() throws Exception {
            // Given
            String vhost = Base64.getEncoder().encodeToString("/".getBytes());
            String queueName = "test-queue";

            when(rabbitMQResourceService.purgeQueue(eq(testCluster.getId()), eq("/"),
                    eq(queueName), any(User.class)))
                    .thenReturn(Mono.empty());

            // When & Then
            mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/queues/{vhost}/{name}/contents",
                    testCluster.getId(), vhost, queueName)
                    .with(authentication(userAuth)))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Binding Operations")
    class BindingOperations {

        @Test
        @Transactional
        @DisplayName("Should create exchange-to-queue binding successfully")
        void createExchangeToQueueBinding_ShouldReturnOk_WhenValidRequest() throws Exception {
            // Given
            String vhost = Base64.getEncoder().encodeToString("/".getBytes());
            String source = "test-exchange";
            String destination = "test-queue";
            CreateBindingRequest request = createBindingRequest("test.routing.key");

            when(rabbitMQResourceService.createBinding(eq(testCluster.getId()), eq("/"),
                    eq(source), eq(destination), eq("q"), eq(request), any(User.class)))
                    .thenReturn(Mono.empty());

            // When & Then
            mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/bindings/{vhost}/e/{source}/q/{destination}",
                    testCluster.getId(), vhost, source, destination)
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @Transactional
        @DisplayName("Should create exchange-to-exchange binding successfully")
        void createExchangeToExchangeBinding_ShouldReturnOk_WhenValidRequest() throws Exception {
            // Given
            String vhost = Base64.getEncoder().encodeToString("/".getBytes());
            String source = "source-exchange";
            String destination = "dest-exchange";
            CreateBindingRequest request = createBindingRequest("test.routing.key");

            when(rabbitMQResourceService.createBinding(eq(testCluster.getId()), eq("/"),
                    eq(source), eq(destination), eq("e"), eq(request), any(User.class)))
                    .thenReturn(Mono.empty());

            // When & Then
            mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/bindings/{vhost}/e/{source}/e/{destination}",
                    testCluster.getId(), vhost, source, destination)
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @Transactional
        @DisplayName("Should handle invalid path variables gracefully")
        void createBinding_ShouldReturn400_WhenInvalidPathVariables() throws Exception {
            // Given - invalid base64 vhost
            String invalidVhost = "invalid-base64!@#";
            String source = "test-exchange";
            String destination = "test-queue";
            CreateBindingRequest request = createBindingRequest("test.routing.key");

            // When & Then
            mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/bindings/{vhost}/e/{source}/q/{destination}",
                    testCluster.getId(), invalidVhost, source, destination)
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Message Operations")
    class MessageOperations {

        @Test
        @Transactional
        @DisplayName("Should publish message to exchange successfully")
        void publishToExchange_ShouldReturnOk_WhenValidRequest() throws Exception {
            // Given
            String vhost = Base64.getEncoder().encodeToString("/".getBytes());
            String exchange = "test-exchange";
            PublishMessageRequest request = createPublishMessageRequest("test.routing.key", "Hello World");
            PublishResponse response = new PublishResponse(true);

            when(rabbitMQResourceService.publishMessage(eq(testCluster.getId()), eq("/"),
                    eq(exchange), eq(request), any(User.class)))
                    .thenReturn(Mono.just(response));

            // When & Then
            mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{exchange}/publish",
                    testCluster.getId(), vhost, exchange)
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.routed").value(true));
        }

        @Test
        @Transactional
        @DisplayName("Should publish message to queue successfully")
        void publishToQueue_ShouldReturnOk_WhenValidRequest() throws Exception {
            // Given
            String vhost = Base64.getEncoder().encodeToString("/".getBytes());
            String queue = "test-queue";
            PublishMessageRequest request = createPublishMessageRequest("", "Hello Queue");
            PublishResponse response = new PublishResponse(true);

            when(rabbitMQResourceService.publishMessage(eq(testCluster.getId()), eq("/"),
                    eq(""), any(PublishMessageRequest.class), any(User.class)))
                    .thenReturn(Mono.just(response));

            // When & Then
            mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/queues/{vhost}/{queue}/publish",
                    testCluster.getId(), vhost, queue)
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.routed").value(true));
        }

        @Test
        @Transactional
        @DisplayName("Should get messages from queue successfully")
        void getMessages_ShouldReturnMessages_WhenValidRequest() throws Exception {
            // Given
            String vhost = Base64.getEncoder().encodeToString("/".getBytes());
            String queue = "test-queue";
            GetMessagesRequest request = createGetMessagesRequest(5, "ack_requeue_true");
            List<MessageDto> messages = Arrays.asList(
                    createMessageDto("Hello 1", "test.key.1"),
                    createMessageDto("Hello 2", "test.key.2"));

            when(rabbitMQResourceService.getMessages(eq(testCluster.getId()), eq("/"),
                    eq(queue), eq(request), any(User.class)))
                    .thenReturn(Mono.just(messages));

            // When & Then
            mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/queues/{vhost}/{queue}/get",
                    testCluster.getId(), vhost, queue)
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].payload").value("Hello 1"))
                    .andExpect(jsonPath("$[1].payload").value("Hello 2"));
        }

        @Test
        @Transactional
        @DisplayName("Should return 400 for invalid message request")
        void publishMessage_ShouldReturn400_WhenInvalidRequest() throws Exception {
            // Given - invalid request with null payload
            String vhost = Base64.getEncoder().encodeToString("/".getBytes());
            String exchange = "test-exchange";
            PublishMessageRequest request = createPublishMessageRequest("test.key", null);

            // When & Then
            mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{exchange}/publish",
                    testCluster.getId(), vhost, exchange)
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.details.payload").exists());
        }
    }

    @Nested
    @DisplayName("Authentication and Authorization")
    class AuthenticationAndAuthorization {

        @Test
        @Transactional
        @DisplayName("Should allow USER role to perform write operations")
        void writeOperations_ShouldAllowUserRole() throws Exception {
            // Given
            CreateExchangeRequest request = createExchangeRequest("test-exchange", "direct", "/");
            when(rabbitMQResourceService.createExchange(eq(testCluster.getId()), eq(request), any(User.class)))
                    .thenReturn(Mono.empty());

            // When & Then
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @Transactional
        @DisplayName("Should allow ADMINISTRATOR role to perform write operations")
        void writeOperations_ShouldAllowAdminRole() throws Exception {
            // Given
            CreateQueueRequest request = createQueueRequest("test-queue", "/");
            when(rabbitMQResourceService.createQueue(eq(testCluster.getId()), eq(request), any(User.class)))
                    .thenReturn(Mono.empty());

            // When & Then
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/queues", testCluster.getId())
                    .with(authentication(adminAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @Transactional
        @DisplayName("Should return 401 for unauthenticated requests")
        void writeOperations_ShouldReturn401_WhenNotAuthenticated() throws Exception {
            // Given
            CreateExchangeRequest request = createExchangeRequest("test-exchange", "direct", "/");

            // When & Then
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Error Handling and Edge Cases")
    class ErrorHandlingAndEdgeCases {

        @Test
        @Transactional
        @DisplayName("Should handle special characters in resource names")
        void operations_ShouldHandleSpecialCharacters() throws Exception {
            // Given
            String vhost = Base64.getEncoder().encodeToString("test-vhost".getBytes());
            String exchangeName = "test.exchange-with_special@chars";

            when(rabbitMQResourceService.deleteExchange(eq(testCluster.getId()), eq("test-vhost"),
                    eq(exchangeName), isNull(), any(User.class)))
                    .thenReturn(Mono.empty());

            // When & Then
            mockMvc.perform(delete("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{name}",
                    testCluster.getId(), vhost, exchangeName)
                    .with(authentication(userAuth)))
                    .andExpect(status().isOk());
        }

        @Test
        @Transactional
        @DisplayName("Should handle empty routing keys")
        void createBinding_ShouldHandleEmptyRoutingKey() throws Exception {
            // Given
            String vhost = Base64.getEncoder().encodeToString("/".getBytes());
            String source = "test-exchange";
            String destination = "test-queue";
            CreateBindingRequest request = createBindingRequest(""); // Empty routing key

            when(rabbitMQResourceService.createBinding(eq(testCluster.getId()), eq("/"),
                    eq(source), eq(destination), eq("q"), eq(request), any(User.class)))
                    .thenReturn(Mono.empty());

            // When & Then
            mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/bindings/{vhost}/e/{source}/q/{destination}",
                    testCluster.getId(), vhost, source, destination)
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @Transactional
        @DisplayName("Should handle large message payloads")
        void publishMessage_ShouldHandleLargePayloads() throws Exception {
            // Given
            String vhost = Base64.getEncoder().encodeToString("/".getBytes());
            String exchange = "test-exchange";
            String largePayload = "x".repeat(10000); // 10KB payload
            PublishMessageRequest request = createPublishMessageRequest("test.key", largePayload);
            PublishResponse response = new PublishResponse(true);

            when(rabbitMQResourceService.publishMessage(eq(testCluster.getId()), eq("/"),
                    eq(exchange), eq(request), any(User.class)))
                    .thenReturn(Mono.just(response));

            // When & Then
            mockMvc.perform(post("/api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{exchange}/publish",
                    testCluster.getId(), vhost, exchange)
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @Transactional
        @DisplayName("Should handle service errors gracefully")
        void operations_ShouldReturn500_WhenServiceThrowsException() throws Exception {
            // Given
            CreateExchangeRequest request = createExchangeRequest("test-exchange", "direct", "/");
            when(rabbitMQResourceService.createExchange(eq(testCluster.getId()), eq(request), any(User.class)))
                    .thenReturn(Mono.error(new RuntimeException("Service error")));

            // When & Then
            mockMvc.perform(put("/api/rabbitmq/{clusterId}/resources/exchanges", testCluster.getId())
                    .with(authentication(userAuth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isInternalServerError());
        }
    }

    // Helper methods for creating test DTOs
    private VirtualHostDto createVirtualHostDto(String name, String description) {
        VirtualHostDto dto = new VirtualHostDto();
        dto.setName(name);
        dto.setDescription(description);
        dto.setTags(List.of());
        dto.setDefaultQueueType("classic");
        dto.setTracing(false);
        return dto;
    }

    private CreateExchangeRequest createExchangeRequest(String name, String type, String vhost) {
        CreateExchangeRequest request = new CreateExchangeRequest();
        request.setName(name);
        request.setType(type);
        request.setVhost(vhost);
        request.setDurable(true);
        request.setAutoDelete(false);
        request.setInternal(false);
        request.setArguments(new HashMap<>());
        return request;
    }

    private CreateQueueRequest createQueueRequest(String name, String vhost) {
        CreateQueueRequest request = new CreateQueueRequest();
        request.setName(name);
        request.setVhost(vhost);
        request.setDurable(true);
        request.setAutoDelete(false);
        request.setExclusive(false);
        request.setArguments(new HashMap<>());
        return request;
    }

    private CreateBindingRequest createBindingRequest(String routingKey) {
        CreateBindingRequest request = new CreateBindingRequest();
        request.setRoutingKey(routingKey);
        request.setArguments(new HashMap<>());
        return request;
    }

    private PublishMessageRequest createPublishMessageRequest(String routingKey, String payload) {
        PublishMessageRequest request = new PublishMessageRequest();
        request.setRoutingKey(routingKey);
        request.setPayload(payload);
        request.setPayloadEncoding("string");
        request.setProperties(new HashMap<>());
        return request;
    }

    private GetMessagesRequest createGetMessagesRequest(int count, String ackmode) {
        GetMessagesRequest request = new GetMessagesRequest();
        request.setCount(count);
        request.setAckmode(ackmode);
        request.setEncoding("auto");
        return request;
    }

    private MessageDto createMessageDto(String payload, String routingKey) {
        MessageDto dto = new MessageDto();
        dto.setPayload(payload);
        dto.setPayloadEncoding("string");
        dto.setRoutingKey(routingKey);
        dto.setRedelivered(false);
        dto.setExchange("test-exchange");
        dto.setProperties(new HashMap<>());
        return dto;
    }
}