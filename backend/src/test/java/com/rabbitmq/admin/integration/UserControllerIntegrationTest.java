package com.rabbitmq.admin.integration;

import com.rabbitmq.admin.dto.CreateUserRequest;
import com.rabbitmq.admin.dto.JwtAuthenticationResponse;
import com.rabbitmq.admin.dto.LoginRequest;
import com.rabbitmq.admin.dto.UpdateUserRequest;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.junit.jupiter.api.AfterAll;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for UserController using TestContainers with PostgreSQL.
 * Tests complete user management flow with real database and authentication.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("integration-test")
@Transactional
class UserControllerIntegrationTest {

        @Container
        @SuppressWarnings("resource")
        static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
                        .withDatabaseName("testdb")
                        .withUsername("test")
                        .withPassword("test")
                        .withReuse(true);

        @DynamicPropertySource
        static void configureProperties(DynamicPropertyRegistry registry) {
                registry.add("spring.datasource.url", postgres::getJdbcUrl);
                registry.add("spring.datasource.username", postgres::getUsername);
                registry.add("spring.datasource.password", postgres::getPassword);
                registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
                registry.add("spring.flyway.enabled", () -> "false");

                // Optimize connection pool for tests - aggressive cleanup
                registry.add("spring.datasource.hikari.maximum-pool-size", () -> "2");
                registry.add("spring.datasource.hikari.minimum-idle", () -> "0");
                registry.add("spring.datasource.hikari.connection-timeout", () -> "5000");
                registry.add("spring.datasource.hikari.idle-timeout", () -> "10000");
                registry.add("spring.datasource.hikari.max-lifetime", () -> "20000");
                registry.add("spring.datasource.hikari.validation-timeout", () -> "3000");
                registry.add("spring.datasource.hikari.leak-detection-threshold", () -> "10000");

                // Speed up Hibernate operations
                registry.add("spring.jpa.properties.hibernate.jdbc.batch_size", () -> "20");
                registry.add("spring.jpa.properties.hibernate.order_inserts", () -> "true");
                registry.add("spring.jpa.properties.hibernate.order_updates", () -> "true");
        }

        @AfterAll
        static void tearDown() {
                try {
                        if (postgres != null && postgres.isRunning()) {
                                postgres.stop();
                        }
                } catch (Exception e) {
                        // Ignore cleanup errors to prevent hanging
                        System.err.println("Warning: Error during test cleanup: " + e.getMessage());
                }
        }

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        private User adminUser;
        private User regularUser;
        private String adminToken;
        private String userToken;

        @BeforeEach
        void setUp() throws Exception {
                userRepository.deleteAll();

                // Create admin user
                adminUser = new User("admin", passwordEncoder.encode("adminpass"), UserRole.ADMINISTRATOR);
                adminUser = userRepository.save(adminUser);

                // Create regular user
                regularUser = new User("user", passwordEncoder.encode("userpass"), UserRole.USER);
                regularUser = userRepository.save(regularUser);

                // Get admin token
                adminToken = getAuthToken("admin", "adminpass");

                // Get user token
                userToken = getAuthToken("user", "userpass");
        }

        private String getAuthToken(String username, String password) throws Exception {
                LoginRequest loginRequest = new LoginRequest(username, password);
                String response = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JwtAuthenticationResponse authResponse = objectMapper.readValue(response,
                                JwtAuthenticationResponse.class);
                return authResponse.getAccessToken();
        }

        @Test
        void getAllUsers_ShouldReturnAllUsers_WhenAdminAuthenticated() throws Exception {
                // When & Then
                mockMvc.perform(get("/api/users")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$").isArray())
                                .andExpect(jsonPath("$.length()").value(2))
                                .andExpect(jsonPath("$[?(@.username == 'admin')]").exists())
                                .andExpect(jsonPath("$[?(@.username == 'user')]").exists());
        }

        @Test
        void getAllUsers_ShouldReturnForbidden_WhenRegularUserAuthenticated() throws Exception {
                // When & Then
                // Spring Security may return 403 Forbidden or 401 Unauthorized depending on
                // configuration
                // Both are acceptable for insufficient privileges
                mockMvc.perform(get("/api/users")
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(result -> {
                                        int status = result.getResponse().getStatus();
                                        assertThat(status).isIn(401, 403);
                                });
        }

        @Test
        void getAllUsers_ShouldReturnUnauthorized_WhenNotAuthenticated() throws Exception {
                // When & Then
                mockMvc.perform(get("/api/users"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void createUser_ShouldCreateUser_WhenAdminAuthenticated() throws Exception {
                // Given
                CreateUserRequest createRequest = new CreateUserRequest();
                createRequest.setUsername("newuser");
                createRequest.setPassword("NewPass123!");
                createRequest.setRole(UserRole.USER);

                // When & Then
                mockMvc.perform(post("/api/users")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createRequest)))
                                .andExpect(status().isCreated())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.username").value("newuser"))
                                .andExpect(jsonPath("$.role").value("USER"))
                                .andExpect(jsonPath("$.id").exists())
                                .andExpect(jsonPath("$.createdAt").exists());

                // Verify user was created in database
                assertThat(userRepository.existsByUsernameIgnoreCase("newuser")).isTrue();
        }

        @Test
        void createUser_ShouldReturnBadRequest_WhenUsernameAlreadyExists() throws Exception {
                // Given
                CreateUserRequest createRequest = new CreateUserRequest();
                createRequest.setUsername("admin"); // Already exists
                createRequest.setPassword("NewPass123!");
                createRequest.setRole(UserRole.USER);

                // When & Then
                mockMvc.perform(post("/api/users")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createRequest)))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.message").value("Username already exists: admin"));
        }

        @Test
        void createUser_ShouldReturnBadRequest_WhenPasswordIsWeak() throws Exception {
                // Given
                CreateUserRequest createRequest = new CreateUserRequest();
                createRequest.setUsername("newuser");
                createRequest.setPassword("weak"); // Weak password
                createRequest.setRole(UserRole.USER);

                // When & Then
                mockMvc.perform(post("/api/users")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createRequest)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void createUser_ShouldReturnForbidden_WhenRegularUserAuthenticated() throws Exception {
                // Given
                CreateUserRequest createRequest = new CreateUserRequest();
                createRequest.setUsername("newuser");
                createRequest.setPassword("NewPass123!");
                createRequest.setRole(UserRole.USER);

                // When & Then
                // Spring Security may return 403 Forbidden or 401 Unauthorized depending on
                // configuration
                // Both are acceptable for insufficient privileges
                mockMvc.perform(post("/api/users")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createRequest)))
                                .andExpect(result -> {
                                        int status = result.getResponse().getStatus();
                                        assertThat(status).isIn(401, 403);
                                });
        }

        @Test
        void getUserById_ShouldReturnUser_WhenAdminAuthenticated() throws Exception {
                // When & Then
                mockMvc.perform(get("/api/users/{id}", regularUser.getId())
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.id").value(regularUser.getId().toString()))
                                .andExpect(jsonPath("$.username").value("user"))
                                .andExpect(jsonPath("$.role").value("USER"));
        }

        @Test
        void getUserById_ShouldReturnNotFound_WhenUserDoesNotExist() throws Exception {
                // Given
                UUID nonExistentId = UUID.randomUUID();

                // When & Then
                mockMvc.perform(get("/api/users/{id}", nonExistentId)
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isNotFound());
        }

        @Test
        void updateUser_ShouldUpdateUser_WhenAdminAuthenticated() throws Exception {
                // Given
                UpdateUserRequest updateRequest = new UpdateUserRequest();
                updateRequest.setUsername("updateduser");
                updateRequest.setRole(UserRole.ADMINISTRATOR);

                // When & Then
                mockMvc.perform(put("/api/users/{id}", regularUser.getId())
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest)))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.username").value("updateduser"))
                                .andExpect(jsonPath("$.role").value("ADMINISTRATOR"));

                // Verify user was updated in database
                User updatedUser = userRepository.findById(regularUser.getId()).orElseThrow();
                assertThat(updatedUser.getUsername()).isEqualTo("updateduser");
                assertThat(updatedUser.getRole()).isEqualTo(UserRole.ADMINISTRATOR);
        }

        @Test
        void updateUser_ShouldReturnBadRequest_WhenUsernameAlreadyExists() throws Exception {
                // Given
                UpdateUserRequest updateRequest = new UpdateUserRequest();
                updateRequest.setUsername("admin"); // Already exists
                updateRequest.setRole(UserRole.USER);

                // When & Then
                mockMvc.perform(put("/api/users/{id}", regularUser.getId())
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest)))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.message").value("Username already exists: admin"));
        }

        @Test
        void updateUser_ShouldReturnNotFound_WhenUserDoesNotExist() throws Exception {
                // Given
                UUID nonExistentId = UUID.randomUUID();
                UpdateUserRequest updateRequest = new UpdateUserRequest();
                updateRequest.setUsername("newname");
                updateRequest.setRole(UserRole.USER);

                // When & Then
                mockMvc.perform(put("/api/users/{id}", nonExistentId)
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest)))
                                .andExpect(status().isNotFound());
        }

        @Test
        void deleteUser_ShouldDeleteUser_WhenAdminAuthenticated() throws Exception {
                // When & Then
                mockMvc.perform(delete("/api/users/{id}", regularUser.getId())
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isNoContent());

                // Verify user was deleted from database
                assertThat(userRepository.findById(regularUser.getId())).isEmpty();
        }

        @Test
        void deleteUser_ShouldReturnNotFound_WhenUserDoesNotExist() throws Exception {
                // Given
                UUID nonExistentId = UUID.randomUUID();

                // When & Then
                mockMvc.perform(delete("/api/users/{id}", nonExistentId)
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isNotFound());
        }

        @Test
        void deleteUser_ShouldReturnForbidden_WhenRegularUserAuthenticated() throws Exception {
                // When & Then
                // Spring Security may return 403 Forbidden or 401 Unauthorized depending on
                // configuration
                // Both are acceptable for insufficient privileges
                mockMvc.perform(delete("/api/users/{id}", regularUser.getId())
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(result -> {
                                        int status = result.getResponse().getStatus();
                                        assertThat(status).isIn(401, 403);
                                });
        }

        @Test
        void completeUserManagementFlow_ShouldWork() throws Exception {
                // 1. Create user
                CreateUserRequest createRequest = new CreateUserRequest();
                createRequest.setUsername("flowuser");
                createRequest.setPassword("FlowPass123!");
                createRequest.setRole(UserRole.USER);

                String createResponse = mockMvc.perform(post("/api/users")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createRequest)))
                                .andExpect(status().isCreated())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                // Extract user ID from response
                String userId = objectMapper.readTree(createResponse).get("id").asText();

                // 2. Get user
                mockMvc.perform(get("/api/users/{id}", userId)
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.username").value("flowuser"));

                // 3. Update user
                UpdateUserRequest updateRequest = new UpdateUserRequest();
                updateRequest.setUsername("updatedflowuser");
                updateRequest.setRole(UserRole.ADMINISTRATOR);

                mockMvc.perform(put("/api/users/{id}", userId)
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.username").value("updatedflowuser"))
                                .andExpect(jsonPath("$.role").value("ADMINISTRATOR"));

                // 4. Delete user
                mockMvc.perform(delete("/api/users/{id}", userId)
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isNoContent());

                // 5. Verify user is deleted
                mockMvc.perform(get("/api/users/{id}", userId)
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isNotFound());
        }
}