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
 * Unit tests for ClusterConnectionRepository using @DataJpaTest.
 * Tests all custom query methods and repository functionality.
 */
@DataJpaTest
@ActiveProfiles("test")
class ClusterConnectionRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ClusterConnectionRepository clusterConnectionRepository;

    private ClusterConnection activeCluster1;
    private ClusterConnection activeCluster2;
    private ClusterConnection inactiveCluster;
    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        // Create test cluster connections
        activeCluster1 = new ClusterConnection("Active Cluster 1", "http://localhost:15672", "admin", "password");
        activeCluster1.setDescription("First active cluster");
        activeCluster1.setActive(true);

        activeCluster2 = new ClusterConnection("Active Cluster 2", "http://localhost:15673", "admin", "password");
        activeCluster2.setDescription("Second active cluster");
        activeCluster2.setActive(true);

        inactiveCluster = new ClusterConnection("Inactive Cluster", "http://localhost:15674", "admin", "password");
        inactiveCluster.setDescription("Inactive cluster");
        inactiveCluster.setActive(false);

        // Create test users
        user1 = new User("user1", "hashedPassword1", UserRole.USER);
        user2 = new User("user2", "hashedPassword2", UserRole.USER);

        // Persist entities
        entityManager.persistAndFlush(activeCluster1);
        entityManager.persistAndFlush(activeCluster2);
        entityManager.persistAndFlush(inactiveCluster);
        entityManager.persistAndFlush(user1);
        entityManager.persistAndFlush(user2);

        // Set up relationships
        user1.addClusterConnection(activeCluster1);
        user1.addClusterConnection(activeCluster2);
        user2.addClusterConnection(activeCluster1);

        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void findByNameIgnoreCase_ShouldReturnCluster_WhenNameExists() {
        // Test exact case
        Optional<ClusterConnection> result = clusterConnectionRepository.findByNameIgnoreCase("Active Cluster 1");
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Active Cluster 1");

        // Test different case
        result = clusterConnectionRepository.findByNameIgnoreCase("ACTIVE CLUSTER 1");
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Active Cluster 1");

        // Test mixed case
        result = clusterConnectionRepository.findByNameIgnoreCase("AcTiVe ClUsTeR 1");
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Active Cluster 1");
    }

    @Test
    void findByNameIgnoreCase_ShouldReturnEmpty_WhenNameDoesNotExist() {
        Optional<ClusterConnection> result = clusterConnectionRepository.findByNameIgnoreCase("Nonexistent Cluster");
        assertThat(result).isEmpty();
    }

    @Test
    void existsByNameIgnoreCase_ShouldReturnTrue_WhenNameExists() {
        assertThat(clusterConnectionRepository.existsByNameIgnoreCase("Active Cluster 1")).isTrue();
        assertThat(clusterConnectionRepository.existsByNameIgnoreCase("ACTIVE CLUSTER 1")).isTrue();
        assertThat(clusterConnectionRepository.existsByNameIgnoreCase("AcTiVe ClUsTeR 1")).isTrue();
    }

    @Test
    void existsByNameIgnoreCase_ShouldReturnFalse_WhenNameDoesNotExist() {
        assertThat(clusterConnectionRepository.existsByNameIgnoreCase("Nonexistent Cluster")).isFalse();
    }

    @Test
    void findByActiveTrue_ShouldReturnOnlyActiveClusters() {
        List<ClusterConnection> activeClusters = clusterConnectionRepository.findByActiveTrue();
        assertThat(activeClusters).hasSize(2);
        assertThat(activeClusters).extracting(ClusterConnection::getName)
                .containsExactlyInAnyOrder("Active Cluster 1", "Active Cluster 2");
        assertThat(activeClusters).allMatch(ClusterConnection::getActive);
    }

    @Test
    void findByActiveFalse_ShouldReturnOnlyInactiveClusters() {
        List<ClusterConnection> inactiveClusters = clusterConnectionRepository.findByActiveFalse();
        assertThat(inactiveClusters).hasSize(1);
        assertThat(inactiveClusters.get(0).getName()).isEqualTo("Inactive Cluster");
        assertThat(inactiveClusters.get(0).getActive()).isFalse();
    }

    @Test
    void findByAssignedUsersId_ShouldReturnClustersAssignedToUser() {
        List<ClusterConnection> user1Clusters = clusterConnectionRepository.findByAssignedUsersId(user1.getId());
        assertThat(user1Clusters).hasSize(2);
        assertThat(user1Clusters).extracting(ClusterConnection::getName)
                .containsExactlyInAnyOrder("Active Cluster 1", "Active Cluster 2");

        List<ClusterConnection> user2Clusters = clusterConnectionRepository.findByAssignedUsersId(user2.getId());
        assertThat(user2Clusters).hasSize(1);
        assertThat(user2Clusters.get(0).getName()).isEqualTo("Active Cluster 1");
    }

    @Test
    void findActiveClustersByUserId_ShouldReturnOnlyActiveClustersForUser() {
        List<ClusterConnection> user1ActiveClusters = clusterConnectionRepository
                .findActiveClustersByUserId(user1.getId());
        assertThat(user1ActiveClusters).hasSize(2);
        assertThat(user1ActiveClusters).allMatch(ClusterConnection::getActive);

        List<ClusterConnection> user2ActiveClusters = clusterConnectionRepository
                .findActiveClustersByUserId(user2.getId());
        assertThat(user2ActiveClusters).hasSize(1);
        assertThat(user2ActiveClusters.get(0).getName()).isEqualTo("Active Cluster 1");
    }

    @Test
    void findClustersNotAssignedToUser_ShouldReturnUnassignedClusters() {
        List<ClusterConnection> user1UnassignedClusters = clusterConnectionRepository
                .findClustersNotAssignedToUser(user1.getId());
        assertThat(user1UnassignedClusters).hasSize(1);
        assertThat(user1UnassignedClusters.get(0).getName()).isEqualTo("Inactive Cluster");

        List<ClusterConnection> user2UnassignedClusters = clusterConnectionRepository
                .findClustersNotAssignedToUser(user2.getId());
        assertThat(user2UnassignedClusters).hasSize(2);
        assertThat(user2UnassignedClusters).extracting(ClusterConnection::getName)
                .containsExactlyInAnyOrder("Active Cluster 2", "Inactive Cluster");
    }

    @Test
    void findByApiUrl_ShouldReturnClustersWithMatchingApiUrl() {
        List<ClusterConnection> clusters = clusterConnectionRepository.findByApiUrl("http://localhost:15672");
        assertThat(clusters).hasSize(1);
        assertThat(clusters.get(0).getName()).isEqualTo("Active Cluster 1");
    }

    @Test
    void findClustersWithNoUserAssignments_ShouldReturnUnassignedClusters() {
        List<ClusterConnection> unassignedClusters = clusterConnectionRepository.findClustersWithNoUserAssignments();
        assertThat(unassignedClusters).hasSize(1);
        assertThat(unassignedClusters.get(0).getName()).isEqualTo("Inactive Cluster");
    }

    @Test
    void findClustersWithUserAssignments_ShouldReturnAssignedClusters() {
        List<ClusterConnection> assignedClusters = clusterConnectionRepository.findClustersWithUserAssignments();
        assertThat(assignedClusters).hasSize(2);
        assertThat(assignedClusters).extracting(ClusterConnection::getName)
                .containsExactlyInAnyOrder("Active Cluster 1", "Active Cluster 2");
    }

    @Test
    void countByActive_ShouldReturnCorrectCount() {
        long activeCount = clusterConnectionRepository.countByActive(true);
        assertThat(activeCount).isEqualTo(2);

        long inactiveCount = clusterConnectionRepository.countByActive(false);
        assertThat(inactiveCount).isEqualTo(1);
    }

    @Test
    void findAllByOrderByNameAsc_ShouldReturnClustersOrderedByName() {
        List<ClusterConnection> orderedClusters = clusterConnectionRepository.findAllByOrderByNameAsc();
        assertThat(orderedClusters).hasSize(3);
        assertThat(orderedClusters).extracting(ClusterConnection::getName)
                .containsExactly("Active Cluster 1", "Active Cluster 2", "Inactive Cluster");
    }

    @Test
    void findByActiveTrueOrderByNameAsc_ShouldReturnActiveClustersOrderedByName() {
        List<ClusterConnection> orderedActiveClusters = clusterConnectionRepository.findByActiveTrueOrderByNameAsc();
        assertThat(orderedActiveClusters).hasSize(2);
        assertThat(orderedActiveClusters).extracting(ClusterConnection::getName)
                .containsExactly("Active Cluster 1", "Active Cluster 2");
        assertThat(orderedActiveClusters).allMatch(ClusterConnection::getActive);
    }

    @Test
    void countActiveClusters_ShouldReturnActiveClusterCount() {
        long activeCount = clusterConnectionRepository.countActiveClusters();
        assertThat(activeCount).isEqualTo(2);
    }

    @Test
    void countInactiveClusters_ShouldReturnInactiveClusterCount() {
        long inactiveCount = clusterConnectionRepository.countInactiveClusters();
        assertThat(inactiveCount).isEqualTo(1);
    }

    @Test
    void save_ShouldPersistClusterConnection() {
        ClusterConnection newCluster = new ClusterConnection("New Cluster", "http://localhost:15675", "admin",
                "password");
        newCluster.setDescription("New test cluster");
        ClusterConnection savedCluster = clusterConnectionRepository.save(newCluster);

        assertThat(savedCluster.getId()).isNotNull();
        assertThat(savedCluster.getCreatedAt()).isNotNull();
        assertThat(savedCluster.getName()).isEqualTo("New Cluster");
        assertThat(savedCluster.getActive()).isTrue(); // Default value
    }

    @Test
    void delete_ShouldRemoveClusterConnection() {
        UUID clusterId = inactiveCluster.getId();
        clusterConnectionRepository.deleteById(clusterId);

        Optional<ClusterConnection> deletedCluster = clusterConnectionRepository.findById(clusterId);
        assertThat(deletedCluster).isEmpty();
    }

    @Test
    void findAll_ShouldReturnAllClusters() {
        List<ClusterConnection> allClusters = clusterConnectionRepository.findAll();
        assertThat(allClusters).hasSize(3);
    }

    @Test
    void findById_ShouldReturnCluster_WhenExists() {
        Optional<ClusterConnection> foundCluster = clusterConnectionRepository.findById(activeCluster1.getId());
        assertThat(foundCluster).isPresent();
        assertThat(foundCluster.get().getName()).isEqualTo("Active Cluster 1");
    }

    @Test
    void findById_ShouldReturnEmpty_WhenNotExists() {
        Optional<ClusterConnection> foundCluster = clusterConnectionRepository.findById(UUID.randomUUID());
        assertThat(foundCluster).isEmpty();
    }
}