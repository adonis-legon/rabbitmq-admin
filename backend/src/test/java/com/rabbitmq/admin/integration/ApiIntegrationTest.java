package com.rabbitmq.admin.integration;

import com.rabbitmq.admin.dto.CreateUserRequest;
import com.rabbitmq.admin.dto.JwtAuthenticationResponse;
import com.rabbitmq.admin.dto.LoginRequest;
import com.rabbitmq.admin.dto.UserInfo;
import com.rabbitmq.admin.dto.UserResponse;
import com.rabbitmq.admin.model.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for API endpoints using TestContainers with PostgreSQL.
 * Tests complete API functionality with real database and authentication.
 * Note: No @Transactional at class level for web-based tests with RANDOM_PORT
 * since they need committed data to work with the embedded web server.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiIntegrationTest extends ApiIntegrationTestBase {

        @Autowired
        private TestRestTemplate restTemplate;

        @Test
        void completeAuthenticationFlow_ShouldWork() throws Exception {
                // The admin user is already created by IntegrationTestBase
                // Use the admin credentials from the base class

                // 2. Login as admin
                LoginRequest loginRequest = new LoginRequest(testAdminUsername, testAdminPassword);
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<LoginRequest> loginEntity = new HttpEntity<>(loginRequest, headers);

                ResponseEntity<JwtAuthenticationResponse> loginResponse = restTemplate.postForEntity(
                                "/api/auth/login", loginEntity, JwtAuthenticationResponse.class);

                assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
                assertThat(loginResponse.getBody()).isNotNull();

                JwtAuthenticationResponse loginBody = Objects.requireNonNull(loginResponse.getBody());
                assertThat(loginBody.getAccessToken()).isNotNull();
                assertThat(loginBody.getUser().getUsername()).isEqualTo(testAdminUsername);
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
                assertThat(meBody.getUsername()).isEqualTo(testAdminUsername);
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
                // Try to login with existing user but wrong password
                LoginRequest loginRequest = new LoginRequest(testUserUsername, "wrongpassword");
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