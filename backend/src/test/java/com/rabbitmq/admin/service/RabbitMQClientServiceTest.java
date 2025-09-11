package com.rabbitmq.admin.service;

import com.rabbitmq.admin.model.ClusterConnection;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RabbitMQClientServiceTest {

    private RabbitMQClientService clientService;
    private MockWebServer mockWebServer;
    private ClusterConnection testCluster;

    @BeforeEach
    void setUp() throws IOException {
        clientService = new RabbitMQClientService();
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        testCluster = new ClusterConnection();
        testCluster.setId(UUID.randomUUID());
        testCluster.setName("Test Cluster");
        testCluster.setApiUrl(mockWebServer.url("/").toString());
        testCluster.setUsername("admin");
        testCluster.setPassword("password");
        testCluster.setActive(true);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
        clientService.clearPool();
    }

    @Test
    void getClient_ShouldCreateAndCacheWebClient() {
        // When
        WebClient client1 = clientService.getClient(testCluster);
        WebClient client2 = clientService.getClient(testCluster);

        // Then
        assertThat(client1).isNotNull();
        assertThat(client1).isSameAs(client2); // Should return cached instance
        assertThat(clientService.getPoolSize()).isEqualTo(1);
    }

    @Test
    void getClient_WithNullCluster_ShouldThrowException() {
        // When/Then
        assertThatThrownBy(() -> clientService.getClient(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cluster connection and ID cannot be null");
    }

    @Test
    void getClient_WithNullId_ShouldThrowException() {
        // Given
        testCluster.setId(null);

        // When/Then
        assertThatThrownBy(() -> clientService.getClient(testCluster))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cluster connection and ID cannot be null");
    }

    @Test
    void getClient_WithInactiveCluster_ShouldThrowException() {
        // Given
        testCluster.setActive(false);

        // When/Then
        assertThatThrownBy(() -> clientService.getClient(testCluster))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cluster connection is not active");
    }

    @Test
    void updateClient_ShouldReplaceExistingClient() {
        // Given
        WebClient originalClient = clientService.getClient(testCluster);

        // Update cluster configuration
        testCluster.setApiUrl(mockWebServer.url("/v2/").toString());

        // When
        clientService.updateClient(testCluster);
        WebClient updatedClient = clientService.getClient(testCluster);

        // Then
        assertThat(updatedClient).isNotSameAs(originalClient);
        assertThat(clientService.getPoolSize()).isEqualTo(1);
    }

    @Test
    void removeClient_ShouldRemoveFromPool() {
        // Given
        clientService.getClient(testCluster);
        assertThat(clientService.getPoolSize()).isEqualTo(1);

        // When
        clientService.removeClient(testCluster.getId().toString());

        // Then
        assertThat(clientService.getPoolSize()).isEqualTo(0);
    }

    @Test
    void removeClient_WithNullId_ShouldNotThrow() {
        // Given
        clientService.getClient(testCluster);

        // When/Then - should not throw
        clientService.removeClient(null);
        assertThat(clientService.getPoolSize()).isEqualTo(1);
    }

    @Test
    void testConnection_WithValidCluster_ShouldReturnTrue() {
        // Given
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{\"rabbitmq_version\":\"3.12.0\"}"));

        // When
        Mono<Boolean> result = clientService.testConnection(testCluster);

        // Then
        StepVerifier.create(result)
                .expectNext(true)
                .verifyComplete();
    }

    @Test
    void testConnection_WithInvalidCluster_ShouldReturnFalse() {
        // Given
        mockWebServer.enqueue(new MockResponse().setResponseCode(401));

        // When
        Mono<Boolean> result = clientService.testConnection(testCluster);

        // Then
        StepVerifier.create(result)
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    void testConnection_WithNullCluster_ShouldReturnFalse() {
        // When
        Mono<Boolean> result = clientService.testConnection(null);

        // Then
        StepVerifier.create(result)
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    void get_ShouldMakeGetRequest() throws InterruptedException {
        // Given
        String expectedResponse = "{\"queues\":[]}";
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody(expectedResponse));

        // When
        Mono<String> result = clientService.get(testCluster, "/api/queues", String.class);

        // Then
        StepVerifier.create(result)
                .expectNext(expectedResponse)
                .verifyComplete();

        // Verify request
        RecordedRequest request = mockWebServer.takeRequest();
        assertThat(request.getMethod()).isEqualTo("GET");
        assertThat(request.getPath()).isEqualTo("/api/queues");
        assertThat(request.getHeader("Authorization")).startsWith("Basic ");
    }

    @Test
    void post_ShouldMakePostRequest() throws InterruptedException {
        // Given
        String requestBody = "{\"name\":\"test-queue\"}";
        String expectedResponse = "{\"created\":true}";
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(201)
                .setBody(expectedResponse));

        // When
        Mono<String> result = clientService.post(testCluster, "/api/queues", requestBody, String.class);

        // Then
        StepVerifier.create(result)
                .expectNext(expectedResponse)
                .verifyComplete();

        // Verify request
        RecordedRequest request = mockWebServer.takeRequest();
        assertThat(request.getMethod()).isEqualTo("POST");
        assertThat(request.getPath()).isEqualTo("/api/queues");
        assertThat(request.getBody().readUtf8()).isEqualTo(requestBody);
    }

    @Test
    void put_ShouldMakePutRequest() throws InterruptedException {
        // Given
        String requestBody = "{\"durable\":true}";
        String expectedResponse = "{\"updated\":true}";
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody(expectedResponse));

        // When
        Mono<String> result = clientService.put(testCluster, "/api/queues/test", requestBody, String.class);

        // Then
        StepVerifier.create(result)
                .expectNext(expectedResponse)
                .verifyComplete();

        // Verify request
        RecordedRequest request = mockWebServer.takeRequest();
        assertThat(request.getMethod()).isEqualTo("PUT");
        assertThat(request.getPath()).isEqualTo("/api/queues/test");
        assertThat(request.getBody().readUtf8()).isEqualTo(requestBody);
    }

    @Test
    void delete_ShouldMakeDeleteRequest() throws InterruptedException {
        // Given
        mockWebServer.enqueue(new MockResponse().setResponseCode(204));

        // When
        Mono<Void> result = clientService.delete(testCluster, "/api/queues/test");

        // Then
        StepVerifier.create(result)
                .verifyComplete();

        // Verify request
        RecordedRequest request = mockWebServer.takeRequest();
        assertThat(request.getMethod()).isEqualTo("DELETE");
        assertThat(request.getPath()).isEqualTo("/api/queues/test");
    }

    @Test
    void clearPool_ShouldRemoveAllClients() {
        // Given
        ClusterConnection cluster2 = new ClusterConnection();
        cluster2.setId(UUID.randomUUID());
        cluster2.setName("Test Cluster 2");
        cluster2.setApiUrl(mockWebServer.url("/").toString());
        cluster2.setUsername("admin");
        cluster2.setPassword("password");
        cluster2.setActive(true);

        clientService.getClient(testCluster);
        clientService.getClient(cluster2);
        assertThat(clientService.getPoolSize()).isEqualTo(2);

        // When
        clientService.clearPool();

        // Then
        assertThat(clientService.getPoolSize()).isEqualTo(0);
    }

    @Test
    void webClient_ShouldHandleBaseUrlWithoutTrailingSlash() {
        // Given
        testCluster.setApiUrl(mockWebServer.url("").toString().replaceAll("/$", ""));
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{}"));

        // When
        Mono<String> result = clientService.get(testCluster, "/api/overview", String.class);

        // Then
        StepVerifier.create(result)
                .expectNext("{}")
                .verifyComplete();
    }

    @Test
    void webClient_ShouldIncludeBasicAuthHeader() throws InterruptedException {
        // Given
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{}"));

        // When
        clientService.get(testCluster, "/api/overview", String.class).block();

        // Then
        RecordedRequest request = mockWebServer.takeRequest();
        String authHeader = request.getHeader("Authorization");
        assertThat(authHeader).isNotNull();
        assertThat(authHeader).startsWith("Basic ");

        // Decode and verify credentials
        String encodedCredentials = authHeader.substring(6);
        String decodedCredentials = new String(java.util.Base64.getDecoder().decode(encodedCredentials));
        assertThat(decodedCredentials).isEqualTo("admin:password");
    }
}