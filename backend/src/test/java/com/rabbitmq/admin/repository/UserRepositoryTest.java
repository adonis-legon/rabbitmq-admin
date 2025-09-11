package com.rabbitmq.admin.repository;

import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for UserRepository using @DataJpaTest.
 * Tests all custom query methods and repository functionality.
 */
@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    private User adminUser;
    private User regularUser1;
    private User regularUser2;
    private ClusterConnection cluster1;
    private ClusterConnection cluster2;

    @BeforeEach
    void setUp() {
        // Create test users
        adminUser = new User("admin", "hashedPassword123", UserRole.ADMINISTRATOR);
        regularUser1 = new User("user1", "hashedPassword456", UserRole.USER);
        regularUser2 = new User("user2", "hashedPassword789", UserRole.USER);

        // Create test cluster connections
        cluster1 = new ClusterConnection("Test Cluster 1", "http://localhost:15672", "admin", "password");
        cluster2 = new ClusterConnection("Test Cluster 2", "http://localhost:15673", "admin", "password");

        // Persist entities
        entityManager.persistAndFlush(adminUser);
        entityManager.persistAndFlush(regularUser1);
        entityManager.persistAndFlush(regularUser2);
        entityManager.persistAndFlush(cluster1);
        entityManager.persistAndFlush(cluster2);

        // Set up relationships
        regularUser1.addClusterConnection(cluster1);
        regularUser1.addClusterConnection(cluster2);
        regularUser2.addClusterConnection(cluster1);

        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void findByUsernameIgnoreCase_ShouldReturnUser_WhenUsernameExists() {
        // Test exact case
        Optional<User> result = userRepository.findByUsernameIgnoreCase("admin");
        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("admin");

        // Test different case
        result = userRepository.findByUsernameIgnoreCase("ADMIN");
        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("admin");

        // Test mixed case
        result = userRepository.findByUsernameIgnoreCase("AdMiN");
        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("admin");
    }

    @Test
    void findByUsernameIgnoreCase_ShouldReturnEmpty_WhenUsernameDoesNotExist() {
        Optional<User> result = userRepository.findByUsernameIgnoreCase("nonexistent");
        assertThat(result).isEmpty();
    }

    @Test
    void existsByUsernameIgnoreCase_ShouldReturnTrue_WhenUsernameExists() {
        assertThat(userRepository.existsByUsernameIgnoreCase("admin")).isTrue();
        assertThat(userRepository.existsByUsernameIgnoreCase("ADMIN")).isTrue();
        assertThat(userRepository.existsByUsernameIgnoreCase("AdMiN")).isTrue();
    }

    @Test
    void existsByUsernameIgnoreCase_ShouldReturnFalse_WhenUsernameDoesNotExist() {
        assertThat(userRepository.existsByUsernameIgnoreCase("nonexistent")).isFalse();
    }

    @Test
    void findByRole_ShouldReturnUsersWithSpecificRole() {
        List<User> administrators = userRepository.findByRole(UserRole.ADMINISTRATOR);
        assertThat(administrators).hasSize(1);
        assertThat(administrators.get(0).getUsername()).isEqualTo("admin");

        List<User> users = userRepository.findByRole(UserRole.USER);
        assertThat(users).hasSize(2);
        assertThat(users).extracting(User::getUsername).containsExactlyInAnyOrder("user1", "user2");
    }

    @Test
    void findByAssignedClustersId_ShouldReturnUsersAssignedToCluster() {
        List<User> usersInCluster1 = userRepository.findByAssignedClustersId(cluster1.getId());
        assertThat(usersInCluster1).hasSize(2);
        assertThat(usersInCluster1).extracting(User::getUsername).containsExactlyInAnyOrder("user1", "user2");

        List<User> usersInCluster2 = userRepository.findByAssignedClustersId(cluster2.getId());
        assertThat(usersInCluster2).hasSize(1);
        assertThat(usersInCluster2.get(0).getUsername()).isEqualTo("user1");
    }

    @Test
    void findUsersNotAssignedToCluster_ShouldReturnUsersNotInCluster() {
        List<User> usersNotInCluster1 = userRepository.findUsersNotAssignedToCluster(cluster1.getId());
        assertThat(usersNotInCluster1).hasSize(1);
        assertThat(usersNotInCluster1.get(0).getUsername()).isEqualTo("admin");

        List<User> usersNotInCluster2 = userRepository.findUsersNotAssignedToCluster(cluster2.getId());
        assertThat(usersNotInCluster2).hasSize(2);
        assertThat(usersNotInCluster2).extracting(User::getUsername).containsExactlyInAnyOrder("admin", "user2");
    }

    @Test
    void countByRole_ShouldReturnCorrectCount() {
        long adminCount = userRepository.countByRole(UserRole.ADMINISTRATOR);
        assertThat(adminCount).isEqualTo(1);

        long userCount = userRepository.countByRole(UserRole.USER);
        assertThat(userCount).isEqualTo(2);
    }

    @Test
    void findUsersWithNoClusterAssignments_ShouldReturnUsersWithoutClusters() {
        List<User> usersWithoutClusters = userRepository.findUsersWithNoClusterAssignments();
        assertThat(usersWithoutClusters).hasSize(1);
        assertThat(usersWithoutClusters.get(0).getUsername()).isEqualTo("admin");
    }

    @Test
    void findUsersWithClusterAssignments_ShouldReturnUsersWithClusters() {
        List<User> usersWithClusters = userRepository.findUsersWithClusterAssignments();
        assertThat(usersWithClusters).hasSize(2);
        assertThat(usersWithClusters).extracting(User::getUsername).containsExactlyInAnyOrder("user1", "user2");
    }

    @Test
    void findAdministrators_ShouldReturnAdminUsers() {
        List<User> administrators = userRepository.findAdministrators();
        assertThat(administrators).hasSize(1);
        assertThat(administrators.get(0).getRole()).isEqualTo(UserRole.ADMINISTRATOR);
    }

    @Test
    void findRegularUsers_ShouldReturnRegularUsers() {
        List<User> regularUsers = userRepository.findRegularUsers();
        assertThat(regularUsers).hasSize(2);
        assertThat(regularUsers).allMatch(user -> user.getRole() == UserRole.USER);
    }

    @Test
    void save_ShouldPersistUser() {
        User newUser = new User("newuser", "hashedPassword", UserRole.USER);
        User savedUser = userRepository.save(newUser);

        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getCreatedAt()).isNotNull();
        assertThat(savedUser.getUsername()).isEqualTo("newuser");
    }

    @Test
    void delete_ShouldRemoveUser() {
        UUID userId = adminUser.getId();
        userRepository.deleteById(userId);

        Optional<User> deletedUser = userRepository.findById(userId);
        assertThat(deletedUser).isEmpty();
    }

    @Test
    void findAll_ShouldReturnAllUsers() {
        List<User> allUsers = userRepository.findAll();
        assertThat(allUsers).hasSize(3);
    }

    @Test
    void findById_ShouldReturnUser_WhenExists() {
        Optional<User> foundUser = userRepository.findById(adminUser.getId());
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getUsername()).isEqualTo("admin");
    }

    @Test
    void findById_ShouldReturnEmpty_WhenNotExists() {
        Optional<User> foundUser = userRepository.findById(UUID.randomUUID());
        assertThat(foundUser).isEmpty();
    }
}