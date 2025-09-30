package com.rabbitmq.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.dto.*;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import org.mockito.ArgumentCaptor;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class RabbitMQResourceServiceTest {

        @Mock
        private RabbitMQProxyService proxyService;

        @Mock
        private ResourceMetricsService metricsService;

        @Mock
        private ResourceAuditService auditService;

        private ObjectMapper objectMapper;
        private RabbitMQResourceService resourceService;
        private User testUser;
        private UUID testClusterId;

        @BeforeEach
        void setUp() {
                objectMapper = new ObjectMapper();
                resourceService = new RabbitMQResourceService(proxyService, objectMapper, metricsService, auditService);

                testUser = new User("testuser", "hashedpassword", UserRole.USER);
                testUser.setId(UUID.randomUUID());
                testClusterId = UUID.randomUUID();
        }

        // Message publishing tests

        @Test
        void publishMessage_ShouldReturnPublishResponse_WhenSuccessful() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange";
                PublishMessageRequest request = new PublishMessageRequest("test.key",
                                Map.of("delivery_mode", 2), "Hello World", "string");

                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2F/test-exchange/publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When
                PublishResponse result = resourceService.publishMessage(testClusterId, vhost, exchange, request,
                                testUser);

                // Then
                assertThat(result).isNotNull();
                assertThat(result.getRouted()).isTrue();
        }

        @Test
        void publishMessage_ShouldReturnPublishResponse_WhenMessageNotRouted() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange";
                PublishMessageRequest request = new PublishMessageRequest("nonexistent.key",
                                Map.of(), "Hello World", "string");

                PublishResponse mockResponse = new PublishResponse(false);

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2F/test-exchange/publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When
                PublishResponse result = resourceService.publishMessage(testClusterId, vhost, exchange, request,
                                testUser);

                // Then
                assertThat(result).isNotNull();
                assertThat(result.getRouted()).isFalse();
        }

        @Test
        void publishMessage_ShouldHandleDefaultExchange_WhenExchangeEmpty() {
                // Given
                String vhost = "/";
                String exchange = "";
                PublishMessageRequest request = new PublishMessageRequest("test-queue",
                                Map.of(), "Direct to queue", "string");

                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2F/amq.default/publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When
                PublishResponse result = resourceService.publishMessage(testClusterId, vhost, exchange, request,
                                testUser);

                // Then
                assertThat(result).isNotNull();
                assertThat(result.getRouted()).isTrue();
        }

        @Test
        void publishMessage_ShouldHandleComplexVhost() {
                // Given
                String vhost = "/special/vhost";
                String exchange = "test-exchange";
                PublishMessageRequest request = new PublishMessageRequest("test.key",
                                Map.of(), "Hello World", "string");

                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2Fspecial%2Fvhost/test-exchange/publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When
                PublishResponse result = resourceService.publishMessage(testClusterId, vhost, exchange, request,
                                testUser);

                // Then
                assertThat(result).isNotNull();
                assertThat(result.getRouted()).isTrue();
        }

        @Test
        void publishMessage_ShouldEncodeSpecialCharacters() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange with spaces";
                PublishMessageRequest request = new PublishMessageRequest("test.key",
                                Map.of(), "Hello World", "string");

                PublishResponse mockResponse = new PublishResponse(true);

                // Use anyString() to avoid URL encoding matching issues
                when(proxyService.post(eq(testClusterId), anyString(),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When
                PublishResponse result = resourceService.publishMessage(testClusterId, vhost, exchange, request,
                                testUser);

                // Then
                assertThat(result).isNotNull();
                assertThat(result.getRouted()).isTrue();

                // Verify the correct encoded URL was called (URLEncoder uses + for spaces)
                verify(proxyService).post(eq(testClusterId), eq("/api/exchanges/%2F/test-exchange+with+spaces/publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser));
        }

        @Test
        void publishMessage_ShouldIncludeHeaders_WhenProvided() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange";
                Map<String, Object> headers = Map.of(
                                "x-custom-header", "value",
                                "priority", 5);
                PublishMessageRequest request = new PublishMessageRequest("test.key", headers, "Hello World", "string");

                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId), anyString(), any(Map.class), eq(PublishResponse.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When
                PublishResponse result = resourceService.publishMessage(testClusterId, vhost, exchange, request,
                                testUser);

                // Then
                assertThat(result).isNotNull();
                assertThat(result.getRouted()).isTrue();

                // Verify the request body includes headers (properties are directly the headers
                // in this case)
                @SuppressWarnings("unchecked")
                ArgumentCaptor<Map<String, Object>> bodyCaptor = ArgumentCaptor.forClass(Map.class);
                verify(proxyService).post(eq(testClusterId), anyString(), bodyCaptor.capture(),
                                eq(PublishResponse.class), eq(testUser));

                Map<String, Object> capturedBody = bodyCaptor.getValue();
                assertThat(capturedBody.get("properties")).isNotNull();
                @SuppressWarnings("unchecked")
                Map<String, Object> properties = (Map<String, Object>) capturedBody.get("properties");
                assertThat(properties).isEqualTo(headers);
        }

        @Test
        void publishMessage_ShouldCreateCorrectRequestBody() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange";
                PublishMessageRequest request = new PublishMessageRequest("test.routing.key",
                                Map.of("delivery_mode", 2), "Test message", "string");

                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId), anyString(), any(Map.class), eq(PublishResponse.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When
                resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser);

                // Then
                @SuppressWarnings("unchecked")
                ArgumentCaptor<Map<String, Object>> bodyCaptor = ArgumentCaptor.forClass(Map.class);
                verify(proxyService).post(eq(testClusterId), anyString(), bodyCaptor.capture(),
                                eq(PublishResponse.class), eq(testUser));

                Map<String, Object> capturedBody = bodyCaptor.getValue();
                assertThat(capturedBody.get("routing_key")).isEqualTo("test.routing.key");
                assertThat(capturedBody.get("payload")).isEqualTo("Test message");
                assertThat(capturedBody.get("payload_encoding")).isEqualTo("string");
                assertThat(capturedBody.get("properties")).isNotNull();
        }

        // Message retrieval tests

        @Test
        void getMessages_ShouldReturnMessages_WhenSuccessful() {
                // Given
                String vhost = "/";
                String queue = "test-queue";
                GetMessagesRequest request = new GetMessagesRequest(5, "ack_requeue_true", "auto", null);

                List<MessageDto> mockMessages = Arrays.asList(
                                createTestMessage("Message 1", "key1"),
                                createTestMessage("Message 2", "key2"));

                when(proxyService.post(eq(testClusterId), eq("/api/queues/%2F/test-queue/get"),
                                any(Map.class), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockMessages));

                // When
                // Note: The service now uses enhanced two-step JSON processing to ensure
                // custom deserializers like PropertiesDeserializer are properly invoked
                List<MessageDto> result = resourceService.getMessages(testClusterId, vhost, queue, request, testUser);

                // Then
                assertThat(result).isNotNull();
                assertThat(result).hasSize(2);
                assertThat(result.get(0).getPayload()).isEqualTo("Message 1");
                assertThat(result.get(1).getPayload()).isEqualTo("Message 2");
        }

        @Test
        void getMessages_ShouldReturnEmptyList_WhenNoMessages() {
                // Given
                String vhost = "/";
                String queue = "empty-queue";
                GetMessagesRequest request = new GetMessagesRequest(5, "ack_requeue_true", "auto", null);

                List<MessageDto> emptyList = new ArrayList<>();

                when(proxyService.post(eq(testClusterId), eq("/api/queues/%2F/empty-queue/get"),
                                any(Map.class), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(emptyList));

                // When
                List<MessageDto> result = resourceService.getMessages(testClusterId, vhost, queue, request, testUser);

                // Then
                assertThat(result).isNotNull();
                assertThat(result).isEmpty();
        }

        @Test
        void getMessages_ShouldCreateCorrectRequestBody() {
                // Given
                String vhost = "/";
                String queue = "test-queue";
                GetMessagesRequest request = new GetMessagesRequest(10, "ack_requeue_false", "base64", 30000);

                List<MessageDto> mockMessages = new ArrayList<>();

                when(proxyService.post(eq(testClusterId), anyString(), any(Map.class), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockMessages));

                // When
                resourceService.getMessages(testClusterId, vhost, queue, request, testUser);

                // Then
                @SuppressWarnings("unchecked")
                ArgumentCaptor<Map<String, Object>> bodyCaptor = ArgumentCaptor.forClass(Map.class);
                verify(proxyService).post(eq(testClusterId), anyString(), bodyCaptor.capture(), eq(List.class),
                                eq(testUser));

                Map<String, Object> capturedBody = bodyCaptor.getValue();
                assertThat(capturedBody.get("count")).isEqualTo(10);
                assertThat(capturedBody.get("ackmode")).isEqualTo("ack_requeue_false");
                assertThat(capturedBody.get("encoding")).isEqualTo("base64");
                assertThat(capturedBody.get("truncate")).isEqualTo(30000);
        }

        // Helper methods

        private MessageDto createTestMessage(String payload, String routingKey) {
                MessageDto message = new MessageDto();
                message.setPayload(payload);

                Map<String, Object> properties = new HashMap<>();
                properties.put("routing_key", routingKey);
                message.setProperties(properties);

                return message;
        }
}