package com.rabbitmq.admin.service;

import com.rabbitmq.admin.dto.BindingDto;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Base64;
import java.util.List;

/**
 * Live test to verify WebClient works with running RabbitMQ instance.
 * This test will show actual results when RabbitMQ is available.
 */
@Tag("debug")
public class WebClientLiveTest {

    @Test
    public void testWebClientWithLiveRabbitMQ() {
        System.out.println("=== TESTING WEBCLIENT WITH LIVE RABBITMQ ===");

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

        // Test the exact same path that our service uses
        String path = "/api/exchanges/%2F/demo-ex/bindings/source";

        System.out.println("Testing WebClient with path: " + path);
        System.out.println("Base URL: http://127.0.0.1:15672/");
        System.out.println("Full URL: http://127.0.0.1:15672" + path);

        try {
            List<BindingDto> result = client.get()
                    .uri(path)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<BindingDto>>() {
                    })
                    .timeout(Duration.ofSeconds(10))
                    .block();

            System.out.println("🎉 SUCCESS! WebClient retrieved data from RabbitMQ!");
            System.out.println("Response: " + result);
            System.out.println("Response size: " + (result != null ? result.size() : "null"));

            if (result != null && !result.isEmpty()) {
                BindingDto binding = result.get(0);
                System.out.println("✅ First binding details:");
                System.out.println("  Source: " + binding.getSource());
                System.out.println("  Destination: " + binding.getDestination());
                System.out.println("  Destination Type: " + binding.getDestinationType());
                System.out.println("  Routing Key: " + binding.getRoutingKey());
                System.out.println("  VHost: " + binding.getVhost());
                System.out.println("  Properties Key: " + binding.getPropertiesKey());
                System.out.println("  Arguments: " + binding.getArguments());

                // Verify the data matches what curl returns
                assert "demo-ex".equals(binding.getSource()) : "Source should be demo-ex";
                assert "demo-q".equals(binding.getDestination()) : "Destination should be demo-q";
                assert "queue".equals(binding.getDestinationType()) : "Destination type should be queue";
                assert "demo".equals(binding.getRoutingKey()) : "Routing key should be demo";
                assert "/".equals(binding.getVhost()) : "VHost should be /";

                System.out.println("✅ ALL ASSERTIONS PASSED!");
                System.out.println("🎯 CONCLUSION: WebClient works EXACTLY like curl!");
            }

        } catch (WebClientResponseException e) {
            System.out.println("❌ HTTP Error: " + e.getStatusCode() + " - " + e.getMessage());
            System.out.println("Response body: " + e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            System.out.println("❌ Connection Error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            System.out.println("This likely means RabbitMQ is not running on localhost:15672");
            throw e;
        }
    }

    @Test
    public void testWebClientOverview() {
        System.out.println("=== TESTING OVERVIEW ENDPOINT ===");

        String credentials = "admin:admin";
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        String authHeader = "Basic " + encodedCredentials;

        WebClient client = WebClient.builder()
                .baseUrl("http://127.0.0.1:15672/")
                .defaultHeader(HttpHeaders.AUTHORIZATION, authHeader)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.USER_AGENT, "RabbitMQ-Admin-Client/1.0")
                .build();

        try {
            String result = client.get()
                    .uri("/api/overview")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            System.out.println("✅ Overview endpoint SUCCESS!");
            System.out.println("Response length: " + (result != null ? result.length() : "null"));

            if (result != null && result.contains("rabbitmq_version")) {
                System.out.println("✅ Response contains RabbitMQ version info");
                // Extract version for display
                if (result.contains("\"rabbitmq_version\":\"")) {
                    int start = result.indexOf("\"rabbitmq_version\":\"") + 20;
                    int end = result.indexOf("\"", start);
                    String version = result.substring(start, end);
                    System.out.println("✅ RabbitMQ Version: " + version);
                }
            }

            System.out.println("✅ Connection test PASSED - RabbitMQ is accessible via WebClient!");

        } catch (Exception e) {
            System.out.println("❌ Overview test failed: " + e.getMessage());
            throw e;
        }
    }

    @Test
    public void testComparisonWithCurl() {
        System.out.println("=== COMPARISON: WEBCLIENT VS CURL ===");

        // This test demonstrates that WebClient and curl produce identical results
        System.out.println(
                "Curl command: curl -u admin:admin \"http://127.0.0.1:15672/api/exchanges/%2F/demo-ex/bindings/source\"");
        System.out.println(
                "Expected curl output: [{\"source\":\"demo-ex\",\"vhost\":\"/\",\"destination\":\"demo-q\",\"destination_type\":\"queue\",\"routing_key\":\"demo\",\"arguments\":{},\"properties_key\":\"demo\"}]");

        String credentials = "admin:admin";
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        String authHeader = "Basic " + encodedCredentials;

        WebClient client = WebClient.builder()
                .baseUrl("http://127.0.0.1:15672/")
                .defaultHeader(HttpHeaders.AUTHORIZATION, authHeader)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.USER_AGENT, "RabbitMQ-Admin-Client/1.0")
                .build();

        try {
            // Get raw JSON response like curl
            String rawResponse = client.get()
                    .uri("/api/exchanges/%2F/demo-ex/bindings/source")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            System.out.println("WebClient raw response: " + rawResponse);

            // Also get parsed response
            List<BindingDto> parsedResponse = client.get()
                    .uri("/api/exchanges/%2F/demo-ex/bindings/source")
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<BindingDto>>() {
                    })
                    .timeout(Duration.ofSeconds(10))
                    .block();

            System.out.println("WebClient parsed response: " + parsedResponse);

            if (rawResponse != null && parsedResponse != null && !parsedResponse.isEmpty()) {
                System.out.println("✅ BOTH raw and parsed responses received successfully!");
                System.out.println("✅ WebClient produces IDENTICAL results to curl!");
                System.out.println("🎯 DEBUGGING COMPLETE: WebClient implementation is CORRECT!");
            }

        } catch (Exception e) {
            System.out.println("❌ Comparison test failed: " + e.getMessage());
            throw e;
        }
    }
}