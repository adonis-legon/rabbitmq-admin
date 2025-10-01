package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class GetMessagesRequestTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private GetMessagesRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new GetMessagesRequest();
        validRequest.setCount(5);
        validRequest.setAckmode("ack_requeue_true");
        validRequest.setEncoding("auto");
    }

    @Test
    void testDefaultConstructor() {
        GetMessagesRequest request = new GetMessagesRequest();

        assertEquals(1, request.getCount());
        assertEquals("ack_requeue_true", request.getAckmode());
        assertEquals("auto", request.getEncoding());
        assertNull(request.getTruncate());
    }

    @Test
    void testConstructorWithParameters() {
        GetMessagesRequest request = new GetMessagesRequest(10, "reject_requeue_false", "base64", 1000);

        assertEquals(10, request.getCount());
        assertEquals("reject_requeue_false", request.getAckmode());
        assertEquals("base64", request.getEncoding());
        assertEquals(1000, request.getTruncate());
    }

    @Test
    void testValidRequest() {
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Valid request should have no validation errors");
    }

    @Test
    void testCountTooLow() {
        validRequest.setCount(0);
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("count")));
    }

    @Test
    void testCountTooHigh() {
        validRequest.setCount(101);
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("count")));
    }

    @Test
    void testValidCountRange() {
        // Test minimum valid count
        validRequest.setCount(1);
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Count 1 should be valid");

        // Test maximum valid count
        validRequest.setCount(100);
        violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Count 100 should be valid");
    }

    @Test
    void testNullCount() {
        validRequest.setCount(null);
        assertEquals(1, validRequest.getCount());
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Null count should default to 1");
    }

    @Test
    void testInvalidAckmode() {
        validRequest.setAckmode("invalid_mode");
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("ackmode")));
    }

    @Test
    void testValidAckmodes() {
        String[] validModes = {
                "ack_requeue_true",
                "ack_requeue_false",
                "reject_requeue_true",
                "reject_requeue_false"
        };

        for (String mode : validModes) {
            validRequest.setAckmode(mode);
            Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
            assertTrue(violations.isEmpty(), "Ackmode '" + mode + "' should be valid");
        }
    }

    @Test
    void testNullAckmode() {
        validRequest.setAckmode(null);
        assertEquals("ack_requeue_true", validRequest.getAckmode());
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Null ackmode should default to 'ack_requeue_true'");
    }

    @Test
    void testInvalidEncoding() {
        validRequest.setEncoding("invalid");
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("encoding")));
    }

    @Test
    void testValidEncodings() {
        String[] validEncodings = { "auto", "base64" };

        for (String encoding : validEncodings) {
            validRequest.setEncoding(encoding);
            Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
            assertTrue(violations.isEmpty(), "Encoding '" + encoding + "' should be valid");
        }
    }

    @Test
    void testNullEncoding() {
        validRequest.setEncoding(null);
        assertEquals("auto", validRequest.getEncoding());
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Null encoding should default to 'auto'");
    }

    @Test
    void testTruncateTooLow() {
        validRequest.setTruncate(0);
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("truncate")));
    }

    @Test
    void testTruncateTooHigh() {
        validRequest.setTruncate(1048577); // 1MB + 1 byte
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("truncate")));
    }

    @Test
    void testValidTruncateRange() {
        // Test minimum valid truncate
        validRequest.setTruncate(1);
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Truncate 1 should be valid");

        // Test maximum valid truncate
        validRequest.setTruncate(1048576); // Exactly 1MB
        violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Truncate 1MB should be valid");
    }

    @Test
    void testNullTruncate() {
        validRequest.setTruncate(null);
        assertNull(validRequest.getTruncate());
        Set<ConstraintViolation<GetMessagesRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Null truncate should be valid");
    }

    @Test
    void testJsonSerialization() throws Exception {
        validRequest.setTruncate(5000);

        String json = objectMapper.writeValueAsString(validRequest);

        assertTrue(json.contains("\"count\":5"));
        assertTrue(json.contains("\"ackmode\":\"ack_requeue_true\""));
        assertTrue(json.contains("\"encoding\":\"auto\""));
        assertTrue(json.contains("\"truncate\":5000"));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"count\":10," +
                "\"ackmode\":\"reject_requeue_false\"," +
                "\"encoding\":\"base64\"," +
                "\"truncate\":2000" +
                "}";

        GetMessagesRequest request = objectMapper.readValue(json, GetMessagesRequest.class);

        assertEquals(10, request.getCount());
        assertEquals("reject_requeue_false", request.getAckmode());
        assertEquals("base64", request.getEncoding());
        assertEquals(2000, request.getTruncate());
    }

    @Test
    void testSettersAndGetters() {
        GetMessagesRequest request = new GetMessagesRequest();

        request.setCount(25);
        request.setAckmode("reject_requeue_true");
        request.setEncoding("base64");
        request.setTruncate(10000);

        assertEquals(25, request.getCount());
        assertEquals("reject_requeue_true", request.getAckmode());
        assertEquals("base64", request.getEncoding());
        assertEquals(10000, request.getTruncate());
    }

    @Test
    void testDefaultValues() {
        GetMessagesRequest request = new GetMessagesRequest(null, null, null, null);

        assertEquals(1, request.getCount());
        assertEquals("ack_requeue_true", request.getAckmode());
        assertEquals("auto", request.getEncoding());
        assertNull(request.getTruncate());
    }

    @Test
    void testAcknowledgmentModes() {
        GetMessagesRequest request = new GetMessagesRequest();

        // Test ack with requeue
        request.setAckmode("ack_requeue_true");
        assertEquals("ack_requeue_true", request.getAckmode());

        // Test ack without requeue
        request.setAckmode("ack_requeue_false");
        assertEquals("ack_requeue_false", request.getAckmode());

        // Test reject with requeue
        request.setAckmode("reject_requeue_true");
        assertEquals("reject_requeue_true", request.getAckmode());

        // Test reject without requeue (discard)
        request.setAckmode("reject_requeue_false");
        assertEquals("reject_requeue_false", request.getAckmode());
    }
}