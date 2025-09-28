package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class VirtualHostDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testDefaultConstructor() {
        VirtualHostDto dto = new VirtualHostDto();

        assertNull(dto.getName());
        assertNull(dto.getDescription());
        assertNull(dto.getTags());
        assertNull(dto.getDefaultQueueType());
        assertNull(dto.getTracing());
        assertNull(dto.getMessageStats());
    }

    @Test
    void testConstructorWithParameters() {
        Map<String, Object> messageStats = new HashMap<>();
        messageStats.put("publish", 100);
        messageStats.put("deliver", 95);

        VirtualHostDto dto = new VirtualHostDto(
                "/", "Default virtual host", "management",
                "classic", false, messageStats);

        assertEquals("/", dto.getName());
        assertEquals("Default virtual host", dto.getDescription());
        assertEquals("management", dto.getTags());
        assertEquals("classic", dto.getDefaultQueueType());
        assertFalse(dto.getTracing());
        assertEquals(messageStats, dto.getMessageStats());
    }

    @Test
    void testSettersAndGetters() {
        VirtualHostDto dto = new VirtualHostDto();
        Map<String, Object> messageStats = new HashMap<>();
        messageStats.put("publish_in", 50);
        messageStats.put("publish_out", 48);

        dto.setName("/test");
        dto.setDescription("Test virtual host");
        dto.setTags("test,development");
        dto.setDefaultQueueType("quorum");
        dto.setTracing(true);
        dto.setMessageStats(messageStats);

        assertEquals("/test", dto.getName());
        assertEquals("Test virtual host", dto.getDescription());
        assertEquals("test,development", dto.getTags());
        assertEquals("quorum", dto.getDefaultQueueType());
        assertTrue(dto.getTracing());
        assertEquals(messageStats, dto.getMessageStats());
    }

    @Test
    void testJsonSerialization() throws Exception {
        Map<String, Object> messageStats = new HashMap<>();
        messageStats.put("publish", 200);
        messageStats.put("deliver_get", 180);

        VirtualHostDto dto = new VirtualHostDto(
                "/production", "Production environment", "production,critical",
                "classic", false, messageStats);

        String json = objectMapper.writeValueAsString(dto);

        assertTrue(json.contains("\"name\":\"/production\""));
        assertTrue(json.contains("\"description\":\"Production environment\""));
        assertTrue(json.contains("\"tags\":\"production,critical\""));
        assertTrue(json.contains("\"default_queue_type\":\"classic\""));
        assertTrue(json.contains("\"tracing\":false"));
        assertTrue(json.contains("\"publish\":200"));
        assertTrue(json.contains("\"deliver_get\":180"));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"name\":\"/staging\"," +
                "\"description\":\"Staging environment\"," +
                "\"tags\":\"staging\"," +
                "\"default_queue_type\":\"quorum\"," +
                "\"tracing\":true," +
                "\"message_stats\":{\"publish\":50,\"deliver\":45}" +
                "}";

        VirtualHostDto dto = objectMapper.readValue(json, VirtualHostDto.class);

        assertEquals("/staging", dto.getName());
        assertEquals("Staging environment", dto.getDescription());
        assertEquals("staging", dto.getTags());
        assertEquals("quorum", dto.getDefaultQueueType());
        assertTrue(dto.getTracing());

        assertNotNull(dto.getMessageStats());
        assertEquals(50, dto.getMessageStats().get("publish"));
        assertEquals(45, dto.getMessageStats().get("deliver"));
    }

    @Test
    void testJsonIgnoreUnknownProperties() throws Exception {
        String json = "{" +
                "\"name\":\"/test\"," +
                "\"unknown_field\":\"should_be_ignored\"," +
                "\"another_unknown\":123" +
                "}";

        // Should not throw exception due to @JsonIgnoreProperties(ignoreUnknown = true)
        VirtualHostDto dto = objectMapper.readValue(json, VirtualHostDto.class);

        assertEquals("/test", dto.getName());
    }

    @Test
    void testNullValues() {
        VirtualHostDto dto = new VirtualHostDto();

        dto.setName(null);
        dto.setDescription(null);
        dto.setTags(null);
        dto.setDefaultQueueType(null);
        dto.setTracing(null);
        dto.setMessageStats(null);

        assertNull(dto.getName());
        assertNull(dto.getDescription());
        assertNull(dto.getTags());
        assertNull(dto.getDefaultQueueType());
        assertNull(dto.getTracing());
        assertNull(dto.getMessageStats());
    }

    @Test
    void testDefaultVirtualHost() {
        VirtualHostDto dto = new VirtualHostDto();
        dto.setName("/");
        dto.setDescription("Default virtual host");
        dto.setDefaultQueueType("classic");
        dto.setTracing(false);

        assertEquals("/", dto.getName());
        assertEquals("Default virtual host", dto.getDescription());
        assertEquals("classic", dto.getDefaultQueueType());
        assertFalse(dto.getTracing());
    }

    @Test
    void testCustomVirtualHost() {
        VirtualHostDto dto = new VirtualHostDto();
        dto.setName("/my-app");
        dto.setDescription("Application specific virtual host");
        dto.setTags("application,isolated");
        dto.setDefaultQueueType("quorum");
        dto.setTracing(true);

        assertEquals("/my-app", dto.getName());
        assertEquals("Application specific virtual host", dto.getDescription());
        assertEquals("application,isolated", dto.getTags());
        assertEquals("quorum", dto.getDefaultQueueType());
        assertTrue(dto.getTracing());
    }

    @Test
    void testQueueTypes() {
        VirtualHostDto dto = new VirtualHostDto();

        // Test classic queue type
        dto.setDefaultQueueType("classic");
        assertEquals("classic", dto.getDefaultQueueType());

        // Test quorum queue type
        dto.setDefaultQueueType("quorum");
        assertEquals("quorum", dto.getDefaultQueueType());

        // Test stream queue type
        dto.setDefaultQueueType("stream");
        assertEquals("stream", dto.getDefaultQueueType());
    }

    @Test
    void testMessageStats() {
        VirtualHostDto dto = new VirtualHostDto();
        Map<String, Object> stats = new HashMap<>();

        // Common message statistics
        stats.put("publish", 1000);
        stats.put("publish_in", 1000);
        stats.put("publish_out", 995);
        stats.put("deliver", 950);
        stats.put("deliver_no_ack", 50);
        stats.put("get", 100);
        stats.put("get_no_ack", 10);
        stats.put("deliver_get", 1050);
        stats.put("redeliver", 5);
        stats.put("return_unroutable", 5);

        dto.setMessageStats(stats);

        assertEquals(1000, dto.getMessageStats().get("publish"));
        assertEquals(1000, dto.getMessageStats().get("publish_in"));
        assertEquals(995, dto.getMessageStats().get("publish_out"));
        assertEquals(950, dto.getMessageStats().get("deliver"));
        assertEquals(50, dto.getMessageStats().get("deliver_no_ack"));
        assertEquals(100, dto.getMessageStats().get("get"));
        assertEquals(10, dto.getMessageStats().get("get_no_ack"));
        assertEquals(1050, dto.getMessageStats().get("deliver_get"));
        assertEquals(5, dto.getMessageStats().get("redeliver"));
        assertEquals(5, dto.getMessageStats().get("return_unroutable"));
    }

    @Test
    void testEmptyMessageStats() {
        VirtualHostDto dto = new VirtualHostDto();
        Map<String, Object> emptyStats = new HashMap<>();
        dto.setMessageStats(emptyStats);

        assertNotNull(dto.getMessageStats());
        assertTrue(dto.getMessageStats().isEmpty());
    }

    @Test
    void testTracingFlag() {
        VirtualHostDto dto = new VirtualHostDto();

        // Test tracing disabled
        dto.setTracing(false);
        assertFalse(dto.getTracing());

        // Test tracing enabled
        dto.setTracing(true);
        assertTrue(dto.getTracing());
    }

    @Test
    void testTagsHandling() {
        VirtualHostDto dto = new VirtualHostDto();

        // Test single tag
        dto.setTags("production");
        assertEquals("production", dto.getTags());

        // Test multiple tags
        dto.setTags("production,critical,monitored");
        assertEquals("production,critical,monitored", dto.getTags());

        // Test empty tags
        dto.setTags("");
        assertEquals("", dto.getTags());
    }
}