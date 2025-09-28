package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CreateBindingRequestTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private CreateBindingRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new CreateBindingRequest();
        validRequest.setRoutingKey("test.routing.key");
    }

    @Test
    void testDefaultConstructor() {
        CreateBindingRequest request = new CreateBindingRequest();

        assertEquals("", request.getRoutingKey());
        assertNotNull(request.getArguments());
        assertTrue(request.getArguments().isEmpty());
    }

    @Test
    void testConstructorWithParameters() {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-match", "all");

        CreateBindingRequest request = new CreateBindingRequest("test.key", arguments);

        assertEquals("test.key", request.getRoutingKey());
        assertEquals(arguments, request.getArguments());
    }

    @Test
    void testValidRequest() {
        Set<ConstraintViolation<CreateBindingRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Valid request should have no validation errors");
    }

    @Test
    void testEmptyRoutingKey() {
        validRequest.setRoutingKey("");
        Set<ConstraintViolation<CreateBindingRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Empty routing key should be valid");
    }

    @Test
    void testNullRoutingKey() {
        validRequest.setRoutingKey(null);
        assertEquals("", validRequest.getRoutingKey());
        Set<ConstraintViolation<CreateBindingRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Null routing key should be converted to empty string");
    }

    @Test
    void testRoutingKeyTooLong() {
        String longKey = "a".repeat(256);
        validRequest.setRoutingKey(longKey);
        Set<ConstraintViolation<CreateBindingRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("routingKey")));
    }

    @Test
    void testValidRoutingKeys() {
        String[] validKeys = {
                "",
                "simple",
                "test.routing.key",
                "test-routing-key",
                "test_routing_key",
                "test.*.key",
                "test.#",
                "*.test.#",
                "123.456.789"
        };

        for (String key : validKeys) {
            validRequest.setRoutingKey(key);
            Set<ConstraintViolation<CreateBindingRequest>> violations = validator.validate(validRequest);
            assertTrue(violations.isEmpty(), "Routing key '" + key + "' should be valid");
        }
    }

    @Test
    void testArgumentsHandling() {
        // Test null arguments
        validRequest.setArguments(null);
        assertNotNull(validRequest.getArguments());
        assertTrue(validRequest.getArguments().isEmpty());

        // Test with arguments
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-match", "all");
        arguments.put("header1", "value1");
        validRequest.setArguments(arguments);
        assertEquals(arguments, validRequest.getArguments());
    }

    @Test
    void testJsonSerialization() throws Exception {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-match", "all");
        arguments.put("header1", "value1");
        validRequest.setArguments(arguments);

        String json = objectMapper.writeValueAsString(validRequest);

        assertTrue(json.contains("\"routingKey\":\"test.routing.key\""));
        assertTrue(json.contains("\"x-match\":\"all\""));
        assertTrue(json.contains("\"header1\":\"value1\""));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"routingKey\":\"test.key\"," +
                "\"arguments\":{\"x-match\":\"any\",\"header2\":\"value2\"}" +
                "}";

        CreateBindingRequest request = objectMapper.readValue(json, CreateBindingRequest.class);

        assertEquals("test.key", request.getRoutingKey());
        assertEquals("any", request.getArguments().get("x-match"));
        assertEquals("value2", request.getArguments().get("header2"));
    }

    @Test
    void testSettersAndGetters() {
        CreateBindingRequest request = new CreateBindingRequest();
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-match", "all");

        request.setRoutingKey("my.routing.key");
        request.setArguments(arguments);

        assertEquals("my.routing.key", request.getRoutingKey());
        assertEquals(arguments, request.getArguments());
    }

    @Test
    void testHeadersBindingArguments() {
        CreateBindingRequest request = new CreateBindingRequest();
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-match", "all");
        arguments.put("format", "pdf");
        arguments.put("type", "report");

        request.setArguments(arguments);

        assertEquals("all", request.getArguments().get("x-match"));
        assertEquals("pdf", request.getArguments().get("format"));
        assertEquals("report", request.getArguments().get("type"));
    }

    @Test
    void testEmptyArguments() {
        CreateBindingRequest request = new CreateBindingRequest();
        Map<String, Object> emptyArgs = new HashMap<>();
        request.setArguments(emptyArgs);

        assertNotNull(request.getArguments());
        assertTrue(request.getArguments().isEmpty());
    }
}