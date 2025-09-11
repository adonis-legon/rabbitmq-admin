package com.rabbitmq.admin.model;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidUser() {
        User user = new User("testuser", "hashedPassword123", UserRole.USER);

        Set<ConstraintViolation<User>> violations = validator.validate(user);

        assertTrue(violations.isEmpty(), "Valid user should have no validation errors");
        assertEquals("testuser", user.getUsername());
        assertEquals("hashedPassword123", user.getPasswordHash());
        assertEquals(UserRole.USER, user.getRole());
        assertNotNull(user.getAssignedClusters());
        assertTrue(user.getAssignedClusters().isEmpty());
    }

    @Test
    void testValidAdministratorUser() {
        User user = new User("admin", "hashedAdminPassword", UserRole.ADMINISTRATOR);

        Set<ConstraintViolation<User>> violations = validator.validate(user);

        assertTrue(violations.isEmpty(), "Valid administrator should have no validation errors");
        assertEquals(UserRole.ADMINISTRATOR, user.getRole());
    }

    @Test
    void testBlankUsername() {
        User user = new User("", "hashedPassword123", UserRole.USER);

        Set<ConstraintViolation<User>> violations = validator.validate(user);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getMessage().equals("Username is required")));
    }

    @Test
    void testNullUsername() {
        User user = new User(null, "hashedPassword123", UserRole.USER);

        Set<ConstraintViolation<User>> violations = validator.validate(user);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getMessage().equals("Username is required")));
    }

    @Test
    void testUsernameTooShort() {
        User user = new User("ab", "hashedPassword123", UserRole.USER);

        Set<ConstraintViolation<User>> violations = validator.validate(user);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getMessage().equals("Username must be between 3 and 50 characters")));
    }

    @Test
    void testUsernameTooLong() {
        String longUsername = "a".repeat(51);
        User user = new User(longUsername, "hashedPassword123", UserRole.USER);

        Set<ConstraintViolation<User>> violations = validator.validate(user);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getMessage().equals("Username must be between 3 and 50 characters")));
    }

    @Test
    void testUsernameWithInvalidCharacters() {
        User user = new User("test@user", "hashedPassword123", UserRole.USER);

        Set<ConstraintViolation<User>> violations = validator.validate(user);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getMessage()
                        .equals("Username can only contain letters, numbers, underscores, and hyphens")));
    }

    @Test
    void testValidUsernameWithAllowedCharacters() {
        User user = new User("test_user-123", "hashedPassword123", UserRole.USER);

        Set<ConstraintViolation<User>> violations = validator.validate(user);

        assertTrue(violations.isEmpty(), "Username with allowed characters should be valid");
    }

    @Test
    void testBlankPasswordHash() {
        User user = new User("testuser", "", UserRole.USER);

        Set<ConstraintViolation<User>> violations = validator.validate(user);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getMessage().equals("Password hash is required")));
    }

    @Test
    void testNullPasswordHash() {
        User user = new User("testuser", null, UserRole.USER);

        Set<ConstraintViolation<User>> violations = validator.validate(user);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getMessage().equals("Password hash is required")));
    }

    @Test
    void testNullRole() {
        User user = new User("testuser", "hashedPassword123", null);

        Set<ConstraintViolation<User>> violations = validator.validate(user);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getMessage().equals("User role is required")));
    }

    @Test
    void testUserEquality() {
        UUID id = UUID.randomUUID();
        User user1 = new User("testuser", "hashedPassword123", UserRole.USER);
        user1.setId(id);

        User user2 = new User("testuser", "hashedPassword123", UserRole.USER);
        user2.setId(id);

        User user3 = new User("testuser", "hashedPassword123", UserRole.USER);
        user3.setId(UUID.randomUUID());

        assertEquals(user1, user2, "Users with same ID should be equal");
        assertNotEquals(user1, user3, "Users with different IDs should not be equal");
        assertEquals(user1.hashCode(), user2.hashCode(), "Users with same ID should have same hash code");
    }

    @Test
    void testUserToString() {
        User user = new User("testuser", "hashedPassword123", UserRole.USER);
        user.setId(UUID.randomUUID());
        user.setCreatedAt(LocalDateTime.now());

        String toString = user.toString();

        assertTrue(toString.contains("testuser"));
        assertTrue(toString.contains("USER"));
        assertTrue(toString.contains(user.getId().toString()));
    }

    @Test
    void testDefaultConstructor() {
        User user = new User();

        assertNull(user.getId());
        assertNull(user.getUsername());
        assertNull(user.getPasswordHash());
        assertNull(user.getRole());
        assertNull(user.getCreatedAt());
        assertNotNull(user.getAssignedClusters());
        assertTrue(user.getAssignedClusters().isEmpty());
    }

    @Test
    void testClusterConnectionManagement() {
        User user = new User("testuser", "hashedPassword123", UserRole.USER);
        ClusterConnection cluster = new ClusterConnection();
        cluster.setId(UUID.randomUUID());
        cluster.setName("test-cluster");

        // Test adding cluster connection
        user.addClusterConnection(cluster);

        assertTrue(user.getAssignedClusters().contains(cluster));
        assertTrue(cluster.getAssignedUsers().contains(user));

        // Test removing cluster connection
        user.removeClusterConnection(cluster);

        assertFalse(user.getAssignedClusters().contains(cluster));
        assertFalse(cluster.getAssignedUsers().contains(user));
    }
}