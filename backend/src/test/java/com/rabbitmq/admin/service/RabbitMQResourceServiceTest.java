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
import static org.mockito.Mockito.reset;

@ExtendWith(MockitoExtension.class)
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

        @Test
        void getConnections_ShouldReturnPagedConnections_WhenSuccessful() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 2);
                List<Map<String, Object>> mockConnections = createMockConnections();

                when(proxyService.get(eq(testClusterId), eq("/api/connections"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockConnections));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getItems()).hasSize(2);
                                        assertThat(result.getPage()).isEqualTo(1);
                                        assertThat(result.getPageSize()).isEqualTo(2);
                                        assertThat(result.getTotalItems()).isEqualTo(3);
                                        assertThat(result.getTotalPages()).isEqualTo(2);
                                        assertThat(result.isHasNext()).isTrue();
                                        assertThat(result.isHasPrevious()).isFalse();

                                        ConnectionDto firstConnection = result.getItems().get(0);
                                        assertThat(firstConnection.getName()).isEqualTo("connection-1");
                                        assertThat(firstConnection.getState()).isEqualTo("running");
                                        assertThat(firstConnection.getChannels()).isEqualTo(2);
                                })
                                .verifyComplete();
        }

        @Test
        void getConnections_ShouldReturnSecondPage_WhenRequestingSecondPage() {
                // Given
                PaginationRequest request = new PaginationRequest(2, 2);
                List<Map<String, Object>> mockConnections = createMockConnections();

                when(proxyService.get(eq(testClusterId), eq("/api/connections"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockConnections));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result.getItems()).hasSize(1); // Only one item on second page
                                        assertThat(result.getPage()).isEqualTo(2);
                                        assertThat(result.isHasNext()).isFalse();
                                        assertThat(result.isHasPrevious()).isTrue();

                                        ConnectionDto connection = result.getItems().get(0);
                                        assertThat(connection.getName()).isEqualTo("connection-3");
                                })
                                .verifyComplete();
        }

        @Test
        void getConnections_ShouldHandleNameFilter_WhenNameProvided() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10, "test-filter", false);
                List<Map<String, Object>> mockConnections = createMockConnections();

                when(proxyService.get(eq(testClusterId), eq("/api/connections?name=test-filter"), eq(List.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(mockConnections));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getItems()).hasSize(3);
                                })
                                .verifyComplete();
        }

        @Test
        void getConnections_ShouldHandleRegexFilter_WhenRegexEnabled() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10, "test.*", true);
                List<Map<String, Object>> mockConnections = createMockConnections();

                when(proxyService.get(eq(testClusterId), eq("/api/connections?name=test.*&use_regex=true"),
                                eq(List.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(mockConnections));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getItems()).hasSize(3);
                                })
                                .verifyComplete();
        }

        @Test
        void getConnections_ShouldPropagateError_WhenProxyServiceFails() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10);
                RuntimeException proxyError = new RuntimeException("Proxy service error");

                when(proxyService.get(eq(testClusterId), eq("/api/connections"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.error(proxyError));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getMessage().equals(
                                                                                "Failed to execute paginated request")
                                                                &&
                                                                throwable.getCause() == proxyError)
                                .verify();
        }

        @Test
        void getChannels_ShouldReturnPagedChannels_WhenSuccessful() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10);
                List<Map<String, Object>> mockChannels = createMockChannels();

                when(proxyService.get(eq(testClusterId), eq("/api/channels"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockChannels));

                // When & Then
                StepVerifier.create(resourceService.getChannels(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getItems()).hasSize(2);
                                        assertThat(result.getTotalItems()).isEqualTo(2);

                                        ChannelDto firstChannel = result.getItems().get(0);
                                        assertThat(firstChannel.getName()).isEqualTo("channel-1");
                                        assertThat(firstChannel.getNumber()).isEqualTo(1);
                                        assertThat(firstChannel.getState()).isEqualTo("running");
                                })
                                .verifyComplete();
        }

        @Test
        void getExchanges_ShouldReturnPagedExchanges_WhenSuccessful() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10);
                List<Map<String, Object>> mockExchanges = createMockExchanges();

                when(proxyService.get(eq(testClusterId), eq("/api/exchanges"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockExchanges));

                // When & Then
                StepVerifier.create(resourceService.getExchanges(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getItems()).hasSize(2);
                                        assertThat(result.getTotalItems()).isEqualTo(2);

                                        ExchangeDto firstExchange = result.getItems().get(0);
                                        assertThat(firstExchange.getName()).isEqualTo("exchange-1");
                                        assertThat(firstExchange.getType()).isEqualTo("direct");
                                        assertThat(firstExchange.getDurable()).isTrue();
                                })
                                .verifyComplete();
        }

        @Test
        void getQueues_ShouldReturnPagedQueues_WhenSuccessful() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10);
                List<Map<String, Object>> mockQueues = createMockQueues();

                when(proxyService.get(eq(testClusterId), eq("/api/queues"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockQueues));

                // When & Then
                StepVerifier.create(resourceService.getQueues(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getItems()).hasSize(2);
                                        assertThat(result.getTotalItems()).isEqualTo(2);

                                        QueueDto firstQueue = result.getItems().get(0);
                                        assertThat(firstQueue.getName()).isEqualTo("queue-1");
                                        assertThat(firstQueue.getState()).isEqualTo("running");
                                        assertThat(firstQueue.getMessages()).isEqualTo(10);
                                })
                                .verifyComplete();
        }

        @Test
        void getExchangeBindings_ShouldReturnBindings_WhenSuccessful() {
                // Given
                String vhost = "/";
                String exchangeName = "test-exchange";
                List<Map<String, Object>> mockBindings = createMockBindings();

                when(proxyService.get(eq(testClusterId), eq("/api/exchanges/%2F/test-exchange/bindings/source"),
                                eq(List.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(mockBindings));

                // When & Then
                StepVerifier.create(resourceService.getExchangeBindings(testClusterId, vhost, exchangeName, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result).hasSize(2);

                                        BindingDto firstBinding = result.get(0);
                                        assertThat(firstBinding.getSource()).isEqualTo("test-exchange");
                                        assertThat(firstBinding.getDestination()).isEqualTo("test-queue");
                                        assertThat(firstBinding.getDestinationType()).isEqualTo("queue");
                                        assertThat(firstBinding.getRoutingKey()).isEqualTo("test.key");
                                })
                                .verifyComplete();
        }

        @Test
        void getQueueBindings_ShouldReturnBindings_WhenSuccessful() {
                // Given
                String vhost = "/";
                String queueName = "test-queue";
                List<Map<String, Object>> mockBindings = createMockBindings();

                when(proxyService.get(eq(testClusterId), eq("/api/queues/%2F/test-queue/bindings"), eq(List.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(mockBindings));

                // When & Then
                StepVerifier.create(resourceService.getQueueBindings(testClusterId, vhost, queueName, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result).hasSize(2);

                                        BindingDto firstBinding = result.get(0);
                                        assertThat(firstBinding.getSource()).isEqualTo("test-exchange");
                                        assertThat(firstBinding.getDestination()).isEqualTo("test-queue");
                                })
                                .verifyComplete();
        }

        @Test
        void getExchangeBindings_ShouldHandleSpecialCharacters_InExchangeName() {
                // Given
                String vhost = "/";
                String exchangeName = "test exchange/with%special&chars";
                List<Map<String, Object>> mockBindings = createMockBindings();

                when(proxyService.get(eq(testClusterId), contains("/api/exchanges/"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockBindings));

                // When & Then
                StepVerifier.create(resourceService.getExchangeBindings(testClusterId, vhost, exchangeName, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result).hasSize(2);
                                })
                                .verifyComplete();
        }

        @Test
        void getConnections_ShouldReturnEmptyPage_WhenPageBeyondAvailableData() {
                // Given
                PaginationRequest request = new PaginationRequest(5, 10); // Page 5 with 10 items per page, but only 3
                                                                          // items
                                                                          // total
                List<Map<String, Object>> mockConnections = createMockConnections(); // Only 3 items

                when(proxyService.get(eq(testClusterId), eq("/api/connections"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockConnections));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result.getItems()).isEmpty();
                                        assertThat(result.getPage()).isEqualTo(5);
                                        assertThat(result.getTotalItems()).isEqualTo(3);
                                        assertThat(result.isHasNext()).isFalse();
                                        assertThat(result.isHasPrevious()).isTrue();
                                })
                                .verifyComplete();
        }

        @Test
        void getBindings_ShouldHandleParsingError_WhenResponseMalformed() {
                // Given
                String exchangeName = "test-exchange";
                List<Object> malformedResponse = List.of("invalid json response");

                when(proxyService.get(eq(testClusterId), anyString(), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(malformedResponse));

                // When & Then
                StepVerifier.create(resourceService.getExchangeBindings(testClusterId, "/", exchangeName, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getMessage().equals(
                                                                                "Failed to parse exchange bindings response"))
                                .verify();
        }

        // Additional comprehensive error handling tests

        @Test
        void getConnections_ShouldHandleParsingError_WhenResponseMalformed() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10);
                List<Object> malformedResponse = List.of("invalid", "json", "response");

                when(proxyService.get(eq(testClusterId), eq("/api/connections"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(malformedResponse));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getMessage()
                                                                                .equals("Failed to parse API response"))
                                .verify();
        }

        @Test
        void getChannels_ShouldHandleParsingError_WhenResponseMalformed() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10);

                // Simulate a parsing error by returning a runtime exception from the proxy
                RuntimeException parsingError = new RuntimeException("Malformed JSON response");

                when(proxyService.get(eq(testClusterId), eq("/api/channels"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.error(parsingError));

                // When & Then
                StepVerifier.create(resourceService.getChannels(testClusterId, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getCause() == parsingError)
                                .verify();
        }

        @Test
        void getExchanges_ShouldHandleParsingError_WhenResponseMalformed() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10);

                // Simulate a parsing error by returning a runtime exception from the proxy
                RuntimeException parsingError = new RuntimeException("Malformed JSON response");

                when(proxyService.get(eq(testClusterId), eq("/api/exchanges"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.error(parsingError));

                // When & Then
                StepVerifier.create(resourceService.getExchanges(testClusterId, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getCause() == parsingError)
                                .verify();
        }

        @Test
        void getQueues_ShouldHandleParsingError_WhenResponseMalformed() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10);

                // Simulate a parsing error by returning a runtime exception from the proxy
                RuntimeException parsingError = new RuntimeException("Malformed JSON response");

                when(proxyService.get(eq(testClusterId), eq("/api/queues"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.error(parsingError));

                // When & Then
                StepVerifier.create(resourceService.getQueues(testClusterId, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getCause() == parsingError)
                                .verify();
        }

        @Test
        void getQueueBindings_ShouldHandleParsingError_WhenResponseMalformed() {
                // Given
                String queueName = "test-queue";
                List<Object> malformedResponse = List.of("invalid json response");

                when(proxyService.get(eq(testClusterId), anyString(), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(malformedResponse));

                // When & Then
                StepVerifier.create(resourceService.getQueueBindings(testClusterId, "/", queueName, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getMessage().equals(
                                                                                "Failed to parse queue bindings response"))
                                .verify();
        }

        @Test
        void getAllResourceMethods_ShouldHandleNetworkTimeout() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10);
                RuntimeException timeoutError = new RuntimeException("Network timeout");

                // Reset mocks to avoid interference from previous tests
                reset(proxyService);

                when(proxyService.get(eq(testClusterId), anyString(), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.error(timeoutError));

                // When & Then - Test all resource methods handle timeout errors
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getCause() == timeoutError)
                                .verify();

                StepVerifier.create(resourceService.getChannels(testClusterId, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getCause() == timeoutError)
                                .verify();

                StepVerifier.create(resourceService.getExchanges(testClusterId, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getCause() == timeoutError)
                                .verify();

                StepVerifier.create(resourceService.getQueues(testClusterId, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getCause() == timeoutError)
                                .verify();
        }

        @Test
        void getBindings_ShouldHandleNetworkTimeout() {
                // Given
                RuntimeException timeoutError = new RuntimeException("Network timeout");

                // Reset mocks to avoid interference from previous tests
                reset(proxyService);

                when(proxyService.get(eq(testClusterId), anyString(), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.error(timeoutError));

                // When & Then
                StepVerifier.create(resourceService.getExchangeBindings(testClusterId, "/", "test-exchange", testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getCause() == timeoutError)
                                .verify();

                StepVerifier.create(resourceService.getQueueBindings(testClusterId, "/", "test-queue", testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getCause() == timeoutError)
                                .verify();
        }

        // Performance and large dataset tests

        @Test
        void getConnections_ShouldHandleLargeDataset_WithPagination() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 50);
                List<Map<String, Object>> largeConnectionList = createLargeConnectionDataset(1000);

                when(proxyService.get(eq(testClusterId), eq("/api/connections"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(largeConnectionList));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result.getItems()).hasSize(50); // First page
                                        assertThat(result.getTotalItems()).isEqualTo(1000);
                                        assertThat(result.getTotalPages()).isEqualTo(20);
                                        assertThat(result.isHasNext()).isTrue();
                                        assertThat(result.isHasPrevious()).isFalse();
                                })
                                .verifyComplete();
        }

        @Test
        void getConnections_ShouldHandleLargeDataset_LastPage() {
                // Given
                PaginationRequest request = new PaginationRequest(20, 50); // Last page
                List<Map<String, Object>> largeConnectionList = createLargeConnectionDataset(1000);

                when(proxyService.get(eq(testClusterId), eq("/api/connections"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(largeConnectionList));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result.getItems()).hasSize(50); // Last page
                                        assertThat(result.getTotalItems()).isEqualTo(1000);
                                        assertThat(result.getTotalPages()).isEqualTo(20);
                                        assertThat(result.isHasNext()).isFalse();
                                        assertThat(result.isHasPrevious()).isTrue();
                                })
                                .verifyComplete();
        }

        @Test
        void getQueues_ShouldHandleLargeDataset_WithSmallPageSize() {
                // Given
                PaginationRequest request = new PaginationRequest(5, 10); // Small page size
                List<Map<String, Object>> largeQueueList = createLargeQueueDataset(500);

                when(proxyService.get(eq(testClusterId), eq("/api/queues"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(largeQueueList));

                // When & Then
                StepVerifier.create(resourceService.getQueues(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result.getItems()).hasSize(10);
                                        assertThat(result.getTotalItems()).isEqualTo(500);
                                        assertThat(result.getTotalPages()).isEqualTo(50);
                                        assertThat(result.getPage()).isEqualTo(5);
                                        assertThat(result.isHasNext()).isTrue();
                                        assertThat(result.isHasPrevious()).isTrue();
                                })
                                .verifyComplete();
        }

        @Test
        void getExchangeBindings_ShouldHandleLargeBindingList() {
                // Given
                String vhost = "/";
                String exchangeName = "high-traffic-exchange";
                List<Map<String, Object>> largeBindingList = createLargeBindingDataset(200);

                when(proxyService.get(eq(testClusterId), contains("/api/exchanges/"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(largeBindingList));

                // When & Then
                StepVerifier.create(resourceService.getExchangeBindings(testClusterId, vhost, exchangeName, testUser))
                                .assertNext(result -> {
                                        assertThat(result).hasSize(200);
                                        assertThat(result.get(0).getSource()).isEqualTo("high-traffic-exchange");
                                })
                                .verifyComplete();
        }

        // Edge case tests

        @Test
        void getConnections_ShouldHandleEmptyResponse() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10);
                List<Map<String, Object>> emptyResponse = List.of();

                when(proxyService.get(eq(testClusterId), eq("/api/connections"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(emptyResponse));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result.getItems()).isEmpty();
                                        assertThat(result.getTotalItems()).isEqualTo(0);
                                        assertThat(result.getTotalPages()).isEqualTo(0);
                                        assertThat(result.isHasNext()).isFalse();
                                        assertThat(result.isHasPrevious()).isFalse();
                                })
                                .verifyComplete();
        }

        @Test
        void getConnections_ShouldHandleNullResponse() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10);

                // Simulate a null response error that would cause the service to fail
                RuntimeException nullResponseError = new RuntimeException("Null response from API");

                when(proxyService.get(eq(testClusterId), eq("/api/connections"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.error(nullResponseError));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .expectErrorMatches(
                                                throwable -> throwable instanceof RabbitMQResourceService.RabbitMQResourceException
                                                                &&
                                                                throwable.getCause() == nullResponseError)
                                .verify();
        }

        @Test
        void getConnections_ShouldHandleSpecialCharactersInNameFilter() {
                // Given
                PaginationRequest request = new PaginationRequest(1, 10, "connection with spaces & special chars!",
                                false);
                List<Map<String, Object>> mockConnections = createMockConnections();

                when(proxyService.get(eq(testClusterId), contains("connection+with+spaces"), eq(List.class),
                                eq(testUser)))
                                .thenReturn(Mono.just(mockConnections));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, request, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result.getItems()).hasSize(3);
                                })
                                .verifyComplete();
        }

        @Test
        void getExchangeBindings_ShouldHandleUnicodeCharacters_InExchangeName() {
                // Given
                String vhost = "/";
                String exchangeName = "测试交换机-ñáméwithünicode";
                List<Map<String, Object>> mockBindings = createMockBindings();

                when(proxyService.get(eq(testClusterId), contains("/api/exchanges/"), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(mockBindings));

                // When & Then
                StepVerifier.create(resourceService.getExchangeBindings(testClusterId, vhost, exchangeName, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isNotNull();
                                        assertThat(result).hasSize(2);
                                })
                                .verifyComplete();
        }

        @Test
        void getQueueBindings_ShouldHandleEmptyBindingList() {
                // Given
                String vhost = "/";
                String queueName = "empty-queue";
                List<Map<String, Object>> emptyBindings = List.of();

                when(proxyService.get(eq(testClusterId), anyString(), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(emptyBindings));

                // When & Then
                StepVerifier.create(resourceService.getQueueBindings(testClusterId, vhost, queueName, testUser))
                                .assertNext(result -> {
                                        assertThat(result).isEmpty();
                                })
                                .verifyComplete();
        }

        @Test
        void getAllResourceMethods_ShouldHandleMaxPageSize() {
                // Given
                PaginationRequest maxPageRequest = new PaginationRequest(1, 500); // Max page size
                List<Map<String, Object>> largeDataset = createLargeConnectionDataset(1000);

                when(proxyService.get(eq(testClusterId), anyString(), eq(List.class), eq(testUser)))
                                .thenReturn(Mono.just(largeDataset));

                // When & Then
                StepVerifier.create(resourceService.getConnections(testClusterId, maxPageRequest, testUser))
                                .assertNext(result -> {
                                        assertThat(result.getItems()).hasSize(500); // First 500 items
                                        assertThat(result.getTotalItems()).isEqualTo(1000);
                                        assertThat(result.getTotalPages()).isEqualTo(2);
                                })
                                .verifyComplete();
        }

        // Helper methods for creating large datasets

        private List<Map<String, Object>> createLargeConnectionDataset(int size) {
                List<Map<String, Object>> connections = new ArrayList<>();
                for (int i = 0; i < size; i++) {
                        Map<String, Object> conn = new HashMap<>();
                        conn.put("name", "connection-" + i);
                        conn.put("state", i % 3 == 0 ? "running" : (i % 3 == 1 ? "blocked" : "closing"));
                        conn.put("channels", i % 5);
                        conn.put("host", "localhost");
                        conn.put("peer_host", "192.168.1." + (100 + i % 155));
                        conn.put("port", 5672);
                        conn.put("peer_port", 50000 + i);
                        conn.put("protocol", "AMQP 0-9-1");
                        conn.put("user", "user-" + (i % 10));
                        conn.put("vhost", i % 2 == 0 ? "/" : "/vhost-" + (i % 5));
                        conn.put("connected_at", System.currentTimeMillis() - (i * 1000));
                        connections.add(conn);
                }
                return connections;
        }

        private List<Map<String, Object>> createLargeQueueDataset(int size) {
                List<Map<String, Object>> queues = new ArrayList<>();
                for (int i = 0; i < size; i++) {
                        Map<String, Object> queue = new HashMap<>();
                        queue.put("name", "queue-" + i);
                        queue.put("state", i % 4 == 0 ? "running"
                                        : (i % 4 == 1 ? "idle" : (i % 4 == 2 ? "flow" : "down")));
                        queue.put("durable", i % 2 == 0);
                        queue.put("auto_delete", i % 3 == 0);
                        queue.put("exclusive", i % 10 == 0);
                        queue.put("arguments", new HashMap<>());
                        queue.put("node", "rabbit@node" + (i % 3 + 1));
                        queue.put("vhost", i % 2 == 0 ? "/" : "/vhost-" + (i % 5));
                        queue.put("messages", i * 10);
                        queue.put("messages_ready", i * 8);
                        queue.put("messages_unacknowledged", i * 2);
                        queue.put("consumers", i % 5);
                        queue.put("memory", 1024L * (i + 1));
                        queues.add(queue);
                }
                return queues;
        }

        private List<Map<String, Object>> createLargeBindingDataset(int size) {
                List<Map<String, Object>> bindings = new ArrayList<>();
                for (int i = 0; i < size; i++) {
                        Map<String, Object> binding = new HashMap<>();
                        binding.put("source", "high-traffic-exchange");
                        binding.put("destination", "queue-" + i);
                        binding.put("destination_type", i % 10 == 0 ? "exchange" : "queue");
                        binding.put("routing_key", "routing.key." + i);
                        binding.put("arguments", new HashMap<>());
                        binding.put("vhost", "/");
                        bindings.add(binding);
                }
                return bindings;
        }

        // Helper methods to create mock data

        private List<Map<String, Object>> createMockConnections() {
                List<Map<String, Object>> connections = new ArrayList<>();

                Map<String, Object> conn1 = new HashMap<>();
                conn1.put("name", "connection-1");
                conn1.put("state", "running");
                conn1.put("channels", 2);
                conn1.put("host", "localhost");
                conn1.put("peer_host", "192.168.1.100");
                conn1.put("port", 5672);
                conn1.put("peer_port", 54321);
                conn1.put("protocol", "AMQP 0-9-1");
                conn1.put("user", "guest");
                conn1.put("vhost", "/");
                conn1.put("connected_at", 1640995200000L);
                connections.add(conn1);

                Map<String, Object> conn2 = new HashMap<>();
                conn2.put("name", "connection-2");
                conn2.put("state", "running");
                conn2.put("channels", 1);
                conn2.put("host", "localhost");
                conn2.put("peer_host", "192.168.1.101");
                conn2.put("port", 5672);
                conn2.put("peer_port", 54322);
                conn2.put("protocol", "AMQP 0-9-1");
                conn2.put("user", "guest");
                conn2.put("vhost", "/");
                conn2.put("connected_at", 1640995300000L);
                connections.add(conn2);

                Map<String, Object> conn3 = new HashMap<>();
                conn3.put("name", "connection-3");
                conn3.put("state", "blocked");
                conn3.put("channels", 0);
                conn3.put("host", "localhost");
                conn3.put("peer_host", "192.168.1.102");
                conn3.put("port", 5672);
                conn3.put("peer_port", 54323);
                conn3.put("protocol", "AMQP 0-9-1");
                conn3.put("user", "guest");
                conn3.put("vhost", "/");
                conn3.put("connected_at", 1640995400000L);
                connections.add(conn3);

                return connections;
        }

        private List<Map<String, Object>> createMockChannels() {
                List<Map<String, Object>> channels = new ArrayList<>();

                Map<String, Object> chan1 = new HashMap<>();
                chan1.put("name", "channel-1");
                chan1.put("number", 1);
                chan1.put("state", "running");
                chan1.put("consumer_count", 2);
                chan1.put("messages_unacknowledged", 5);
                chan1.put("prefetch_count", 10);
                chan1.put("transactional", false);
                chan1.put("confirm", true);
                chan1.put("user", "guest");
                chan1.put("vhost", "/");
                channels.add(chan1);

                Map<String, Object> chan2 = new HashMap<>();
                chan2.put("name", "channel-2");
                chan2.put("number", 2);
                chan2.put("state", "flow");
                chan2.put("consumer_count", 1);
                chan2.put("messages_unacknowledged", 0);
                chan2.put("prefetch_count", 5);
                chan2.put("transactional", true);
                chan2.put("confirm", false);
                chan2.put("user", "guest");
                chan2.put("vhost", "/");
                channels.add(chan2);

                return channels;
        }

        private List<Map<String, Object>> createMockExchanges() {
                List<Map<String, Object>> exchanges = new ArrayList<>();

                Map<String, Object> exch1 = new HashMap<>();
                exch1.put("name", "exchange-1");
                exch1.put("type", "direct");
                exch1.put("durable", true);
                exch1.put("auto_delete", false);
                exch1.put("internal", false);
                exch1.put("arguments", new HashMap<>());
                exch1.put("vhost", "/");
                exchanges.add(exch1);

                Map<String, Object> exch2 = new HashMap<>();
                exch2.put("name", "exchange-2");
                exch2.put("type", "topic");
                exch2.put("durable", false);
                exch2.put("auto_delete", true);
                exch2.put("internal", false);
                exch2.put("arguments", new HashMap<>());
                exch2.put("vhost", "/");
                exchanges.add(exch2);

                return exchanges;
        }

        private List<Map<String, Object>> createMockQueues() {
                List<Map<String, Object>> queues = new ArrayList<>();

                Map<String, Object> queue1 = new HashMap<>();
                queue1.put("name", "queue-1");
                queue1.put("state", "running");
                queue1.put("durable", true);
                queue1.put("auto_delete", false);
                queue1.put("exclusive", false);
                queue1.put("arguments", new HashMap<>());
                queue1.put("node", "rabbit@node1");
                queue1.put("vhost", "/");
                queue1.put("messages", 10);
                queue1.put("messages_ready", 8);
                queue1.put("messages_unacknowledged", 2);
                queue1.put("consumers", 1);
                queue1.put("memory", 1024L);
                queues.add(queue1);

                Map<String, Object> queue2 = new HashMap<>();
                queue2.put("name", "queue-2");
                queue2.put("state", "idle");
                queue2.put("durable", false);
                queue2.put("auto_delete", true);
                queue2.put("exclusive", true);
                queue2.put("arguments", new HashMap<>());
                queue2.put("node", "rabbit@node2");
                queue2.put("vhost", "/");
                queue2.put("messages", 0);
                queue2.put("messages_ready", 0);
                queue2.put("messages_unacknowledged", 0);
                queue2.put("consumers", 0);
                queue2.put("memory", 512L);
                queues.add(queue2);

                return queues;
        }

        private List<Map<String, Object>> createMockBindings() {
                List<Map<String, Object>> bindings = new ArrayList<>();

                Map<String, Object> binding1 = new HashMap<>();
                binding1.put("source", "test-exchange");
                binding1.put("destination", "test-queue");
                binding1.put("destination_type", "queue");
                binding1.put("routing_key", "test.key");
                binding1.put("arguments", new HashMap<>());
                binding1.put("vhost", "/");
                bindings.add(binding1);

                Map<String, Object> binding2 = new HashMap<>();
                binding2.put("source", "test-exchange");
                binding2.put("destination", "another-queue");
                binding2.put("destination_type", "queue");
                binding2.put("routing_key", "another.key");
                binding2.put("arguments", new HashMap<>());
                binding2.put("vhost", "/");
                bindings.add(binding2);

                return bindings;
        }
}