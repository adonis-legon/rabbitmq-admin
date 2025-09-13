package com.rabbitmq.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.dto.CreateUserRequest;
import com.rabbitmq.admin.dto.UpdateUserRequest;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.security.CustomUserDetailsService;
import com.rabbitmq.admin.security.JwtTokenProvider;
import com.rabbitmq.admin.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for UserController.
 */
@WebMvcTest(controllers = UserController.class, excludeAutoConfiguration = {
                org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
})
@ActiveProfiles("test")
class UserControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockitoBean
        private UserService userService;

        @MockitoBean
        private JwtTokenProvider jwtTokenProvider;

        @MockitoBean
        private CustomUserDetailsService customUserDetailsService;

        private User adminUser;
        private User regularUser;

        @BeforeEach
        void setUp() {
                // Create test users
                adminUser = new User("admin", "hashedPassword", UserRole.ADMINISTRATOR);
                adminUser.setId(UUID.randomUUID());
                adminUser.setCreatedAt(LocalDateTime.now());

                regularUser = new User("user", "hashedPassword", UserRole.USER);
                regularUser.setId(UUID.randomUUID());
                regularUser.setCreatedAt(LocalDateTime.now());
        }

        @Test
        void getAllUsers_ShouldReturnAllUsers() throws Exception {
                // Given
                when(userService.getAllUsers()).thenReturn(List.of(adminUser, regularUser));

                // When & Then
                mockMvc.perform(get("/api/users"))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$", hasSize(2)))
                                .andExpect(jsonPath("$[*].username", containsInAnyOrder("admin", "user")))
                                .andExpect(jsonPath("$[*].role", containsInAnyOrder("ADMINISTRATOR", "USER")));
        }

        @Test
        void getUserById_WithValidId_ShouldReturnUser() throws Exception {
                // Given
                when(userService.getUserById(adminUser.getId())).thenReturn(adminUser);

                // When & Then
                mockMvc.perform(get("/api/users/{id}", adminUser.getId()))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.id", is(adminUser.getId().toString())))
                                .andExpect(jsonPath("$.username", is("admin")))
                                .andExpect(jsonPath("$.role", is("ADMINISTRATOR")))
                                .andExpect(jsonPath("$.createdAt", notNullValue()));
        }

        @Test
        void getUserById_WithInvalidId_ShouldReturnBadRequest() throws Exception {
                // Given
                UUID nonExistentId = UUID.randomUUID();
                when(userService.getUserById(nonExistentId))
                                .thenThrow(new IllegalArgumentException("User not found with ID: " + nonExistentId));

                // When & Then
                mockMvc.perform(get("/api/users/{id}", nonExistentId))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message", containsString("User not found")));
        }

        @Test
        void createUser_WithValidData_ShouldCreateUser() throws Exception {
                // Given
                CreateUserRequest request = new CreateUserRequest("newuser", "NewPass123!", UserRole.USER, null);
                User newUser = new User("newuser", "hashedPassword", UserRole.USER);
                newUser.setId(UUID.randomUUID());
                newUser.setCreatedAt(LocalDateTime.now());

                when(userService.createUser("newuser", "NewPass123!", UserRole.USER)).thenReturn(newUser);

                // When & Then
                mockMvc.perform(post("/api/users")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.username", is("newuser")))
                                .andExpect(jsonPath("$.role", is("USER")))
                                .andExpect(jsonPath("$.id", notNullValue()))
                                .andExpect(jsonPath("$.createdAt", notNullValue()));
        }

        @Test
        void createUser_WithDuplicateUsername_ShouldReturnBadRequest() throws Exception {
                // Given
                CreateUserRequest request = new CreateUserRequest("admin", "NewPass123!", UserRole.USER, null);
                when(userService.createUser("admin", "NewPass123!", UserRole.USER))
                                .thenThrow(new IllegalArgumentException("Username already exists: admin"));

                // When & Then
                mockMvc.perform(post("/api/users")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message", containsString("Username already exists")));
        }

        @Test
        void createUser_WithWeakPassword_ShouldReturnBadRequest() throws Exception {
                // Given - password is 8+ chars but lacks complexity (no uppercase, numbers,
                // special chars)
                CreateUserRequest request = new CreateUserRequest("newuser", "weakpassword", UserRole.USER, null);
                when(userService.createUser("newuser", "weakpassword", UserRole.USER))
                                .thenThrow(new IllegalArgumentException(
                                                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"));

                // When & Then
                mockMvc.perform(post("/api/users")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message", containsString("Password must contain")));
        }

        @Test
        void createUser_WithInvalidInput_ShouldReturnValidationErrors() throws Exception {
                // Given
                CreateUserRequest request = new CreateUserRequest("", "", null, null);

                // When & Then
                mockMvc.perform(post("/api/users")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.error", is("Validation Failed")))
                                .andExpect(jsonPath("$.details.username", notNullValue()))
                                .andExpect(jsonPath("$.details.password", notNullValue()))
                                .andExpect(jsonPath("$.details.role", notNullValue()));
        }

        @Test
        void updateUser_WithValidData_ShouldUpdateUser() throws Exception {
                // Given
                UpdateUserRequest request = new UpdateUserRequest("updateduser", null, UserRole.ADMINISTRATOR, null);
                User updatedUser = new User("updateduser", "hashedPassword", UserRole.ADMINISTRATOR);
                updatedUser.setId(regularUser.getId());
                updatedUser.setCreatedAt(regularUser.getCreatedAt());

                when(userService.updateUser(regularUser.getId(), "updateduser", null, UserRole.ADMINISTRATOR))
                                .thenReturn(updatedUser);

                // When & Then
                mockMvc.perform(put("/api/users/{id}", regularUser.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.username", is("updateduser")))
                                .andExpect(jsonPath("$.role", is("ADMINISTRATOR")));
        }

        @Test
        void updateUser_WithInvalidId_ShouldReturnBadRequest() throws Exception {
                // Given
                UUID nonExistentId = UUID.randomUUID();
                UpdateUserRequest request = new UpdateUserRequest("updateduser", null, UserRole.USER, null);
                when(userService.updateUser(eq(nonExistentId), any(), any(), any()))
                                .thenThrow(new IllegalArgumentException("User not found with ID: " + nonExistentId));

                // When & Then
                mockMvc.perform(put("/api/users/{id}", nonExistentId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message", containsString("User not found")));
        }

        @Test
        void deleteUser_WithValidId_ShouldDeleteUser() throws Exception {
                // Given
                doNothing().when(userService).deleteUser(regularUser.getId());

                // When & Then
                mockMvc.perform(delete("/api/users/{id}", regularUser.getId()))
                                .andExpect(status().isNoContent());
        }

        @Test
        void deleteUser_WithInvalidId_ShouldReturnBadRequest() throws Exception {
                // Given
                UUID nonExistentId = UUID.randomUUID();
                doThrow(new IllegalArgumentException("User not found with ID: " + nonExistentId))
                                .when(userService).deleteUser(nonExistentId);

                // When & Then
                mockMvc.perform(delete("/api/users/{id}", nonExistentId))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message", containsString("User not found")));
        }

        @Test
        void assignClusterToUser_WithValidIds_ShouldAssignCluster() throws Exception {
                // Given
                UUID clusterId = UUID.randomUUID();
                doNothing().when(userService).assignClusterToUser(regularUser.getId(), clusterId);

                // When & Then
                mockMvc.perform(post("/api/users/{userId}/clusters/{clusterId}",
                                regularUser.getId(), clusterId))
                                .andExpect(status().isOk());
        }

        @Test
        void assignClusterToUser_WithInvalidUserId_ShouldReturnBadRequest() throws Exception {
                // Given
                UUID nonExistentUserId = UUID.randomUUID();
                UUID clusterId = UUID.randomUUID();
                doThrow(new IllegalArgumentException("User not found with ID: " + nonExistentUserId))
                                .when(userService).assignClusterToUser(nonExistentUserId, clusterId);

                // When & Then
                mockMvc.perform(post("/api/users/{userId}/clusters/{clusterId}",
                                nonExistentUserId, clusterId))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message", containsString("User not found")));
        }

        @Test
        void removeClusterFromUser_WithValidIds_ShouldRemoveCluster() throws Exception {
                // Given
                UUID clusterId = UUID.randomUUID();
                doNothing().when(userService).removeClusterFromUser(regularUser.getId(), clusterId);

                // When & Then
                mockMvc.perform(delete("/api/users/{userId}/clusters/{clusterId}",
                                regularUser.getId(), clusterId))
                                .andExpect(status().isOk());
        }

        @Test
        void getUsersByCluster_WithValidClusterId_ShouldReturnUsers() throws Exception {
                // Given
                UUID clusterId = UUID.randomUUID();
                when(userService.getUsersAssignedToCluster(clusterId)).thenReturn(List.of(regularUser));

                // When & Then
                mockMvc.perform(get("/api/users/by-cluster/{clusterId}", clusterId))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$", hasSize(1)))
                                .andExpect(jsonPath("$[0].username", is("user")));
        }

        @Test
        void getUnassignedUsers_ShouldReturnUsersWithNoClusters() throws Exception {
                // Given
                when(userService.getUsersWithNoClusterAssignments()).thenReturn(List.of(adminUser, regularUser));

                // When & Then
                mockMvc.perform(get("/api/users/unassigned"))
                                .andExpect(status().isOk())
                                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$", hasSize(2)))
                                .andExpect(jsonPath("$[*].username", containsInAnyOrder("admin", "user")));
        }
}