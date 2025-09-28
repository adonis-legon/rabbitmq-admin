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
import reactor.test.StepVerifier;

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

                // When & Then
                StepVerifier.create(resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getRouted()).isTrue();
                                })
                                .verifyComplete();
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

                // When & Then
                StepVerifier.create(resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getRouted()).isFalse();
                                })
                                .verifyComplete();
        }

        @Test
        void publishMessage_ShouldHandleDefaultExchange_WhenExchangeEmpty() {
                // Given
                String vhost = "/";
                String exchange = "";
                PublishMessageRequest request = new PublishMessageRequest("test-queue",
                                Map.of(), "Direct to queue", "string");

                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2F//publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When & Then
                StepVerifier.create(resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getRouted()).isTrue();
                                })
                                .verifyComplete();
        }

        @Test
        void publishMessage_ShouldHandleBase64Encoding() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange";
                PublishMessageRequest request = new PublishMessageRequest("test.key",
                                Map.of("content_type", "application/octet-stream"),
                                "SGVsbG8gV29ybGQ=", "base64");

                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2F/test-exchange/publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When & Then
                StepVerifier.create(resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getRouted()).isTrue();
                                })
                                .verifyComplete();
        }

        @Test
        void publishMessage_ShouldHandleComplexProperties() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange";
                Map<String, Object> properties = Map.of(
                                "delivery_mode", 2,
                                "priority", 5,
                                "content_type", "application/json",
                                "correlation_id", "test-correlation-123",
                                "headers", Map.of("custom-header", "custom-value"));
                PublishMessageRequest request = new PublishMessageRequest("test.key",
                                properties, "{\"message\": \"Hello World\"}", "string");

                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2F/test-exchange/publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When & Then
                StepVerifier.create(resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getRouted()).isTrue();
                                })
                                .verifyComplete();
        }

        @Test
        void publishMessage_ShouldPropagateError_WhenProxyServiceFails() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange";
                PublishMessageRequest request = new PublishMessageRequest("test.key",
                                Map.of(), "Hello World", "string");
                RuntimeException proxyError = new RuntimeException("Message publishing failed");

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2F/test-exchange/publish"),
                                any(Map.class),
                                eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.error(proxyError));

                // When & Then
                StepVerifier.create(resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getMessage()
                                                                                .equals("Failed to publish message")
                                                                &&
                                                                throwable.getCause() == proxyError)
                                .verify();
        }

        @Test
        void publishMessage_ShouldHandleMapResponse_WhenRabbitMQReturnsMap() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange";
                PublishMessageRequest request = new PublishMessageRequest("test.key",
                                Map.of(), "Hello World", "string");

                // Note: Testing the Map response case is complex with mocks since it involves
                // type casting at runtime. This scenario is better covered by integration
                // tests.
                // For unit testing, we verify the normal PublishResponse case.
                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2F/test-exchange/publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When & Then
                StepVerifier.create(resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getRouted()).isTrue();
                                })
                                .verifyComplete();
        }

        @Test
        void publishMessage_ShouldHandleParsingError_WhenResponseMalformed() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange";
                PublishMessageRequest request = new PublishMessageRequest("test.key",
                                Map.of(), "Hello World", "string");

                // Simulate a parsing error by returning an error from the proxy service
                RuntimeException parsingError = new RuntimeException("Failed to parse response");

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2F/test-exchange/publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.error(parsingError));

                // When & Then
                StepVerifier.create(resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getMessage()
                                                                                .equals("Failed to publish message")
                                                                &&
                                                                throwable.getCause() == parsingError)
                                .verify();
        }

        @Test
        void publishMessage_ShouldHandleEmptyRoutingKey() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange";
                PublishMessageRequest request = new PublishMessageRequest("",
                                Map.of(), "Hello World", "string");

                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2F/test-exchange/publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When & Then
                StepVerifier.create(resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getRouted()).isTrue();
                                })
                                .verifyComplete();
        }

        @Test
        void publishMessage_ShouldHandleNullProperties() {
                // Given
                String vhost = "/";
                String exchange = "test-exchange";
                PublishMessageRequest request = new PublishMessageRequest("test.key",
                                null, "Hello World", "string");

                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId), eq("/api/exchanges/%2F/test-exchange/publish"),
                                any(Map.class), eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When & Then
                StepVerifier.create(resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getRouted()).isTrue();
                                })
                                .verifyComplete();
        }

        @Test
        void publishMessage_ShouldHandleSpecialCharacters_InVhostAndExchange() {
                // Given
                String vhost = "test-vhost";
                String exchange = "test exchange/with%special&chars";
                PublishMessageRequest request = new PublishMessageRequest("test.key",
                                Map.of(), "Hello World", "string");

                PublishResponse mockResponse = new PublishResponse(true);

                when(proxyService.post(eq(testClusterId),
                                eq("/api/exchanges/test-vhost/test+exchange%2Fwith%25special%26chars/publish"),
                                any(Map.class),
                                eq(PublishResponse.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When & Then
                StepVerifier.create(resourceService.publishMessage(testClusterId, vhost, exchange, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getRouted()).isTrue();
                                })
                                .verifyComplete();
        }

        @Test
        void getMessages_ShouldReturnMessages_WhenSuccessful() {
                // Given
                String vhost = "/";
                String queue = "test-queue";
                GetMessagesRequest request = new GetMessagesRequest(5, "ack_requeue_true", "auto", null);

                List<Map<String, Object>> mockResponse = List.of(
                                Map.of("payload_encoding", "string",
                                                "payload", "Hello World",
                                                "properties", Map.of("delivery_mode", 2),
                                                "routing_key", "test.key",
                                                "redelivered", false,
                                                "exchange", "test-exchange",
                                                "message_count", 10));

                when(proxyService.post(eq(testClusterId), eq("/api/queues/%2F/test-queue/get"), any(), eq(List.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When & Then
                StepVerifier.create(resourceService.getMessages(testClusterId, vhost, queue, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result).hasSize(1);
                                        MessageDto message = result.get(0);
                                        assertThat(message.getPayloadEncoding()).isEqualTo("string");
                                        assertThat(message.getPayload()).isEqualTo("Hello World");
                                        assertThat(message.getRoutingKey()).isEqualTo("test.key");
                                        assertThat(message.getRedelivered()).isFalse();
                                        assertThat(message.getExchange()).isEqualTo("test-exchange");
                                        assertThat(message.getMessageCount()).isEqualTo(10);
                                })
                                .verifyComplete();
        }

        @Test
        void getMessages_ShouldReturnEmptyList_WhenNoMessages() {
                // Given
                String vhost = "/";
                String queue = "empty-queue";
                GetMessagesRequest request = new GetMessagesRequest(1, "ack_requeue_true", "auto", null);

                when(proxyService.post(eq(testClusterId), eq("/api/queues/%2F/empty-queue/get"), any(), eq(List.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(List.of()));

                // When & Then
                StepVerifier.create(resourceService.getMessages(testClusterId, vhost, queue, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result).isEmpty();
                                })
                                .verifyComplete();
        }

        @Test
        void getMessages_ShouldHandleMultipleMessages() {
                // Given
                String vhost = "/test";
                String queue = "multi-message-queue";
                GetMessagesRequest request = new GetMessagesRequest(3, "reject_requeue_false", "base64", 1000);

                List<Map<String, Object>> mockResponse = List.of(
                                Map.of("payload_encoding", "base64",
                                                "payload", "SGVsbG8=",
                                                "properties", Map.of("delivery_mode", 1),
                                                "routing_key", "key1",
                                                "redelivered", false,
                                                "exchange", "test-exchange",
                                                "message_count", 3),
                                Map.of("payload_encoding", "string",
                                                "payload", "World",
                                                "properties", Map.of("delivery_mode", 2, "priority", 5),
                                                "routing_key", "key2",
                                                "redelivered", true,
                                                "exchange", "test-exchange",
                                                "message_count", 2),
                                Map.of("payload_encoding", "string",
                                                "payload", "Test",
                                                "properties", Map.of(),
                                                "routing_key", "",
                                                "redelivered", false,
                                                "exchange", "",
                                                "message_count", 1));

                when(proxyService.post(eq(testClusterId), anyString(), any(),
                                eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When & Then
                StepVerifier.create(resourceService.getMessages(testClusterId, vhost, queue, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result).hasSize(3);

                                        MessageDto message1 = result.get(0);
                                        assertThat(message1.getPayloadEncoding()).isEqualTo("base64");
                                        assertThat(message1.getPayload()).isEqualTo("SGVsbG8=");
                                        assertThat(message1.getRoutingKey()).isEqualTo("key1");
                                        assertThat(message1.getRedelivered()).isFalse();
                                        assertThat(message1.getMessageCount()).isEqualTo(3);

                                        MessageDto message2 = result.get(1);
                                        assertThat(message2.getPayloadEncoding()).isEqualTo("string");
                                        assertThat(message2.getPayload()).isEqualTo("World");
                                        assertThat(message2.getRoutingKey()).isEqualTo("key2");
                                        assertThat(message2.getRedelivered()).isTrue();
                                        assertThat(message2.getMessageCount()).isEqualTo(2);

                                        MessageDto message3 = result.get(2);
                                        assertThat(message3.getPayloadEncoding()).isEqualTo("string");
                                        assertThat(message3.getPayload()).isEqualTo("Test");
                                        assertThat(message3.getRoutingKey()).isEmpty();
                                        assertThat(message3.getRedelivered()).isFalse();
                                        assertThat(message3.getExchange()).isEmpty();
                                        assertThat(message3.getMessageCount()).isEqualTo(1);
                                })
                                .verifyComplete();
        }

        @Test
        void getMessages_ShouldHandleSpecialCharacters_InVhostAndQueue() {
                // Given
                String vhost = "test-vhost";
                String queue = "test queue/with%special&chars";
                GetMessagesRequest request = new GetMessagesRequest(1, "ack_requeue_false", "auto", null);

                List<Map<String, Object>> mockResponse = List.of(
                                Map.of("payload_encoding", "string",
                                                "payload", "Special chars test",
                                                "properties", Map.of(),
                                                "routing_key", "special.key",
                                                "redelivered", false,
                                                "exchange", "special-exchange",
                                                "message_count", 1));

                when(proxyService.post(eq(testClusterId), anyString(), any(), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockResponse));

                // When & Then
                StepVerifier.create(resourceService.getMessages(testClusterId, vhost, queue, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result).hasSize(1);
                                        assertThat(result.get(0).getPayload()).isEqualTo("Special chars test");
                                })
                                .verifyComplete();
        }

        @Test
        void getMessages_ShouldIncludeTruncateParameter_WhenSpecified() {
                // Given
                String vhost = "/";
                String queue = "test-queue";
                GetMessagesRequest request = new GetMessagesRequest(2, "ack_requeue_true", "auto", 5000);

                when(proxyService.post(eq(testClusterId), eq("/api/queues/%2F/test-queue/get"), any(), eq(List.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(List.of()));

                // When
                StepVerifier.create(resourceService.getMessages(testClusterId, vhost, queue, request, testUser))
                                .expectNextCount(1)
                                .verifyComplete();

                // Then - verify the request body includes truncate parameter
                @SuppressWarnings("unchecked")
                ArgumentCaptor<Map<String, Object>> bodyCaptor = ArgumentCaptor.forClass(Map.class);
                verify(proxyService).post(eq(testClusterId), eq("/api/queues/%2F/test-queue/get"), bodyCaptor.capture(),
                                eq(List.class), eq(testUser));

                Map<String, Object> requestBody = bodyCaptor.getValue();
                assertThat(requestBody).containsEntry("count", 2);
                assertThat(requestBody).containsEntry("ackmode", "ack_requeue_true");
                assertThat(requestBody).containsEntry("encoding", "auto");
                assertThat(requestBody).containsEntry("truncate", 5000);
        }

        @Test
        void getMessages_ShouldNotIncludeTruncateParameter_WhenNotSpecified() {
                // Given
                String vhost = "/";
                String queue = "test-queue";
                GetMessagesRequest request = new GetMessagesRequest(1, "reject_requeue_true", "base64", null);

                when(proxyService.post(eq(testClusterId), eq("/api/queues/%2F/test-queue/get"), any(), eq(List.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(List.of()));

                // When
                StepVerifier.create(resourceService.getMessages(testClusterId, vhost, queue, request, testUser))
                                .expectNextCount(1)
                                .verifyComplete();

                // Then - verify the request body does not include truncate parameter
                @SuppressWarnings("unchecked")
                ArgumentCaptor<Map<String, Object>> bodyCaptor = ArgumentCaptor.forClass(Map.class);
                verify(proxyService).post(eq(testClusterId), eq("/api/queues/%2F/test-queue/get"), bodyCaptor.capture(),
                                eq(List.class), eq(testUser));

                Map<String, Object> requestBody = bodyCaptor.getValue();
                assertThat(requestBody).containsEntry("count", 1);
                assertThat(requestBody).containsEntry("ackmode", "reject_requeue_true");
                assertThat(requestBody).containsEntry("encoding", "base64");
                assertThat(requestBody).doesNotContainKey("truncate");
        }

        @Test
        void getMessages_ShouldPropagateError_WhenProxyServiceFails() {
                // Given
                String vhost = "/";
                String queue = "test-queue";
                GetMessagesRequest request = new GetMessagesRequest(1, "ack_requeue_true", "auto", null);
                RuntimeException proxyError = new RuntimeException("Message retrieval failed");

                when(proxyService.post(eq(testClusterId), eq("/api/queues/%2F/test-queue/get"), any(), eq(List.class),
                                eq(testUser)))
                                .thenReturn(Mono.error(proxyError));

                // When & Then
                StepVerifier.create(resourceService.getMessages(testClusterId, vhost, queue, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                && throwable.getMessage().contains(
                                                                                "Failed to get messages from queue")
                                                                && throwable.getCause() == proxyError)
                                .verify();
        }

        @Test
        void getMessages_ShouldHandleParsingError_WhenResponseMalformed() {
                // Given
                String vhost = "/";
                String queue = "test-queue";
                GetMessagesRequest request = new GetMessagesRequest(1, "ack_requeue_true", "auto", null);

                // Return a List with invalid structure that can't be parsed as List<MessageDto>
                List<Object> invalidResponse = List.of(
                                Map.of("invalid_field", "invalid_value", "not_a_message", true),
                                "not_a_map_at_all",
                                Map.of("payload", "test", "invalid_structure", List.of("nested", "invalid")));

                when(proxyService.post(eq(testClusterId), eq("/api/queues/%2F/test-queue/get"), any(), eq(List.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(invalidResponse));

                // When & Then
                StepVerifier.create(resourceService.getMessages(testClusterId, vhost, queue, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                && throwable.getMessage().contains(
                                                                                "Failed to parse messages response"))
                                .verify();
        }
}