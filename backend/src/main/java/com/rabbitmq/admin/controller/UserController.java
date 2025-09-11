package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.dto.CreateUserRequest;
import com.rabbitmq.admin.dto.UpdateUserRequest;
import com.rabbitmq.admin.dto.UserResponse;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for user management operations.
 * Requires ADMINISTRATOR role for access.
 */
@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Get all users
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserResponse> userResponses = users.stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userResponses);
    }

    /**
     * Get user by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable("id") UUID id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    /**
     * Create a new user
     */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        User user = userService.createUser(request.getUsername(), request.getPassword(), request.getRole());

        // Assign cluster connections if provided
        if (request.getClusterConnectionIds() != null && !request.getClusterConnectionIds().isEmpty()) {
            userService.updateUserClusterAssignments(user.getId(), request.getClusterConnectionIds());
            // Reload user to get updated cluster assignments
            user = userService.getUserById(user.getId());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.fromUser(user));
    }

    /**
     * Update an existing user
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable("id") UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        User user = userService.updateUser(id, request.getUsername(), request.getPassword(), request.getRole());

        // Update cluster assignments if provided
        if (request.getClusterConnectionIds() != null) {
            userService.updateUserClusterAssignments(id, request.getClusterConnectionIds());
            // Reload user to get updated cluster assignments
            user = userService.getUserById(id);
        }

        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    /**
     * Delete a user
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Assign a cluster connection to a user
     */
    @PostMapping("/{userId}/clusters/{clusterId}")
    public ResponseEntity<Void> assignClusterToUser(@PathVariable("userId") UUID userId,
            @PathVariable("clusterId") UUID clusterId) {
        userService.assignClusterToUser(userId, clusterId);
        return ResponseEntity.ok().build();
    }

    /**
     * Remove a cluster connection assignment from a user
     */
    @DeleteMapping("/{userId}/clusters/{clusterId}")
    public ResponseEntity<Void> removeClusterFromUser(@PathVariable("userId") UUID userId,
            @PathVariable("clusterId") UUID clusterId) {
        userService.removeClusterFromUser(userId, clusterId);
        return ResponseEntity.ok().build();
    }

    /**
     * Get users assigned to a specific cluster
     */
    @GetMapping("/by-cluster/{clusterId}")
    public ResponseEntity<List<UserResponse>> getUsersByCluster(@PathVariable("clusterId") UUID clusterId) {
        List<User> users = userService.getUsersAssignedToCluster(clusterId);
        List<UserResponse> userResponses = users.stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userResponses);
    }

    /**
     * Get users with no cluster assignments
     */
    @GetMapping("/unassigned")
    public ResponseEntity<List<UserResponse>> getUnassignedUsers() {
        List<User> users = userService.getUsersWithNoClusterAssignments();
        List<UserResponse> userResponses = users.stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userResponses);
    }
}