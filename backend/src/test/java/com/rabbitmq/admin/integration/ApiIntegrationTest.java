package com.rabbitmq.admin.integration;

import com.rabbitmq.admin.dto.CreateUserRequest;
import com.rabbitmq.admin.dto.JwtAuthenticationResponse;
import com.rabbitmq.admin.dto.LoginRequest;
import com.rabbitmq.admin.dto.UserInfo;
import com.rabbitmq.admin.dto.UserResponse;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.junit.jupiter.api.AfterAll;

import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for API endpoints using TestContainers with PostgreSQL.
 * Tests complete API functionality with real database and authentication.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("integration-test")
class ApiIntegrationTest {

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
        private TestRestTemplate restTemplate;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @BeforeEach
        void setUp() {
                userRepository.deleteAll();
        }

        @Test
        void completeAuthenticationFlow_ShouldWork() throws Exception {
                // 1. Create initial admin user and commit to database
                User adminUser = new User("admin", passwordEncoder.encode("AdminPass123!"), UserRole.ADMINISTRATOR);
                userRepository.saveAndFlush(adminUser);

                // 2. Login as admin
                LoginRequest loginRequest = new LoginRequest("admin", "AdminPass123!");
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<LoginRequest> loginEntity = new HttpEntity<>(loginRequest, headers);

                ResponseEntity<JwtAuthenticationResponse> loginResponse = restTemplate.postForEntity(
                                "/api/auth/login", loginEntity, JwtAuthenticationResponse.class);

                assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
                assertThat(loginResponse.getBody()).isNotNull();

                JwtAuthenticationResponse loginBody = Objects.requireNonNull(loginResponse.getBody());
                assertThat(loginBody.getAccessToken()).isNotNull();
                assertThat(loginBody.getUser().getUsername()).isEqualTo("admin");
                assertThat(loginBody.getUser().getRole()).isEqualTo(UserRole.ADMINISTRATOR);

                String adminToken = loginBody.getAccessToken();

                // 3. Access protected endpoint
                HttpHeaders authHeaders = new HttpHeaders();
                authHeaders.setBearerAuth(adminToken);
                HttpEntity<Void> authEntity = new HttpEntity<>(authHeaders);

                ResponseEntity<UserInfo> meResponse = restTemplate.exchange(
                                "/api/auth/me", HttpMethod.GET, authEntity, UserInfo.class);

                assertThat(meResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
                assertThat(meResponse.getBody()).isNotNull();
                UserInfo meBody = Objects.requireNonNull(meResponse.getBody());
                assertThat(meBody.getUsername()).isEqualTo("admin");
                assertThat(meBody.getRole()).isEqualTo(UserRole.ADMINISTRATOR);

                // 4. Create new user
                CreateUserRequest createUserRequest = new CreateUserRequest();
                createUserRequest.setUsername("newuser");
                createUserRequest.setPassword("NewUserPass123!");
                createUserRequest.setRole(UserRole.USER);

                HttpHeaders createHeaders = new HttpHeaders();
                createHeaders.setContentType(MediaType.APPLICATION_JSON);
                createHeaders.setBearerAuth(adminToken);
                HttpEntity<CreateUserRequest> createEntity = new HttpEntity<>(createUserRequest, createHeaders);

                ResponseEntity<UserResponse> createResponse = restTemplate.postForEntity(
                                "/api/users", createEntity, UserResponse.class);

                assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
                assertThat(createResponse.getBody()).isNotNull();
                UserResponse createBody = Objects.requireNonNull(createResponse.getBody());
                assertThat(createBody.getUsername()).isEqualTo("newuser");
                assertThat(createBody.getRole()).isEqualTo(UserRole.USER);

                // 5. New user should be able to login
                LoginRequest newUserLogin = new LoginRequest("newuser", "NewUserPass123!");
                HttpEntity<LoginRequest> newUserEntity = new HttpEntity<>(newUserLogin, headers);

                ResponseEntity<JwtAuthenticationResponse> newUserResponse = restTemplate.postForEntity(
                                "/api/auth/login", newUserEntity, JwtAuthenticationResponse.class);

                assertThat(newUserResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
                assertThat(newUserResponse.getBody()).isNotNull();
                JwtAuthenticationResponse newUserBody = Objects.requireNonNull(newUserResponse.getBody());
                assertThat(newUserBody.getUser().getUsername()).isEqualTo("newuser");
                assertThat(newUserBody.getUser().getRole()).isEqualTo(UserRole.USER);

                // 6. Logout
                ResponseEntity<String> logoutResponse = restTemplate.exchange(
                                "/api/auth/logout", HttpMethod.POST, authEntity, String.class);

                assertThat(logoutResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        void login_ShouldReturnUnauthorized_WhenCredentialsAreInvalid() throws Exception {
                // Create a user first
                User user = new User("testuser", passwordEncoder.encode("correctpassword"), UserRole.USER);
                userRepository.saveAndFlush(user);

                // Try to login with wrong password
                LoginRequest loginRequest = new LoginRequest("testuser", "wrongpassword");
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<LoginRequest> loginEntity = new HttpEntity<>(loginRequest, headers);

                ResponseEntity<JwtAuthenticationResponse> response = restTemplate.postForEntity(
                                "/api/auth/login", loginEntity, JwtAuthenticationResponse.class);

                assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        void login_ShouldReturnUnauthorized_WhenUserDoesNotExist() throws Exception {
                LoginRequest loginRequest = new LoginRequest("nonexistent", "password");
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<LoginRequest> loginEntity = new HttpEntity<>(loginRequest, headers);

                ResponseEntity<JwtAuthenticationResponse> response = restTemplate.postForEntity(
                                "/api/auth/login", loginEntity, JwtAuthenticationResponse.class);

                assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }
}