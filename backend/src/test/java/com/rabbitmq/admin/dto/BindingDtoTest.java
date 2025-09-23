package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class BindingDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testDefaultConstructor() {
        BindingDto dto = new BindingDto();

        assertNull(dto.getSource());
        assertNull(dto.getDestination());
        assertNull(dto.getDestinationType());
        assertNull(dto.getRoutingKey());
        assertNull(dto.getArguments());
        assertNull(dto.getPropertiesKey());
        assertNull(dto.getVhost());
    }

    @Test
    void testConstructorWithParameters() {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-match", "all");
        arguments.put("format", "json");

        BindingDto dto = new BindingDto(
                "source-exchange", "destination-queue", "queue",
                "routing.key", arguments, "/");

        assertEquals("source-exchange", dto.getSource());
        assertEquals("destination-queue", dto.getDestination());
        assertEquals("queue", dto.getDestinationType());
        assertEquals("routing.key", dto.getRoutingKey());
        assertEquals(arguments, dto.getArguments());
        assertEquals("/", dto.getVhost());
    }

    @Test
    void testSettersAndGetters() {
        BindingDto dto = new BindingDto();
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-match", "any");
        arguments.put("type", "notification");

        dto.setSource("my-exchange");
        dto.setDestination("my-queue");
        dto.setDestinationType("queue");
        dto.setRoutingKey("my.routing.key");
        dto.setArguments(arguments);
        dto.setPropertiesKey("~");
        dto.setVhost("/test");

        assertEquals("my-exchange", dto.getSource());
        assertEquals("my-queue", dto.getDestination());
        assertEquals("queue", dto.getDestinationType());
        assertEquals("my.routing.key", dto.getRoutingKey());
        assertEquals(arguments, dto.getArguments());
        assertEquals("~", dto.getPropertiesKey());
        assertEquals("/test", dto.getVhost());
    }

    @Test
    void testDestinationTypes() {
        BindingDto dto = new BindingDto();

        // Test queue destination
        dto.setDestinationType("queue");
        assertEquals("queue", dto.getDestinationType());

        // Test exchange destination
        dto.setDestinationType("exchange");
        assertEquals("exchange", dto.getDestinationType());
    }

    @Test
    void testJsonSerialization() throws Exception {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-match", "all");

        BindingDto dto = new BindingDto(
                "source-exchange", "destination-queue", "queue",
                "routing.key", arguments, "/");

        String json = objectMapper.writeValueAsString(dto);

        assertTrue(json.contains("\"source\":\"source-exchange\""));
        assertTrue(json.contains("\"destination\":\"destination-queue\""));
        assertTrue(json.contains("\"destination_type\":\"queue\""));
        assertTrue(json.contains("\"routing_key\":\"routing.key\""));
        assertTrue(json.contains("\"vhost\":\"/\""));
        assertTrue(json.contains("\"x-match\":\"all\""));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"source\":\"source-exchange\"," +
                "\"destination\":\"destination-queue\"," +
                "\"destination_type\":\"queue\"," +
                "\"routing_key\":\"routing.key\"," +
                "\"arguments\":{\"x-match\":\"all\",\"format\":\"json\"}," +
                "\"properties_key\":\"~\"," +
                "\"vhost\":\"/\"" +
                "}";

        BindingDto dto = objectMapper.readValue(json, BindingDto.class);

        assertEquals("source-exchange", dto.getSource());
        assertEquals("destination-queue", dto.getDestination());
        assertEquals("queue", dto.getDestinationType());
        assertEquals("routing.key", dto.getRoutingKey());
        assertEquals("~", dto.getPropertiesKey());
        assertEquals("/", dto.getVhost());

        assertNotNull(dto.getArguments());
        assertEquals("all", dto.getArguments().get("x-match"));
        assertEquals("json", dto.getArguments().get("format"));
    }

    @Test
    void testJsonIgnoreUnknownProperties() throws Exception {
        String json = "{" +
                "\"source\":\"source-exchange\"," +
                "\"destination\":\"destination-queue\"," +
                "\"unknown_field\":\"should_be_ignored\"," +
                "\"another_unknown\":123" +
                "}";

        // Should not throw exception due to @JsonIgnoreProperties(ignoreUnknown = true)
        BindingDto dto = objectMapper.readValue(json, BindingDto.class);

        assertEquals("source-exchange", dto.getSource());
        assertEquals("destination-queue", dto.getDestination());
    }

    @Test
    void testExchangeToExchangeBinding() {
        BindingDto dto = new BindingDto();

        dto.setSource("source-exchange");
        dto.setDestination("destination-exchange");
        dto.setDestinationType("exchange");
        dto.setRoutingKey("exchange.routing.key");
        dto.setVhost("/");

        assertEquals("source-exchange", dto.getSource());
        assertEquals("destination-exchange", dto.getDestination());
        assertEquals("exchange", dto.getDestinationType());
        assertEquals("exchange.routing.key", dto.getRoutingKey());
    }

    @Test
    void testExchangeToQueueBinding() {
        BindingDto dto = new BindingDto();

        dto.setSource("source-exchange");
        dto.setDestination("destination-queue");
        dto.setDestinationType("queue");
        dto.setRoutingKey("queue.routing.key");
        dto.setVhost("/");

        assertEquals("source-exchange", dto.getSource());
        assertEquals("destination-queue", dto.getDestination());
        assertEquals("queue", dto.getDestinationType());
        assertEquals("queue.routing.key", dto.getRoutingKey());
    }

    @Test
    void testEmptyRoutingKey() {
        BindingDto dto = new BindingDto();

        dto.setRoutingKey("");
        assertEquals("", dto.getRoutingKey());

        dto.setRoutingKey(null);
        assertNull(dto.getRoutingKey());
    }

    @Test
    void testComplexArguments() {
        BindingDto dto = new BindingDto();
        Map<String, Object> complexArgs = new HashMap<>();
        complexArgs.put("x-match", "all");
        complexArgs.put("format", "json");
        complexArgs.put("priority", 10);
        complexArgs.put("enabled", true);

        dto.setArguments(complexArgs);

        assertEquals(4, dto.getArguments().size());
        assertEquals("all", dto.getArguments().get("x-match"));
        assertEquals("json", dto.getArguments().get("format"));
        assertEquals(10, dto.getArguments().get("priority"));
        assertTrue((Boolean) dto.getArguments().get("enabled"));
    }

    @Test
    void testEmptyArguments() {
        BindingDto dto = new BindingDto();
        Map<String, Object> emptyArgs = new HashMap<>();
        dto.setArguments(emptyArgs);

        assertNotNull(dto.getArguments());
        assertTrue(dto.getArguments().isEmpty());
    }

    @Test
    void testNullValues() {
        BindingDto dto = new BindingDto();

        // Test that null values are handled properly
        dto.setSource(null);
        dto.setDestination(null);
        dto.setDestinationType(null);
        dto.setRoutingKey(null);
        dto.setArguments(null);
        dto.setPropertiesKey(null);
        dto.setVhost(null);

        assertNull(dto.getSource());
        assertNull(dto.getDestination());
        assertNull(dto.getDestinationType());
        assertNull(dto.getRoutingKey());
        assertNull(dto.getArguments());
        assertNull(dto.getPropertiesKey());
        assertNull(dto.getVhost());
    }

    @Test
    void testPropertiesKey() {
        BindingDto dto = new BindingDto();

        // Test default properties key
        dto.setPropertiesKey("~");
        assertEquals("~", dto.getPropertiesKey());

        // Test custom properties key
        dto.setPropertiesKey("custom-key");
        assertEquals("custom-key", dto.getPropertiesKey());
    }

    @Test
    void testVhostVariations() {
        BindingDto dto = new BindingDto();

        // Test default vhost
        dto.setVhost("/");
        assertEquals("/", dto.getVhost());

        // Test custom vhost
        dto.setVhost("/test-vhost");
        assertEquals("/test-vhost", dto.getVhost());

        // Test vhost with special characters
        dto.setVhost("/test_vhost-123");
        assertEquals("/test_vhost-123", dto.getVhost());
    }
}