package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.dto.UpdateClusterConnectionRequest;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Simple test to verify that the UpdateClusterConnectionRequest DTO 
 * properly handles assignedUserIds field.
 * This test addresses the bug where user assignments were not being 
 * included in cluster update requests from the frontend.
 */
public class ClusterUserAssignmentTest {

    @Test
    public void testUpdateClusterConnectionRequestIncludesAssignedUserIds() {
        // Given
        UUID userId1 = UUID.randomUUID();
        UUID userId2 = UUID.randomUUID();
        Set<UUID> userIds = Set.of(userId1, userId2);

        // When
        UpdateClusterConnectionRequest request = new UpdateClusterConnectionRequest();
        request.setName("Test Cluster");
        request.setApiUrl("http://localhost:15672");
        request.setUsername("admin");
        request.setPassword("password");
        request.setDescription("Test description");
        request.setActive(true);
        request.setAssignedUserIds(userIds);

        // Then
        assertNotNull(request.getAssignedUserIds());
        assertEquals(2, request.getAssignedUserIds().size());
        assertTrue(request.getAssignedUserIds().contains(userId1));
        assertTrue(request.getAssignedUserIds().contains(userId2));
    }

    @Test
    public void testUpdateClusterConnectionRequestWithEmptyUserIds() {
        // Given
        UpdateClusterConnectionRequest request = new UpdateClusterConnectionRequest();
        request.setAssignedUserIds(Set.of());

        // Then
        assertNotNull(request.getAssignedUserIds());
        assertTrue(request.getAssignedUserIds().isEmpty());
    }

    @Test
    public void testUpdateClusterConnectionRequestWithNullUserIds() {
        // Given
        UpdateClusterConnectionRequest request = new UpdateClusterConnectionRequest();
        request.setAssignedUserIds(null);

        // Then
        assertNull(request.getAssignedUserIds());
    }
}