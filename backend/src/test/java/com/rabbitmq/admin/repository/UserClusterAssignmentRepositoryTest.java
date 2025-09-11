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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for UserClusterAssignmentRepository using @DataJpaTest.
 * Tests all custom query methods and assignment operations.
 */
@DataJpaTest
@ActiveProfiles("test")
class UserClusterAssignmentRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserClusterAssignmentRepository userClusterAssignmentRepository;

    private User user1;
    private User user2;
    private User user3;
    private ClusterConnection cluster1;
    private ClusterConnection cluster2;
    private ClusterConnection cluster3;

    @BeforeEach
    void setUp() {
        // Create test users
        user1 = new User("user1", "hashedPassword1", UserRole.USER);
        user2 = new User("user2", "hashedPassword2", UserRole.USER);
        user3 = new User("user3", "hashedPassword3", UserRole.USER);

        // Create test cluster connections
        cluster1 = new ClusterConnection("Cluster 1", "http://localhost:15672", "admin", "password");
        cluster2 = new ClusterConnection("Cluster 2", "http://localhost:15673", "admin", "password");
        cluster3 = new ClusterConnection("Cluster 3", "http://localhost:15674", "admin", "password");

        // Persist entities
        entityManager.persistAndFlush(user1);
        entityManager.persistAndFlush(user2);
        entityManager.persistAndFlush(user3);
        entityManager.persistAndFlush(cluster1);
        entityManager.persistAndFlush(cluster2);
        entityManager.persistAndFlush(cluster3);

        // Set up initial relationships using JPA entities
        user1.addClusterConnection(cluster1);
        user1.addClusterConnection(cluster2);
        user2.addClusterConnection(cluster1);

        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void assignUserToCluster_ShouldCreateAssignment() {
        // Assign user3 to cluster3
        userClusterAssignmentRepository.assignUserToCluster(user3.getId(), cluster3.getId());
        entityManager.flush();

        // Verify assignment was created
        boolean isAssigned = userClusterAssignmentRepository.isUserAssignedToCluster(user3.getId(), cluster3.getId());
        assertThat(isAssigned).isTrue();

        // Verify count increased
        long assignmentCount = userClusterAssignmentRepository.countAssignmentsForUser(user3.getId());
        assertThat(assignmentCount).isEqualTo(1);
    }

    @Test
    void assignUserToCluster_ShouldIgnoreDuplicateAssignment() {
        // Try to assign user1 to cluster1 again (already assigned)
        userClusterAssignmentRepository.assignUserToCluster(user1.getId(), cluster1.getId());
        entityManager.flush();

        // Verify no duplicate was created
        long assignmentCount = userClusterAssignmentRepository.countAssignmentsForUser(user1.getId());
        assertThat(assignmentCount).isEqualTo(2); // Should still be 2 (cluster1 and cluster2)
    }

    @Test
    void removeUserFromCluster_ShouldRemoveAssignment() {
        // Remove user1 from cluster1
        userClusterAssignmentRepository.removeUserFromCluster(user1.getId(), cluster1.getId());
        entityManager.flush();

        // Verify assignment was removed
        boolean isAssigned = userClusterAssignmentRepository.isUserAssignedToCluster(user1.getId(), cluster1.getId());
        assertThat(isAssigned).isFalse();

        // Verify count decreased
        long assignmentCount = userClusterAssignmentRepository.countAssignmentsForUser(user1.getId());
        assertThat(assignmentCount).isEqualTo(1); // Should be 1 (only cluster2 remaining)
    }

    @Test
    void removeAllUsersFromCluster_ShouldRemoveAllAssignmentsForCluster() {
        // Remove all users from cluster1
        userClusterAssignmentRepository.removeAllUsersFromCluster(cluster1.getId());
        entityManager.flush();

        // Verify no users are assigned to cluster1
        long assignmentCount = userClusterAssignmentRepository.countAssignmentsForCluster(cluster1.getId());
        assertThat(assignmentCount).isEqualTo(0);

        // Verify other assignments are intact
        long user1AssignmentCount = userClusterAssignmentRepository.countAssignmentsForUser(user1.getId());
        assertThat(user1AssignmentCount).isEqualTo(1); // Should still have cluster2
    }

    @Test
    void removeAllClustersFromUser_ShouldRemoveAllAssignmentsForUser() {
        // Remove all clusters from user1
        userClusterAssignmentRepository.removeAllClustersFromUser(user1.getId());
        entityManager.flush();

        // Verify user1 has no assignments
        long assignmentCount = userClusterAssignmentRepository.countAssignmentsForUser(user1.getId());
        assertThat(assignmentCount).isEqualTo(0);

        // Verify other assignments are intact
        long cluster1AssignmentCount = userClusterAssignmentRepository.countAssignmentsForCluster(cluster1.getId());
        assertThat(cluster1AssignmentCount).isEqualTo(1); // Should still have user2
    }

    @Test
    void isUserAssignedToCluster_ShouldReturnCorrectStatus() {
        // Test existing assignments
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user1.getId(), cluster1.getId())).isTrue();
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user1.getId(), cluster2.getId())).isTrue();
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user2.getId(), cluster1.getId())).isTrue();

        // Test non-existing assignments
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user1.getId(), cluster3.getId())).isFalse();
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user2.getId(), cluster2.getId())).isFalse();
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user3.getId(), cluster1.getId())).isFalse();
    }

    @Test
    void findAllAssignments_ShouldReturnAllAssignmentPairs() {
        List<Object[]> assignments = userClusterAssignmentRepository.findAllAssignments();
        assertThat(assignments).hasSize(3); // user1->cluster1, user1->cluster2, user2->cluster1

        // Convert UUIDs to strings for comparison since native queries return strings
        boolean foundUser1Cluster1 = assignments.stream()
                .anyMatch(assignment -> assignment[0].toString().equals(user1.getId().toString())
                        && assignment[1].toString().equals(cluster1.getId().toString()));
        boolean foundUser1Cluster2 = assignments.stream()
                .anyMatch(assignment -> assignment[0].toString().equals(user1.getId().toString())
                        && assignment[1].toString().equals(cluster2.getId().toString()));
        boolean foundUser2Cluster1 = assignments.stream()
                .anyMatch(assignment -> assignment[0].toString().equals(user2.getId().toString())
                        && assignment[1].toString().equals(cluster1.getId().toString()));

        assertThat(foundUser1Cluster1).isTrue();
        assertThat(foundUser1Cluster2).isTrue();
        assertThat(foundUser2Cluster1).isTrue();
    }

    @Test
    void countTotalAssignments_ShouldReturnCorrectCount() {
        long totalAssignments = userClusterAssignmentRepository.countTotalAssignments();
        assertThat(totalAssignments).isEqualTo(3);
    }

    @Test
    void countAssignmentsForUser_ShouldReturnCorrectCount() {
        long user1Assignments = userClusterAssignmentRepository.countAssignmentsForUser(user1.getId());
        assertThat(user1Assignments).isEqualTo(2);

        long user2Assignments = userClusterAssignmentRepository.countAssignmentsForUser(user2.getId());
        assertThat(user2Assignments).isEqualTo(1);

        long user3Assignments = userClusterAssignmentRepository.countAssignmentsForUser(user3.getId());
        assertThat(user3Assignments).isEqualTo(0);
    }

    @Test
    void countAssignmentsForCluster_ShouldReturnCorrectCount() {
        long cluster1Assignments = userClusterAssignmentRepository.countAssignmentsForCluster(cluster1.getId());
        assertThat(cluster1Assignments).isEqualTo(2);

        long cluster2Assignments = userClusterAssignmentRepository.countAssignmentsForCluster(cluster2.getId());
        assertThat(cluster2Assignments).isEqualTo(1);

        long cluster3Assignments = userClusterAssignmentRepository.countAssignmentsForCluster(cluster3.getId());
        assertThat(cluster3Assignments).isEqualTo(0);
    }

    @Test
    void batchAssignUsersToCluster_ShouldCreateMultipleAssignments() {
        UUID[] userIds = { user2.getId(), user3.getId() };

        // Assign multiple users to cluster2
        userClusterAssignmentRepository.batchAssignUsersToCluster(userIds, cluster2.getId());
        entityManager.flush();

        // Verify assignments were created
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user2.getId(), cluster2.getId())).isTrue();
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user3.getId(), cluster2.getId())).isTrue();

        // Verify counts
        long cluster2Assignments = userClusterAssignmentRepository.countAssignmentsForCluster(cluster2.getId());
        assertThat(cluster2Assignments).isEqualTo(3); // user1 (existing) + user2 + user3
    }

    @Test
    void batchAssignUserToClusters_ShouldCreateMultipleAssignments() {
        UUID[] clusterIds = { cluster2.getId(), cluster3.getId() };

        // Assign user3 to multiple clusters
        userClusterAssignmentRepository.batchAssignUserToClusters(user3.getId(), clusterIds);
        entityManager.flush();

        // Verify assignments were created
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user3.getId(), cluster2.getId())).isTrue();
        assertThat(userClusterAssignmentRepository.isUserAssignedToCluster(user3.getId(), cluster3.getId())).isTrue();

        // Verify count
        long user3Assignments = userClusterAssignmentRepository.countAssignmentsForUser(user3.getId());
        assertThat(user3Assignments).isEqualTo(2);
    }

    @Test
    void batchOperations_ShouldIgnoreDuplicates() {
        UUID[] userIds = { user1.getId(), user2.getId() }; // user1 already assigned to cluster1

        // Try to assign users to cluster1 (user1 already assigned, user2 already
        // assigned)
        userClusterAssignmentRepository.batchAssignUsersToCluster(userIds, cluster1.getId());
        entityManager.flush();

        // Verify no duplicates were created
        long cluster1Assignments = userClusterAssignmentRepository.countAssignmentsForCluster(cluster1.getId());
        assertThat(cluster1Assignments).isEqualTo(2); // Should still be 2
    }

    @Test
    void assignmentOperations_ShouldHandleNonExistentIds() {
        UUID nonExistentUserId = UUID.randomUUID();
        UUID nonExistentClusterId = UUID.randomUUID();

        // These operations should not fail but should not create any assignments
        userClusterAssignmentRepository.assignUserToCluster(nonExistentUserId, cluster1.getId());
        userClusterAssignmentRepository.assignUserToCluster(user1.getId(), nonExistentClusterId);
        entityManager.flush();

        // Verify no new assignments were created
        long totalAssignments = userClusterAssignmentRepository.countTotalAssignments();
        assertThat(totalAssignments).isEqualTo(3); // Should still be 3
    }
}