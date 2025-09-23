package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ChannelDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testDefaultConstructor() {
        ChannelDto dto = new ChannelDto();

        assertNull(dto.getName());
        assertNull(dto.getNumber());
        assertNull(dto.getState());
        assertNull(dto.getConsumerCount());
        assertNull(dto.getMessagesUnacknowledged());
        assertNull(dto.getMessagesUnconfirmed());
        assertNull(dto.getMessagesUncommitted());
        assertNull(dto.getAcksUncommitted());
        assertNull(dto.getPrefetchCount());
        assertNull(dto.getGlobalPrefetchCount());
        assertNull(dto.getTransactional());
        assertNull(dto.getConfirm());
        assertNull(dto.getUser());
        assertNull(dto.getVhost());
        assertNull(dto.getConnectionDetails());
    }

    @Test
    void testConstructorWithParameters() {
        ChannelDto dto = new ChannelDto(
                "channel-1", 1, "running", 2,
                5, 10, true, false,
                "guest", "/");

        assertEquals("channel-1", dto.getName());
        assertEquals(1, dto.getNumber());
        assertEquals("running", dto.getState());
        assertEquals(2, dto.getConsumerCount());
        assertEquals(5, dto.getMessagesUnacknowledged());
        assertEquals(10, dto.getPrefetchCount());
        assertTrue(dto.getTransactional());
        assertFalse(dto.getConfirm());
        assertEquals("guest", dto.getUser());
        assertEquals("/", dto.getVhost());
    }

    @Test
    void testSettersAndGetters() {
        ChannelDto dto = new ChannelDto();
        Map<String, Object> connectionDetails = new HashMap<>();
        connectionDetails.put("name", "connection-1");
        connectionDetails.put("peer_host", "192.168.1.100");

        dto.setName("test-channel");
        dto.setNumber(5);
        dto.setState("flow");
        dto.setConsumerCount(3);
        dto.setMessagesUnacknowledged(10);
        dto.setMessagesUnconfirmed(2);
        dto.setMessagesUncommitted(1);
        dto.setAcksUncommitted(0);
        dto.setPrefetchCount(100);
        dto.setGlobalPrefetchCount(200);
        dto.setTransactional(true);
        dto.setConfirm(false);
        dto.setUser("testuser");
        dto.setVhost("/test");
        dto.setConnectionDetails(connectionDetails);

        assertEquals("test-channel", dto.getName());
        assertEquals(5, dto.getNumber());
        assertEquals("flow", dto.getState());
        assertEquals(3, dto.getConsumerCount());
        assertEquals(10, dto.getMessagesUnacknowledged());
        assertEquals(2, dto.getMessagesUnconfirmed());
        assertEquals(1, dto.getMessagesUncommitted());
        assertEquals(0, dto.getAcksUncommitted());
        assertEquals(100, dto.getPrefetchCount());
        assertEquals(200, dto.getGlobalPrefetchCount());
        assertTrue(dto.getTransactional());
        assertFalse(dto.getConfirm());
        assertEquals("testuser", dto.getUser());
        assertEquals("/test", dto.getVhost());
        assertEquals(connectionDetails, dto.getConnectionDetails());
    }

    @Test
    void testJsonSerialization() throws Exception {
        ChannelDto dto = new ChannelDto(
                "channel-1", 1, "running", 2,
                5, 10, true, false,
                "guest", "/");

        String json = objectMapper.writeValueAsString(dto);

        assertTrue(json.contains("\"name\":\"channel-1\""));
        assertTrue(json.contains("\"number\":1"));
        assertTrue(json.contains("\"state\":\"running\""));
        assertTrue(json.contains("\"consumer_count\":2"));
        assertTrue(json.contains("\"messages_unacknowledged\":5"));
        assertTrue(json.contains("\"prefetch_count\":10"));
        assertTrue(json.contains("\"transactional\":true"));
        assertTrue(json.contains("\"confirm\":false"));
        assertTrue(json.contains("\"user\":\"guest\""));
        assertTrue(json.contains("\"vhost\":\"/\""));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"name\":\"channel-1\"," +
                "\"number\":1," +
                "\"state\":\"running\"," +
                "\"consumer_count\":2," +
                "\"messages_unacknowledged\":5," +
                "\"messages_unconfirmed\":3," +
                "\"messages_uncommitted\":1," +
                "\"acks_uncommitted\":0," +
                "\"prefetch_count\":10," +
                "\"global_prefetch_count\":20," +
                "\"transactional\":true," +
                "\"confirm\":false," +
                "\"user\":\"guest\"," +
                "\"vhost\":\"/\"," +
                "\"connection_details\":{\"name\":\"connection-1\",\"peer_host\":\"192.168.1.100\"}" +
                "}";

        ChannelDto dto = objectMapper.readValue(json, ChannelDto.class);

        assertEquals("channel-1", dto.getName());
        assertEquals(1, dto.getNumber());
        assertEquals("running", dto.getState());
        assertEquals(2, dto.getConsumerCount());
        assertEquals(5, dto.getMessagesUnacknowledged());
        assertEquals(3, dto.getMessagesUnconfirmed());
        assertEquals(1, dto.getMessagesUncommitted());
        assertEquals(0, dto.getAcksUncommitted());
        assertEquals(10, dto.getPrefetchCount());
        assertEquals(20, dto.getGlobalPrefetchCount());
        assertTrue(dto.getTransactional());
        assertFalse(dto.getConfirm());
        assertEquals("guest", dto.getUser());
        assertEquals("/", dto.getVhost());
        assertNotNull(dto.getConnectionDetails());
        assertEquals("connection-1", dto.getConnectionDetails().get("name"));
        assertEquals("192.168.1.100", dto.getConnectionDetails().get("peer_host"));
    }

    @Test
    void testJsonIgnoreUnknownProperties() throws Exception {
        String json = "{" +
                "\"name\":\"channel-1\"," +
                "\"number\":1," +
                "\"unknown_field\":\"should_be_ignored\"," +
                "\"another_unknown\":123" +
                "}";

        // Should not throw exception due to @JsonIgnoreProperties(ignoreUnknown = true)
        ChannelDto dto = objectMapper.readValue(json, ChannelDto.class);

        assertEquals("channel-1", dto.getName());
        assertEquals(1, dto.getNumber());
    }

    @Test
    void testChannelStates() {
        ChannelDto dto = new ChannelDto();

        // Test different channel states
        String[] states = { "running", "flow", "starting", "closing" };
        for (String state : states) {
            dto.setState(state);
            assertEquals(state, dto.getState());
        }
    }

    @Test
    void testBooleanFlags() {
        ChannelDto dto = new ChannelDto();

        // Test transactional flag
        dto.setTransactional(true);
        assertTrue(dto.getTransactional());
        dto.setTransactional(false);
        assertFalse(dto.getTransactional());

        // Test confirm flag
        dto.setConfirm(true);
        assertTrue(dto.getConfirm());
        dto.setConfirm(false);
        assertFalse(dto.getConfirm());
    }

    @Test
    void testNullValues() {
        ChannelDto dto = new ChannelDto();

        // Test that null values are handled properly
        dto.setName(null);
        dto.setNumber(null);
        dto.setState(null);
        dto.setTransactional(null);
        dto.setConfirm(null);

        assertNull(dto.getName());
        assertNull(dto.getNumber());
        assertNull(dto.getState());
        assertNull(dto.getTransactional());
        assertNull(dto.getConfirm());
    }

    @Test
    void testZeroValues() {
        ChannelDto dto = new ChannelDto();

        dto.setNumber(0);
        dto.setConsumerCount(0);
        dto.setMessagesUnacknowledged(0);
        dto.setPrefetchCount(0);

        assertEquals(0, dto.getNumber());
        assertEquals(0, dto.getConsumerCount());
        assertEquals(0, dto.getMessagesUnacknowledged());
        assertEquals(0, dto.getPrefetchCount());
    }
}