package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class QueueDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testDefaultConstructor() {
        QueueDto dto = new QueueDto();

        assertNull(dto.getName());
        assertNull(dto.getState());
        assertNull(dto.getDurable());
        assertNull(dto.getAutoDelete());
        assertNull(dto.getExclusive());
        assertNull(dto.getArguments());
        assertNull(dto.getNode());
        assertNull(dto.getVhost());
        assertNull(dto.getMessages());
        assertNull(dto.getMessagesReady());
        assertNull(dto.getMessagesUnacknowledged());
        assertNull(dto.getConsumers());
        assertNull(dto.getConsumerUtilisation());
        assertNull(dto.getMemory());
        assertNull(dto.getMessageStats());
        assertNull(dto.getConsumerDetails());
    }

    @Test
    void testConstructorWithParameters() {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-message-ttl", 60000);

        QueueDto dto = new QueueDto(
                "test-queue", "running", true, false,
                false, arguments, "rabbit@node1",
                "/", 100, 2);

        assertEquals("test-queue", dto.getName());
        assertEquals("running", dto.getState());
        assertTrue(dto.getDurable());
        assertFalse(dto.getAutoDelete());
        assertFalse(dto.getExclusive());
        assertEquals(arguments, dto.getArguments());
        assertEquals("rabbit@node1", dto.getNode());
        assertEquals("/", dto.getVhost());
        assertEquals(100, dto.getMessages());
        assertEquals(2, dto.getConsumers());
    }

    @Test
    void testSettersAndGetters() {
        QueueDto dto = new QueueDto();
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-max-length", 1000);

        Map<String, Object> messageStats = new HashMap<>();
        messageStats.put("deliver_get", 50);
        messageStats.put("publish", 100);

        Map<String, Object> consumer1 = new HashMap<>();
        consumer1.put("consumer_tag", "consumer-1");
        consumer1.put("ack_required", true);

        List<Map<String, Object>> consumerDetails = Arrays.asList(consumer1);

        dto.setName("my-queue");
        dto.setState("idle");
        dto.setDurable(false);
        dto.setAutoDelete(true);
        dto.setExclusive(true);
        dto.setArguments(arguments);
        dto.setNode("rabbit@node2");
        dto.setVhost("/test");
        dto.setMessages(50);
        dto.setMessagesReady(45);
        dto.setMessagesUnacknowledged(5);
        dto.setConsumers(1);
        dto.setConsumerUtilisation(0.8);
        dto.setMemory(1024L);
        dto.setMessageStats(messageStats);
        dto.setConsumerDetails(consumerDetails);

        assertEquals("my-queue", dto.getName());
        assertEquals("idle", dto.getState());
        assertFalse(dto.getDurable());
        assertTrue(dto.getAutoDelete());
        assertTrue(dto.getExclusive());
        assertEquals(arguments, dto.getArguments());
        assertEquals("rabbit@node2", dto.getNode());
        assertEquals("/test", dto.getVhost());
        assertEquals(50, dto.getMessages());
        assertEquals(45, dto.getMessagesReady());
        assertEquals(5, dto.getMessagesUnacknowledged());
        assertEquals(1, dto.getConsumers());
        assertEquals(0.8, dto.getConsumerUtilisation());
        assertEquals(1024L, dto.getMemory());
        assertEquals(messageStats, dto.getMessageStats());
        assertEquals(consumerDetails, dto.getConsumerDetails());
    }

    @Test
    void testQueueStates() {
        QueueDto dto = new QueueDto();

        // Test different queue states
        String[] states = { "running", "idle", "flow", "down" };
        for (String state : states) {
            dto.setState(state);
            assertEquals(state, dto.getState());
        }
    }

    @Test
    void testJsonSerialization() throws Exception {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-message-ttl", 60000);

        QueueDto dto = new QueueDto(
                "test-queue", "running", true, false,
                false, arguments, "rabbit@node1",
                "/", 100, 2);

        String json = objectMapper.writeValueAsString(dto);

        assertTrue(json.contains("\"name\":\"test-queue\""));
        assertTrue(json.contains("\"state\":\"running\""));
        assertTrue(json.contains("\"durable\":true"));
        assertTrue(json.contains("\"auto_delete\":false"));
        assertTrue(json.contains("\"exclusive\":false"));
        assertTrue(json.contains("\"node\":\"rabbit@node1\""));
        assertTrue(json.contains("\"vhost\":\"/\""));
        assertTrue(json.contains("\"messages\":100"));
        assertTrue(json.contains("\"consumers\":2"));
        assertTrue(json.contains("\"x-message-ttl\":60000"));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"name\":\"test-queue\"," +
                "\"state\":\"running\"," +
                "\"durable\":true," +
                "\"auto_delete\":false," +
                "\"exclusive\":false," +
                "\"arguments\":{\"x-message-ttl\":60000,\"x-max-length\":1000}," +
                "\"node\":\"rabbit@node1\"," +
                "\"vhost\":\"/\"," +
                "\"messages\":100," +
                "\"messages_ready\":95," +
                "\"messages_unacknowledged\":5," +
                "\"consumers\":2," +
                "\"consumer_utilisation\":0.8," +
                "\"memory\":2048," +
                "\"message_stats\":{\"deliver_get\":50,\"publish\":100}," +
                "\"consumer_details\":[{\"consumer_tag\":\"consumer-1\",\"ack_required\":true}]" +
                "}";

        QueueDto dto = objectMapper.readValue(json, QueueDto.class);

        assertEquals("test-queue", dto.getName());
        assertEquals("running", dto.getState());
        assertTrue(dto.getDurable());
        assertFalse(dto.getAutoDelete());
        assertFalse(dto.getExclusive());
        assertEquals("rabbit@node1", dto.getNode());
        assertEquals("/", dto.getVhost());
        assertEquals(100, dto.getMessages());
        assertEquals(95, dto.getMessagesReady());
        assertEquals(5, dto.getMessagesUnacknowledged());
        assertEquals(2, dto.getConsumers());
        assertEquals(0.8, dto.getConsumerUtilisation());
        assertEquals(2048L, dto.getMemory());

        assertNotNull(dto.getArguments());
        assertEquals(60000, dto.getArguments().get("x-message-ttl"));
        assertEquals(1000, dto.getArguments().get("x-max-length"));

        assertNotNull(dto.getMessageStats());
        assertEquals(50, dto.getMessageStats().get("deliver_get"));
        assertEquals(100, dto.getMessageStats().get("publish"));

        assertNotNull(dto.getConsumerDetails());
        assertEquals(1, dto.getConsumerDetails().size());
        assertEquals("consumer-1", dto.getConsumerDetails().get(0).get("consumer_tag"));
        assertTrue((Boolean) dto.getConsumerDetails().get(0).get("ack_required"));
    }

    @Test
    void testJsonIgnoreUnknownProperties() throws Exception {
        String json = "{" +
                "\"name\":\"test-queue\"," +
                "\"state\":\"running\"," +
                "\"unknown_field\":\"should_be_ignored\"," +
                "\"another_unknown\":123" +
                "}";

        // Should not throw exception due to @JsonIgnoreProperties(ignoreUnknown = true)
        QueueDto dto = objectMapper.readValue(json, QueueDto.class);

        assertEquals("test-queue", dto.getName());
        assertEquals("running", dto.getState());
    }

    @Test
    void testBooleanFlags() {
        QueueDto dto = new QueueDto();

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

        // Test exclusive flag
        dto.setExclusive(true);
        assertTrue(dto.getExclusive());
        dto.setExclusive(false);
        assertFalse(dto.getExclusive());
    }

    @Test
    void testNullValues() {
        QueueDto dto = new QueueDto();

        // Test that null values are handled properly
        dto.setName(null);
        dto.setState(null);
        dto.setDurable(null);
        dto.setMessages(null);
        dto.setConsumers(null);
        dto.setConsumerUtilisation(null);
        dto.setMemory(null);

        assertNull(dto.getName());
        assertNull(dto.getState());
        assertNull(dto.getDurable());
        assertNull(dto.getMessages());
        assertNull(dto.getConsumers());
        assertNull(dto.getConsumerUtilisation());
        assertNull(dto.getMemory());
    }

    @Test
    void testZeroValues() {
        QueueDto dto = new QueueDto();

        dto.setMessages(0);
        dto.setMessagesReady(0);
        dto.setMessagesUnacknowledged(0);
        dto.setConsumers(0);
        dto.setConsumerUtilisation(0.0);
        dto.setMemory(0L);

        assertEquals(0, dto.getMessages());
        assertEquals(0, dto.getMessagesReady());
        assertEquals(0, dto.getMessagesUnacknowledged());
        assertEquals(0, dto.getConsumers());
        assertEquals(0.0, dto.getConsumerUtilisation());
        assertEquals(0L, dto.getMemory());
    }

    @Test
    void testConsumerDetails() {
        QueueDto dto = new QueueDto();

        Map<String, Object> consumer1 = new HashMap<>();
        consumer1.put("consumer_tag", "consumer-1");
        consumer1.put("ack_required", true);
        consumer1.put("prefetch_count", 10);

        Map<String, Object> consumer2 = new HashMap<>();
        consumer2.put("consumer_tag", "consumer-2");
        consumer2.put("ack_required", false);
        consumer2.put("prefetch_count", 5);

        List<Map<String, Object>> consumerDetails = Arrays.asList(consumer1, consumer2);
        dto.setConsumerDetails(consumerDetails);

        assertEquals(2, dto.getConsumerDetails().size());
        assertEquals("consumer-1", dto.getConsumerDetails().get(0).get("consumer_tag"));
        assertEquals("consumer-2", dto.getConsumerDetails().get(1).get("consumer_tag"));
        assertTrue((Boolean) dto.getConsumerDetails().get(0).get("ack_required"));
        assertFalse((Boolean) dto.getConsumerDetails().get(1).get("ack_required"));
    }
}