package com.rabbitmq.admin.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.dto.LoginRequest;
import com.rabbitmq.admin.dto.CreateUserRequest;
import com.rabbitmq.admin.dto.JwtAuthenticationResponse;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.repository.UserRepository;
import com.rabbitmq.admin.service.UserService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base class for integration tests with TestContainers configuration.
 * Provides common setup for PostgreSQL database integration tests.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("integration-test")
@Transactional
public abstract class IntegrationTestBase {

    @Container
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test")
            .withReuse(false) // Disable reuse for CI stability
            .withStartupTimeout(Duration.ofMinutes(5))
            .withConnectTimeoutSeconds(60);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.flyway.enabled", () -> "false");

        // Optimize connection pool for tests
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> "4");
        registry.add("spring.datasource.hikari.minimum-idle", () -> "1");
        registry.add("spring.datasource.hikari.connection-timeout", () -> "20000");
        registry.add("spring.datasource.hikari.idle-timeout", () -> "300000");
        registry.add("spring.datasource.hikari.max-lifetime", () -> "600000");
        registry.add("spring.datasource.hikari.validation-timeout", () -> "5000");
        registry.add("spring.datasource.hikari.leak-detection-threshold", () -> "60000");
        registry.add("spring.datasource.hikari.auto-commit", () -> "false");

        // Speed up Hibernate operations
        registry.add("spring.jpa.properties.hibernate.jdbc.batch_size", () -> "20");
        registry.add("spring.jpa.properties.hibernate.order_inserts", () -> "true");
        registry.add("spring.jpa.properties.hibernate.order_updates", () -> "true");
        registry.add("spring.jpa.properties.hibernate.connection.provider_disables_autocommit", () -> "true");
        registry.add("spring.jpa.properties.hibernate.connection.autocommit", () -> "false");
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected UserService userService;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected ObjectMapper objectMapper;

    // Test user data
    protected String testUserUsername = "testuser";
    protected String testUserPassword = "TestPassword123!";
    protected String testAdminUsername = "adminuser";
    protected String testAdminPassword = "AdminPassword123!";
    protected UUID testUserId;
    protected UUID testAdminId;
    protected String authToken;
    protected String adminToken;

    @BeforeEach
    void setUpTestData() {
        // Clean up any existing data
        userRepository.deleteAll();

        // Create test users
        createTestUsers();

        // Generate auth tokens
        try {
            authToken = getAuthToken(testUserUsername, testUserPassword);
            adminToken = getAuthToken(testAdminUsername, testAdminPassword);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate auth tokens", e);
        }
    }

    private void createTestUsers() {
        // Create regular test user
        User testUser = new User();
        testUser.setUsername(testUserUsername);
        testUser.setPasswordHash(passwordEncoder.encode(testUserPassword));
        testUser.setRole(UserRole.USER);
        testUser = userRepository.save(testUser);
        testUserId = testUser.getId();

        // Create admin test user
        User adminUser = new User();
        adminUser.setUsername(testAdminUsername);
        adminUser.setPasswordHash(passwordEncoder.encode(testAdminPassword));
        adminUser.setRole(UserRole.ADMINISTRATOR);
        adminUser = userRepository.save(adminUser);
        testAdminId = adminUser.getId();
    }

    protected String getAuthToken(String username, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(username);
        loginRequest.setPassword(password);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        JwtAuthenticationResponse loginResponse = objectMapper.readValue(responseBody, JwtAuthenticationResponse.class);
        return loginResponse.getAccessToken();
    }

    protected CreateUserRequest createUserRequest(String username, String password, UserRole role) {
        CreateUserRequest userRequest = new CreateUserRequest();
        userRequest.setUsername(username);
        userRequest.setPassword(password);
        userRequest.setRole(role);
        return userRequest;
    }

    @BeforeAll
    static void setUp() {
        // Ensure container is started
        if (!postgres.isRunning()) {
            postgres.start();
        }
    }

    @AfterAll
    static void tearDown() {
        try {
            if (postgres != null && postgres.isRunning()) {
                postgres.stop();
            }
        } catch (Exception e) {
            // Log but don't fail on cleanup errors
            System.err.println("Warning: Error during test cleanup: " + e.getMessage());
        }
    }
}