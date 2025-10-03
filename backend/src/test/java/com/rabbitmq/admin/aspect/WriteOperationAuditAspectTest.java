package com.rabbitmq.admin.aspect;

import com.rabbitmq.admin.model.*;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import com.rabbitmq.admin.security.UserPrincipal;
import com.rabbitmq.admin.service.WriteAuditService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Method;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for WriteOperationAuditAspect.
 */
@ExtendWith(MockitoExtension.class)
class WriteOperationAuditAspectTest {

    @Mock
    private WriteAuditService writeAuditService;

    @Mock
    private ClusterConnectionRepository clusterConnectionRepository;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MethodSignature methodSignature;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    private WriteOperationAuditAspect aspect;
    private User testUser;
    private ClusterConnection testCluster;

    @BeforeEach
    void setUp() {
        // Use lenient mode to avoid UnnecessaryStubbing errors
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);

        aspect = new WriteOperationAuditAspect(writeAuditService, clusterConnectionRepository);

        // Set up test user
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setRole(UserRole.ADMINISTRATOR);

        // Set up test cluster
        testCluster = new ClusterConnection();
        testCluster.setId(UUID.randomUUID());
        testCluster.setName("test-cluster");
        testCluster.setApiUrl("http://localhost:15672");
        testCluster.setUsername("admin");
        testCluster.setPassword("password");

        // Set up security context
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void testSuccessfulOperationAudit() throws Throwable {
        // Arrange
        Method testMethod = TestService.class.getMethod("createExchange", String.class, ClusterConnection.class);
        String exchangeName = "test-exchange";
        Object[] args = { exchangeName, testCluster };
        String expectedResult = "success";

        setupJoinPoint(testMethod, args, expectedResult);
        setupAuthentication(testUser);

        // Act
        Object result = aspect.auditWriteOperation(joinPoint);

        // Assert
        assertEquals(expectedResult, result);
        verify(joinPoint).proceed();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<ClusterConnection> clusterCaptor = ArgumentCaptor.forClass(ClusterConnection.class);
        ArgumentCaptor<AuditOperationType> operationTypeCaptor = ArgumentCaptor.forClass(AuditOperationType.class);
        ArgumentCaptor<String> resourceTypeCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> resourceNameCaptor = ArgumentCaptor.forClass(String.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> detailsCaptor = ArgumentCaptor.forClass(Map.class);
        ArgumentCaptor<AuditOperationStatus> statusCaptor = ArgumentCaptor.forClass(AuditOperationStatus.class);
        ArgumentCaptor<String> errorMessageCaptor = ArgumentCaptor.forClass(String.class);

        verify(writeAuditService).auditWriteOperation(
                userCaptor.capture(),
                clusterCaptor.capture(),
                operationTypeCaptor.capture(),
                resourceTypeCaptor.capture(),
                resourceNameCaptor.capture(),
                detailsCaptor.capture(),
                statusCaptor.capture(),
                errorMessageCaptor.capture());

        assertEquals(testUser, userCaptor.getValue());
        assertEquals(testCluster, clusterCaptor.getValue());
        assertEquals(AuditOperationType.CREATE_EXCHANGE, operationTypeCaptor.getValue());
        assertEquals("exchange", resourceTypeCaptor.getValue());
        assertEquals(exchangeName, resourceNameCaptor.getValue());
        assertEquals(AuditOperationStatus.SUCCESS, statusCaptor.getValue());
        assertNull(errorMessageCaptor.getValue());

        Map<String, Object> details = detailsCaptor.getValue();
        assertNotNull(details);
        assertEquals("createExchange", details.get("method"));
        assertEquals("TestService", details.get("class"));
        assertTrue(details.containsKey("executionTimeMs"));
        assertTrue(details.containsKey("timestamp"));
    }

    @Test
    void testFailedOperationAudit() throws Throwable {
        // Arrange
        Method testMethod = TestService.class.getMethod("createExchange", String.class, ClusterConnection.class);
        String exchangeName = "test-exchange";
        Object[] args = { exchangeName, testCluster };
        RuntimeException expectedException = new RuntimeException("Operation failed");

        setupJoinPoint(testMethod, args, null);
        setupAuthentication(testUser);
        lenient().when(joinPoint.proceed()).thenThrow(expectedException);

        // Act & Assert
        RuntimeException thrownException = assertThrows(RuntimeException.class, () -> {
            aspect.auditWriteOperation(joinPoint);
        });

        assertEquals(expectedException, thrownException);
        verify(joinPoint).proceed();

        ArgumentCaptor<AuditOperationStatus> statusCaptor = ArgumentCaptor.forClass(AuditOperationStatus.class);
        ArgumentCaptor<String> errorMessageCaptor = ArgumentCaptor.forClass(String.class);

        verify(writeAuditService).auditWriteOperation(
                eq(testUser),
                eq(testCluster),
                eq(AuditOperationType.CREATE_EXCHANGE),
                eq("exchange"),
                eq(exchangeName),
                any(),
                statusCaptor.capture(),
                errorMessageCaptor.capture());

        assertEquals(AuditOperationStatus.FAILURE, statusCaptor.getValue());
        assertEquals("Operation failed", errorMessageCaptor.getValue());
    }

    @Test
    void testAuditWithUserPrincipal() throws Throwable {
        // Arrange
        Method testMethod = TestService.class.getMethod("createExchange", String.class, ClusterConnection.class);
        Object[] args = { "test-exchange", testCluster };

        UserPrincipal userPrincipal = UserPrincipal.create(testUser);
        setupJoinPoint(testMethod, args, "success");
        lenient().when(authentication.getPrincipal()).thenReturn(userPrincipal);

        // Act
        aspect.auditWriteOperation(joinPoint);

        // Assert
        verify(writeAuditService).auditWriteOperation(
                eq(testUser),
                any(ClusterConnection.class),
                any(AuditOperationType.class),
                any(String.class),
                any(String.class),
                any(),
                eq(AuditOperationStatus.SUCCESS),
                isNull());
    }

    @Test
    void testAuditWithoutUser() throws Throwable {
        // Arrange
        Method testMethod = TestService.class.getMethod("createExchange", String.class, ClusterConnection.class);
        Object[] args = { "test-exchange", testCluster };

        setupJoinPoint(testMethod, args, "success");
        lenient().when(authentication.getPrincipal()).thenReturn("anonymous");

        // Act
        Object result = aspect.auditWriteOperation(joinPoint);

        // Assert
        assertEquals("success", result);
        verify(joinPoint).proceed();
        // Should not call audit service when user cannot be extracted
        verify(writeAuditService, never()).auditWriteOperation(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testAuditWithoutCluster() throws Throwable {
        // Arrange
        Method testMethod = TestService.class.getMethod("createExchangeWithoutCluster", String.class);
        Object[] args = { "test-exchange" };

        setupJoinPoint(testMethod, args, "success");
        setupAuthentication(testUser);

        // Act
        Object result = aspect.auditWriteOperation(joinPoint);

        // Assert
        assertEquals("success", result);
        verify(joinPoint).proceed();
        // Should not call audit service when cluster cannot be extracted
        verify(writeAuditService, never()).auditWriteOperation(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testAuditWithParameters() throws Throwable {
        // Arrange
        Method testMethod = TestService.class.getMethod("createQueueWithParameters", String.class,
                ClusterConnection.class, Boolean.class);
        Object[] args = { "test-queue", testCluster, true };

        setupJoinPoint(testMethod, args, "success");
        setupAuthentication(testUser);

        // Act
        aspect.auditWriteOperation(joinPoint);

        // Assert
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> detailsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(writeAuditService).auditWriteOperation(
                any(), any(), any(), any(), any(),
                detailsCaptor.capture(),
                any(), any());

        Map<String, Object> details = detailsCaptor.getValue();
        assertTrue(details.containsKey("parameters"));

        @SuppressWarnings("unchecked")
        Map<String, Object> parameters = (Map<String, Object>) details.get("parameters");
        assertEquals("test-queue", parameters.get("queueName"));
        assertEquals(true, parameters.get("durable"));
    }

    @Test
    void testAuditWithReturnValue() throws Throwable {
        // Arrange
        Method testMethod = TestService.class.getMethod("createBindingWithReturnValue", String.class,
                ClusterConnection.class);
        Object[] args = { "test-binding", testCluster };
        String returnValue = "binding-created";

        setupJoinPoint(testMethod, args, returnValue);
        setupAuthentication(testUser);

        // Act
        aspect.auditWriteOperation(joinPoint);

        // Assert
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> detailsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(writeAuditService).auditWriteOperation(
                any(), any(), any(), any(), any(),
                detailsCaptor.capture(),
                any(), any());

        Map<String, Object> details = detailsCaptor.getValue();
        assertTrue(details.containsKey("returnValue"));
        assertEquals(returnValue, details.get("returnValue"));
    }

    @Test
    void testAuditServiceFailureDoesNotAffectOperation() throws Throwable {
        // Arrange
        Method testMethod = TestService.class.getMethod("createExchange", String.class, ClusterConnection.class);
        Object[] args = { "test-exchange", testCluster };

        setupJoinPoint(testMethod, args, "success");
        setupAuthentication(testUser);

        // Make audit service throw exception
        lenient().doThrow(new RuntimeException("Audit service failed")).when(writeAuditService)
                .auditWriteOperation(any(), any(), any(), any(), any(), any(), any(), any());

        // Act
        Object result = aspect.auditWriteOperation(joinPoint);

        // Assert
        assertEquals("success", result);
        verify(joinPoint).proceed();
        verify(writeAuditService).auditWriteOperation(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testMethodWithoutAnnotation() throws Throwable {
        // Arrange
        Method testMethod = TestService.class.getMethod("methodWithoutAnnotation");
        setupJoinPointMinimal(testMethod, new Object[0], "success");

        // Act
        Object result = aspect.auditWriteOperation(joinPoint);

        // Assert
        assertEquals("success", result);
        verify(joinPoint).proceed();
        verify(writeAuditService, never()).auditWriteOperation(any(), any(), any(), any(), any(), any(), any(), any());
    }

    private void setupJoinPoint(Method method, Object[] args, Object returnValue) throws Throwable {
        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        lenient().when(methodSignature.getName()).thenReturn(method.getName());
        lenient().when(joinPoint.getArgs()).thenReturn(args);
        when(joinPoint.getTarget()).thenReturn(new TestService());
        lenient().when(methodSignature.getParameterNames()).thenReturn(getParameterNames(method));

        if (returnValue != null) {
            when(joinPoint.proceed()).thenReturn(returnValue);
        }
    }

    private void setupJoinPointMinimal(Method method, Object[] args, Object returnValue) throws Throwable {
        lenient().when(joinPoint.getSignature()).thenReturn(methodSignature);
        lenient().when(methodSignature.getMethod()).thenReturn(method);
        lenient().when(methodSignature.getName()).thenReturn(method.getName());
        lenient().when(joinPoint.getTarget()).thenReturn(new TestService());

        if (returnValue != null) {
            lenient().when(joinPoint.proceed()).thenReturn(returnValue);
        }
    }

    private void setupAuthentication(User user) {
        when(authentication.getPrincipal()).thenReturn(user);
    }

    private String[] getParameterNames(Method method) {
        // Simple parameter name generation for testing
        String[] names = new String[method.getParameterCount()];
        Class<?>[] paramTypes = method.getParameterTypes();

        for (int i = 0; i < paramTypes.length; i++) {
            if (paramTypes[i] == String.class) {
                if (method.getName().contains("Exchange")) {
                    names[i] = "exchangeName";
                } else if (method.getName().contains("Queue")) {
                    names[i] = "queueName";
                } else if (method.getName().contains("Binding")) {
                    names[i] = "bindingKey";
                } else {
                    names[i] = "name";
                }
            } else if (paramTypes[i] == ClusterConnection.class) {
                names[i] = "cluster";
            } else if (paramTypes[i] == Boolean.class) {
                names[i] = "durable";
            } else {
                names[i] = "param" + i;
            }
        }

        return names;
    }

    // Test service class with annotated methods
    static class TestService {

        @AuditWriteOperation(operationType = AuditOperationType.CREATE_EXCHANGE, resourceType = "exchange")
        public String createExchange(String exchangeName, ClusterConnection cluster) {
            return "success";
        }

        @AuditWriteOperation(operationType = AuditOperationType.CREATE_EXCHANGE, resourceType = "exchange")
        public String createExchangeWithoutCluster(String exchangeName) {
            return "success";
        }

        @AuditWriteOperation(operationType = AuditOperationType.CREATE_QUEUE, resourceType = "queue", includeParameters = true)
        public String createQueueWithParameters(String queueName, ClusterConnection cluster, Boolean durable) {
            return "success";
        }

        @AuditWriteOperation(operationType = AuditOperationType.CREATE_BINDING_QUEUE, resourceType = "binding", includeReturnValue = true)
        public String createBindingWithReturnValue(String bindingKey, ClusterConnection cluster) {
            return "binding-created";
        }

        public String methodWithoutAnnotation() {
            return "success";
        }
    }
}