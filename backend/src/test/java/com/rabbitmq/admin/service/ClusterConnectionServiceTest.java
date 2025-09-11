package com.rabbitmq.admin.service;

import com.rabbitmq.admin.dto.ConnectionTestResponse;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import com.rabbitmq.admin.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ClusterConnectionService.
 */
@ExtendWith(MockitoExtension.class)
class ClusterConnectionServiceTest {

    @Mock
    private ClusterConnectionRepository clusterConnectionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private ClusterConnectionService clusterConnectionService;

    private ClusterConnection testCluster;
    private User testUser;
    private UUID clusterId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        clusterId = UUID.randomUUID();
        userId = UUID.randomUUID();

        testCluster = new ClusterConnection("test-cluster", "http://localhost:15672", "admin", "password");
        testCluster.setId(clusterId);
        testCluster.setDescription("Test cluster");
        testCluster.setActive(true);

        testUser = new User("testuser", "hashedpassword", UserRole.USER);
        testUser.setId(userId);
    }

    @Test
    void createClusterConnection_Success() {
        // Given
        when(clusterConnectionRepository.existsByNameIgnoreCase("test-cluster")).thenReturn(false);
        when(clusterConnectionRepository.save(any(ClusterConnection.class))).thenReturn(testCluster);

        // When
        ClusterConnection result = clusterConnectionService.createClusterConnection(
                "test-cluster", "http://localhost:15672", "admin", "password", "Test cluster", true);

        // Then
        assertNotNull(result);
        assertEquals("test-cluster", result.getName());
        assertEquals("http://localhost:15672", result.getApiUrl());
        assertEquals("admin", result.getUsername());
        assertEquals("password", result.getPassword());
        assertEquals("Test cluster", result.getDescription());
        assertTrue(result.getActive());

        verify(clusterConnectionRepository).existsByNameIgnoreCase("test-cluster");
        verify(clusterConnectionRepository).save(any(ClusterConnection.class));
    }

    @Test
    void createClusterConnection_DuplicateName_ThrowsException() {
        // Given
        when(clusterConnectionRepository.existsByNameIgnoreCase("test-cluster")).thenReturn(true);

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> clusterConnectionService.createClusterConnection(
                        "test-cluster", "http://localhost:15672", "admin", "password", "Test cluster", true));

        assertEquals("Cluster connection name already exists: test-cluster", exception.getMessage());
        verify(clusterConnectionRepository).existsByNameIgnoreCase("test-cluster");
        verify(clusterConnectionRepository, never()).save(any());
    }

    @Test
    void updateClusterConnection_Success() {
        // Given
        when(clusterConnectionRepository.findById(clusterId)).thenReturn(Optional.of(testCluster));
        when(clusterConnectionRepository.existsByNameIgnoreCase("updated-cluster")).thenReturn(false);
        when(clusterConnectionRepository.save(any(ClusterConnection.class))).thenReturn(testCluster);

        // When
        ClusterConnection result = clusterConnectionService.updateClusterConnection(
                clusterId, "updated-cluster", "http://localhost:15673", "newadmin", "newpassword",
                "Updated description", false);

        // Then
        assertNotNull(result);
        verify(clusterConnectionRepository).findById(clusterId);
        verify(clusterConnectionRepository).existsByNameIgnoreCase("updated-cluster");
        verify(clusterConnectionRepository).save(testCluster);
    }

    @Test
    void getClusterConnectionById_Success() {
        // Given
        when(clusterConnectionRepository.findById(clusterId)).thenReturn(Optional.of(testCluster));

        // When
        ClusterConnection result = clusterConnectionService.getClusterConnectionById(clusterId);

        // Then
        assertNotNull(result);
        assertEquals(testCluster.getId(), result.getId());
        assertEquals(testCluster.getName(), result.getName());
        verify(clusterConnectionRepository).findById(clusterId);
    }

    @Test
    void getClusterConnectionById_NotFound_ThrowsException() {
        // Given
        when(clusterConnectionRepository.findById(clusterId)).thenReturn(Optional.empty());

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> clusterConnectionService.getClusterConnectionById(clusterId));

        assertEquals("Cluster connection not found with ID: " + clusterId, exception.getMessage());
        verify(clusterConnectionRepository).findById(clusterId);
    }

    @Test
    void getAllClusterConnections_Success() {
        // Given
        List<ClusterConnection> clusters = Arrays.asList(testCluster);
        when(clusterConnectionRepository.findAllByOrderByNameAsc()).thenReturn(clusters);

        // When
        List<ClusterConnection> result = clusterConnectionService.getAllClusterConnections();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testCluster, result.get(0));
        verify(clusterConnectionRepository).findAllByOrderByNameAsc();
    }

    @Test
    void getActiveClusterConnections_Success() {
        // Given
        List<ClusterConnection> activeClusters = Arrays.asList(testCluster);
        when(clusterConnectionRepository.findByActiveTrueOrderByNameAsc()).thenReturn(activeClusters);

        // When
        List<ClusterConnection> result = clusterConnectionService.getActiveClusterConnections();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testCluster, result.get(0));
        verify(clusterConnectionRepository).findByActiveTrueOrderByNameAsc();
    }

    @Test
    void deleteClusterConnection_Success() {
        // Given
        when(clusterConnectionRepository.findById(clusterId)).thenReturn(Optional.of(testCluster));

        // When
        clusterConnectionService.deleteClusterConnection(clusterId);

        // Then
        verify(clusterConnectionRepository).findById(clusterId);
        verify(clusterConnectionRepository).save(testCluster);
        verify(clusterConnectionRepository).delete(testCluster);
    }

    @Test
    void assignUserToCluster_Success() {
        // Given
        when(clusterConnectionRepository.findById(clusterId)).thenReturn(Optional.of(testCluster));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // When
        clusterConnectionService.assignUserToCluster(clusterId, userId);

        // Then
        verify(clusterConnectionRepository).findById(clusterId);
        verify(userRepository).findById(userId);
        verify(clusterConnectionRepository).save(testCluster);
    }

    @Test
    void assignUserToCluster_UserNotFound_ThrowsException() {
        // Given
        when(clusterConnectionRepository.findById(clusterId)).thenReturn(Optional.of(testCluster));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> clusterConnectionService.assignUserToCluster(clusterId, userId));

        assertEquals("User not found with ID: " + userId, exception.getMessage());
        verify(clusterConnectionRepository).findById(clusterId);
        verify(userRepository).findById(userId);
        verify(clusterConnectionRepository, never()).save(any());
    }

    @Test
    void testConnection_Success() {
        // Given
        ResponseEntity<String> mockResponse = new ResponseEntity<>("{\"rabbitmq_version\":\"3.8.0\"}", HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(mockResponse);

        // When
        ConnectionTestResponse result = clusterConnectionService.testConnection(
                "http://localhost:15672", "admin", "password");

        // Then
        assertNotNull(result);
        assertTrue(result.isSuccessful());
        assertEquals("Connection successful - RabbitMQ API is accessible", result.getMessage());
        assertTrue(result.getResponseTimeMs() >= 0);
        verify(restTemplate).exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(),
                eq(String.class));
    }

    @Test
    void testConnection_Unauthorized_ReturnsFailure() {
        // Given
        when(restTemplate.exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(), eq(String.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED));

        // When
        ConnectionTestResponse result = clusterConnectionService.testConnection(
                "http://localhost:15672", "admin", "wrongpassword");

        // Then
        assertNotNull(result);
        assertFalse(result.isSuccessful());
        assertEquals("Invalid credentials - authentication failed", result.getMessage());
        assertEquals("HTTP 401 - UNAUTHORIZED", result.getErrorDetails());
        verify(restTemplate).exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(),
                eq(String.class));
    }

    @Test
    void testConnection_NetworkError_ReturnsFailure() {
        // Given
        when(restTemplate.exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection timeout"));

        // When
        ConnectionTestResponse result = clusterConnectionService.testConnection(
                "http://unreachable:15672", "admin", "password");

        // Then
        assertNotNull(result);
        assertFalse(result.isSuccessful());
        assertEquals("Connection timeout or network error", result.getMessage());
        assertTrue(result.getErrorDetails().contains("Connection timeout"));
        verify(restTemplate).exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(),
                eq(String.class));
    }

    @Test
    void testClusterConnection_Success() {
        // Given
        when(clusterConnectionRepository.findById(clusterId)).thenReturn(Optional.of(testCluster));
        ResponseEntity<String> mockResponse = new ResponseEntity<>("{\"rabbitmq_version\":\"3.8.0\"}", HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(mockResponse);

        // When
        ConnectionTestResponse result = clusterConnectionService.testClusterConnection(clusterId);

        // Then
        assertNotNull(result);
        assertTrue(result.isSuccessful());
        verify(clusterConnectionRepository).findById(clusterId);
        verify(restTemplate).exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(),
                eq(String.class));
    }

    @Test
    void userHasAccessToCluster_Success() {
        // Given
        List<ClusterConnection> userClusters = Arrays.asList(testCluster);
        when(clusterConnectionRepository.findByAssignedUsersId(userId)).thenReturn(userClusters);

        // When
        boolean result = clusterConnectionService.userHasAccessToCluster(userId, clusterId);

        // Then
        assertTrue(result);
        verify(clusterConnectionRepository).findByAssignedUsersId(userId);
    }

    @Test
    void userHasAccessToCluster_NoAccess() {
        // Given
        when(clusterConnectionRepository.findByAssignedUsersId(userId)).thenReturn(Collections.emptyList());

        // When
        boolean result = clusterConnectionService.userHasAccessToCluster(userId, clusterId);

        // Then
        assertFalse(result);
        verify(clusterConnectionRepository).findByAssignedUsersId(userId);
    }

    @Test
    void clusterNameExists_True() {
        // Given
        when(clusterConnectionRepository.existsByNameIgnoreCase("test-cluster")).thenReturn(true);

        // When
        boolean result = clusterConnectionService.clusterNameExists("test-cluster");

        // Then
        assertTrue(result);
        verify(clusterConnectionRepository).existsByNameIgnoreCase("test-cluster");
    }

    @Test
    void clusterNameExists_False() {
        // Given
        when(clusterConnectionRepository.existsByNameIgnoreCase("nonexistent")).thenReturn(false);

        // When
        boolean result = clusterConnectionService.clusterNameExists("nonexistent");

        // Then
        assertFalse(result);
        verify(clusterConnectionRepository).existsByNameIgnoreCase("nonexistent");
    }
}