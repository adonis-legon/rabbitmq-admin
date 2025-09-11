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

class ClusterConnectionTest {

        private Validator validator;

        @BeforeEach
        void setUp() {
                ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
                validator = factory.getValidator();
        }

        @Test
        void testValidClusterConnection() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                "password123");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertTrue(violations.isEmpty(), "Valid cluster connection should have no validation errors");
                assertEquals("test-cluster", cluster.getName());
                assertEquals("http://localhost:15672", cluster.getApiUrl());
                assertEquals("admin", cluster.getUsername());
                assertEquals("password123", cluster.getPassword());
                assertTrue(cluster.getActive());
                assertNotNull(cluster.getAssignedUsers());
                assertTrue(cluster.getAssignedUsers().isEmpty());
        }

        @Test
        void testValidClusterConnectionWithDescription() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "https://rabbitmq.example.com:15672",
                                "admin",
                                "password123",
                                "Production RabbitMQ cluster");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertTrue(violations.isEmpty(),
                                "Valid cluster connection with description should have no validation errors");
                assertEquals("Production RabbitMQ cluster", cluster.getDescription());
        }

        @Test
        void testValidHttpsUrl() {
                ClusterConnection cluster = new ClusterConnection(
                                "secure-cluster",
                                "https://rabbitmq.example.com:15672/api",
                                "admin",
                                "password123");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertTrue(violations.isEmpty(), "HTTPS URL should be valid");
        }

        @Test
        void testBlankName() {
                ClusterConnection cluster = new ClusterConnection(
                                "",
                                "http://localhost:15672",
                                "admin",
                                "password123");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage().equals("Cluster name is required")));
        }

        @Test
        void testNullName() {
                ClusterConnection cluster = new ClusterConnection(
                                null,
                                "http://localhost:15672",
                                "admin",
                                "password123");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage().equals("Cluster name is required")));
        }

        @Test
        void testNameTooLong() {
                String longName = "a".repeat(101);
                ClusterConnection cluster = new ClusterConnection(
                                longName,
                                "http://localhost:15672",
                                "admin",
                                "password123");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage()
                                                .equals("Cluster name must be between 1 and 100 characters")));
        }

        @Test
        void testBlankApiUrl() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "",
                                "admin",
                                "password123");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage().equals("API URL is required")));
        }

        @Test
        void testNullApiUrl() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                null,
                                "admin",
                                "password123");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage().equals("API URL is required")));
        }

        @Test
        void testInvalidApiUrlFormat() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "invalid-url",
                                "admin",
                                "password123");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage().equals("API URL must be a valid HTTP or HTTPS URL")));
        }

        @Test
        void testBlankUsername() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "",
                                "password123");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage().equals("Username is required")));
        }

        @Test
        void testNullUsername() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                null,
                                "password123");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage().equals("Username is required")));
        }

        @Test
        void testUsernameTooLong() {
                String longUsername = "a".repeat(101);
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                longUsername,
                                "password123");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage().equals("Username must be between 1 and 100 characters")));
        }

        @Test
        void testBlankPassword() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                "");

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage().equals("Password is required")));
        }

        @Test
        void testNullPassword() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                null);

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage().equals("Password is required")));
        }

        @Test
        void testDescriptionTooLong() {
                String longDescription = "a".repeat(501);
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                "password123",
                                longDescription);

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertFalse(violations.isEmpty());
                assertTrue(violations.stream()
                                .anyMatch(v -> v.getMessage().equals("Description must not exceed 500 characters")));
        }

        @Test
        void testNullDescription() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                "password123",
                                null);

                Set<ConstraintViolation<ClusterConnection>> violations = validator.validate(cluster);

                assertTrue(violations.isEmpty(), "Null description should be valid");
        }

        @Test
        void testClusterConnectionEquality() {
                UUID id = UUID.randomUUID();
                ClusterConnection cluster1 = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                "password123");
                cluster1.setId(id);

                ClusterConnection cluster2 = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                "password123");
                cluster2.setId(id);

                ClusterConnection cluster3 = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                "password123");
                cluster3.setId(UUID.randomUUID());

                assertEquals(cluster1, cluster2, "Cluster connections with same ID should be equal");
                assertNotEquals(cluster1, cluster3, "Cluster connections with different IDs should not be equal");
                assertEquals(cluster1.hashCode(), cluster2.hashCode(),
                                "Cluster connections with same ID should have same hash code");
        }

        @Test
        void testClusterConnectionToString() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                "password123");
                cluster.setId(UUID.randomUUID());
                cluster.setCreatedAt(LocalDateTime.now());

                String toString = cluster.toString();

                assertTrue(toString.contains("test-cluster"));
                assertTrue(toString.contains("http://localhost:15672"));
                assertTrue(toString.contains("admin"));
                assertTrue(toString.contains("true")); // active status
                assertTrue(toString.contains(cluster.getId().toString()));
        }

        @Test
        void testDefaultConstructor() {
                ClusterConnection cluster = new ClusterConnection();

                assertNull(cluster.getId());
                assertNull(cluster.getName());
                assertNull(cluster.getApiUrl());
                assertNull(cluster.getUsername());
                assertNull(cluster.getPassword());
                assertNull(cluster.getDescription());
                assertTrue(cluster.getActive()); // Default value is true
                assertNull(cluster.getCreatedAt());
                assertNotNull(cluster.getAssignedUsers());
                assertTrue(cluster.getAssignedUsers().isEmpty());
        }

        @Test
        void testActiveStatusDefault() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                "password123");

                assertTrue(cluster.getActive(), "New cluster connection should be active by default");
                assertTrue(cluster.isAccessible(), "Active cluster should be accessible");
        }

        @Test
        void testInactiveCluster() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                "password123");
                cluster.setActive(false);

                assertFalse(cluster.getActive());
                assertFalse(cluster.isAccessible(), "Inactive cluster should not be accessible");
        }

        @Test
        void testUserAssignmentManagement() {
                ClusterConnection cluster = new ClusterConnection(
                                "test-cluster",
                                "http://localhost:15672",
                                "admin",
                                "password123");
                User user = new User("testuser", "hashedPassword123", UserRole.USER);

                // Test adding user
                cluster.addUser(user);

                assertTrue(cluster.getAssignedUsers().contains(user));
                assertTrue(user.getAssignedClusters().contains(cluster));

                // Test removing user
                cluster.removeUser(user);

                assertFalse(cluster.getAssignedUsers().contains(user));
                assertFalse(user.getAssignedClusters().contains(cluster));
        }

        @Test
        void testNullActiveStatus() {
                ClusterConnection cluster = new ClusterConnection();
                cluster.setActive(null);

                assertFalse(cluster.isAccessible(), "Cluster with null active status should not be accessible");
        }
}