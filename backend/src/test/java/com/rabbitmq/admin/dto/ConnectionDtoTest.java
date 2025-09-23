package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ConnectionDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testDefaultConstructor() {
        ConnectionDto dto = new ConnectionDto();

        assertNull(dto.getName());
        assertNull(dto.getState());
        assertNull(dto.getChannels());
        assertNull(dto.getClientProperties());
        assertNull(dto.getHost());
        assertNull(dto.getPeerHost());
        assertNull(dto.getPort());
        assertNull(dto.getPeerPort());
        assertNull(dto.getProtocol());
        assertNull(dto.getUser());
        assertNull(dto.getVhost());
        assertNull(dto.getConnectedAt());
    }

    @Test
    void testConstructorWithParameters() {
        Map<String, Object> clientProps = new HashMap<>();
        clientProps.put("connection_name", "Test Connection");
        clientProps.put("platform", "Java");

        ConnectionDto dto = new ConnectionDto(
                "connection-1", "running", 2, clientProps,
                "localhost", "192.168.1.100", 5672, 54321,
                "AMQP 0-9-1", "guest", "/", 1640995200000L);

        assertEquals("connection-1", dto.getName());
        assertEquals("running", dto.getState());
        assertEquals(2, dto.getChannels());
        assertEquals(clientProps, dto.getClientProperties());
        assertEquals("localhost", dto.getHost());
        assertEquals("192.168.1.100", dto.getPeerHost());
        assertEquals(5672, dto.getPort());
        assertEquals(54321, dto.getPeerPort());
        assertEquals("AMQP 0-9-1", dto.getProtocol());
        assertEquals("guest", dto.getUser());
        assertEquals("/", dto.getVhost());
        assertEquals(1640995200000L, dto.getConnectedAt());
    }

    @Test
    void testSettersAndGetters() {
        ConnectionDto dto = new ConnectionDto();
        Map<String, Object> clientProps = new HashMap<>();
        clientProps.put("product", "RabbitMQ Java Client");

        dto.setName("test-connection");
        dto.setState("blocked");
        dto.setChannels(5);
        dto.setClientProperties(clientProps);
        dto.setHost("rabbitmq.example.com");
        dto.setPeerHost("client.example.com");
        dto.setPort(5672);
        dto.setPeerPort(12345);
        dto.setProtocol("AMQP 0-9-1");
        dto.setUser("testuser");
        dto.setVhost("/test");
        dto.setTimeout(60);
        dto.setFrameMax(131072);
        dto.setConnectedAt(1640995200000L);
        dto.setRecvOct(1024L);
        dto.setRecvCnt(10L);
        dto.setSendOct(2048L);
        dto.setSendCnt(20L);

        assertEquals("test-connection", dto.getName());
        assertEquals("blocked", dto.getState());
        assertEquals(5, dto.getChannels());
        assertEquals(clientProps, dto.getClientProperties());
        assertEquals("rabbitmq.example.com", dto.getHost());
        assertEquals("client.example.com", dto.getPeerHost());
        assertEquals(5672, dto.getPort());
        assertEquals(12345, dto.getPeerPort());
        assertEquals("AMQP 0-9-1", dto.getProtocol());
        assertEquals("testuser", dto.getUser());
        assertEquals("/test", dto.getVhost());
        assertEquals(60, dto.getTimeout());
        assertEquals(131072, dto.getFrameMax());
        assertEquals(1640995200000L, dto.getConnectedAt());
        assertEquals(1024L, dto.getRecvOct());
        assertEquals(10L, dto.getRecvCnt());
        assertEquals(2048L, dto.getSendOct());
        assertEquals(20L, dto.getSendCnt());
    }

    @Test
    void testJsonSerialization() throws Exception {
        Map<String, Object> clientProps = new HashMap<>();
        clientProps.put("connection_name", "Test Connection");
        clientProps.put("platform", "Java");

        ConnectionDto dto = new ConnectionDto(
                "connection-1", "running", 2, clientProps,
                "localhost", "192.168.1.100", 5672, 54321,
                "AMQP 0-9-1", "guest", "/", 1640995200000L);

        String json = objectMapper.writeValueAsString(dto);

        assertTrue(json.contains("\"name\":\"connection-1\""));
        assertTrue(json.contains("\"state\":\"running\""));
        assertTrue(json.contains("\"channels\":2"));
        assertTrue(json.contains("\"host\":\"localhost\""));
        assertTrue(json.contains("\"peer_host\":\"192.168.1.100\""));
        assertTrue(json.contains("\"port\":5672"));
        assertTrue(json.contains("\"peer_port\":54321"));
        assertTrue(json.contains("\"protocol\":\"AMQP 0-9-1\""));
        assertTrue(json.contains("\"user\":\"guest\""));
        assertTrue(json.contains("\"vhost\":\"/\""));
        assertTrue(json.contains("\"connected_at\":1640995200000"));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"name\":\"connection-1\"," +
                "\"state\":\"running\"," +
                "\"channels\":2," +
                "\"client_properties\":{\"connection_name\":\"Test Connection\",\"platform\":\"Java\"}," +
                "\"host\":\"localhost\"," +
                "\"peer_host\":\"192.168.1.100\"," +
                "\"port\":5672," +
                "\"peer_port\":54321," +
                "\"protocol\":\"AMQP 0-9-1\"," +
                "\"user\":\"guest\"," +
                "\"vhost\":\"/\"," +
                "\"connected_at\":1640995200000," +
                "\"recv_oct\":1024," +
                "\"send_oct\":2048" +
                "}";

        ConnectionDto dto = objectMapper.readValue(json, ConnectionDto.class);

        assertEquals("connection-1", dto.getName());
        assertEquals("running", dto.getState());
        assertEquals(2, dto.getChannels());
        assertNotNull(dto.getClientProperties());
        assertEquals("Test Connection", dto.getClientProperties().get("connection_name"));
        assertEquals("Java", dto.getClientProperties().get("platform"));
        assertEquals("localhost", dto.getHost());
        assertEquals("192.168.1.100", dto.getPeerHost());
        assertEquals(5672, dto.getPort());
        assertEquals(54321, dto.getPeerPort());
        assertEquals("AMQP 0-9-1", dto.getProtocol());
        assertEquals("guest", dto.getUser());
        assertEquals("/", dto.getVhost());
        assertEquals(1640995200000L, dto.getConnectedAt());
        assertEquals(1024L, dto.getRecvOct());
        assertEquals(2048L, dto.getSendOct());
    }

    @Test
    void testJsonIgnoreUnknownProperties() throws Exception {
        String json = "{" +
                "\"name\":\"connection-1\"," +
                "\"state\":\"running\"," +
                "\"unknown_field\":\"should_be_ignored\"," +
                "\"another_unknown\":123" +
                "}";

        // Should not throw exception due to @JsonIgnoreProperties(ignoreUnknown = true)
        ConnectionDto dto = objectMapper.readValue(json, ConnectionDto.class);

        assertEquals("connection-1", dto.getName());
        assertEquals("running", dto.getState());
    }

    @Test
    void testNullValues() {
        ConnectionDto dto = new ConnectionDto();

        // Test that null values are handled properly
        dto.setName(null);
        dto.setState(null);
        dto.setChannels(null);
        dto.setClientProperties(null);

        assertNull(dto.getName());
        assertNull(dto.getState());
        assertNull(dto.getChannels());
        assertNull(dto.getClientProperties());
    }

    @Test
    void testEmptyClientProperties() {
        ConnectionDto dto = new ConnectionDto();
        Map<String, Object> emptyProps = new HashMap<>();
        dto.setClientProperties(emptyProps);

        assertNotNull(dto.getClientProperties());
        assertTrue(dto.getClientProperties().isEmpty());
    }
}