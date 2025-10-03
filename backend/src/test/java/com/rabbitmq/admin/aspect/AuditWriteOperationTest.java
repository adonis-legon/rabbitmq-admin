package com.rabbitmq.admin.aspect;

import com.rabbitmq.admin.model.AuditOperationType;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the AuditWriteOperation annotation.
 */
class AuditWriteOperationTest {

    @Test
    void testAnnotationPresence() throws NoSuchMethodException {
        Method method = TestClass.class.getMethod("testMethod");
        assertTrue(method.isAnnotationPresent(AuditWriteOperation.class));
    }

    @Test
    void testAnnotationValues() throws NoSuchMethodException {
        Method method = TestClass.class.getMethod("testMethod");
        AuditWriteOperation annotation = method.getAnnotation(AuditWriteOperation.class);

        assertNotNull(annotation);
        assertEquals(AuditOperationType.CREATE_EXCHANGE, annotation.operationType());
        assertEquals("exchange", annotation.resourceType());
        assertEquals("Test operation", annotation.description());
        assertTrue(annotation.includeParameters());
        assertFalse(annotation.includeReturnValue());
    }

    @Test
    void testDefaultValues() throws NoSuchMethodException {
        Method method = TestClass.class.getMethod("testMethodWithDefaults");
        AuditWriteOperation annotation = method.getAnnotation(AuditWriteOperation.class);

        assertNotNull(annotation);
        assertEquals(AuditOperationType.CREATE_QUEUE, annotation.operationType());
        assertEquals("queue", annotation.resourceType());
        assertEquals("", annotation.description()); // Default empty string
        assertFalse(annotation.includeParameters()); // Default false
        assertFalse(annotation.includeReturnValue()); // Default false
    }

    @Test
    void testAnnotationRetention() {
        AuditWriteOperation annotation = TestClass.class.getAnnotation(AuditWriteOperation.class);
        // Class-level annotation should not be present since @Target is METHOD only
        assertNull(annotation);
    }

    // Test class with annotated methods
    static class TestClass {

        @AuditWriteOperation(operationType = AuditOperationType.CREATE_EXCHANGE, resourceType = "exchange", description = "Test operation", includeParameters = true, includeReturnValue = false)
        public void testMethod() {
            // Test method
        }

        @AuditWriteOperation(operationType = AuditOperationType.CREATE_QUEUE, resourceType = "queue")
        public void testMethodWithDefaults() {
            // Test method with default annotation values
        }
    }
}