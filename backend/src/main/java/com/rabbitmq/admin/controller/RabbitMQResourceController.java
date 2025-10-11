package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.aspect.AuditWriteOperation;
import com.rabbitmq.admin.dto.*;
import com.rabbitmq.admin.model.AuditOperationType;
import com.rabbitmq.admin.security.UserPrincipal;
import com.rabbitmq.admin.service.RabbitMQResourceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for RabbitMQ resource management endpoints.
 * Provides paginated access to connections, channels, exchanges, and queues
 * with proper security and validation.
 * Requires USER or ADMINISTRATOR role for access.
 */
@RestController
@RequestMapping("/api/rabbitmq/{clusterId}/resources")
@Validated
@PreAuthorize("hasRole('USER') or hasRole('ADMINISTRATOR')")
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
                        @RequestParam(required = false) String vhost,
                        @RequestParam(defaultValue = "false") boolean useRegex,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting exchanges for cluster {} by user {} - page: {}, pageSize: {}, name: {}, vhost: {}, useRegex: {}",
                                clusterId, principal.getUsername(), page, pageSize, name, vhost, useRegex);

                PaginationRequest request = new PaginationRequest(page, pageSize, name, vhost, useRegex);

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
                        @RequestParam(required = false) String vhost,
                        @RequestParam(defaultValue = "false") boolean useRegex,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting queues for cluster {} by user {} - page: {}, pageSize: {}, name: {}, vhost: {}, useRegex: {}",
                                clusterId, principal.getUsername(), page, pageSize, name, vhost, useRegex);

                PaginationRequest request = new PaginationRequest(page, pageSize, name, vhost, useRegex);

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

        /**
         * Create a new exchange in the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param request   the exchange creation request
         * @param principal the authenticated user
         * @return ResponseEntity indicating success or failure
         */
        @PutMapping("/exchanges")
        @AuditWriteOperation(operationType = AuditOperationType.CREATE_EXCHANGE, resourceType = "exchange", description = "Create a new exchange")
        public ResponseEntity<Void> createExchange(
                        @PathVariable UUID clusterId,
                        @RequestBody @Valid CreateExchangeRequest request,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Creating exchange {} of type {} in vhost {} for cluster {} by user {}",
                                request.getName(), request.getType(), request.getVhost(), clusterId,
                                principal.getUsername());

                try {
                        resourceService.createExchange(clusterId, request, principal.getUser()).block();
                        logger.debug("Successfully created exchange {} in vhost {} for cluster {}",
                                        request.getName(), request.getVhost(), clusterId);
                        return ResponseEntity.ok().build();
                } catch (Exception error) {
                        logger.error("Failed to create exchange {} in vhost {} for cluster {}: {}",
                                        request.getName(), request.getVhost(), clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Delete an exchange from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name (URL encoded)
         * @param name      the exchange name (URL encoded)
         * @param ifUnused  whether to delete only if unused (optional)
         * @param principal the authenticated user
         * @return ResponseEntity indicating success or failure
         */
        @DeleteMapping("/exchanges/{vhost}/{name}")
        @AuditWriteOperation(operationType = AuditOperationType.DELETE_EXCHANGE, resourceType = "exchange", description = "Delete an exchange")
        public ResponseEntity<Void> deleteExchange(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String name,
                        @RequestParam(required = false) Boolean ifUnused,
                        @AuthenticationPrincipal UserPrincipal principal) {

                // Decode base64-encoded vhost and URL-encoded exchange name
                try {
                        vhost = new String(java.util.Base64.getDecoder().decode(vhost),
                                        java.nio.charset.StandardCharsets.UTF_8);
                        name = java.net.URLDecoder.decode(name, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                        logger.error("Failed to decode path variables: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                }

                logger.debug("Deleting exchange {} in vhost {} for cluster {} by user {} (ifUnused: {})",
                                name, vhost, clusterId, principal.getUsername(), ifUnused);

                try {
                        resourceService.deleteExchange(clusterId, vhost, name, ifUnused, principal.getUser()).block();
                        logger.debug("Successfully deleted exchange {} in vhost {} for cluster {}",
                                        name, vhost, clusterId);
                        return ResponseEntity.ok().build();
                } catch (Exception error) {
                        logger.error("Failed to delete exchange {} in vhost {} for cluster {}: {}",
                                        name, vhost, clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Create a new queue in the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param request   the queue creation request
         * @param principal the authenticated user
         * @return ResponseEntity indicating success or failure
         */
        @PutMapping("/queues")
        @AuditWriteOperation(operationType = AuditOperationType.CREATE_QUEUE, resourceType = "queue", description = "Create a new queue")
        public ResponseEntity<Void> createQueue(
                        @PathVariable UUID clusterId,
                        @RequestBody @Valid CreateQueueRequest request,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Creating queue {} in vhost {} for cluster {} by user {}",
                                request.getName(), request.getVhost(), clusterId, principal.getUsername());

                try {
                        resourceService.createQueue(clusterId, request, principal.getUser()).block();
                        logger.debug("Successfully created queue {} in vhost {} for cluster {}",
                                        request.getName(), request.getVhost(), clusterId);
                        return ResponseEntity.ok().build();
                } catch (Exception error) {
                        logger.error("Failed to create queue {} in vhost {} for cluster {}: {}",
                                        request.getName(), request.getVhost(), clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Delete a queue from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name (URL encoded)
         * @param name      the queue name (URL encoded)
         * @param ifEmpty   whether to delete only if empty (optional)
         * @param ifUnused  whether to delete only if unused (optional)
         * @param principal the authenticated user
         * @return ResponseEntity indicating success or failure
         */
        @DeleteMapping("/queues/{vhost}/{name}")
        @AuditWriteOperation(operationType = AuditOperationType.DELETE_QUEUE, resourceType = "queue", description = "Delete a queue")
        public ResponseEntity<Void> deleteQueue(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String name,
                        @RequestParam(required = false) Boolean ifEmpty,
                        @RequestParam(required = false) Boolean ifUnused,
                        @AuthenticationPrincipal UserPrincipal principal) {

                // Decode base64-encoded vhost and URL-encoded queue name
                try {
                        vhost = new String(java.util.Base64.getDecoder().decode(vhost),
                                        java.nio.charset.StandardCharsets.UTF_8);
                        name = java.net.URLDecoder.decode(name, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                        logger.error("Failed to decode path variables: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                }

                logger.debug("Deleting queue {} in vhost {} for cluster {} by user {} (ifEmpty: {}, ifUnused: {})",
                                name, vhost, clusterId, principal.getUsername(), ifEmpty, ifUnused);

                resourceService.deleteQueue(clusterId, vhost, name, ifEmpty, ifUnused, principal.getUser())
                                .block();
                logger.debug("Successfully deleted queue {} in vhost {} for cluster {}",
                                name, vhost, clusterId);
                return ResponseEntity.ok().build();
        }

        /**
         * Purge all messages from a queue in the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name (URL encoded)
         * @param name      the queue name (URL encoded)
         * @param principal the authenticated user
         * @return ResponseEntity indicating success or failure
         */
        @DeleteMapping("/queues/{vhost}/{name}/contents")
        @AuditWriteOperation(operationType = AuditOperationType.PURGE_QUEUE, resourceType = "queue", description = "Purge all messages from a queue")
        public ResponseEntity<Void> purgeQueue(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String name,
                        @AuthenticationPrincipal UserPrincipal principal) {

                // Decode base64-encoded vhost and URL-encoded queue name
                try {
                        vhost = new String(java.util.Base64.getDecoder().decode(vhost),
                                        java.nio.charset.StandardCharsets.UTF_8);
                        name = java.net.URLDecoder.decode(name, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                        logger.error("Failed to decode path variables: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                }

                logger.debug("Purging queue {} in vhost {} for cluster {} by user {}",
                                name, vhost, clusterId, principal.getUsername());

                try {
                        resourceService.purgeQueue(clusterId, vhost, name, principal.getUser()).block();
                        logger.debug("Successfully purged queue {} in vhost {} for cluster {}",
                                        name, vhost, clusterId);
                        return ResponseEntity.ok().build();
                } catch (Exception error) {
                        logger.error("Failed to purge queue {} in vhost {} for cluster {}: {}",
                                        name, vhost, clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Create a binding from an exchange to a queue in the specified RabbitMQ
         * cluster.
         * 
         * @param clusterId   the cluster connection ID
         * @param vhost       the virtual host name (URL encoded)
         * @param source      the source exchange name (URL encoded)
         * @param destination the destination queue name (URL encoded)
         * @param request     the binding creation request
         * @param principal   the authenticated user
         * @return ResponseEntity indicating success or failure
         */
        @PostMapping("/bindings/{vhost}/e/{source}/q/{destination}")
        @AuditWriteOperation(operationType = AuditOperationType.CREATE_BINDING_QUEUE, resourceType = "binding", description = "Create a binding from exchange to queue")
        public ResponseEntity<Void> createExchangeToQueueBinding(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String source,
                        @PathVariable String destination,
                        @RequestBody @Valid CreateBindingRequest request,
                        @AuthenticationPrincipal UserPrincipal principal) {

                // Decode base64-encoded vhost and URL-encoded names
                try {
                        vhost = new String(java.util.Base64.getDecoder().decode(vhost),
                                        java.nio.charset.StandardCharsets.UTF_8);
                        source = java.net.URLDecoder.decode(source, java.nio.charset.StandardCharsets.UTF_8);
                        destination = java.net.URLDecoder.decode(destination, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                        logger.error("Failed to decode path variables: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                }

                logger.debug("Creating binding from exchange {} to queue {} with routing key {} in vhost {} for cluster {} by user {}",
                                source, destination, request.getRoutingKey(), vhost, clusterId,
                                principal.getUsername());

                try {
                        resourceService.createBinding(clusterId, vhost, source, destination, "q", request,
                                        principal.getUser()).block();
                        logger.debug("Successfully created binding from exchange {} to queue {} in vhost {} for cluster {}",
                                        source, destination, vhost, clusterId);
                        return ResponseEntity.ok().build();
                } catch (Exception error) {
                        logger.error("Failed to create binding from exchange {} to queue {} in vhost {} for cluster {}: {}",
                                        source, destination, vhost, clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Create a binding from an exchange to another exchange in the specified
         * RabbitMQ cluster.
         * 
         * @param clusterId   the cluster connection ID
         * @param vhost       the virtual host name (URL encoded)
         * @param source      the source exchange name (URL encoded)
         * @param destination the destination exchange name (URL encoded)
         * @param request     the binding creation request
         * @param principal   the authenticated user
         * @return ResponseEntity indicating success or failure
         */
        @PostMapping("/bindings/{vhost}/e/{source}/e/{destination}")
        @AuditWriteOperation(operationType = AuditOperationType.CREATE_BINDING_EXCHANGE, resourceType = "binding", description = "Create a binding from exchange to exchange")
        public ResponseEntity<Void> createExchangeToExchangeBinding(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String source,
                        @PathVariable String destination,
                        @RequestBody @Valid CreateBindingRequest request,
                        @AuthenticationPrincipal UserPrincipal principal) {

                // Decode base64-encoded vhost and URL-encoded names
                try {
                        vhost = new String(java.util.Base64.getDecoder().decode(vhost),
                                        java.nio.charset.StandardCharsets.UTF_8);
                        source = java.net.URLDecoder.decode(source, java.nio.charset.StandardCharsets.UTF_8);
                        destination = java.net.URLDecoder.decode(destination, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                        logger.error("Failed to decode path variables: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                }

                logger.debug("Creating binding from exchange {} to exchange {} with routing key {} in vhost {} for cluster {} by user {}",
                                source, destination, request.getRoutingKey(), vhost, clusterId,
                                principal.getUsername());

                try {
                        resourceService.createBinding(clusterId, vhost, source, destination, "e", request,
                                        principal.getUser()).block();
                        logger.debug("Successfully created binding from exchange {} to exchange {} in vhost {} for cluster {}",
                                        source, destination, vhost, clusterId);
                        return ResponseEntity.ok().build();
                } catch (Exception error) {
                        logger.error("Failed to create binding from exchange {} to exchange {} in vhost {} for cluster {}: {}",
                                        source, destination, vhost, clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Publish a message to an exchange in the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name (URL encoded)
         * @param exchange  the exchange name (URL encoded)
         * @param request   the message publishing request
         * @param principal the authenticated user
         * @return ResponseEntity with publish response indicating if message was routed
         */
        @PostMapping("/exchanges/{vhost}/{exchange}/publish")
        @AuditWriteOperation(operationType = AuditOperationType.PUBLISH_MESSAGE_EXCHANGE, resourceType = "message", description = "Publish a message to an exchange")
        public ResponseEntity<PublishResponse> publishMessage(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String exchange,
                        @RequestBody @Valid PublishMessageRequest request,
                        @AuthenticationPrincipal UserPrincipal principal) {

                // Decode base64-encoded vhost and URL-encoded exchange name
                try {
                        vhost = new String(java.util.Base64.getDecoder().decode(vhost),
                                        java.nio.charset.StandardCharsets.UTF_8);
                        exchange = java.net.URLDecoder.decode(exchange, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                        logger.error("Failed to decode path variables: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                }

                logger.debug("Publishing message to exchange {} in vhost {} for cluster {} by user {}",
                                exchange, vhost, clusterId, principal.getUsername());

                try {
                        PublishResponse result = resourceService.publishMessage(clusterId, vhost, exchange, request,
                                        principal.getUser());

                        logger.debug("Successfully published message to exchange {} in vhost {} for cluster {} (routed: {})",
                                        exchange, vhost, clusterId, result != null ? result.getRouted() : null);
                        return ResponseEntity.ok(result);
                } catch (Exception error) {
                        logger.error("Failed to publish message to exchange {} in vhost {} for cluster {}: {}",
                                        exchange, vhost, clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Publish a message directly to a queue using the default exchange in the
         * specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name (URL encoded)
         * @param queue     the queue name (URL encoded) - used as routing key
         * @param request   the message publishing request
         * @param principal the authenticated user
         * @return ResponseEntity with publish response indicating if message was routed
         */
        @PostMapping("/queues/{vhost}/{queue}/publish")
        @AuditWriteOperation(operationType = AuditOperationType.PUBLISH_MESSAGE_QUEUE, resourceType = "message", description = "Publish a message directly to a queue")
        public ResponseEntity<PublishResponse> publishToQueue(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String queue,
                        @RequestBody @Valid PublishMessageRequest request,
                        @AuthenticationPrincipal UserPrincipal principal) {

                // Decode base64-encoded vhost and URL-encoded queue name
                try {
                        vhost = new String(java.util.Base64.getDecoder().decode(vhost),
                                        java.nio.charset.StandardCharsets.UTF_8);
                        queue = java.net.URLDecoder.decode(queue, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                        logger.error("Failed to decode path variables: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                }

                logger.debug("Publishing message to queue {} in vhost {} for cluster {} by user {}",
                                queue, vhost, clusterId, principal.getUsername());

                try {
                        // Create a new request with the queue name as routing key for default exchange
                        PublishMessageRequest queueRequest = new PublishMessageRequest(
                                        queue, // Use queue name as routing key
                                        request.getProperties(),
                                        request.getPayload(),
                                        request.getPayloadEncoding());

                        PublishResponse result = resourceService.publishMessage(clusterId, vhost, "", queueRequest,
                                        principal.getUser());
                        logger.debug("Successfully published message to queue {} in vhost {} for cluster {} (routed: {})",
                                        queue, vhost, clusterId, result != null ? result.getRouted() : null);
                        return ResponseEntity.ok(result);
                } catch (Exception error) {
                        logger.error("Failed to publish message to queue {} in vhost {} for cluster {}: {}",
                                        queue, vhost, clusterId, error.getMessage());
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Get messages from a queue in the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name (base64 encoded)
         * @param queue     the queue name (URL encoded)
         * @param request   the message retrieval request
         * @param principal the authenticated user
         * @return ResponseEntity with list of messages
         */
        @PostMapping("/queues/{vhost}/{queue}/get")
        public ResponseEntity<List<MessageResponseDto>> getMessages(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String queue,
                        @RequestBody @Valid GetMessagesRequest request,
                        @AuthenticationPrincipal UserPrincipal principal) {

                // Decode base64-encoded vhost and URL-encoded queue name
                try {
                        vhost = new String(java.util.Base64.getDecoder().decode(vhost),
                                        java.nio.charset.StandardCharsets.UTF_8);
                        queue = java.net.URLDecoder.decode(queue, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                        logger.error("Failed to decode path variables: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                }

                logger.debug("Getting {} messages from queue {} in vhost {} for cluster {} by user {} (ackmode: {}, encoding: {})",
                                request.getCount(), queue, vhost, clusterId, principal.getUsername(),
                                request.getAckmode(), request.getEncoding());

                try {
                        List<MessageDto> messages = resourceService
                                        .getMessages(clusterId, vhost, queue, request, principal.getUser());

                        // Convert to response DTOs with camelCase field names
                        List<MessageResponseDto> result = messages.stream()
                                        .map(MessageResponseDto::fromMessageDto)
                                        .collect(java.util.stream.Collectors.toList());

                        logger.debug("Successfully returned {} messages from queue {} in vhost {} for cluster {}",
                                        result.size(), queue, vhost, clusterId);
                        return ResponseEntity.ok(result);
                } catch (Exception error) {
                        logger.error("Failed to get messages from queue {} in vhost {} for cluster {}: {}",
                                        queue, vhost, clusterId, error.getMessage(), error);
                        return ResponseEntity.status(500).build();
                }
        }

        /**
         * Create a shovel to move messages from one queue to another in the specified
         * RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param request   the shovel creation request
         * @param principal the authenticated user
         * @return ResponseEntity indicating success or failure
         */
        @PostMapping("/shovels")
        @AuditWriteOperation(operationType = AuditOperationType.MOVE_MESSAGES_QUEUE, resourceType = "shovel", description = "Create a shovel to move messages between queues")
        public ResponseEntity<Void> createShovel(
                        @PathVariable UUID clusterId,
                        @Valid @RequestBody CreateShovelRequest request,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Creating shovel {} in vhost {} from {} to {} for cluster {} by user {}",
                                request.getName(), request.getVhost(), request.getSourceQueue(),
                                request.getDestinationQueue(), clusterId, principal.getUsername());

                try {
                        resourceService.createShovel(clusterId, request, principal.getUser()).block();
                        logger.debug("Successfully created shovel {} in vhost {} for cluster {}",
                                        request.getName(), request.getVhost(), clusterId);
                        return ResponseEntity.ok().build();
                } catch (Exception error) {
                        logger.error("Failed to create shovel {} in vhost {} for cluster {}: {}",
                                        request.getName(), request.getVhost(), clusterId, error.getMessage());

                        // Check if error is due to shovel plugin not enabled
                        String errorMessage = error.getMessage();
                        if (errorMessage != null
                                        && (errorMessage.contains("404") || errorMessage.contains("not found"))) {
                                logger.warn("Shovel plugin might not be enabled in RabbitMQ cluster {}", clusterId);
                                return ResponseEntity.status(503).build(); // Service Unavailable
                        }

                        return ResponseEntity.status(500).build();
                }
        }

}