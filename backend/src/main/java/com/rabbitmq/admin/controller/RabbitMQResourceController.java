package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.dto.*;
import com.rabbitmq.admin.security.UserPrincipal;
import com.rabbitmq.admin.service.RabbitMQResourceService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for RabbitMQ resource management endpoints.
 * Provides paginated access to connections, channels, exchanges, and queues
 * with proper security and validation.
 */
@RestController
@RequestMapping("/api/rabbitmq/{clusterId}/resources")
@Validated
public class RabbitMQResourceController {

        private static final Logger logger = LoggerFactory.getLogger(RabbitMQResourceController.class);

        private final RabbitMQResourceService resourceService;

        public RabbitMQResourceController(RabbitMQResourceService resourceService) {
                this.resourceService = resourceService;
        }

        /**
         * Get paginated connections from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param page      page number (0-based, default: 0)
         * @param pageSize  number of items per page (default: 50, max: 500)
         * @param name      optional name filter
         * @param useRegex  whether to use regex for name filtering (default: false)
         * @param principal the authenticated user
         * @return ResponseEntity with paginated connection data
         */
        @GetMapping("/connections")
        public ResponseEntity<PagedResponse<ConnectionDto>> getConnections(
                        @PathVariable UUID clusterId,
                        @RequestParam(defaultValue = "1") @Min(value = 1, message = "Page must be at least 1") int page,
                        @RequestParam(defaultValue = "50") @Min(value = 1, message = "Page size must be at least 1") @Max(value = 500, message = "Page size cannot exceed 500") int pageSize,
                        @RequestParam(required = false) String name,
                        @RequestParam(defaultValue = "false") boolean useRegex,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting connections for cluster {} by user {} - page: {}, pageSize: {}, name: {}, useRegex: {}",
                                clusterId, principal.getUsername(), page, pageSize, name, useRegex);

                PaginationRequest request = new PaginationRequest(page, pageSize, name, useRegex);

                try {
                        PagedResponse<ConnectionDto> result = resourceService
                                        .getConnections(clusterId, request, principal.getUser()).block();
                        logger.debug("Successfully returned {} connections for cluster {}",
                                        result != null ? result.getItems().size() : 0, clusterId);
                        return ResponseEntity.ok(result);
                } catch (Exception error) {
                        logger.error("Failed to get connections for cluster {}: {}", clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Get paginated channels from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param page      page number (0-based, default: 0)
         * @param pageSize  number of items per page (default: 50, max: 500)
         * @param name      optional name filter
         * @param useRegex  whether to use regex for name filtering (default: false)
         * @param principal the authenticated user
         * @return ResponseEntity with paginated channel data
         */
        @GetMapping("/channels")
        public ResponseEntity<PagedResponse<ChannelDto>> getChannels(
                        @PathVariable UUID clusterId,
                        @RequestParam(defaultValue = "1") @Min(value = 1, message = "Page must be at least 1") int page,
                        @RequestParam(defaultValue = "50") @Min(value = 1, message = "Page size must be at least 1") @Max(value = 500, message = "Page size cannot exceed 500") int pageSize,
                        @RequestParam(required = false) String name,
                        @RequestParam(defaultValue = "false") boolean useRegex,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting channels for cluster {} by user {} - page: {}, pageSize: {}, name: {}, useRegex: {}",
                                clusterId, principal.getUsername(), page, pageSize, name, useRegex);

                PaginationRequest request = new PaginationRequest(page, pageSize, name, useRegex);

                try {
                        PagedResponse<ChannelDto> result = resourceService
                                        .getChannels(clusterId, request, principal.getUser()).block();
                        logger.debug("Successfully returned {} channels for cluster {}",
                                        result != null ? result.getItems().size() : 0, clusterId);
                        return ResponseEntity.ok(result);
                } catch (Exception error) {
                        logger.error("Failed to get channels for cluster {}: {}", clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Get paginated exchanges from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param page      page number (0-based, default: 0)
         * @param pageSize  number of items per page (default: 50, max: 500)
         * @param name      optional name filter
         * @param useRegex  whether to use regex for name filtering (default: false)
         * @param principal the authenticated user
         * @return ResponseEntity with paginated exchange data
         */
        @GetMapping("/exchanges")
        public ResponseEntity<PagedResponse<ExchangeDto>> getExchanges(
                        @PathVariable UUID clusterId,
                        @RequestParam(defaultValue = "1") @Min(value = 1, message = "Page must be at least 1") int page,
                        @RequestParam(defaultValue = "50") @Min(value = 1, message = "Page size must be at least 1") @Max(value = 500, message = "Page size cannot exceed 500") int pageSize,
                        @RequestParam(required = false) String name,
                        @RequestParam(defaultValue = "false") boolean useRegex,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting exchanges for cluster {} by user {} - page: {}, pageSize: {}, name: {}, useRegex: {}",
                                clusterId, principal.getUsername(), page, pageSize, name, useRegex);

                PaginationRequest request = new PaginationRequest(page, pageSize, name, useRegex);

                try {
                        PagedResponse<ExchangeDto> result = resourceService
                                        .getExchanges(clusterId, request, principal.getUser()).block();
                        logger.debug("Successfully returned {} exchanges for cluster {}",
                                        result != null ? result.getItems().size() : 0, clusterId);
                        return ResponseEntity.ok(result);
                } catch (Exception error) {
                        logger.error("Failed to get exchanges for cluster {}: {}", clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Get paginated queues from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param page      page number (0-based, default: 0)
         * @param pageSize  number of items per page (default: 50, max: 500)
         * @param name      optional name filter
         * @param useRegex  whether to use regex for name filtering (default: false)
         * @param principal the authenticated user
         * @return ResponseEntity with paginated queue data
         */
        @GetMapping("/queues")
        public ResponseEntity<PagedResponse<QueueDto>> getQueues(
                        @PathVariable UUID clusterId,
                        @RequestParam(defaultValue = "1") @Min(value = 1, message = "Page must be at least 1") int page,
                        @RequestParam(defaultValue = "50") @Min(value = 1, message = "Page size must be at least 1") @Max(value = 500, message = "Page size cannot exceed 500") int pageSize,
                        @RequestParam(required = false) String name,
                        @RequestParam(defaultValue = "false") boolean useRegex,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting queues for cluster {} by user {} - page: {}, pageSize: {}, name: {}, useRegex: {}",
                                clusterId, principal.getUsername(), page, pageSize, name, useRegex);

                PaginationRequest request = new PaginationRequest(page, pageSize, name, useRegex);

                try {
                        PagedResponse<QueueDto> result = resourceService
                                        .getQueues(clusterId, request, principal.getUser()).block();
                        logger.debug("Successfully returned {} queues for cluster {}",
                                        result != null ? result.getItems().size() : 0, clusterId);
                        return ResponseEntity.ok(result);
                } catch (Exception error) {
                        logger.error("Failed to get queues for cluster {}: {}", clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Get bindings for a specific exchange from the specified RabbitMQ cluster.
         * 
         * @param clusterId    the cluster connection ID
         * @param vhost        the virtual host name (URL encoded)
         * @param exchangeName the name of the exchange (URL encoded)
         * @param principal    the authenticated user
         * @return Mono with list of binding data
         */
        @GetMapping("/exchanges/{vhost}/{exchangeName}/bindings")
        public ResponseEntity<List<BindingDto>> getExchangeBindings(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String exchangeName,
                        @AuthenticationPrincipal UserPrincipal principal) {

                // Decode base64-encoded vhost and URL-encoded exchange name
                try {
                        vhost = new String(java.util.Base64.getDecoder().decode(vhost),
                                        java.nio.charset.StandardCharsets.UTF_8);
                        exchangeName = java.net.URLDecoder.decode(exchangeName,
                                        java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                        logger.error("Failed to decode path variables: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                }

                logger.info("Controller: Getting bindings for exchange {} in vhost {} in cluster {} by user {}",
                                exchangeName, vhost, clusterId, principal.getUsername());

                try {
                        List<BindingDto> result = resourceService
                                        .getExchangeBindings(clusterId, vhost, exchangeName, principal.getUser())
                                        .block();
                        logger.debug("Successfully returned {} bindings for exchange {} in vhost {} in cluster {}",
                                        result != null ? result.size() : 0, exchangeName, vhost, clusterId);
                        return ResponseEntity.ok(result);
                } catch (Exception error) {
                        logger.error("Failed to get bindings for exchange {} in vhost {} in cluster {}: {}",
                                        exchangeName, vhost, clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Get bindings for a specific queue from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name (URL encoded)
         * @param queueName the name of the queue (URL encoded)
         * @param principal the authenticated user
         * @return Mono with list of binding data
         */
        @GetMapping("/queues/{vhost}/{queueName}/bindings")
        public ResponseEntity<List<BindingDto>> getQueueBindings(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String queueName,
                        @AuthenticationPrincipal UserPrincipal principal) {

                // Decode base64-encoded vhost and URL-encoded queue name
                try {
                        vhost = new String(java.util.Base64.getDecoder().decode(vhost),
                                        java.nio.charset.StandardCharsets.UTF_8);
                        queueName = java.net.URLDecoder.decode(queueName, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                        logger.error("Failed to decode path variables: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                }

                logger.debug("Getting bindings for queue {} in vhost {} in cluster {} by user {}",
                                queueName, vhost, clusterId, principal.getUsername());

                try {
                        List<BindingDto> result = resourceService
                                        .getQueueBindings(clusterId, vhost, queueName, principal.getUser()).block();
                        logger.debug("Successfully returned {} bindings for queue {} in vhost {} in cluster {}",
                                        result != null ? result.size() : 0, queueName, vhost, clusterId);
                        return ResponseEntity.ok(result);
                } catch (Exception error) {
                        logger.error("Failed to get bindings for queue {} in vhost {} in cluster {}: {}",
                                        queueName, vhost, clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

}