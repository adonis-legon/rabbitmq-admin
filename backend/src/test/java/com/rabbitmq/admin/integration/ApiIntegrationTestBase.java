package com.rabbitmq.admin.integration;

import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.util.UUID;

/**
 * Base class for API integration tests using TestContainers with PostgreSQL.
 * 
 * This base class provides:
 * - PostgreSQL container setup with TestContainers
 * - Common test user creation and authentication setup
 * - Database configuration for integration testing
 * 
 * Note: This class is NOT annotated with @Transactional since API tests with
 * RANDOM_PORT need committed data to work with the embedded web server.
 */
@Testcontainers
@SpringBootTest
@ActiveProfiles("integration-test")
public abstract class ApiIntegrationTestBase {

    @Container
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpass")
            .withStartupTimeout(Duration.ofMinutes(2));

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    // Test user credentials - using same as IntegrationTestBase for consistency
    protected final String testUserUsername = "testuser";
    protected final String testUserPassword = "TestUserPass123!";
    protected final String testAdminUsername = "adminuser";
    protected final String testAdminPassword = "AdminUserPass123!";

    protected UUID testUserId;
    protected UUID testAdminId;

    @BeforeEach
    void setUpTestUsers() {
        // Clear any existing test data first
        userRepository.deleteAll();

        // Create test users (data will be committed since no @Transactional)
        User testUser = new User(testUserUsername, passwordEncoder.encode(testUserPassword), UserRole.USER);
        User adminUser = new User(testAdminUsername, passwordEncoder.encode(testAdminPassword), UserRole.ADMINISTRATOR);

        testUserId = userRepository.save(testUser).getId();
        testAdminId = userRepository.save(adminUser).getId();
    }
}