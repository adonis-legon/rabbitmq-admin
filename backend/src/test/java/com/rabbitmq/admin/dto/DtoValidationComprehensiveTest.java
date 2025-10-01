package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test to verify all DTO validation and serialization aspects are
 * working correctly.
 * This test ensures that all validation constraints are properly enforced and
 * JSON serialization
 * works as expected for all write operation DTOs.
 */
class DtoValidationComprehensiveTest {

        private final ObjectMapper objectMapper = new ObjectMapper();
        private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

        @BeforeEach
        void setUp() {
                // Ensure validator is properly initialized
                assertNotNull(validator);
                assertNotNull(objectMapper);
        }

        @Test
        void testAllDtosHaveNoValidationErrorsWithValidData() {
                // Test CreateExchangeRequest
                CreateExchangeRequest exchangeRequest = new CreateExchangeRequest(
                                "test-exchange", "direct", "/", true, false, false, new HashMap<>());
                Set<ConstraintViolation<CreateExchangeRequest>> exchangeViolations = validator
                                .validate(exchangeRequest);
                assertTrue(exchangeViolations.isEmpty(), "Valid CreateExchangeRequest should have no violations");

                // Test CreateQueueRequest
                CreateQueueRequest queueRequest = new CreateQueueRequest(
                                "test-queue", "/", true, false, false, new HashMap<>(), null);
                Set<ConstraintViolation<CreateQueueRequest>> queueViolations = validator.validate(queueRequest);
                assertTrue(queueViolations.isEmpty(), "Valid CreateQueueRequest should have no violations");

                // Test CreateBindingRequest
                CreateBindingRequest bindingRequest = new CreateBindingRequest("test.key", new HashMap<>());
                Set<ConstraintViolation<CreateBindingRequest>> bindingViolations = validator.validate(bindingRequest);
                assertTrue(bindingViolations.isEmpty(), "Valid CreateBindingRequest should have no violations");

                // Test PublishMessageRequest
                PublishMessageRequest publishRequest = new PublishMessageRequest(
                                "test.key", new HashMap<>(), "Hello World", "string");
                Set<ConstraintViolation<PublishMessageRequest>> publishViolations = validator.validate(publishRequest);
                assertTrue(publishViolations.isEmpty(), "Valid PublishMessageRequest should have no violations");

                // Test GetMessagesRequest
                GetMessagesRequest getRequest = new GetMessagesRequest(5, "ack_requeue_true", "auto", null);
                Set<ConstraintViolation<GetMessagesRequest>> getViolations = validator.validate(getRequest);
                assertTrue(getViolations.isEmpty(), "Valid GetMessagesRequest should have no violations");
        }

        @Test
        void testAllDtosCanBeSerializedAndDeserialized() throws Exception {
                // Test CreateExchangeRequest serialization/deserialization
                Map<String, Object> exchangeArgs = new HashMap<>();
                exchangeArgs.put("x-message-ttl", 60000);
                CreateExchangeRequest originalExchange = new CreateExchangeRequest(
                                "test-exchange", "topic", "/test", false, true, false, exchangeArgs);

                String exchangeJson = objectMapper.writeValueAsString(originalExchange);
                CreateExchangeRequest deserializedExchange = objectMapper.readValue(exchangeJson,
                                CreateExchangeRequest.class);

                assertEquals(originalExchange.getName(), deserializedExchange.getName());
                assertEquals(originalExchange.getType(), deserializedExchange.getType());
                assertEquals(originalExchange.getVhost(), deserializedExchange.getVhost());
                assertEquals(originalExchange.getDurable(), deserializedExchange.getDurable());
                assertEquals(originalExchange.getAutoDelete(), deserializedExchange.getAutoDelete());
                assertEquals(originalExchange.getInternal(), deserializedExchange.getInternal());
                assertEquals(originalExchange.getArguments(), deserializedExchange.getArguments());

                // Test CreateQueueRequest serialization/deserialization
                Map<String, Object> queueArgs = new HashMap<>();
                queueArgs.put("x-max-length", 1000);
                CreateQueueRequest originalQueue = new CreateQueueRequest(
                                "test-queue", "/test", false, true, true, queueArgs, "rabbit@node1");

                String queueJson = objectMapper.writeValueAsString(originalQueue);
                CreateQueueRequest deserializedQueue = objectMapper.readValue(queueJson, CreateQueueRequest.class);

                assertEquals(originalQueue.getName(), deserializedQueue.getName());
                assertEquals(originalQueue.getVhost(), deserializedQueue.getVhost());
                assertEquals(originalQueue.getDurable(), deserializedQueue.getDurable());
                assertEquals(originalQueue.getAutoDelete(), deserializedQueue.getAutoDelete());
                assertEquals(originalQueue.getExclusive(), deserializedQueue.getExclusive());
                assertEquals(originalQueue.getArguments(), deserializedQueue.getArguments());
                assertEquals(originalQueue.getNode(), deserializedQueue.getNode());

                // Test PublishMessageRequest serialization/deserialization
                Map<String, Object> messageProps = new HashMap<>();
                messageProps.put("delivery_mode", 2);
                messageProps.put("priority", 5);
                PublishMessageRequest originalPublish = new PublishMessageRequest(
                                "test.routing.key", messageProps, "Test message content", "string");

                String publishJson = objectMapper.writeValueAsString(originalPublish);
                PublishMessageRequest deserializedPublish = objectMapper.readValue(publishJson,
                                PublishMessageRequest.class);

                assertEquals(originalPublish.getRoutingKey(), deserializedPublish.getRoutingKey());
                assertEquals(originalPublish.getProperties(), deserializedPublish.getProperties());
                assertEquals(originalPublish.getPayload(), deserializedPublish.getPayload());
                assertEquals(originalPublish.getPayloadEncoding(), deserializedPublish.getPayloadEncoding());

                // Test GetMessagesRequest serialization/deserialization
                GetMessagesRequest originalGet = new GetMessagesRequest(10, "reject_requeue_false", "base64", 5000);

                String getJson = objectMapper.writeValueAsString(originalGet);
                GetMessagesRequest deserializedGet = objectMapper.readValue(getJson, GetMessagesRequest.class);

                assertEquals(originalGet.getCount(), deserializedGet.getCount());
                assertEquals(originalGet.getAckmode(), deserializedGet.getAckmode());
                assertEquals(originalGet.getEncoding(), deserializedGet.getEncoding());
                assertEquals(originalGet.getTruncate(), deserializedGet.getTruncate());
        }

        @Test
        void testResponseDtosSerialization() throws Exception {
                // Test VirtualHostDto
                Map<String, Object> messageStats = new HashMap<>();
                messageStats.put("publish", 1000);
                messageStats.put("deliver", 950);
                VirtualHostDto vhostDto = new VirtualHostDto(
                                "/production", "Production environment", List.of("production"), "classic", false,
                                messageStats);

                String vhostJson = objectMapper.writeValueAsString(vhostDto);
                VirtualHostDto deserializedVhost = objectMapper.readValue(vhostJson, VirtualHostDto.class);

                assertEquals(vhostDto.getName(), deserializedVhost.getName());
                assertEquals(vhostDto.getDescription(), deserializedVhost.getDescription());
                assertEquals(vhostDto.getTags(), deserializedVhost.getTags());
                assertEquals(vhostDto.getDefaultQueueType(), deserializedVhost.getDefaultQueueType());
                assertEquals(vhostDto.getTracing(), deserializedVhost.getTracing());
                assertEquals(vhostDto.getMessageStats(), deserializedVhost.getMessageStats());

                // Test MessageDto
                Map<String, Object> msgProperties = new HashMap<>();
                msgProperties.put("delivery_mode", 2);
                msgProperties.put("content_type", "application/json");
                MessageDto messageDto = new MessageDto(
                                "string", "{\"test\":\"data\"}", msgProperties, "test.key", false, "test-exchange", 5);

                String messageJson = objectMapper.writeValueAsString(messageDto);
                MessageDto deserializedMessage = objectMapper.readValue(messageJson, MessageDto.class);

                assertEquals(messageDto.getPayloadEncoding(), deserializedMessage.getPayloadEncoding());
                assertEquals(messageDto.getPayload(), deserializedMessage.getPayload());
                assertEquals(messageDto.getProperties(), deserializedMessage.getProperties());
                assertEquals(messageDto.getRoutingKey(), deserializedMessage.getRoutingKey());
                assertEquals(messageDto.getRedelivered(), deserializedMessage.getRedelivered());
                assertEquals(messageDto.getExchange(), deserializedMessage.getExchange());
                assertEquals(messageDto.getMessageCount(), deserializedMessage.getMessageCount());

                // Test PublishResponse
                PublishResponse publishResponse = new PublishResponse(true);

                String responseJson = objectMapper.writeValueAsString(publishResponse);
                PublishResponse deserializedResponse = objectMapper.readValue(responseJson, PublishResponse.class);

                assertEquals(publishResponse.getRouted(), deserializedResponse.getRouted());
        }

        @Test
        void testValidationConstraintsAreEnforced() {
                // Test that validation constraints are properly enforced

                // CreateExchangeRequest - invalid name pattern
                CreateExchangeRequest invalidExchange = new CreateExchangeRequest();
                invalidExchange.setName("invalid@name");
                invalidExchange.setType("direct");
                invalidExchange.setVhost("/");
                Set<ConstraintViolation<CreateExchangeRequest>> exchangeViolations = validator
                                .validate(invalidExchange);
                assertFalse(exchangeViolations.isEmpty(), "Invalid exchange name should cause validation error");

                // CreateQueueRequest - name too long
                CreateQueueRequest invalidQueue = new CreateQueueRequest();
                invalidQueue.setName("a".repeat(256));
                invalidQueue.setVhost("/");
                Set<ConstraintViolation<CreateQueueRequest>> queueViolations = validator.validate(invalidQueue);
                assertFalse(queueViolations.isEmpty(), "Queue name too long should cause validation error");

                // PublishMessageRequest - payload too large
                PublishMessageRequest invalidPublish = new PublishMessageRequest();
                invalidPublish.setPayload("a".repeat(1048577)); // 1MB + 1 byte
                Set<ConstraintViolation<PublishMessageRequest>> publishViolations = validator.validate(invalidPublish);
                assertFalse(publishViolations.isEmpty(), "Payload too large should cause validation error");

                // GetMessagesRequest - count out of range
                GetMessagesRequest invalidGet = new GetMessagesRequest();
                invalidGet.setCount(101); // Max is 100
                Set<ConstraintViolation<GetMessagesRequest>> getViolations = validator.validate(invalidGet);
                assertFalse(getViolations.isEmpty(), "Count too high should cause validation error");
        }

        @Test
        void testNullHandlingInConstructors() {
                // Test that constructors handle null arguments gracefully

                CreateExchangeRequest exchangeRequest = new CreateExchangeRequest(
                                "test", "direct", "/", true, false, false, null);
                assertNotNull(exchangeRequest.getArguments());
                assertTrue(exchangeRequest.getArguments().isEmpty());

                CreateQueueRequest queueRequest = new CreateQueueRequest(
                                "test", "/", true, false, false, null, null);
                assertNotNull(queueRequest.getArguments());
                assertTrue(queueRequest.getArguments().isEmpty());

                CreateBindingRequest bindingRequest = new CreateBindingRequest(null, null);
                assertEquals("", bindingRequest.getRoutingKey());
                assertNotNull(bindingRequest.getArguments());
                assertTrue(bindingRequest.getArguments().isEmpty());

                PublishMessageRequest publishRequest = new PublishMessageRequest(null, null, "test", null);
                assertEquals("", publishRequest.getRoutingKey());
                assertNotNull(publishRequest.getProperties());
                assertTrue(publishRequest.getProperties().isEmpty());
                assertEquals("string", publishRequest.getPayloadEncoding());
        }

        @Test
        void testSetterNullHandling() {
                // Test that setters handle null values appropriately

                CreateExchangeRequest exchangeRequest = new CreateExchangeRequest();
                exchangeRequest.setArguments(null);
                assertNotNull(exchangeRequest.getArguments());
                assertTrue(exchangeRequest.getArguments().isEmpty());

                CreateQueueRequest queueRequest = new CreateQueueRequest();
                queueRequest.setArguments(null);
                assertNotNull(queueRequest.getArguments());
                assertTrue(queueRequest.getArguments().isEmpty());

                CreateBindingRequest bindingRequest = new CreateBindingRequest();
                bindingRequest.setRoutingKey(null);
                assertEquals("", bindingRequest.getRoutingKey());
                bindingRequest.setArguments(null);
                assertNotNull(bindingRequest.getArguments());
                assertTrue(bindingRequest.getArguments().isEmpty());

                PublishMessageRequest publishRequest = new PublishMessageRequest();
                publishRequest.setRoutingKey(null);
                assertEquals("", publishRequest.getRoutingKey());
                publishRequest.setProperties(null);
                assertNotNull(publishRequest.getProperties());
                assertTrue(publishRequest.getProperties().isEmpty());
                publishRequest.setPayloadEncoding(null);
                assertEquals("string", publishRequest.getPayloadEncoding());

                GetMessagesRequest getRequest = new GetMessagesRequest();
                getRequest.setCount(null);
                assertEquals(1, getRequest.getCount());
                getRequest.setAckmode(null);
                assertEquals("ack_requeue_true", getRequest.getAckmode());
                getRequest.setEncoding(null);
                assertEquals("auto", getRequest.getEncoding());
        }

        @Test
        void testComplexArgumentsAndPropertiesHandling() throws Exception {
                // Test complex nested objects in arguments and properties

                Map<String, Object> complexArgs = new HashMap<>();
                complexArgs.put("x-message-ttl", 60000);
                complexArgs.put("x-max-length", 1000);
                complexArgs.put("x-dead-letter-exchange", "dlx");
                complexArgs.put("x-dead-letter-routing-key", "dlx.key");

                Map<String, Object> nestedMap = new HashMap<>();
                nestedMap.put("nested-key", "nested-value");
                nestedMap.put("nested-number", 42);
                complexArgs.put("nested-object", nestedMap);

                CreateExchangeRequest exchangeRequest = new CreateExchangeRequest(
                                "complex-exchange", "headers", "/test", true, false, false, complexArgs);

                String json = objectMapper.writeValueAsString(exchangeRequest);
                CreateExchangeRequest deserialized = objectMapper.readValue(json, CreateExchangeRequest.class);

                assertEquals(complexArgs, deserialized.getArguments());
                assertEquals(60000, deserialized.getArguments().get("x-message-ttl"));
                assertEquals("dlx", deserialized.getArguments().get("x-dead-letter-exchange"));

                @SuppressWarnings("unchecked")
                Map<String, Object> deserializedNested = (Map<String, Object>) deserialized.getArguments()
                                .get("nested-object");
                assertEquals("nested-value", deserializedNested.get("nested-key"));
                assertEquals(42, deserializedNested.get("nested-number"));
        }
}