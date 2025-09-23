package com.rabbitmq.admin.service;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Base64;

/**
 * Debug test to identify why WebClient returns empty array while curl returns
 * data
 */
@Tag("debug")
public class WebClientDebugTest {

    @Test
    public void debugWebClientVsCurl() {
        System.out.println("=== DEBUGGING WEBCLIENT VS CURL DIFFERENCE ===");

        String credentials = "admin:admin";
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        String authHeader = "Basic " + encodedCredentials;

        System.out.println("Credentials: " + credentials);
        System.out.println("Encoded: " + encodedCredentials);
        System.out.println("Auth Header: " + authHeader);

        // Test 1: Minimal WebClient (like curl)
        System.out.println("\n=== TEST 1: MINIMAL WEBCLIENT ===");
        WebClient minimalClient = WebClient.builder()
                .baseUrl("http://127.0.0.1:15672") // No trailing slash
                .build();

        try {
            String result1 = minimalClient.get()
                    .uri("/api/exchanges/%2F/demo-ex/bindings/source")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            System.out.println("Minimal WebClient result: " + result1);
        } catch (Exception e) {
            System.out.println("Minimal WebClient error: " + e.getMessage());
        }

        // Test 2: WebClient with Accept header
        System.out.println("\n=== TEST 2: WEBCLIENT WITH ACCEPT HEADER ===");
        try {
            String result2 = minimalClient.get()
                    .uri("/api/exchanges/%2F/demo-ex/bindings/source")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            System.out.println("WebClient with Accept result: " + result2);
        } catch (Exception e) {
            System.out.println("WebClient with Accept error: " + e.getMessage());
        }

        // Test 3: Different URL variations
        System.out.println("\n=== TEST 3: URL VARIATIONS ===");

        String[] urlVariations = {
                "/api/exchanges/%2F/demo-ex/bindings/source",
                "/api/exchanges//demo-ex/bindings/source",
                "/api/exchanges/%2f/demo-ex/bindings/source",
                "api/exchanges/%2F/demo-ex/bindings/source"
        };

        for (String url : urlVariations) {
            try {
                System.out.println("Testing URL: " + url);
                String result = minimalClient.get()
                        .uri(url)
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(5))
                        .block();

                System.out.println("  Result: " + result);
            } catch (Exception e) {
                System.out.println("  Error: " + e.getMessage());
            }
        }

        // Test 4: Check if exchange exists
        System.out.println("\n=== TEST 4: CHECK EXCHANGE EXISTS ===");
        try {
            String exchangeResult = minimalClient.get()
                    .uri("/api/exchanges/%2F/demo-ex")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            System.out.println("Exchange info: " + exchangeResult);
        } catch (Exception e) {
            System.out.println("Exchange check error: " + e.getMessage());
        }

        // Test 5: List all exchanges
        System.out.println("\n=== TEST 5: LIST ALL EXCHANGES ===");
        try {
            String allExchanges = minimalClient.get()
                    .uri("/api/exchanges")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            System.out.println("All exchanges: " + allExchanges);
        } catch (Exception e) {
            System.out.println("List exchanges error: " + e.getMessage());
        }

        // Test 6: Check response headers
        System.out.println("\n=== TEST 6: CHECK RESPONSE HEADERS ===");
        WebClient debugClient = WebClient.builder()
                .baseUrl("http://127.0.0.1:15672")
                .build();

        try {
            debugClient.get()
                    .uri("/api/exchanges/%2F/demo-ex/bindings/source")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .toEntity(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .doOnSuccess(entity -> {
                        System.out.println("Response status: " + entity.getStatusCode());
                        System.out.println("Response headers: " + entity.getHeaders());
                        System.out.println("Response body: " + entity.getBody());
                    })
                    .block();
        } catch (Exception e) {
            System.out.println("Header check error: " + e.getMessage());
        }
    }

    @Test
    public void testDifferentBaseUrls() {
        System.out.println("=== TESTING DIFFERENT BASE URLS ===");

        String credentials = "admin:admin";
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        String authHeader = "Basic " + encodedCredentials;

        String[] baseUrls = {
                "http://127.0.0.1:15672", // No trailing slash
                "http://127.0.0.1:15672/", // With trailing slash
                "http://localhost:15672", // localhost instead of 127.0.0.1
                "http://localhost:15672/" // localhost with trailing slash
        };

        for (String baseUrl : baseUrls) {
            System.out.println("\nTesting base URL: " + baseUrl);

            WebClient client = WebClient.builder()
                    .baseUrl(baseUrl)
                    .build();

            try {
                String result = client.get()
                        .uri("/api/exchanges/%2F/demo-ex/bindings/source")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(5))
                        .block();

                System.out.println("  Result: " + result);
                System.out.println("  Length: " + (result != null ? result.length() : "null"));
            } catch (Exception e) {
                System.out.println("  Error: " + e.getMessage());
            }
        }
    }
}