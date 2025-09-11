package com.rabbitmq.admin.service;

import com.rabbitmq.admin.exception.DuplicateResourceException;
import com.rabbitmq.admin.exception.UserNotFoundException;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import com.rabbitmq.admin.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClusterConnectionRepository clusterConnectionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private ClusterConnection testCluster;
    private UUID testUserId;
    private UUID testClusterId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testClusterId = UUID.randomUUID();

        testUser = new User("testuser", "hashedPassword", UserRole.USER);
        testUser.setId(testUserId);

        testCluster = new ClusterConnection("Test Cluster", "http://localhost:15672", "admin", "password");
        testCluster.setId(testClusterId);
    }

    @Test
    void createUser_WithValidData_ShouldCreateUser() {
        // Arrange
        String username = "newuser";
        String password = "StrongPass123!";
        UserRole role = UserRole.USER;
        String hashedPassword = "hashedStrongPass123!";

        when(userRepository.existsByUsernameIgnoreCase(username)).thenReturn(false);
        when(passwordEncoder.encode(password)).thenReturn(hashedPassword);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        // Act
        User result = userService.createUser(username, password, role);

        // Assert
        assertNotNull(result);
        assertEquals(username, result.getUsername());
        assertEquals(hashedPassword, result.getPasswordHash());
        assertEquals(role, result.getRole());
        verify(userRepository).existsByUsernameIgnoreCase(username);
        verify(passwordEncoder).encode(password);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_WithExistingUsername_ShouldThrowException() {
        // Arrange
        String username = "existinguser";
        String password = "StrongPass123!";
        UserRole role = UserRole.USER;

        when(userRepository.existsByUsernameIgnoreCase(username)).thenReturn(true);

        // Act & Assert
        DuplicateResourceException exception = assertThrows(DuplicateResourceException.class,
                () -> userService.createUser(username, password, role));

        assertEquals("Username already exists: " + username, exception.getMessage());
        verify(userRepository).existsByUsernameIgnoreCase(username);
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_WithWeakPassword_ShouldThrowException() {
        // Arrange
        String username = "newuser";
        String weakPassword = "weak";
        UserRole role = UserRole.USER;

        when(userRepository.existsByUsernameIgnoreCase(username)).thenReturn(false);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> userService.createUser(username, weakPassword, role));

        assertTrue(exception.getMessage().contains("Password must be at least 8 characters long"));
        verify(userRepository).existsByUsernameIgnoreCase(username);
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_WithPasswordMissingUppercase_ShouldThrowException() {
        // Arrange
        String username = "newuser";
        String password = "strongpass123!";
        UserRole role = UserRole.USER;

        when(userRepository.existsByUsernameIgnoreCase(username)).thenReturn(false);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> userService.createUser(username, password, role));

        assertTrue(exception.getMessage().contains("Password must contain at least one uppercase letter"));
    }

    @Test
    void updateUser_WithValidData_ShouldUpdateUser() {
        // Arrange
        String newUsername = "updateduser";
        String newPassword = "NewStrongPass123!";
        UserRole newRole = UserRole.ADMINISTRATOR;
        String hashedNewPassword = "hashedNewStrongPass123!";

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByUsernameIgnoreCase(newUsername)).thenReturn(false);
        when(passwordEncoder.encode(newPassword)).thenReturn(hashedNewPassword);
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        User result = userService.updateUser(testUserId, newUsername, newPassword, newRole);

        // Assert
        assertNotNull(result);
        assertEquals(newUsername, result.getUsername());
        assertEquals(hashedNewPassword, result.getPasswordHash());
        assertEquals(newRole, result.getRole());
        verify(userRepository).findById(testUserId);
        verify(userRepository).existsByUsernameIgnoreCase(newUsername);
        verify(passwordEncoder).encode(newPassword);
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUser_WithNonExistentUser_ShouldThrowException() {
        // Arrange
        UUID nonExistentUserId = UUID.randomUUID();
        when(userRepository.findById(nonExistentUserId)).thenReturn(Optional.empty());

        // Act & Assert
        UserNotFoundException exception = assertThrows(UserNotFoundException.class,
                () -> userService.updateUser(nonExistentUserId, "newusername", "NewPass123!", UserRole.USER));

        assertEquals("User not found with ID: " + nonExistentUserId, exception.getMessage());
        verify(userRepository).findById(nonExistentUserId);
    }

    @Test
    void getUserById_WithExistingUser_ShouldReturnUser() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // Act
        User result = userService.getUserById(testUserId);

        // Assert
        assertNotNull(result);
        assertEquals(testUser, result);
        verify(userRepository).findById(testUserId);
    }

    @Test
    void getUserById_WithNonExistentUser_ShouldThrowException() {
        // Arrange
        UUID nonExistentUserId = UUID.randomUUID();
        when(userRepository.findById(nonExistentUserId)).thenReturn(Optional.empty());

        // Act & Assert
        UserNotFoundException exception = assertThrows(UserNotFoundException.class,
                () -> userService.getUserById(nonExistentUserId));

        assertEquals("User not found with ID: " + nonExistentUserId, exception.getMessage());
        verify(userRepository).findById(nonExistentUserId);
    }

    @Test
    void getUserByUsername_WithExistingUser_ShouldReturnUser() {
        // Arrange
        String username = "testuser";
        when(userRepository.findByUsernameIgnoreCase(username)).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = userService.getUserByUsername(username);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testUser, result.get());
        verify(userRepository).findByUsernameIgnoreCase(username);
    }

    @Test
    void getAllUsers_ShouldReturnAllUsers() {
        // Arrange
        List<User> users = Arrays.asList(testUser, new User("user2", "hash2", UserRole.ADMINISTRATOR));
        when(userRepository.findAll()).thenReturn(users);

        // Act
        List<User> result = userService.getAllUsers();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(users, result);
        verify(userRepository).findAll();
    }

    @Test
    void getUsersByRole_ShouldReturnUsersWithSpecificRole() {
        // Arrange
        UserRole role = UserRole.USER;
        List<User> users = Arrays.asList(testUser);
        when(userRepository.findByRole(role)).thenReturn(users);

        // Act
        List<User> result = userService.getUsersByRole(role);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(users, result);
        verify(userRepository).findByRole(role);
    }

    @Test
    void deleteUser_WithExistingUser_ShouldDeleteUser() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        userService.deleteUser(testUserId);

        // Assert
        verify(userRepository).findById(testUserId);
        verify(userRepository).save(testUser);
        verify(userRepository).delete(testUser);
    }

    @Test
    void assignClusterToUser_WithValidData_ShouldAssignCluster() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(clusterConnectionRepository.findById(testClusterId)).thenReturn(Optional.of(testCluster));
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        userService.assignClusterToUser(testUserId, testClusterId);

        // Assert
        assertTrue(testUser.getAssignedClusters().contains(testCluster));
        assertTrue(testCluster.getAssignedUsers().contains(testUser));
        verify(userRepository).findById(testUserId);
        verify(clusterConnectionRepository).findById(testClusterId);
        verify(userRepository).save(testUser);
    }

    @Test
    void assignClusterToUser_WithNonExistentCluster_ShouldThrowException() {
        // Arrange
        UUID nonExistentClusterId = UUID.randomUUID();
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(clusterConnectionRepository.findById(nonExistentClusterId)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> userService.assignClusterToUser(testUserId, nonExistentClusterId));

        assertEquals("Cluster connection not found with ID: " + nonExistentClusterId, exception.getMessage());
        verify(userRepository).findById(testUserId);
        verify(clusterConnectionRepository).findById(nonExistentClusterId);
    }

    @Test
    void removeClusterFromUser_WithValidData_ShouldRemoveCluster() {
        // Arrange
        testUser.addClusterConnection(testCluster);
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(clusterConnectionRepository.findById(testClusterId)).thenReturn(Optional.of(testCluster));
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        userService.removeClusterFromUser(testUserId, testClusterId);

        // Assert
        assertFalse(testUser.getAssignedClusters().contains(testCluster));
        assertFalse(testCluster.getAssignedUsers().contains(testUser));
        verify(userRepository).findById(testUserId);
        verify(clusterConnectionRepository).findById(testClusterId);
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUserClusterAssignments_WithValidData_ShouldUpdateAssignments() {
        // Arrange
        ClusterConnection cluster2 = new ClusterConnection("Cluster 2", "http://localhost:15673", "admin", "pass");
        cluster2.setId(UUID.randomUUID());

        Set<UUID> clusterIds = Set.of(testClusterId, cluster2.getId());

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(clusterConnectionRepository.findById(testClusterId)).thenReturn(Optional.of(testCluster));
        when(clusterConnectionRepository.findById(cluster2.getId())).thenReturn(Optional.of(cluster2));
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        userService.updateUserClusterAssignments(testUserId, clusterIds);

        // Assert
        assertEquals(2, testUser.getAssignedClusters().size());
        assertTrue(testUser.getAssignedClusters().contains(testCluster));
        assertTrue(testUser.getAssignedClusters().contains(cluster2));
        verify(userRepository).findById(testUserId);
        verify(clusterConnectionRepository).findById(testClusterId);
        verify(clusterConnectionRepository).findById(cluster2.getId());
        verify(userRepository).save(testUser);
    }

    @Test
    void usernameExists_WithExistingUsername_ShouldReturnTrue() {
        // Arrange
        String username = "existinguser";
        when(userRepository.existsByUsernameIgnoreCase(username)).thenReturn(true);

        // Act
        boolean result = userService.usernameExists(username);

        // Assert
        assertTrue(result);
        verify(userRepository).existsByUsernameIgnoreCase(username);
    }

    @Test
    void usernameExists_WithNonExistentUsername_ShouldReturnFalse() {
        // Arrange
        String username = "nonexistentuser";
        when(userRepository.existsByUsernameIgnoreCase(username)).thenReturn(false);

        // Act
        boolean result = userService.usernameExists(username);

        // Assert
        assertFalse(result);
        verify(userRepository).existsByUsernameIgnoreCase(username);
    }

    @Test
    void countUsersByRole_ShouldReturnCorrectCount() {
        // Arrange
        UserRole role = UserRole.USER;
        long expectedCount = 5L;
        when(userRepository.countByRole(role)).thenReturn(expectedCount);

        // Act
        long result = userService.countUsersByRole(role);

        // Assert
        assertEquals(expectedCount, result);
        verify(userRepository).countByRole(role);
    }

    @Test
    void getUsersAssignedToCluster_ShouldReturnAssignedUsers() {
        // Arrange
        List<User> assignedUsers = Arrays.asList(testUser);
        when(userRepository.findByAssignedClustersId(testClusterId)).thenReturn(assignedUsers);

        // Act
        List<User> result = userService.getUsersAssignedToCluster(testClusterId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(assignedUsers, result);
        verify(userRepository).findByAssignedClustersId(testClusterId);
    }

    @Test
    void getUsersWithNoClusterAssignments_ShouldReturnUnassignedUsers() {
        // Arrange
        List<User> unassignedUsers = Arrays.asList(testUser);
        when(userRepository.findUsersWithNoClusterAssignments()).thenReturn(unassignedUsers);

        // Act
        List<User> result = userService.getUsersWithNoClusterAssignments();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(unassignedUsers, result);
        verify(userRepository).findUsersWithNoClusterAssignments();
    }
}