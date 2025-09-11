package com.rabbitmq.admin.integration;

import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import com.rabbitmq.admin.repository.UserClusterAssignmentRepository;
import com.rabbitmq.admin.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.junit.jupiter.api.AfterAll;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for database operations using TestContainers with
 * PostgreSQL.
 * Tests complete database functionality with real PostgreSQL database.
 */
@SpringBootTest
@Testcontainers
@ActiveProfiles("integration-test")
@Transactional
class DatabaseIntegrationTest {

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
    private UserRepository userRepository;

    @Autowired
    private ClusterConnectionRepository clusterConnectionRepository;

    @Autowired
    private UserClusterAssignmentRepository userClusterAssignmentRepository;

    @BeforeEach
    void setUp() {
        // Clean up before each test
        userClusterAssignmentRepository.deleteAll();
        clusterConnectionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void userRepository_ShouldPersistAndRetrieveUsers() {
        // Given
        User user = new User("testuser", "hashedPassword", UserRole.USER);

        // When
        User savedUser = userRepository.save(user);

        // Then
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getCreatedAt()).isNotNull();

        Optional<User> retrievedUser = userRepository.findById(savedUser.getId());
        assertThat(retrievedUser).isPresent();
        assertThat(retrievedUser.get().getUsername()).isEqualTo("testuser");
        assertThat(retrievedUser.get().getRole()).isEqualTo(UserRole.USER);
    }

    @Test
    void clusterConnectionRepository_ShouldPersistAndRetrieveClusters() {
        // Given
        ClusterConnection cluster = new ClusterConnection("Test Cluster", "http://localhost:15672", "admin",
                "password");
        cluster.setDescription("Test cluster description");

        // When
        ClusterConnection savedCluster = clusterConnectionRepository.save(cluster);

        // Then
        assertThat(savedCluster.getId()).isNotNull();
        assertThat(savedCluster.getCreatedAt()).isNotNull();

        Optional<ClusterConnection> retrievedCluster = clusterConnectionRepository.findById(savedCluster.getId());
        assertThat(retrievedCluster).isPresent();
        assertThat(retrievedCluster.get().getName()).isEqualTo("Test Cluster");
        assertThat(retrievedCluster.get().getApiUrl()).isEqualTo("http://localhost:15672");
        assertThat(retrievedCluster.get().getActive()).isTrue();
    }

    @Test
    void userClusterAssignment_ShouldWorkCorrectly() {
        // Given
        User user = new User("testuser", "hashedPassword", UserRole.USER);
        user = userRepository.save(user);

        ClusterConnection cluster = new ClusterConnection("Test Cluster", "http://localhost:15672", "admin",
                "password");
        cluster = clusterConnectionRepository.save(cluster);

        // When - Assign user to cluster using JPA relationship
        user.addClusterConnection(cluster);
        userRepository.save(user);

        // Then - Verify assignment using repository methods
        List<User> usersInCluster = userRepository.findByAssignedClustersId(cluster.getId());
        assertThat(usersInCluster).hasSize(1);
        assertThat(usersInCluster.get(0).getUsername()).isEqualTo("testuser");

        List<ClusterConnection> userClusters = clusterConnectionRepository.findByAssignedUsersId(user.getId());
        assertThat(userClusters).hasSize(1);
        assertThat(userClusters.get(0).getName()).isEqualTo("Test Cluster");

        // Verify using assignment repository
        boolean isAssigned = userClusterAssignmentRepository.isUserAssignedToCluster(user.getId(), cluster.getId());
        assertThat(isAssigned).isTrue();

        long assignmentCount = userClusterAssignmentRepository.countAssignmentsForUser(user.getId());
        assertThat(assignmentCount).isEqualTo(1);
    }

    @Test
    void complexUserClusterScenario_ShouldWork() {
        // Given - Create multiple users and clusters
        User admin = new User("admin", "adminPass", UserRole.ADMINISTRATOR);
        User user1 = new User("user1", "user1Pass", UserRole.USER);
        User user2 = new User("user2", "user2Pass", UserRole.USER);

        admin = userRepository.save(admin);
        user1 = userRepository.save(user1);
        user2 = userRepository.save(user2);

        ClusterConnection prodCluster = new ClusterConnection("Production", "http://prod:15672", "admin", "password");
        ClusterConnection devCluster = new ClusterConnection("Development", "http://dev:15672", "admin", "password");
        ClusterConnection testCluster = new ClusterConnection("Test", "http://test:15672", "admin", "password");

        prodCluster = clusterConnectionRepository.save(prodCluster);
        devCluster = clusterConnectionRepository.save(devCluster);
        testCluster = clusterConnectionRepository.save(testCluster);

        // When - Set up complex assignments
        // Admin has access to all clusters
        admin.addClusterConnection(prodCluster);
        admin.addClusterConnection(devCluster);
        admin.addClusterConnection(testCluster);

        // User1 has access to dev and test
        user1.addClusterConnection(devCluster);
        user1.addClusterConnection(testCluster);

        // User2 has access to test only
        user2.addClusterConnection(testCluster);

        userRepository.save(admin);
        userRepository.save(user1);
        userRepository.save(user2);

        // Then - Verify assignments
        // Check admin assignments
        List<ClusterConnection> adminClusters = clusterConnectionRepository.findByAssignedUsersId(admin.getId());
        assertThat(adminClusters).hasSize(3);

        // Check user1 assignments
        List<ClusterConnection> user1Clusters = clusterConnectionRepository.findByAssignedUsersId(user1.getId());
        assertThat(user1Clusters).hasSize(2);
        assertThat(user1Clusters).extracting(ClusterConnection::getName)
                .containsExactlyInAnyOrder("Development", "Test");

        // Check user2 assignments
        List<ClusterConnection> user2Clusters = clusterConnectionRepository.findByAssignedUsersId(user2.getId());
        assertThat(user2Clusters).hasSize(1);
        assertThat(user2Clusters.get(0).getName()).isEqualTo("Test");

        // Check cluster assignments
        List<User> testClusterUsers = userRepository.findByAssignedClustersId(testCluster.getId());
        assertThat(testClusterUsers).hasSize(3); // All users have access to test cluster

        List<User> prodClusterUsers = userRepository.findByAssignedClustersId(prodCluster.getId());
        assertThat(prodClusterUsers).hasSize(1); // Only admin has access to prod cluster
        assertThat(prodClusterUsers.get(0).getUsername()).isEqualTo("admin");

        // Check users with no assignments (should be none in this scenario)
        List<User> usersWithoutClusters = userRepository.findUsersWithNoClusterAssignments();
        assertThat(usersWithoutClusters).isEmpty();

        // Check clusters with no assignments (should be none in this scenario)
        List<ClusterConnection> clustersWithoutUsers = clusterConnectionRepository.findClustersWithNoUserAssignments();
        assertThat(clustersWithoutUsers).isEmpty();
    }

    @Test
    void userClusterAssignmentRepository_DirectOperations_ShouldWork() {
        // Given
        User user = new User("testuser", "hashedPassword", UserRole.USER);
        user = userRepository.save(user);

        ClusterConnection cluster1 = new ClusterConnection("Cluster 1", "http://cluster1:15672", "admin", "password");
        ClusterConnection cluster2 = new ClusterConnection("Cluster 2", "http://cluster2:15672", "admin", "password");
        cluster1 = clusterConnectionRepository.save(cluster1);
        cluster2 = clusterConnectionRepository.save(cluster2);

        // When - Use direct assignment repository operations
        userClusterAssignmentRepository.assignUserToCluster(user.getId(), cluster1.getId());
        userClusterAssignmentRepository.assignUserToCluster(user.getId(), cluster2.getId());

        // Then - Verify assignments
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user.getId(), cluster1.getId())).isTrue();
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user.getId(), cluster2.getId())).isTrue();

        long userAssignmentCount = userClusterAssignmentRepository.countAssignmentsForUser(user.getId());
        assertThat(userAssignmentCount).isEqualTo(2);

        long cluster1AssignmentCount = userClusterAssignmentRepository.countAssignmentsForCluster(cluster1.getId());
        assertThat(cluster1AssignmentCount).isEqualTo(1);

        long totalAssignments = userClusterAssignmentRepository.countTotalAssignments();
        assertThat(totalAssignments).isEqualTo(2);

        // When - Remove one assignment
        userClusterAssignmentRepository.removeUserFromCluster(user.getId(), cluster1.getId());

        // Then - Verify removal
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user.getId(), cluster1.getId())).isFalse();
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user.getId(), cluster2.getId())).isTrue();

        userAssignmentCount = userClusterAssignmentRepository.countAssignmentsForUser(user.getId());
        assertThat(userAssignmentCount).isEqualTo(1);
    }

    @Test
    void repositoryQueries_ShouldWorkWithRealDatabase() {
        // Given
        User admin = new User("admin", "adminPass", UserRole.ADMINISTRATOR);
        User user1 = new User("user1", "user1Pass", UserRole.USER);
        User user2 = new User("user2", "user2Pass", UserRole.USER);

        admin = userRepository.save(admin);
        user1 = userRepository.save(user1);
        user2 = userRepository.save(user2);

        ClusterConnection activeCluster = new ClusterConnection("Active Cluster", "http://active:15672", "admin",
                "password");
        activeCluster.setActive(true);

        ClusterConnection inactiveCluster = new ClusterConnection("Inactive Cluster", "http://inactive:15672", "admin",
                "password");
        inactiveCluster.setActive(false);

        activeCluster = clusterConnectionRepository.save(activeCluster);
        inactiveCluster = clusterConnectionRepository.save(inactiveCluster);

        // When & Then - Test various repository queries
        // User queries
        assertThat(userRepository.existsByUsernameIgnoreCase("ADMIN")).isTrue();
        assertThat(userRepository.existsByUsernameIgnoreCase("nonexistent")).isFalse();

        Optional<User> foundUser = userRepository.findByUsernameIgnoreCase("ADMIN");
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getUsername()).isEqualTo("admin");

        List<User> administrators = userRepository.findByRole(UserRole.ADMINISTRATOR);
        assertThat(administrators).hasSize(1);

        List<User> regularUsers = userRepository.findByRole(UserRole.USER);
        assertThat(regularUsers).hasSize(2);

        long adminCount = userRepository.countByRole(UserRole.ADMINISTRATOR);
        assertThat(adminCount).isEqualTo(1);

        // Cluster queries
        assertThat(clusterConnectionRepository.existsByNameIgnoreCase("ACTIVE CLUSTER")).isTrue();
        assertThat(clusterConnectionRepository.existsByNameIgnoreCase("nonexistent")).isFalse();

        Optional<ClusterConnection> foundCluster = clusterConnectionRepository.findByNameIgnoreCase("ACTIVE CLUSTER");
        assertThat(foundCluster).isPresent();
        assertThat(foundCluster.get().getName()).isEqualTo("Active Cluster");

        List<ClusterConnection> activeClusters = clusterConnectionRepository.findByActiveTrue();
        assertThat(activeClusters).hasSize(1);

        List<ClusterConnection> inactiveClusters = clusterConnectionRepository.findByActiveFalse();
        assertThat(inactiveClusters).hasSize(1);

        long activeCount = clusterConnectionRepository.countByActive(true);
        assertThat(activeCount).isEqualTo(1);

        List<ClusterConnection> orderedClusters = clusterConnectionRepository.findAllByOrderByNameAsc();
        assertThat(orderedClusters).hasSize(2);
        assertThat(orderedClusters.get(0).getName()).isEqualTo("Active Cluster");
        assertThat(orderedClusters.get(1).getName()).isEqualTo("Inactive Cluster");
    }
}