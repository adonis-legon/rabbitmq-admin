package com.rabbitmq.admin.security;

import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.repository.UserRepository;
import com.rabbitmq.admin.service.UserService;
import com.rabbitmq.admin.service.ClusterConnectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Spring Security configuration.
 * Tests authentication, authorization, and security filters.
 */
@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
class SecurityConfigTest {

        @Autowired
        private WebApplicationContext context;

        @Autowired
        private JwtTokenProvider jwtTokenProvider;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @MockitoBean
        private UserRepository userRepository;

        @MockitoBean
        private UserService userService;

        @MockitoBean
        private ClusterConnectionService clusterConnectionService;

        private MockMvc mockMvc;
        private User testUser;
        private User adminUser;

        @BeforeEach
        void setUp() {
                mockMvc = MockMvcBuilders
                                .webAppContextSetup(context)
                                .apply(springSecurity())
                                .build();

                // Create test users
                testUser = new User();
                testUser.setId(UUID.randomUUID());
                testUser.setUsername("testuser");
                testUser.setPasswordHash(passwordEncoder.encode("password123"));
                testUser.setRole(UserRole.USER);
                testUser.setCreatedAt(LocalDateTime.now());

                adminUser = new User();
                adminUser.setId(UUID.randomUUID());
                adminUser.setUsername("admin");
                adminUser.setPasswordHash(passwordEncoder.encode("admin123"));
                adminUser.setRole(UserRole.ADMINISTRATOR);
                adminUser.setCreatedAt(LocalDateTime.now());

                // Mock cluster service to throw exception for non-existent cluster
                UUID nonExistentClusterId = UUID.fromString("00000000-0000-0000-0000-000000000000");
                when(clusterConnectionService.getClusterConnectionById(nonExistentClusterId))
                                .thenThrow(new IllegalArgumentException(
                                                "Cluster connection not found with ID: " + nonExistentClusterId));

                // Also mock userHasAccessToCluster to return false for any user/cluster
                // combination
                when(clusterConnectionService.userHasAccessToCluster(any(UUID.class), eq(nonExistentClusterId)))
                                .thenReturn(false);
        }

        @Test
        void publicEndpoints_ShouldBeAccessibleWithoutAuthentication() throws Exception {
                mockMvc.perform(get("/actuator/health"))
                                .andExpect(status().isOk());

                mockMvc.perform(get("/actuator/info"))
                                .andExpect(status().isOk());
        }

        @Test
        void staticResources_ShouldBeAccessibleWithoutAuthentication() throws Exception {
                mockMvc.perform(get("/"))
                                .andExpect(status().isOk());

                mockMvc.perform(get("/index.html"))
                                .andExpect(status().isOk());
        }

        @Test
        void protectedEndpoints_WithoutToken_ShouldReturn401() throws Exception {
                mockMvc.perform(get("/api/users"))
                                .andExpect(status().isUnauthorized())
                                .andExpect(content().contentType("application/json"));

                mockMvc.perform(get("/api/clusters"))
                                .andExpect(status().isUnauthorized());

                mockMvc.perform(get("/api/rabbitmq/test-cluster/overview"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void protectedEndpoints_WithInvalidToken_ShouldReturn401() throws Exception {
                mockMvc.perform(get("/api/users")
                                .header("Authorization", "Bearer invalid.jwt.token"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void adminEndpoints_WithUserToken_ShouldReturn403() throws Exception {
                // Mock user repository
                when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

                String userToken = jwtTokenProvider.generateTokenFromUser(testUser);

                mockMvc.perform(get("/api/users")
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isForbidden());

                mockMvc.perform(get("/api/clusters")
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isForbidden());
        }

        @Test
        void adminEndpoints_WithAdminToken_ShouldBeAccessible() throws Exception {
                // Mock user repository and service
                when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
                when(userService.getAllUsers()).thenReturn(List.of(testUser, adminUser));

                String adminToken = jwtTokenProvider.generateTokenFromUser(adminUser);

                // UserController is now implemented, should return 200 OK
                mockMvc.perform(get("/api/users")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk());

                // ClusterController is implemented, should return 200
                mockMvc.perform(get("/api/clusters")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk());
        }

        @Test
        void userEndpoints_WithValidUserToken_ShouldBeAccessible() throws Exception {
                // Mock user repository
                when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

                String userToken = jwtTokenProvider.generateTokenFromUser(testUser);

                // Test that the user can access the endpoint (authentication works)
                // The specific response depends on cluster validation, but it should not be
                // 401/403
                mockMvc.perform(get("/api/rabbitmq/00000000-0000-0000-0000-000000000000/overview")
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(result -> {
                                        int status = result.getResponse().getStatus();
                                        // Should not be unauthorized (401) or forbidden (403)
                                        // Could be 400 (bad request) if cluster not found, or other status
                                        if (status == 401 || status == 403) {
                                                throw new AssertionError("Expected non-auth error but got: " + status);
                                        }
                                });
        }

        @Test
        void userEndpoints_WithValidAdminToken_ShouldBeAccessible() throws Exception {
                // Mock user repository
                when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));

                String adminToken = jwtTokenProvider.generateTokenFromUser(adminUser);

                // Test that the admin can access the endpoint (authentication works)
                // The specific response depends on cluster validation, but it should not be
                // 401/403
                mockMvc.perform(get("/api/rabbitmq/00000000-0000-0000-0000-000000000000/overview")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(result -> {
                                        int status = result.getResponse().getStatus();
                                        // Should not be unauthorized (401) or forbidden (403)
                                        // Could be 400 (bad request) if cluster not found, or other status
                                        if (status == 401 || status == 403) {
                                                throw new AssertionError("Expected non-auth error but got: " + status);
                                        }
                                });
        }

        @Test
        void corsConfiguration_ShouldAllowCrossOriginRequests() throws Exception {
                mockMvc.perform(get("/actuator/health")
                                .header("Origin", "http://localhost:3000"))
                                .andExpect(status().isOk())
                                .andExpect(header().exists("Access-Control-Allow-Origin"));
        }

        @Test
        void optionsRequest_ShouldReturnCorsHeaders() throws Exception {
                mockMvc.perform(options("/api/auth/login")
                                .header("Origin", "http://localhost:3000")
                                .header("Access-Control-Request-Method", "POST")
                                .header("Access-Control-Request-Headers", "Content-Type"))
                                .andExpect(status().isOk())
                                .andExpect(header().exists("Access-Control-Allow-Origin"))
                                .andExpect(header().exists("Access-Control-Allow-Methods"))
                                .andExpect(header().exists("Access-Control-Allow-Headers"));
        }
}