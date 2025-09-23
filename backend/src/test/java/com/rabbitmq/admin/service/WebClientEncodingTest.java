package com.rabbitmq.admin.service;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.UnsupportedEncodingException;
import java.time.Duration;
import java.util.Base64;

/**
 * Test to identify URL encoding issues between WebClient and curl
 */
@Tag("debug")
public class WebClientEncodingTest {

    @Test
    public void testUrlEncodingIssues() throws UnsupportedEncodingException {
        System.out.println("=== TESTING URL ENCODING ISSUES ===");

        String credentials = "admin:admin";
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        String authHeader = "Basic " + encodedCredentials;

        WebClient client = WebClient.builder()
                .baseUrl("http://127.0.0.1:15672")
                .build();

        // Test different ways to handle the vhost encoding
        System.out.println("\n=== TESTING DIFFERENT VHOST ENCODING APPROACHES ===");

        // Test 1: Pre-encoded URL (what we've been using)
        System.out.println("1. Pre-encoded URL: /api/exchanges/%2F/demo-ex");
        try {
            String result1 = client.get()
                    .uri("/api/exchanges/%2F/demo-ex")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            System.out.println("   Result length: " + (result1 != null ? result1.length() : "null"));
            System.out.println("   Success: " + (result1 != null && result1.length() > 10));
        } catch (Exception e) {
            System.out.println("   Error: " + e.getMessage());
        }

        // Test 2: URI template approach
        System.out.println("\n2. URI template: /api/exchanges/{vhost}/demo-ex with vhost='/'");
        try {
            String result2 = client.get()
                    .uri("/api/exchanges/{vhost}/demo-ex", "/")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            System.out.println("   Result length: " + (result2 != null ? result2.length() : "null"));
            System.out.println("   Success: " + (result2 != null && result2.length() > 10));
        } catch (Exception e) {
            System.out.println("   Error: " + e.getMessage());
        }

        // Test 3: UriBuilder with build(false) to prevent double encoding
        System.out.println("\n3. UriBuilder with build(false):");
        try {
            String result3 = client.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/exchanges/%2F/demo-ex")
                            .build(false)) // false = don't encode
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            System.out.println("   Result length: " + (result3 != null ? result3.length() : "null"));
            System.out.println("   Success: " + (result3 != null && result3.length() > 10));
        } catch (Exception e) {
            System.out.println("   Error: " + e.getMessage());
        }

        // Test 4: UriBuilder with build(true) - default encoding
        System.out.println("\n4. UriBuilder with build(true) - default:");
        try {
            String result4 = client.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/exchanges/%2F/demo-ex")
                            .build(true)) // true = encode (default)
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            System.out.println("   Result length: " + (result4 != null ? result4.length() : "null"));
            System.out.println("   Success: " + (result4 != null && result4.length() > 10));
        } catch (Exception e) {
            System.out.println("   Error: " + e.getMessage());
        }

        // Test 5: Raw path without encoding
        System.out.println("\n5. Raw path without pre-encoding:");
        try {
            String result5 = client.get()
                    .uri("/api/exchanges///demo-ex") // Use // for default vhost
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            System.out.println("   Result length: " + (result5 != null ? result5.length() : "null"));
            System.out.println("   Success: " + (result5 != null && result5.length() > 10));
        } catch (Exception e) {
            System.out.println("   Error: " + e.getMessage());
        }
    }

    @Test
    public void testBindingsWithCorrectEncoding() {
        System.out.println("=== TESTING BINDINGS WITH CORRECT ENCODING ===");

        String credentials = "admin:admin";
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        String authHeader = "Basic " + encodedCredentials;

        WebClient client = WebClient.builder()
                .baseUrl("http://127.0.0.1:15672")
                .build();

        // Test the bindings endpoint with different encoding approaches
        System.out.println("\nTesting bindings endpoint with UriBuilder build(false):");
        try {
            String result = client.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/exchanges/%2F/demo-ex/bindings/source")
                            .build(false)) // Don't double-encode
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            System.out.println("Bindings result: " + result);
            System.out.println("Success: " + (result != null && !result.equals("[]")));

            if (result != null && !result.equals("[]")) {
                System.out.println("🎉 FOUND THE SOLUTION! Use UriBuilder with build(false)");
            }
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }

        // Test with URI template approach
        System.out.println("\nTesting bindings endpoint with URI template:");
        try {
            String result = client.get()
                    .uri("/api/exchanges/{vhost}/demo-ex/bindings/source", "/")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            System.out.println("URI template result: " + result);
            System.out.println("Success: " + (result != null && !result.equals("[]")));

            if (result != null && !result.equals("[]")) {
                System.out.println("🎉 ALTERNATIVE SOLUTION! Use URI templates");
            }
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}