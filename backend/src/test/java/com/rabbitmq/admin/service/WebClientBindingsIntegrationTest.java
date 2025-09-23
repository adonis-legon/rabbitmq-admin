package com.rabbitmq.admin.service;

import com.rabbitmq.admin.dto.BindingDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.Base64;
import java.util.List;

/**
 * Integration test for WebClient RabbitMQ Management API calls.
 * Only runs when RabbitMQ is available (use -Drabbitmq.available=true).
 * 
 * To run this test:
 * 1. Start RabbitMQ: docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672
 * rabbitmq:3-management
 * 2. Create test data:
 * - Exchange: demo-ex
 * - Queue: demo-q
 * - Binding: demo-ex -> demo-q with routing key "demo"
 * 3. Run: mvn test -Dtest=WebClientBindingsIntegrationTest
 * -Drabbitmq.available=true
 */
@EnabledIfSystemProperty(named = "rabbitmq.available", matches = "true")
public class WebClientBindingsIntegrationTest {

    @Test
    public void testWebClientWithRealRabbitMQ() {
        System.out.println("=== INTEGRATION TEST WITH REAL RABBITMQ ===");

        // Create WebClient with same configuration as RabbitMQClientService
        String credentials = "admin:admin";
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        String authHeader = "Basic " + encodedCredentials;

        WebClient client = WebClient.builder()
                .baseUrl("http://127.0.0.1:15672/")
                .defaultHeader(HttpHeaders.AUTHORIZATION, authHeader)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.USER_AGENT, "RabbitMQ-Admin-Client/1.0")
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();

        // Test the bindings endpoint
        String path = "/api/exchanges/%2F/demo-ex/bindings/source";

        System.out.println("Testing WebClient with path: " + path);
        System.out.println("Base URL: http://127.0.0.1:15672/");
        System.out.println("Full URL: http://127.0.0.1:15672" + path);

        Mono<List<BindingDto>> response = client.get()
                .uri(path)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<BindingDto>>() {
                })
                .timeout(Duration.ofSeconds(10))
                .doOnSuccess(result -> {
                    System.out.println("✅ WebClient SUCCESS - Response: " + result);
                    System.out.println("Response size: " + (result != null ? result.size() : "null"));
                    if (result != null && !result.isEmpty()) {
                        BindingDto firstBinding = result.get(0);
                        System.out.println("First binding details:");
                        System.out.println("  Source: " + firstBinding.getSource());
                        System.out.println("  Destination: " + firstBinding.getDestination());
                        System.out.println("  Destination Type: " + firstBinding.getDestinationType());
                        System.out.println("  Routing Key: " + firstBinding.getRoutingKey());
                        System.out.println("  VHost: " + firstBinding.getVhost());
                    }
                })
                .doOnError(WebClientResponseException.class, error -> {
                    System.out.println("❌ WebClient HTTP ERROR: " + error.getStatusCode() + " - " + error.getMessage());
                    System.out.println("Response body: " + error.getResponseBodyAsString());
                })
                .doOnError(error -> {
                    System.out.println(
                            "❌ WebClient ERROR: " + error.getClass().getSimpleName() + " - " + error.getMessage());
                    error.printStackTrace();
                });

        // Verify the response
        StepVerifier.create(response)
                .assertNext(result -> {
                    System.out.println("StepVerifier - Validating result...");
                    assert result != null : "Response should not be null";
                    assert !result.isEmpty() : "Response should contain at least one binding";

                    BindingDto binding = result.get(0);
                    assert "demo-ex".equals(binding.getSource()) : "Source should be demo-ex";
                    assert "demo-q".equals(binding.getDestination()) : "Destination should be demo-q";
                    assert "queue".equals(binding.getDestinationType()) : "Destination type should be queue";
                    assert "demo".equals(binding.getRoutingKey()) : "Routing key should be demo";
                    assert "/".equals(binding.getVhost()) : "VHost should be /";

                    System.out.println("✅ All assertions passed - WebClient is working correctly with RabbitMQ!");
                })
                .verifyComplete();
    }

    @Test
    public void testWebClientOverviewWithRealRabbitMQ() {
        System.out.println("=== TESTING OVERVIEW ENDPOINT WITH REAL RABBITMQ ===");

        String credentials = "admin:admin";
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        String authHeader = "Basic " + encodedCredentials;

        WebClient client = WebClient.builder()
                .baseUrl("http://127.0.0.1:15672/")
                .defaultHeader(HttpHeaders.AUTHORIZATION, authHeader)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.USER_AGENT, "RabbitMQ-Admin-Client/1.0")
                .build();

        Mono<String> response = client.get()
                .uri("/api/overview")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(10))
                .doOnSuccess(result -> {
                    System.out.println("✅ Overview SUCCESS - RabbitMQ is accessible!");
                    System.out.println("Response length: " + (result != null ? result.length() : "null"));
                    // Parse some basic info
                    if (result != null && result.contains("rabbitmq_version")) {
                        System.out.println("✅ Response contains RabbitMQ version info");
                    }
                })
                .doOnError(error -> {
                    System.out.println("❌ Overview ERROR: " + error.getMessage());
                });

        StepVerifier.create(response)
                .assertNext(result -> {
                    assert result != null : "Overview response should not be null";
                    assert !result.trim().isEmpty() : "Overview response should not be empty";
                    assert result.contains("rabbitmq_version") : "Response should contain RabbitMQ version";
                    System.out.println("✅ Overview endpoint test passed!");
                })
                .verifyComplete();
    }
}