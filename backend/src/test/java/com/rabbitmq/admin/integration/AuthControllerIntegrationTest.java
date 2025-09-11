package com.rabbitmq.admin.integration;

import com.rabbitmq.admin.dto.JwtAuthenticationResponse;
import com.rabbitmq.admin.dto.LoginRequest;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AuthController using TestContainers with PostgreSQL.
 * Tests complete authentication flow with real database.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("integration-test")
@Transactional
class AuthControllerIntegrationTest {

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

        private User testUser;

        @BeforeEach
        void setUp() {
                userRepository.deleteAll();

                // Create test user
                testUser = new User("testuser", passwordEncoder.encode("password123"), UserRole.USER);
                testUser = userRepository.save(testUser);
        }

        @Test
        void login_ShouldReturnJwtToken_WhenCredentialsAreValid() throws Exception {
                // Given
                LoginRequest loginRequest = new LoginRequest("testuser", "password123");

                // When & Then
                String response = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.accessToken").exists())
                                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                                .andExpect(jsonPath("$.user.username").value("testuser"))
                                .andExpect(jsonPath("$.user.role").value("USER"))
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JwtAuthenticationResponse authResponse = objectMapper.readValue(response,
                                JwtAuthenticationResponse.class);
                assertThat(authResponse.getAccessToken()).isNotBlank();
                assertThat(authResponse.getUser().getUsername()).isEqualTo("testuser");
        }

        @Test
        void login_ShouldReturnUnauthorized_WhenCredentialsAreInvalid() throws Exception {
                // Given
                LoginRequest loginRequest = new LoginRequest("testuser", "wrongpassword");

                // When & Then
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void login_ShouldReturnUnauthorized_WhenUserDoesNotExist() throws Exception {
                // Given
                LoginRequest loginRequest = new LoginRequest("nonexistent", "password123");

                // When & Then
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void login_ShouldReturnBadRequest_WhenRequestIsInvalid() throws Exception {
                // Given - empty username
                LoginRequest loginRequest = new LoginRequest("", "password123");

                // When & Then
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void me_ShouldReturnUserInfo_WhenAuthenticated() throws Exception {
                // Given - login first to get token
                LoginRequest loginRequest = new LoginRequest("testuser", "password123");
                String loginResponse = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JwtAuthenticationResponse authResponse = objectMapper.readValue(loginResponse,
                                JwtAuthenticationResponse.class);
                String token = authResponse.getAccessToken();

                // When & Then
                mockMvc.perform(get("/api/auth/me")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.username").value("testuser"))
                                .andExpect(jsonPath("$.role").value("USER"))
                                .andExpect(jsonPath("$.id").exists());
        }

        @Test
        void me_ShouldReturnUnauthorized_WhenNotAuthenticated() throws Exception {
                // When & Then
                mockMvc.perform(get("/api/auth/me"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void me_ShouldReturnUnauthorized_WhenTokenIsInvalid() throws Exception {
                // When & Then
                mockMvc.perform(get("/api/auth/me")
                                .header("Authorization", "Bearer invalid-token"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void logout_ShouldReturnOk_WhenAuthenticated() throws Exception {
                // Given - login first to get token
                LoginRequest loginRequest = new LoginRequest("testuser", "password123");
                String loginResponse = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JwtAuthenticationResponse authResponse = objectMapper.readValue(loginResponse,
                                JwtAuthenticationResponse.class);
                String token = authResponse.getAccessToken();

                // When & Then
                mockMvc.perform(post("/api/auth/logout")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Logged out successfully"));
        }

        @Test
        void logout_ShouldReturnUnauthorized_WhenNotAuthenticated() throws Exception {
                // When & Then
                mockMvc.perform(post("/api/auth/logout"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void completeAuthenticationFlow_ShouldWork() throws Exception {
                // 1. Login
                LoginRequest loginRequest = new LoginRequest("testuser", "password123");
                String loginResponse = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                JwtAuthenticationResponse authResponse = objectMapper.readValue(loginResponse,
                                JwtAuthenticationResponse.class);
                String token = authResponse.getAccessToken();

                // 2. Access protected endpoint
                mockMvc.perform(get("/api/auth/me")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.username").value("testuser"));

                // 3. Logout
                mockMvc.perform(post("/api/auth/logout")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk());

                // Note: In a stateless JWT implementation, the token would still be valid
                // until expiration. In a production system, you might implement token
                // blacklisting.
        }

        @Test
        void login_ShouldWorkWithAdministratorUser() throws Exception {
                // Given - create admin user
                User adminUser = new User("admin", passwordEncoder.encode("adminpass"), UserRole.ADMINISTRATOR);
                userRepository.save(adminUser);

                LoginRequest loginRequest = new LoginRequest("admin", "adminpass");

                // When & Then
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.accessToken").exists())
                                .andExpect(jsonPath("$.user.username").value("admin"))
                                .andExpect(jsonPath("$.user.role").value("ADMINISTRATOR"));
        }
}