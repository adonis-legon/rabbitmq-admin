package com.rabbitmq.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.dto.ConnectionTestResponse;
import com.rabbitmq.admin.dto.CreateClusterConnectionRequest;
import com.rabbitmq.admin.dto.UpdateClusterConnectionRequest;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.service.ClusterConnectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.HashSet;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for ClusterController.
 */
@WebMvcTest(controllers = ClusterController.class, excludeAutoConfiguration = {
                org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
})
@ActiveProfiles("test")
class ClusterControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private ClusterConnectionService clusterConnectionService;

        @MockitoBean
        private com.rabbitmq.admin.security.JwtTokenProvider jwtTokenProvider;

        @MockitoBean
        private com.rabbitmq.admin.security.CustomUserDetailsService customUserDetailsService;

        @Autowired
        private ObjectMapper objectMapper;

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
        void getAllClusterConnections_Success() throws Exception {
                // Given
                when(clusterConnectionService.getAllClusterConnections()).thenReturn(Arrays.asList(testCluster));

                // When & Then
                mockMvc.perform(get("/api/clusters"))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$").isArray())
                                .andExpect(jsonPath("$[0].id").value(clusterId.toString()))
                                .andExpect(jsonPath("$[0].name").value("test-cluster"))
                                .andExpect(jsonPath("$[0].apiUrl").value("http://localhost:15672"))
                                .andExpect(jsonPath("$[0].username").value("admin"))
                                .andExpect(jsonPath("$[0].active").value(true));

                verify(clusterConnectionService).getAllClusterConnections();
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void getClusterConnectionById_Success() throws Exception {
                // Given
                when(clusterConnectionService.getClusterConnectionById(clusterId)).thenReturn(testCluster);

                // When & Then
                mockMvc.perform(get("/api/clusters/{id}", clusterId))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.id").value(clusterId.toString()))
                                .andExpect(jsonPath("$.name").value("test-cluster"));

                verify(clusterConnectionService).getClusterConnectionById(clusterId);
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void createClusterConnection_Success() throws Exception {
                // Given
                CreateClusterConnectionRequest request = new CreateClusterConnectionRequest(
                                "new-cluster", "http://localhost:15673", "admin", "password");
                request.setDescription("New cluster");
                request.setActive(true);

                when(clusterConnectionService.createClusterConnection(anyString(), anyString(), anyString(),
                                anyString(), anyString(), anyBoolean())).thenReturn(testCluster);

                // When & Then
                mockMvc.perform(post("/api/clusters")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.name").value("test-cluster"));

                verify(clusterConnectionService).createClusterConnection(
                                "new-cluster", "http://localhost:15673", "admin", "password", "New cluster", true);
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void createClusterConnection_InvalidRequest() throws Exception {
                // Given
                CreateClusterConnectionRequest request = new CreateClusterConnectionRequest();
                // Missing required fields

                // When & Then
                mockMvc.perform(post("/api/clusters")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());

                verify(clusterConnectionService, never()).createClusterConnection(
                                anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean());
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void updateClusterConnection_Success() throws Exception {
                // Given
                UpdateClusterConnectionRequest request = new UpdateClusterConnectionRequest();
                request.setName("updated-cluster");
                request.setActive(false);

                ClusterConnection updatedCluster = new ClusterConnection("updated-cluster", "http://localhost:15672",
                                "admin", "password");
                updatedCluster.setId(clusterId);
                updatedCluster.setActive(false);
                updatedCluster.setAssignedUsers(new HashSet<>()); // Initialize assignedUsers to avoid NPE
                when(clusterConnectionService.updateClusterConnection(eq(clusterId), anyString(), any(),
                                any(), any(), any(), anyBoolean())).thenReturn(updatedCluster);

                // When & Then
                mockMvc.perform(put("/api/clusters/{id}", clusterId)
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON));

                verify(clusterConnectionService).updateClusterConnection(
                                clusterId, "updated-cluster", null, null, null, null, false);
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void deleteClusterConnection_Success() throws Exception {
                // When & Then
                mockMvc.perform(delete("/api/clusters/{id}", clusterId)
                                .with(csrf()))
                                .andExpect(status().isNoContent());

                verify(clusterConnectionService).deleteClusterConnection(clusterId);
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void testConnection_Success() throws Exception {
                // Given
                ConnectionTestResponse testResponse = ConnectionTestResponse.success("Connection successful", 100);
                when(clusterConnectionService.testConnection(anyString(), anyString(), anyString()))
                                .thenReturn(testResponse);

                String requestBody = """
                                {
                                    "apiUrl": "http://localhost:15672",
                                    "username": "admin",
                                    "password": "password"
                                }
                                """;

                // When & Then
                mockMvc.perform(post("/api/clusters/test")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.successful").value(true))
                                .andExpect(jsonPath("$.message").value("Connection successful"))
                                .andExpect(jsonPath("$.responseTimeMs").value(100));

                verify(clusterConnectionService).testConnection("http://localhost:15672", "admin", "password");
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void testClusterConnection_Success() throws Exception {
                // Given
                ConnectionTestResponse testResponse = ConnectionTestResponse.success("Connection successful", 150);
                when(clusterConnectionService.testClusterConnection(clusterId)).thenReturn(testResponse);

                // When & Then
                mockMvc.perform(post("/api/clusters/{id}/test", clusterId)
                                .with(csrf()))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.successful").value(true))
                                .andExpect(jsonPath("$.responseTimeMs").value(150));

                verify(clusterConnectionService).testClusterConnection(clusterId);
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void assignUserToCluster_Success() throws Exception {
                // When & Then
                mockMvc.perform(post("/api/clusters/{clusterId}/users/{userId}", clusterId, userId)
                                .with(csrf()))
                                .andExpect(status().isOk());

                verify(clusterConnectionService).assignUserToCluster(clusterId, userId);
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void removeUserFromCluster_Success() throws Exception {
                // When & Then
                mockMvc.perform(delete("/api/clusters/{clusterId}/users/{userId}", clusterId, userId)
                                .with(csrf()))
                                .andExpect(status().isOk());

                verify(clusterConnectionService).removeUserFromCluster(clusterId, userId);
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void getUsersAssignedToCluster_Success() throws Exception {
                // Given
                when(clusterConnectionService.getUsersAssignedToCluster(clusterId)).thenReturn(Arrays.asList(testUser));

                // When & Then
                mockMvc.perform(get("/api/clusters/{clusterId}/users", clusterId))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$").isArray())
                                .andExpect(jsonPath("$[0].id").value(userId.toString()))
                                .andExpect(jsonPath("$[0].username").value("testuser"));

                verify(clusterConnectionService).getUsersAssignedToCluster(clusterId);
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void checkClusterNameExists_True() throws Exception {
                // Given
                when(clusterConnectionService.clusterNameExists("test-cluster")).thenReturn(true);

                // When & Then
                mockMvc.perform(get("/api/clusters/exists/{name}", "test-cluster"))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$").value(true));

                verify(clusterConnectionService).clusterNameExists("test-cluster");
        }

        @Test
        @WithMockUser(roles = "ADMINISTRATOR")
        void getActiveClusterConnections_Success() throws Exception {
                // Given
                when(clusterConnectionService.getActiveClusterConnections()).thenReturn(Arrays.asList(testCluster));

                // When & Then
                mockMvc.perform(get("/api/clusters/active"))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$").isArray())
                                .andExpect(jsonPath("$[0].active").value(true));

                verify(clusterConnectionService).getActiveClusterConnections();
        }
}