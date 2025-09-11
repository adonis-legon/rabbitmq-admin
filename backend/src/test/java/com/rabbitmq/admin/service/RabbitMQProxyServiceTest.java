package com.rabbitmq.admin.service;

import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.service.RabbitMQProxyService.RabbitMQProxyException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RabbitMQProxyServiceTest {

    @Mock
    private RabbitMQClientService clientService;

    @Mock
    private ClusterConnectionService clusterConnectionService;

    private RabbitMQProxyService proxyService;

    private User adminUser;
    private User regularUser;
    private ClusterConnection testCluster;
    private UUID clusterId;

    @BeforeEach
    void setUp() {
        proxyService = new RabbitMQProxyService(clientService, clusterConnectionService);

        clusterId = UUID.randomUUID();

        // Create test users
        adminUser = new User();
        adminUser.setId(UUID.randomUUID());
        adminUser.setUsername("admin");
        adminUser.setRole(UserRole.ADMINISTRATOR);

        regularUser = new User();
        regularUser.setId(UUID.randomUUID());
        regularUser.setUsername("user");
        regularUser.setRole(UserRole.USER);

        // Create test cluster
        testCluster = new ClusterConnection();
        testCluster.setId(clusterId);
        testCluster.setName("Test Cluster");
        testCluster.setApiUrl("http://localhost:15672");
        testCluster.setUsername("admin");
        testCluster.setPassword("password");
        testCluster.setActive(true);
    }

    @Test
    void get_WithAdminUser_ShouldAllowAccess() {
        // Given
        String path = "/api/queues";
        String expectedResponse = "{\"queues\":[]}";

        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clientService.get(testCluster, path, String.class)).thenReturn(Mono.just(expectedResponse));

        // When
        Mono<String> result = proxyService.get(clusterId, path, String.class, adminUser);

        // Then
        StepVerifier.create(result)
                .expectNext(expectedResponse)
                .verifyComplete();

        verify(clusterConnectionService).getClusterConnectionById(clusterId);
        verify(clientService).get(testCluster, path, String.class);
        // Admin users should not have access validation called
        verify(clusterConnectionService, never()).userHasAccessToCluster(any(), any());
    }

    @Test
    void get_WithRegularUserHavingAccess_ShouldAllowAccess() {
        // Given
        String path = "/api/queues";
        String expectedResponse = "{\"queues\":[]}";

        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clusterConnectionService.userHasAccessToCluster(regularUser.getId(), clusterId)).thenReturn(true);
        when(clientService.get(testCluster, path, String.class)).thenReturn(Mono.just(expectedResponse));

        // When
        Mono<String> result = proxyService.get(clusterId, path, String.class, regularUser);

        // Then
        StepVerifier.create(result)
                .expectNext(expectedResponse)
                .verifyComplete();

        verify(clusterConnectionService).getClusterConnectionById(clusterId);
        verify(clusterConnectionService).userHasAccessToCluster(regularUser.getId(), clusterId);
        verify(clientService).get(testCluster, path, String.class);
    }

    @Test
    void get_WithRegularUserWithoutAccess_ShouldDenyAccess() {
        // Given
        String path = "/api/queues";

        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clusterConnectionService.userHasAccessToCluster(regularUser.getId(), clusterId)).thenReturn(false);

        // When
        Mono<String> result = proxyService.get(clusterId, path, String.class, regularUser);

        // Then
        StepVerifier.create(result)
                .expectError(AccessDeniedException.class)
                .verify();

        verify(clusterConnectionService).getClusterConnectionById(clusterId);
        verify(clusterConnectionService).userHasAccessToCluster(regularUser.getId(), clusterId);
        verify(clientService, never()).get(any(), any(), any());
    }

    @Test
    void get_WithNullClusterId_ShouldThrowException() {
        // When
        Mono<String> result = proxyService.get(null, "/api/queues", String.class, adminUser);

        // Then
        StepVerifier.create(result)
                .expectError(IllegalArgumentException.class)
                .verify();
    }

    @Test
    void get_WithNullUser_ShouldThrowException() {
        // When
        Mono<String> result = proxyService.get(clusterId, "/api/queues", String.class, null);

        // Then
        StepVerifier.create(result)
                .expectError(AccessDeniedException.class)
                .verify();
    }

    @Test
    void get_WithInactiveCluster_ShouldThrowException() {
        // Given
        testCluster.setActive(false);
        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);

        // When
        Mono<String> result = proxyService.get(clusterId, "/api/queues", String.class, adminUser);

        // Then
        StepVerifier.create(result)
                .expectError(IllegalArgumentException.class)
                .verify();
    }

    @Test
    void get_WithNonExistentCluster_ShouldThrowException() {
        // Given
        when(clusterConnectionService.getClusterConnectionById(clusterId))
                .thenThrow(new IllegalArgumentException("Cluster not found"));

        // When
        Mono<String> result = proxyService.get(clusterId, "/api/queues", String.class, adminUser);

        // Then
        StepVerifier.create(result)
                .expectError(IllegalArgumentException.class)
                .verify();
    }

    @Test
    void post_WithValidRequest_ShouldSucceed() {
        // Given
        String path = "/api/queues";
        String requestBody = "{\"name\":\"test-queue\"}";
        String expectedResponse = "{\"created\":true}";

        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clientService.post(testCluster, path, requestBody, String.class)).thenReturn(Mono.just(expectedResponse));

        // When
        Mono<String> result = proxyService.post(clusterId, path, requestBody, String.class, adminUser);

        // Then
        StepVerifier.create(result)
                .expectNext(expectedResponse)
                .verifyComplete();

        verify(clientService).post(testCluster, path, requestBody, String.class);
    }

    @Test
    void put_WithValidRequest_ShouldSucceed() {
        // Given
        String path = "/api/queues/test";
        String requestBody = "{\"durable\":true}";
        String expectedResponse = "{\"updated\":true}";

        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clientService.put(testCluster, path, requestBody, String.class)).thenReturn(Mono.just(expectedResponse));

        // When
        Mono<String> result = proxyService.put(clusterId, path, requestBody, String.class, adminUser);

        // Then
        StepVerifier.create(result)
                .expectNext(expectedResponse)
                .verifyComplete();

        verify(clientService).put(testCluster, path, requestBody, String.class);
    }

    @Test
    void delete_WithValidRequest_ShouldSucceed() {
        // Given
        String path = "/api/queues/test";

        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clientService.delete(testCluster, path)).thenReturn(Mono.empty());

        // When
        Mono<Void> result = proxyService.delete(clusterId, path, adminUser);

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        verify(clientService).delete(testCluster, path);
    }

    @Test
    void testConnection_WithValidCluster_ShouldReturnTrue() {
        // Given
        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clientService.testConnection(testCluster)).thenReturn(Mono.just(true));

        // When
        Mono<Boolean> result = proxyService.testConnection(clusterId, adminUser);

        // Then
        StepVerifier.create(result)
                .expectNext(true)
                .verifyComplete();

        verify(clientService).testConnection(testCluster);
    }

    @Test
    void testConnection_WithConnectionFailure_ShouldReturnFalse() {
        // Given
        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clientService.testConnection(testCluster))
                .thenReturn(Mono.error(new RuntimeException("Connection failed")));

        // When
        Mono<Boolean> result = proxyService.testConnection(clusterId, adminUser);

        // Then
        StepVerifier.create(result)
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    void get_WithWebClientResponseException_ShouldMapToProxyException() {
        // Given
        String path = "/api/queues";
        WebClientResponseException webEx = WebClientResponseException.create(
                401, "Unauthorized", null, null, null);

        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clientService.get(testCluster, path, String.class)).thenReturn(Mono.error(webEx));

        // When
        Mono<String> result = proxyService.get(clusterId, path, String.class, adminUser);

        // Then
        StepVerifier.create(result)
                .expectError(RabbitMQProxyException.class)
                .verify();
    }

    @Test
    void get_WithConnectException_ShouldMapToProxyException() {
        // Given
        String path = "/api/queues";
        java.net.ConnectException connectEx = new java.net.ConnectException("Connection refused");

        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clientService.get(testCluster, path, String.class)).thenReturn(Mono.error(connectEx));

        // When
        Mono<String> result = proxyService.get(clusterId, path, String.class, adminUser);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(RabbitMQProxyException.class);
                    assertThat(error.getMessage()).contains("Unable to connect to RabbitMQ cluster");
                })
                .verify();
    }

    @Test
    void get_WithTimeoutException_ShouldMapToProxyException() {
        // Given
        String path = "/api/queues";
        java.util.concurrent.TimeoutException timeoutEx = new java.util.concurrent.TimeoutException("Request timeout");

        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clientService.get(testCluster, path, String.class)).thenReturn(Mono.error(timeoutEx));

        // When
        Mono<String> result = proxyService.get(clusterId, path, String.class, adminUser);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(RabbitMQProxyException.class);
                    assertThat(error.getMessage()).contains("Request to RabbitMQ cluster timed out");
                })
                .verify();
    }

    @Test
    void get_WithGenericException_ShouldMapToProxyException() {
        // Given
        String path = "/api/queues";
        RuntimeException genericEx = new RuntimeException("Generic error");

        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clientService.get(testCluster, path, String.class)).thenReturn(Mono.error(genericEx));

        // When
        Mono<String> result = proxyService.get(clusterId, path, String.class, adminUser);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(RabbitMQProxyException.class);
                    assertThat(error.getMessage()).contains("Unexpected error communicating with RabbitMQ cluster");
                })
                .verify();
    }

    @Test
    void validateUserAccessAndGetCluster_WithDifferentHttpStatusCodes_ShouldMapCorrectly() {
        // Test different HTTP status codes mapping
        testHttpStatusMapping(403, "RabbitMQ API access forbidden");
        testHttpStatusMapping(404, "RabbitMQ API endpoint not found");
        testHttpStatusMapping(500, "RabbitMQ API internal server error");
        testHttpStatusMapping(503, "RabbitMQ API service unavailable");
    }

    private void testHttpStatusMapping(int statusCode, String expectedMessage) {
        // Given
        String path = "/api/queues";
        WebClientResponseException webEx = WebClientResponseException.create(
                statusCode, "Status Text", null, null, null);

        when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);
        when(clientService.get(testCluster, path, String.class)).thenReturn(Mono.error(webEx));

        // When
        Mono<String> result = proxyService.get(clusterId, path, String.class, adminUser);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(RabbitMQProxyException.class);
                    assertThat(error.getMessage()).contains(expectedMessage);
                })
                .verify();
    }
}