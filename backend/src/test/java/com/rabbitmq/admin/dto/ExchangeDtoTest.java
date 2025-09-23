package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ExchangeDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testDefaultConstructor() {
        ExchangeDto dto = new ExchangeDto();

        assertNull(dto.getName());
        assertNull(dto.getType());
        assertNull(dto.getDurable());
        assertNull(dto.getAutoDelete());
        assertNull(dto.getInternal());
        assertNull(dto.getArguments());
        assertNull(dto.getVhost());
        assertNull(dto.getMessageStats());
    }

    @Test
    void testConstructorWithParameters() {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-message-ttl", 60000);
        arguments.put("x-max-length", 1000);

        ExchangeDto dto = new ExchangeDto(
                "test-exchange", "topic", true, false,
                false, arguments, "/");

        assertEquals("test-exchange", dto.getName());
        assertEquals("topic", dto.getType());
        assertTrue(dto.getDurable());
        assertFalse(dto.getAutoDelete());
        assertFalse(dto.getInternal());
        assertEquals(arguments, dto.getArguments());
        assertEquals("/", dto.getVhost());
    }

    @Test
    void testSettersAndGetters() {
        ExchangeDto dto = new ExchangeDto();
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-alternate-exchange", "alternate");

        Map<String, Object> messageStats = new HashMap<>();
        messageStats.put("publish_in", 100);
        messageStats.put("publish_out", 95);

        dto.setName("my-exchange");
        dto.setType("direct");
        dto.setDurable(true);
        dto.setAutoDelete(true);
        dto.setInternal(false);
        dto.setArguments(arguments);
        dto.setVhost("/test");
        dto.setMessageStats(messageStats);

        assertEquals("my-exchange", dto.getName());
        assertEquals("direct", dto.getType());
        assertTrue(dto.getDurable());
        assertTrue(dto.getAutoDelete());
        assertFalse(dto.getInternal());
        assertEquals(arguments, dto.getArguments());
        assertEquals("/test", dto.getVhost());
        assertEquals(messageStats, dto.getMessageStats());
    }

    @Test
    void testExchangeTypes() {
        ExchangeDto dto = new ExchangeDto();

        // Test different exchange types
        String[] types = { "direct", "fanout", "topic", "headers" };
        for (String type : types) {
            dto.setType(type);
            assertEquals(type, dto.getType());
        }
    }

    @Test
    void testJsonSerialization() throws Exception {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-message-ttl", 60000);

        ExchangeDto dto = new ExchangeDto(
                "test-exchange", "topic", true, false,
                false, arguments, "/");

        String json = objectMapper.writeValueAsString(dto);

        assertTrue(json.contains("\"name\":\"test-exchange\""));
        assertTrue(json.contains("\"type\":\"topic\""));
        assertTrue(json.contains("\"durable\":true"));
        assertTrue(json.contains("\"auto_delete\":false"));
        assertTrue(json.contains("\"internal\":false"));
        assertTrue(json.contains("\"vhost\":\"/\""));
        assertTrue(json.contains("\"x-message-ttl\":60000"));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"name\":\"test-exchange\"," +
                "\"type\":\"topic\"," +
                "\"durable\":true," +
                "\"auto_delete\":false," +
                "\"internal\":false," +
                "\"arguments\":{\"x-message-ttl\":60000,\"x-max-length\":1000}," +
                "\"vhost\":\"/\"," +
                "\"message_stats\":{\"publish_in\":100,\"publish_out\":95}" +
                "}";

        ExchangeDto dto = objectMapper.readValue(json, ExchangeDto.class);

        assertEquals("test-exchange", dto.getName());
        assertEquals("topic", dto.getType());
        assertTrue(dto.getDurable());
        assertFalse(dto.getAutoDelete());
        assertFalse(dto.getInternal());
        assertEquals("/", dto.getVhost());

        assertNotNull(dto.getArguments());
        assertEquals(60000, dto.getArguments().get("x-message-ttl"));
        assertEquals(1000, dto.getArguments().get("x-max-length"));

        assertNotNull(dto.getMessageStats());
        assertEquals(100, dto.getMessageStats().get("publish_in"));
        assertEquals(95, dto.getMessageStats().get("publish_out"));
    }

    @Test
    void testJsonIgnoreUnknownProperties() throws Exception {
        String json = "{" +
                "\"name\":\"test-exchange\"," +
                "\"type\":\"topic\"," +
                "\"unknown_field\":\"should_be_ignored\"," +
                "\"another_unknown\":123" +
                "}";

        // Should not throw exception due to @JsonIgnoreProperties(ignoreUnknown = true)
        ExchangeDto dto = objectMapper.readValue(json, ExchangeDto.class);

        assertEquals("test-exchange", dto.getName());
        assertEquals("topic", dto.getType());
    }

    @Test
    void testBooleanFlags() {
        ExchangeDto dto = new ExchangeDto();

        // Test durable flag
        dto.setDurable(true);
        assertTrue(dto.getDurable());
        dto.setDurable(false);
        assertFalse(dto.getDurable());

        // Test auto_delete flag
        dto.setAutoDelete(true);
        assertTrue(dto.getAutoDelete());
        dto.setAutoDelete(false);
        assertFalse(dto.getAutoDelete());

        // Test internal flag
        dto.setInternal(true);
        assertTrue(dto.getInternal());
        dto.setInternal(false);
        assertFalse(dto.getInternal());
    }

    @Test
    void testNullValues() {
        ExchangeDto dto = new ExchangeDto();

        // Test that null values are handled properly
        dto.setName(null);
        dto.setType(null);
        dto.setDurable(null);
        dto.setAutoDelete(null);
        dto.setInternal(null);
        dto.setArguments(null);
        dto.setVhost(null);
        dto.setMessageStats(null);

        assertNull(dto.getName());
        assertNull(dto.getType());
        assertNull(dto.getDurable());
        assertNull(dto.getAutoDelete());
        assertNull(dto.getInternal());
        assertNull(dto.getArguments());
        assertNull(dto.getVhost());
        assertNull(dto.getMessageStats());
    }

    @Test
    void testEmptyArguments() {
        ExchangeDto dto = new ExchangeDto();
        Map<String, Object> emptyArgs = new HashMap<>();
        dto.setArguments(emptyArgs);

        assertNotNull(dto.getArguments());
        assertTrue(dto.getArguments().isEmpty());
    }

    @Test
    void testComplexArguments() {
        ExchangeDto dto = new ExchangeDto();
        Map<String, Object> complexArgs = new HashMap<>();
        complexArgs.put("x-message-ttl", 60000);
        complexArgs.put("x-max-length", 1000);
        complexArgs.put("x-alternate-exchange", "alternate");
        complexArgs.put("x-dead-letter-exchange", "dlx");
        complexArgs.put("x-dead-letter-routing-key", "dlx.key");

        dto.setArguments(complexArgs);

        assertEquals(5, dto.getArguments().size());
        assertEquals(60000, dto.getArguments().get("x-message-ttl"));
        assertEquals(1000, dto.getArguments().get("x-max-length"));
        assertEquals("alternate", dto.getArguments().get("x-alternate-exchange"));
        assertEquals("dlx", dto.getArguments().get("x-dead-letter-exchange"));
        assertEquals("dlx.key", dto.getArguments().get("x-dead-letter-routing-key"));
    }
}