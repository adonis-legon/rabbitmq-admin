package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.security.UserPrincipal;
import com.rabbitmq.admin.service.RabbitMQProxyService;
import com.rabbitmq.admin.service.RabbitMQProxyService.RabbitMQProxyException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.UUID;

/**
 * Controller for proxying requests to RabbitMQ Management API.
 * Provides cluster-specific endpoints with dynamic routing based on clusterId
 * parameter.
 */
@RestController
@RequestMapping("/api/rabbitmq")
@PreAuthorize("hasRole('USER') or hasRole('ADMINISTRATOR')")
public class RabbitMQController {

        private static final Logger logger = LoggerFactory.getLogger(RabbitMQController.class);

        private final RabbitMQProxyService proxyService;

        public RabbitMQController(RabbitMQProxyService proxyService) {
                this.proxyService = proxyService;
        }

        /**
         * Get RabbitMQ cluster overview information.
         * 
         * @param clusterId the cluster connection ID
         * @param principal the authenticated user
         * @return Mono with cluster overview data
         */
        @GetMapping("/{clusterId}/overview")
        public Mono<ResponseEntity<Object>> getOverview(
                        @PathVariable UUID clusterId,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting overview for cluster {} by user {}", clusterId, principal.getUsername());

                return proxyService.get(clusterId, "/api/overview", Object.class, principal.getUser())
                                .map(ResponseEntity::ok)
                                .onErrorResume(this::handleError);
        }

        /**
         * Get all queues from a RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param principal the authenticated user
         * @return Mono with queues data
         */
        @GetMapping("/{clusterId}/queues")
        public Mono<ResponseEntity<Object>> getQueues(
                        @PathVariable UUID clusterId,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting queues for cluster {} by user {}", clusterId, principal.getUsername());

                return proxyService.get(clusterId, "/api/queues", Object.class, principal.getUser())
                                .map(ResponseEntity::ok)
                                .onErrorResume(this::handleError);
        }

        /**
         * Get specific queue information from a RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host (URL encoded)
         * @param queueName the queue name (URL encoded)
         * @param principal the authenticated user
         * @return Mono with queue data
         */
        @GetMapping("/{clusterId}/queues/{vhost}/{queueName}")
        public Mono<ResponseEntity<Object>> getQueue(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String queueName,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting queue {}/{} for cluster {} by user {}",
                                vhost, queueName, clusterId, principal.getUsername());

                String path = String.format("/api/queues/%s/%s", vhost, queueName);
                return proxyService.get(clusterId, path, Object.class, principal.getUser())
                                .map(ResponseEntity::ok)
                                .onErrorResume(this::handleError);
        }

        /**
         * Create or update a queue in a RabbitMQ cluster.
         * 
         * @param clusterId   the cluster connection ID
         * @param vhost       the virtual host (URL encoded)
         * @param queueName   the queue name (URL encoded)
         * @param queueConfig the queue configuration
         * @param principal   the authenticated user
         * @return Mono with creation result
         */
        @PutMapping("/{clusterId}/queues/{vhost}/{queueName}")
        public Mono<ResponseEntity<Object>> createOrUpdateQueue(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String queueName,
                        @RequestBody Map<String, Object> queueConfig,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Creating/updating queue {}/{} for cluster {} by user {}",
                                vhost, queueName, clusterId, principal.getUsername());

                String path = String.format("/api/queues/%s/%s", vhost, queueName);
                return proxyService.put(clusterId, path, queueConfig, Object.class, principal.getUser())
                                .map(result -> ResponseEntity.status(HttpStatus.CREATED).body(result))
                                .onErrorResume(this::handleError);
        }

        /**
         * Delete a queue from a RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host (URL encoded)
         * @param queueName the queue name (URL encoded)
         * @param principal the authenticated user
         * @return Mono with deletion result
         */
        @DeleteMapping("/{clusterId}/queues/{vhost}/{queueName}")
        public Mono<ResponseEntity<Void>> deleteQueue(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String queueName,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Deleting queue {}/{} for cluster {} by user {}",
                                vhost, queueName, clusterId, principal.getUsername());

                String path = String.format("/api/queues/%s/%s", vhost, queueName);
                return proxyService.delete(clusterId, path, principal.getUser())
                                .map(result -> ResponseEntity.noContent().<Void>build())
                                .onErrorResume(this::handleError);
        }

        /**
         * Get all exchanges from a RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param principal the authenticated user
         * @return Mono with exchanges data
         */
        @GetMapping("/{clusterId}/exchanges")
        public Mono<ResponseEntity<Object>> getExchanges(
                        @PathVariable UUID clusterId,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting exchanges for cluster {} by user {}", clusterId, principal.getUsername());

                return proxyService.get(clusterId, "/api/exchanges", Object.class, principal.getUser())
                                .map(ResponseEntity::ok)
                                .onErrorResume(this::handleError);
        }

        /**
         * Get specific exchange information from a RabbitMQ cluster.
         * 
         * @param clusterId    the cluster connection ID
         * @param vhost        the virtual host (URL encoded)
         * @param exchangeName the exchange name (URL encoded)
         * @param principal    the authenticated user
         * @return Mono with exchange data
         */
        @GetMapping("/{clusterId}/exchanges/{vhost}/{exchangeName}")
        public Mono<ResponseEntity<Object>> getExchange(
                        @PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String exchangeName,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting exchange {}/{} for cluster {} by user {}",
                                vhost, exchangeName, clusterId, principal.getUsername());

                String path = String.format("/api/exchanges/%s/%s", vhost, exchangeName);
                return proxyService.get(clusterId, path, Object.class, principal.getUser())
                                .map(ResponseEntity::ok)
                                .onErrorResume(this::handleError);
        }

        /**
         * Get all connections from a RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param principal the authenticated user
         * @return Mono with connections data
         */
        @GetMapping("/{clusterId}/connections")
        public Mono<ResponseEntity<Object>> getConnections(
                        @PathVariable UUID clusterId,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting connections for cluster {} by user {}", clusterId, principal.getUsername());

                return proxyService.get(clusterId, "/api/connections", Object.class, principal.getUser())
                                .map(ResponseEntity::ok)
                                .onErrorResume(this::handleError);
        }

        /**
         * Get all channels from a RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param principal the authenticated user
         * @return Mono with channels data
         */
        @GetMapping("/{clusterId}/channels")
        public Mono<ResponseEntity<Object>> getChannels(
                        @PathVariable UUID clusterId,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting channels for cluster {} by user {}", clusterId, principal.getUsername());

                return proxyService.get(clusterId, "/api/channels", Object.class, principal.getUser())
                                .map(ResponseEntity::ok)
                                .onErrorResume(this::handleError);
        }

        /**
         * Get all nodes from a RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param principal the authenticated user
         * @return Mono with nodes data
         */
        @GetMapping("/{clusterId}/nodes")
        public Mono<ResponseEntity<Object>> getNodes(
                        @PathVariable UUID clusterId,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting nodes for cluster {} by user {}", clusterId, principal.getUsername());

                return proxyService.get(clusterId, "/api/nodes", Object.class, principal.getUser())
                                .map(ResponseEntity::ok)
                                .onErrorResume(this::handleError);
        }

        /**
         * Get all virtual hosts from a RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param principal the authenticated user
         * @return Mono with virtual hosts data
         */
        @GetMapping("/{clusterId}/vhosts")
        public Mono<ResponseEntity<Object>> getVirtualHosts(
                        @PathVariable UUID clusterId,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting virtual hosts for cluster {} by user {}", clusterId, principal.getUsername());

                return proxyService.get(clusterId, "/api/vhosts", Object.class, principal.getUser())
                                .map(ResponseEntity::ok)
                                .onErrorResume(this::handleError);
        }

        /**
         * Get all users from a RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param principal the authenticated user
         * @return Mono with users data
         */
        @GetMapping("/{clusterId}/users")
        public Mono<ResponseEntity<Object>> getRabbitMQUsers(
                        @PathVariable UUID clusterId,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Getting RabbitMQ users for cluster {} by user {}", clusterId, principal.getUsername());

                return proxyService.get(clusterId, "/api/users", Object.class, principal.getUser())
                                .map(ResponseEntity::ok)
                                .onErrorResume(this::handleError);
        }

        /**
         * Test connection to a RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param principal the authenticated user
         * @return Mono with connection test result
         */
        @GetMapping("/{clusterId}/test-connection")
        public Mono<ResponseEntity<Map<String, Object>>> testConnection(
                        @PathVariable UUID clusterId,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.debug("Testing connection for cluster {} by user {}", clusterId, principal.getUsername());

                return proxyService.testConnection(clusterId, principal.getUser())
                                .map(success -> {
                                        Map<String, Object> response = Map.of(
                                                        "success", success,
                                                        "message",
                                                        success ? "Connection successful" : "Connection failed",
                                                        "clusterId", clusterId);
                                        return ResponseEntity.ok(response);
                                })
                                .onErrorResume(this::handleError);
        }

        /**
         * Test endpoint to directly test WebClient with RabbitMQ Management API
         */
        @GetMapping("/{clusterId}/test-bindings/{vhost}/{exchangeName}")
        public Mono<ResponseEntity<Object>> testBindings(@PathVariable UUID clusterId,
                        @PathVariable String vhost,
                        @PathVariable String exchangeName,
                        @AuthenticationPrincipal UserPrincipal principal) {

                logger.info("TEST: Testing WebClient bindings call for exchange {} in vhost {} for cluster {}",
                                exchangeName, vhost, clusterId);

                // Decode vhost from base64 if needed
                try {
                        vhost = new String(java.util.Base64.getDecoder().decode(vhost),
                                        java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                        // If base64 decoding fails, use as-is
                        logger.info("TEST: Using vhost as-is (not base64): {}", vhost);
                }

                // Construct the exact same path that the resource service uses
                String path = String.format("/api/exchanges/%s/%s/bindings/source",
                                vhost.equals("/") ? "%2F"
                                                : java.net.URLEncoder.encode(vhost,
                                                                java.nio.charset.StandardCharsets.UTF_8),
                                java.net.URLEncoder.encode(exchangeName, java.nio.charset.StandardCharsets.UTF_8));

                logger.info("TEST: Calling path: {}", path);

                return proxyService.get(clusterId, path, Object.class, principal.getUser())
                                .map(response -> {
                                        logger.info("TEST: Raw response: {}", response);
                                        return ResponseEntity.ok(response);
                                })
                                .onErrorResume(error -> {
                                        logger.error("TEST: Error occurred: {}", error.getMessage());
                                        return this.handleError(error);
                                });
        }

        /**
         * Generic proxy endpoint for any RabbitMQ API path.
         * This allows for future extensibility without adding specific endpoints.
         * 
         * @param clusterId the cluster connection ID
         * @param path      the API path (everything after /api/)
         * @param principal the authenticated user
         * @return Mono with API response
         */
        @GetMapping("/{clusterId}/proxy/**")
        public Mono<ResponseEntity<Object>> proxyGet(
                        @PathVariable UUID clusterId,
                        @RequestParam(required = false) String path,
                        @AuthenticationPrincipal UserPrincipal principal) {

                // Extract the path from the request
                String apiPath = "/api/" + (path != null ? path : "");

                logger.debug("Proxying GET request to {} for cluster {} by user {}",
                                apiPath, clusterId, principal.getUsername());

                return proxyService.get(clusterId, apiPath, Object.class, principal.getUser())
                                .map(ResponseEntity::ok)
                                .onErrorResume(this::handleError);
        }

        /**
         * Handles errors and maps them to appropriate HTTP responses.
         * 
         * @param throwable the error to handle
         * @return Mono with error response
         */
        private <T> Mono<ResponseEntity<T>> handleError(Throwable throwable) {
                logger.error("RabbitMQ proxy error: {}", throwable.getMessage(), throwable);

                if (throwable instanceof org.springframework.security.access.AccessDeniedException) {
                        return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
                }

                if (throwable instanceof IllegalArgumentException) {
                        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
                }

                if (throwable instanceof RabbitMQProxyException) {
                        RabbitMQProxyException proxyEx = (RabbitMQProxyException) throwable;

                        // Map specific RabbitMQ errors to appropriate HTTP status codes
                        if (proxyEx.getMessage().contains("authentication failed") ||
                                        proxyEx.getMessage().contains("invalid cluster credentials")) {
                                return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
                        }

                        if (proxyEx.getMessage().contains("access forbidden") ||
                                        proxyEx.getMessage().contains("insufficient cluster permissions")) {
                                return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
                        }

                        if (proxyEx.getMessage().contains("endpoint not found")) {
                                return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
                        }

                        if (proxyEx.getMessage().contains("Unable to connect") ||
                                        proxyEx.getMessage().contains("timed out")) {
                                return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
                        }

                        if (proxyEx.getMessage().contains("internal server error")) {
                                return Mono.just(ResponseEntity.status(HttpStatus.BAD_GATEWAY).build());
                        }
                }

                // Default to internal server error for unexpected exceptions
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
        }
}