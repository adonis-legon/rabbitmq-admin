package com.rabbitmq.admin.dto.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Custom deserializer for message properties that handles both array and object
 * formats.
 * RabbitMQ Management API returns empty array [] when no properties exist,
 * but returns object {} when properties are present.
 */
public class PropertiesDeserializer extends JsonDeserializer<Map<String, Object>> {

    @Override
    public Map<String, Object> deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        JsonToken token = parser.getCurrentToken();

        if (token == JsonToken.START_ARRAY) {
            // Skip the empty array and return empty map
            parser.skipChildren();
            return new HashMap<>();
        } else if (token == JsonToken.START_OBJECT) {
            // Deserialize as normal object
            @SuppressWarnings("unchecked")
            Map<String, Object> result = parser.readValueAs(Map.class);
            return result;
        } else if (token == JsonToken.VALUE_NULL) {
            return new HashMap<>();
        }

        // Default to empty map for any other case
        return new HashMap<>();
    }
}