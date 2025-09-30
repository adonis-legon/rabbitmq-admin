package com.rabbitmq.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.dto.*;
import com.rabbitmq.admin.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing RabbitMQ resource operations.
 * Provides methods for fetching connections, channels, exchanges, and queues
 * with pagination support and proper error handling.
 */
@Service
public class RabbitMQResourceService {

        private static final Logger logger = LoggerFactory.getLogger(RabbitMQResourceService.class);

        private final RabbitMQProxyService proxyService;
        private final ObjectMapper objectMapper;
        private final ResourceMetricsService metricsService;
        private final ResourceAuditService auditService;

        public RabbitMQResourceService(RabbitMQProxyService proxyService, ObjectMapper objectMapper,
                        ResourceMetricsService metricsService, ResourceAuditService auditService) {
                this.proxyService = proxyService;
                this.objectMapper = objectMapper;
                this.metricsService = metricsService;
                this.auditService = auditService;
        }

        /**
         * Retrieves paginated connections from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param request   pagination and filtering parameters
         * @param user      the current authenticated user
         * @return Mono containing paginated connection data
         */
        public Mono<PagedResponse<ConnectionDto>> getConnections(UUID clusterId, PaginationRequest request, User user) {
                logger.debug("Fetching connections for cluster {} with pagination: page={}, pageSize={}, name={}",
                                clusterId, request.getPage(), request.getPageSize(), request.getName());

                Instant startTime = Instant.now();
                String path = buildApiPath("/api/connections", request);

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = createAuditParameters(request);

                return executePagedRequest(clusterId, path, request, new TypeReference<List<ConnectionDto>>() {
                }, user)
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordConnectionRequestDuration(duration);
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "connections",
                                                        "list", auditParams);
                                        logger.debug("Successfully fetched {} connections for cluster {} in {}ms",
                                                        result.getItems().size(), clusterId, duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordConnectionError();
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId,
                                                        "connections", "list",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to fetch connections for cluster {} after {}ms: {}",
                                                        clusterId, duration.toMillis(), error.getMessage());
                                });
        }

        /**
         * Retrieves paginated channels from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param request   pagination and filtering parameters
         * @param user      the current authenticated user
         * @return Mono containing paginated channel data
         */
        public Mono<PagedResponse<ChannelDto>> getChannels(UUID clusterId, PaginationRequest request, User user) {
                logger.debug("Fetching channels for cluster {} with pagination: page={}, pageSize={}, name={}",
                                clusterId, request.getPage(), request.getPageSize(), request.getName());

                Instant startTime = Instant.now();
                String path = buildApiPath("/api/channels", request);

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = createAuditParameters(request);

                return executePagedRequest(clusterId, path, request, new TypeReference<List<ChannelDto>>() {
                }, user)
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordChannelRequestDuration(duration);
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "channels",
                                                        "list", auditParams);
                                        logger.debug("Successfully fetched {} channels for cluster {} in {}ms",
                                                        result.getItems().size(), clusterId, duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordChannelError();
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId, "channels",
                                                        "list",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to fetch channels for cluster {} after {}ms: {}",
                                                        clusterId, duration.toMillis(), error.getMessage());
                                });
        }

        /**
         * Retrieves paginated exchanges from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param request   pagination and filtering parameters
         * @param user      the current authenticated user
         * @return Mono containing paginated exchange data
         */
        public Mono<PagedResponse<ExchangeDto>> getExchanges(UUID clusterId, PaginationRequest request, User user) {
                logger.debug("Fetching exchanges for cluster {} with pagination: page={}, pageSize={}, name={}",
                                clusterId, request.getPage(), request.getPageSize(), request.getName());

                Instant startTime = Instant.now();
                String path = buildApiPath("/api/exchanges", request);

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = createAuditParameters(request);

                return executePagedRequest(clusterId, path, request, new TypeReference<List<ExchangeDto>>() {
                }, user)
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordExchangeRequestDuration(duration);
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "exchanges",
                                                        "list", auditParams);
                                        logger.debug("Successfully fetched {} exchanges for cluster {} in {}ms",
                                                        result.getItems().size(), clusterId, duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordExchangeError();
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId,
                                                        "exchanges", "list",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to fetch exchanges for cluster {} after {}ms: {}",
                                                        clusterId, duration.toMillis(), error.getMessage());
                                });
        }

        /**
         * Retrieves paginated queues from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param request   pagination and filtering parameters
         * @param user      the current authenticated user
         * @return Mono containing paginated queue data
         */
        public Mono<PagedResponse<QueueDto>> getQueues(UUID clusterId, PaginationRequest request, User user) {
                logger.debug("Fetching queues for cluster {} with pagination: page={}, pageSize={}, name={}",
                                clusterId, request.getPage(), request.getPageSize(), request.getName());

                Instant startTime = Instant.now();
                String path = buildApiPath("/api/queues", request);

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = createAuditParameters(request);

                return executePagedRequest(clusterId, path, request, new TypeReference<List<QueueDto>>() {
                }, user)
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordQueueRequestDuration(duration);
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "queues", "list",
                                                        auditParams);
                                        logger.debug("Successfully fetched {} queues for cluster {} in {}ms",
                                                        result.getItems().size(), clusterId, duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordQueueError();
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId, "queues",
                                                        "list",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to fetch queues for cluster {} after {}ms: {}",
                                                        clusterId, duration.toMillis(), error.getMessage());
                                });
        }

        /**
         * Retrieves bindings for a specific exchange from the specified RabbitMQ
         * cluster.
         * 
         * @param clusterId    the cluster connection ID
         * @param exchangeName the name of the exchange
         * @param user         the current authenticated user
         * @return Mono containing list of binding data
         */
        public Mono<List<BindingDto>> getExchangeBindings(UUID clusterId, String vhost, String exchangeName,
                        User user) {
                logger.debug("Fetching bindings for exchange {} in vhost {} in cluster {}", exchangeName, vhost,
                                clusterId);

                Instant startTime = Instant.now();
                // Construct path with proper URL encoding - use raw path segments to avoid
                // double encoding
                String path = String.format("/api/exchanges/%s/%s/bindings/source",
                                vhost.equals("/") ? "%2F" : encodePathSegment(vhost),
                                encodePathSegment(exchangeName));

                logger.info("Fetching exchange bindings - path: {}, vhost: '{}', exchange: '{}'",
                                path, vhost, exchangeName);

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = Map.of("vhost", vhost, "exchangeName", exchangeName);

                return proxyService.get(clusterId, path, List.class, user)
                                .map(response -> {
                                        logger.info("Raw response from RabbitMQ for exchange bindings: {}", response);
                                        try {
                                                List<BindingDto> result = objectMapper.convertValue(response,
                                                                new TypeReference<List<BindingDto>>() {
                                                                });
                                                logger.info("Parsed {} bindings from response", result.size());
                                                return result;
                                        } catch (Exception e) {
                                                logger.error("Failed to parse exchange bindings response for cluster {}: {}",
                                                                clusterId, e.getMessage());
                                                throw new RabbitMQResourceException(
                                                                "Failed to parse exchange bindings response", e);
                                        }
                                })
                                .onErrorMap(throwable -> {
                                        if (throwable instanceof RabbitMQResourceException) {
                                                return throwable;
                                        }
                                        return new RabbitMQResourceException("Failed to fetch exchange bindings",
                                                        throwable);
                                })
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordBindingRequestDuration(duration);
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "bindings",
                                                        "exchange_bindings",
                                                        auditParams);
                                        logger.debug("Successfully fetched {} bindings for exchange {} in vhost {} in cluster {} in {}ms",
                                                        result.size(), exchangeName, vhost, clusterId,
                                                        duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordBindingError();
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId, "bindings",
                                                        "exchange_bindings",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to fetch bindings for exchange {} in vhost {} in cluster {} after {}ms: {}",
                                                        exchangeName, vhost, clusterId, duration.toMillis(),
                                                        error.getMessage());
                                });
        }

        /**
         * Retrieves virtual hosts from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param user      the current authenticated user
         * @return Mono containing list of virtual host data
         */
        public Mono<List<VirtualHostDto>> getVirtualHosts(UUID clusterId, User user) {
                logger.debug("Fetching virtual hosts for cluster {}", clusterId);

                Instant startTime = Instant.now();
                String path = "/api/vhosts";

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = Map.of();

                return proxyService.get(clusterId, path, List.class, user)
                                .map(response -> {
                                        try {
                                                List<VirtualHostDto> result = objectMapper.convertValue(response,
                                                                new TypeReference<List<VirtualHostDto>>() {
                                                                });
                                                logger.debug("Parsed {} virtual hosts from response", result.size());
                                                return result;
                                        } catch (Exception e) {
                                                logger.error("Failed to parse virtual hosts response for cluster {}: {}",
                                                                clusterId, e.getMessage());
                                                throw new RabbitMQResourceException(
                                                                "Failed to parse virtual hosts response", e);
                                        }
                                })
                                .onErrorMap(throwable -> {
                                        if (throwable instanceof RabbitMQResourceException) {
                                                return throwable;
                                        }
                                        return new RabbitMQResourceException("Failed to fetch virtual hosts",
                                                        throwable);
                                })
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "vhosts", "list",
                                                        auditParams);
                                        logger.debug("Successfully fetched {} virtual hosts for cluster {} in {}ms",
                                                        result.size(), clusterId, duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId, "vhosts",
                                                        "list",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to fetch virtual hosts for cluster {} after {}ms: {}",
                                                        clusterId, duration.toMillis(), error.getMessage());
                                });
        }

        /**
         * Retrieves bindings for a specific queue from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param queueName the name of the queue
         * @param user      the current authenticated user
         * @return Mono containing list of binding data
         */
        public Mono<List<BindingDto>> getQueueBindings(UUID clusterId, String vhost, String queueName, User user) {
                logger.debug("Fetching bindings for queue {} in vhost {} in cluster {}", queueName, vhost, clusterId);

                Instant startTime = Instant.now();
                String path = "/api/queues/" + encodePathSegment(vhost) + "/" + encodePathSegment(queueName)
                                + "/bindings";

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = Map.of("vhost", vhost, "queueName", queueName);

                return proxyService.get(clusterId, path, List.class, user)
                                .map(response -> {
                                        try {
                                                return objectMapper.convertValue(response,
                                                                new TypeReference<List<BindingDto>>() {
                                                                });
                                        } catch (Exception e) {
                                                logger.error("Failed to parse queue bindings response for cluster {}: {}",
                                                                clusterId, e.getMessage());
                                                throw new RabbitMQResourceException(
                                                                "Failed to parse queue bindings response", e);
                                        }
                                })
                                .onErrorMap(throwable -> {
                                        if (throwable instanceof RabbitMQResourceException) {
                                                return throwable;
                                        }
                                        return new RabbitMQResourceException("Failed to fetch queue bindings",
                                                        throwable);
                                })
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordBindingRequestDuration(duration);
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "bindings",
                                                        "queue_bindings",
                                                        auditParams);
                                        logger.debug("Successfully fetched {} bindings for queue {} in vhost {} in cluster {} in {}ms",
                                                        result.size(), queueName, vhost, clusterId,
                                                        duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        metricsService.recordBindingError();
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId, "bindings",
                                                        "queue_bindings",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to fetch bindings for queue {} in vhost {} in cluster {} after {}ms: {}",
                                                        queueName, vhost, clusterId, duration.toMillis(),
                                                        error.getMessage());
                                });
        }

        /**
         * Executes a paginated request to the RabbitMQ Management API.
         * 
         * @param clusterId the cluster connection ID
         * @param path      the API path
         * @param request   pagination parameters
         * @param typeRef   type reference for response deserialization
         * @param user      the current authenticated user
         * @return Mono containing paginated response
         */
        private <T> Mono<PagedResponse<T>> executePagedRequest(UUID clusterId, String path,
                        PaginationRequest request, TypeReference<List<T>> typeRef, User user) {

                return proxyService.get(clusterId, path, List.class, user)
                                .map(response -> {
                                        try {
                                                List<T> items = objectMapper.convertValue(response, typeRef);
                                                return createPagedResponse(items, request);
                                        } catch (Exception e) {
                                                logger.error("Failed to parse paginated response for cluster {} path {}: {}",
                                                                clusterId, path, e.getMessage());
                                                throw new RabbitMQResourceException("Failed to parse API response", e);
                                        }
                                })
                                .onErrorMap(throwable -> {
                                        if (throwable instanceof RabbitMQResourceException) {
                                                return throwable;
                                        }
                                        return new RabbitMQResourceException("Failed to execute paginated request",
                                                        throwable);
                                });
        }

        /**
         * Creates a PagedResponse from the full list of items and pagination
         * parameters.
         * Since RabbitMQ Management API doesn't support server-side pagination for all
         * endpoints,
         * we implement client-side pagination.
         * 
         * @param allItems the complete list of items from the API
         * @param request  pagination parameters
         * @return PagedResponse with the requested page of items
         */
        private <T> PagedResponse<T> createPagedResponse(List<T> allItems, PaginationRequest request) {
                int totalItems = allItems.size();
                int startIndex = (request.getPage() - 1) * request.getPageSize();
                int endIndex = Math.min(startIndex + request.getPageSize(), totalItems);

                List<T> pageItems;
                if (startIndex >= totalItems) {
                        pageItems = List.of(); // Empty list if page is beyond available data
                } else {
                        pageItems = allItems.subList(startIndex, endIndex);
                }

                return new PagedResponse<>(pageItems, request.getPage(), request.getPageSize(), totalItems);
        }

        /**
         * Builds the API path with query parameters for pagination and filtering.
         * 
         * @param basePath the base API path
         * @param request  pagination and filtering parameters
         * @return the complete API path with query parameters
         */
        private String buildApiPath(String basePath, PaginationRequest request) {
                StringBuilder pathBuilder = new StringBuilder(basePath);
                boolean hasParams = false;

                // Add name filter if provided
                if (request.getName() != null && !request.getName().trim().isEmpty()) {
                        pathBuilder.append(hasParams ? "&" : "?");
                        pathBuilder.append("name=").append(encodeQueryParam(request.getName()));
                        hasParams = true;

                        // Add regex flag if enabled
                        if (request.isUseRegex()) {
                                pathBuilder.append("&use_regex=true");
                        }
                }

                return pathBuilder.toString();
        }

        /**
         * URL encodes a path segment.
         * 
         * @param segment the path segment to encode
         * @return the encoded path segment
         */
        private String encodePathSegment(String segment) {
                // Special handling for default vhost
                if ("/".equals(segment)) {
                        return "%2F";
                }
                try {
                        return java.net.URLEncoder.encode(segment, "UTF-8");
                } catch (java.io.UnsupportedEncodingException e) {
                        logger.warn("Failed to encode path segment: {}", segment);
                        return segment;
                }
        }

        /**
         * URL encodes a query parameter value.
         * 
         * @param param the parameter value to encode
         * @return the encoded parameter value
         */
        private String encodeQueryParam(String param) {
                try {
                        return java.net.URLEncoder.encode(param, "UTF-8");
                } catch (java.io.UnsupportedEncodingException e) {
                        logger.warn("Failed to encode query parameter: {}", param);
                        return param;
                }
        }

        /**
         * Creates a new exchange in the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param request   the exchange creation request
         * @param user      the current authenticated user
         * @return Mono<Void> indicating completion
         */
        public Mono<Void> createExchange(UUID clusterId, CreateExchangeRequest request, User user) {
                logger.debug("Creating exchange {} of type {} in vhost {} for cluster {} by user {}",
                                request.getName(), request.getType(), request.getVhost(), clusterId,
                                user.getUsername());

                Instant startTime = Instant.now();
                String path = String.format("/api/exchanges/%s/%s",
                                encodePathSegment(request.getVhost()),
                                encodePathSegment(request.getName()));

                // Create request body for RabbitMQ Management API
                Map<String, Object> body = new HashMap<>();
                body.put("type", request.getType());
                body.put("durable", request.getDurable());
                body.put("auto_delete", request.getAutoDelete());
                body.put("internal", request.getInternal());
                body.put("arguments", request.getArguments());

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = Map.of(
                                "exchangeName", request.getName(),
                                "exchangeType", request.getType(),
                                "vhost", request.getVhost(),
                                "durable", request.getDurable(),
                                "autoDelete", request.getAutoDelete(),
                                "internal", request.getInternal());

                return proxyService.put(clusterId, path, body, Void.class, user)
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "exchanges",
                                                        "create", auditParams);
                                        logger.debug("Successfully created exchange {} in vhost {} for cluster {} in {}ms",
                                                        request.getName(), request.getVhost(), clusterId,
                                                        duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId,
                                                        "exchanges", "create",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to create exchange {} in vhost {} for cluster {} after {}ms: {}",
                                                        request.getName(), request.getVhost(), clusterId,
                                                        duration.toMillis(), error.getMessage());
                                });
        }

        /**
         * Deletes an exchange from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name
         * @param name      the exchange name
         * @param ifUnused  whether to delete only if unused (optional)
         * @param user      the current authenticated user
         * @return Mono<Void> indicating completion
         */
        public Mono<Void> deleteExchange(UUID clusterId, String vhost, String name, Boolean ifUnused, User user) {
                logger.debug("Deleting exchange {} in vhost {} for cluster {} by user {} (ifUnused: {})",
                                name, vhost, clusterId, user.getUsername(), ifUnused);

                Instant startTime = Instant.now();
                StringBuilder pathBuilder = new StringBuilder();
                pathBuilder.append(String.format("/api/exchanges/%s/%s",
                                encodePathSegment(vhost),
                                encodePathSegment(name)));

                // Add query parameters if specified
                if (ifUnused != null && ifUnused) {
                        pathBuilder.append("?if-unused=true");
                }

                String path = pathBuilder.toString();

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = new HashMap<>();
                auditParams.put("exchangeName", name);
                auditParams.put("vhost", vhost);
                if (ifUnused != null) {
                        auditParams.put("ifUnused", ifUnused);
                }

                return proxyService.delete(clusterId, path, user)
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "exchanges",
                                                        "delete", auditParams);
                                        logger.debug("Successfully deleted exchange {} in vhost {} for cluster {} in {}ms",
                                                        name, vhost, clusterId, duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId,
                                                        "exchanges", "delete",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to delete exchange {} in vhost {} for cluster {} after {}ms: {}",
                                                        name, vhost, clusterId, duration.toMillis(),
                                                        error.getMessage());
                                });
        }

        /**
         * Creates a new queue in the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param request   the queue creation request
         * @param user      the current authenticated user
         * @return Mono<Void> indicating completion
         */
        public Mono<Void> createQueue(UUID clusterId, CreateQueueRequest request, User user) {
                logger.debug("Creating queue {} in vhost {} for cluster {} by user {}",
                                request.getName(), request.getVhost(), clusterId, user.getUsername());

                Instant startTime = Instant.now();
                String path = String.format("/api/queues/%s/%s",
                                encodePathSegment(request.getVhost()),
                                encodePathSegment(request.getName()));

                // Create request body for RabbitMQ Management API
                Map<String, Object> body = new HashMap<>();
                body.put("durable", request.getDurable());
                body.put("auto_delete", request.getAutoDelete());
                body.put("exclusive", request.getExclusive());
                body.put("arguments", request.getArguments());
                if (request.getNode() != null && !request.getNode().trim().isEmpty()) {
                        body.put("node", request.getNode());
                }

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = new HashMap<>();
                auditParams.put("queueName", request.getName());
                auditParams.put("vhost", request.getVhost());
                auditParams.put("durable", request.getDurable());
                auditParams.put("autoDelete", request.getAutoDelete());
                auditParams.put("exclusive", request.getExclusive());
                if (request.getNode() != null) {
                        auditParams.put("node", request.getNode());
                }

                return proxyService.put(clusterId, path, body, Void.class, user)
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "queues",
                                                        "create", auditParams);
                                        logger.debug("Successfully created queue {} in vhost {} for cluster {} in {}ms",
                                                        request.getName(), request.getVhost(), clusterId,
                                                        duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId, "queues",
                                                        "create",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to create queue {} in vhost {} for cluster {} after {}ms: {}",
                                                        request.getName(), request.getVhost(), clusterId,
                                                        duration.toMillis(), error.getMessage());
                                });
        }

        /**
         * Deletes a queue from the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name
         * @param name      the queue name
         * @param ifEmpty   whether to delete only if empty (optional)
         * @param ifUnused  whether to delete only if unused (optional)
         * @param user      the current authenticated user
         * @return Mono<Void> indicating completion
         */
        public Mono<Void> deleteQueue(UUID clusterId, String vhost, String name, Boolean ifEmpty, Boolean ifUnused,
                        User user) {
                logger.debug("Deleting queue {} in vhost {} for cluster {} by user {} (ifEmpty: {}, ifUnused: {})",
                                name, vhost, clusterId, user.getUsername(), ifEmpty, ifUnused);

                Instant startTime = Instant.now();
                StringBuilder pathBuilder = new StringBuilder();
                pathBuilder.append(String.format("/api/queues/%s/%s",
                                encodePathSegment(vhost),
                                encodePathSegment(name)));

                // Add query parameters if specified
                boolean hasParams = false;
                if (ifEmpty != null && ifEmpty) {
                        pathBuilder.append("?if-empty=true");
                        hasParams = true;
                }
                if (ifUnused != null && ifUnused) {
                        pathBuilder.append(hasParams ? "&" : "?");
                        pathBuilder.append("if-unused=true");
                }

                String path = pathBuilder.toString();

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = new HashMap<>();
                auditParams.put("queueName", name);
                auditParams.put("vhost", vhost);
                if (ifEmpty != null) {
                        auditParams.put("ifEmpty", ifEmpty);
                }
                if (ifUnused != null) {
                        auditParams.put("ifUnused", ifUnused);
                }

                return proxyService.delete(clusterId, path, user)
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "queues",
                                                        "delete", auditParams);
                                        logger.debug("Successfully deleted queue {} in vhost {} for cluster {} in {}ms",
                                                        name, vhost, clusterId, duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId, "queues",
                                                        "delete",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to delete queue {} in vhost {} for cluster {} after {}ms: {}",
                                                        name, vhost, clusterId, duration.toMillis(),
                                                        error.getMessage());
                                });
        }

        /**
         * Purges all messages from a queue in the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name
         * @param name      the queue name
         * @param user      the current authenticated user
         * @return Mono<Void> indicating completion
         */
        public Mono<Void> purgeQueue(UUID clusterId, String vhost, String name, User user) {
                logger.debug("Purging queue {} in vhost {} for cluster {} by user {}",
                                name, vhost, clusterId, user.getUsername());

                Instant startTime = Instant.now();
                String path = String.format("/api/queues/%s/%s/contents",
                                encodePathSegment(vhost),
                                encodePathSegment(name));

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = Map.of(
                                "queueName", name,
                                "vhost", vhost);

                return proxyService.delete(clusterId, path, user)
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "queues", "purge",
                                                        auditParams);
                                        logger.debug("Successfully purged queue {} in vhost {} for cluster {} in {}ms",
                                                        name, vhost, clusterId, duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId, "queues",
                                                        "purge",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error("Failed to purge queue {} in vhost {} for cluster {} after {}ms: {}",
                                                        name, vhost, clusterId, duration.toMillis(),
                                                        error.getMessage());
                                });
        }

        /**
         * Creates a binding between a source exchange and destination (queue or
         * exchange) in the specified RabbitMQ cluster.
         * 
         * @param clusterId       the cluster connection ID
         * @param vhost           the virtual host name
         * @param source          the source exchange name
         * @param destination     the destination name (queue or exchange)
         * @param destinationType the destination type ("q" for queue, "e" for exchange)
         * @param request         the binding creation request
         * @param user            the current authenticated user
         * @return Mono<Void> indicating completion
         */
        public Mono<Void> createBinding(UUID clusterId, String vhost, String source, String destination,
                        String destinationType, CreateBindingRequest request, User user) {
                logger.debug(
                                "Creating binding from exchange {} to {} {} with routing key {} in vhost {} for cluster {} by user {}",
                                source, destinationType, destination, request.getRoutingKey(), vhost, clusterId,
                                user.getUsername());

                Instant startTime = Instant.now();
                String path = String.format("/api/bindings/%s/e/%s/%s/%s",
                                encodePathSegment(vhost),
                                encodePathSegment(source),
                                destinationType, // "q" for queue, "e" for exchange
                                encodePathSegment(destination));

                // Create request body for RabbitMQ Management API
                Map<String, Object> body = new HashMap<>();
                body.put("routing_key", request.getRoutingKey());
                body.put("arguments", request.getArguments());

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = Map.of(
                                "source", source,
                                "destination", destination,
                                "destinationType", destinationType,
                                "routingKey", request.getRoutingKey(),
                                "vhost", vhost);

                return proxyService.post(clusterId, path, body, Void.class, user)
                                .doOnSuccess(result -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccess(user.getUsername(), clusterId, "bindings",
                                                        "create", auditParams);
                                        logger.debug(
                                                        "Successfully created binding from exchange {} to {} {} in vhost {} for cluster {} in {}ms",
                                                        source, destinationType, destination, vhost, clusterId,
                                                        duration.toMillis());
                                })
                                .doOnError(error -> {
                                        Duration duration = Duration.between(startTime, Instant.now());
                                        auditService.logResourceAccessFailure(user.getUsername(), clusterId, "bindings",
                                                        "create",
                                                        error.getMessage(), error.getClass().getSimpleName());
                                        logger.error(
                                                        "Failed to create binding from exchange {} to {} {} in vhost {} for cluster {} after {}ms: {}",
                                                        source, destinationType, destination, vhost, clusterId,
                                                        duration.toMillis(),
                                                        error.getMessage());
                                });
        }

        /**
         * Publishes a message to an exchange in the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name
         * @param exchange  the exchange name (use empty string for default exchange)
         * @param request   the message publishing request
         * @param user      the current authenticated user
         * @return Mono<PublishResponse> indicating whether the message was routed
         */
        public PublishResponse publishMessage(UUID clusterId, String vhost, String exchange,
                        PublishMessageRequest request, User user) {
                logger.debug("Publishing message to exchange {} in vhost {} for cluster {} by user {}",
                                exchange, vhost, clusterId, user.getUsername());

                Instant startTime = Instant.now();
                // Handle default exchange (empty name) - use amq.default in Management API
                String exchangeName = exchange.isEmpty() ? "amq.default" : exchange;
                String path = String.format("/api/exchanges/%s/%s/publish",
                                encodePathSegment(vhost),
                                encodePathSegment(exchangeName));

                // Create request body for RabbitMQ Management API
                Map<String, Object> body = new HashMap<>();
                body.put("routing_key", request.getRoutingKey());
                body.put("payload", request.getPayload());
                body.put("payload_encoding", request.getPayloadEncoding());
                body.put("properties", request.getProperties());

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = Map.of(
                                "exchange", exchange,
                                "vhost", vhost,
                                "routingKey", request.getRoutingKey(),
                                "payloadEncoding", request.getPayloadEncoding(),
                                "payloadSize", request.getPayload() != null ? request.getPayload().length() : 0);

                try {
                        Object response = proxyService.post(clusterId, path, body, PublishResponse.class, user).block();

                        PublishResponse result;
                        // Handle case where RabbitMQ returns a Map instead of PublishResponse
                        if (response instanceof Map) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> responseMap = (Map<String, Object>) response;
                                Boolean routed = (Boolean) responseMap.get("routed");
                                result = new PublishResponse(routed);
                        } else {
                                result = (PublishResponse) response;
                        }

                        Duration duration = Duration.between(startTime, Instant.now());
                        auditService.logResourceAccess(user.getUsername(), clusterId, "messages", "publish",
                                        auditParams);
                        logger.debug(
                                        "Successfully published message to exchange {} in vhost {} for cluster {} in {}ms (routed: {})",
                                        exchange, vhost, clusterId, duration.toMillis(), result.getRouted());

                        return result;
                } catch (Exception error) {
                        Duration duration = Duration.between(startTime, Instant.now());
                        auditService.logResourceAccessFailure(user.getUsername(), clusterId, "messages", "publish",
                                        error.getMessage(), error.getClass().getSimpleName());
                        logger.error("Failed to publish message to exchange {} in vhost {} for cluster {} after {}ms: {}",
                                        exchange, vhost, clusterId, duration.toMillis(), error.getMessage());
                        throw new RabbitMQResourceException("Failed to publish message", error);
                }
        }

        /**
         * Retrieves messages from a queue in the specified RabbitMQ cluster.
         * 
         * @param clusterId the cluster connection ID
         * @param vhost     the virtual host name
         * @param queue     the queue name
         * @param request   the message retrieval request
         * @param user      the current authenticated user
         * @return Mono containing list of messages
         */
        public List<MessageDto> getMessages(UUID clusterId, String vhost, String queue,
                        GetMessagesRequest request, User user) {
                logger.debug(
                                "Getting {} messages from queue {} in vhost {} for cluster {} by user {} (ackmode: {}, encoding: {})",
                                request.getCount(), queue, vhost, clusterId, user.getUsername(),
                                request.getAckmode(), request.getEncoding());

                Instant startTime = Instant.now();
                String path = String.format("/api/queues/%s/%s/get",
                                encodePathSegment(vhost),
                                encodePathSegment(queue));

                // Create request body for RabbitMQ Management API
                Map<String, Object> body = new HashMap<>();
                body.put("count", request.getCount());
                body.put("ackmode", request.getAckmode());
                body.put("encoding", request.getEncoding());
                if (request.getTruncate() != null) {
                        body.put("truncate", request.getTruncate());
                }

                // Record metrics and audit
                metricsService.recordClusterAccess(clusterId);
                metricsService.recordUserAccess(user.getUsername());

                Map<String, Object> auditParams = Map.of(
                                "queueName", queue,
                                "vhost", vhost,
                                "count", request.getCount(),
                                "ackmode", request.getAckmode(),
                                "encoding", request.getEncoding());

                try {
                        Object response = proxyService.post(clusterId, path, body, List.class, user).block();
                        // Convert to JSON string first, then deserialize to properly handle custom
                        // deserializers
                        String jsonString = objectMapper.writeValueAsString(response);
                        List<MessageDto> result = objectMapper.readValue(jsonString,
                                        new TypeReference<List<MessageDto>>() {
                                        });

                        Duration duration = Duration.between(startTime, Instant.now());
                        auditService.logResourceAccess(user.getUsername(), clusterId, "messages", "get", auditParams);
                        logger.debug("Successfully retrieved {} messages from queue {} in vhost {} for cluster {} in {}ms",
                                        result.size(), queue, vhost, clusterId, duration.toMillis());

                        return result;
                } catch (Exception error) {
                        Duration duration = Duration.between(startTime, Instant.now());
                        auditService.logResourceAccessFailure(user.getUsername(), clusterId, "messages", "get",
                                        error.getMessage(), error.getClass().getSimpleName());
                        logger.error("Failed to get messages from queue {} in vhost {} for cluster {} after {}ms: {}",
                                        queue, vhost, clusterId, duration.toMillis(), error.getMessage());
                        throw new RabbitMQResourceException("Failed to get messages from queue", error);
                }
        }

        /**
         * Creates audit parameters from pagination request.
         */
        private Map<String, Object> createAuditParameters(PaginationRequest request) {
                Map<String, Object> params = new HashMap<>();
                params.put("page", request.getPage());
                params.put("pageSize", request.getPageSize());
                if (request.getName() != null) {
                        params.put("nameFilter", request.getName());
                        params.put("useRegex", request.isUseRegex());
                }
                return params;
        }

        /**
         * Custom exception for RabbitMQ resource operations.
         */
        public static class RabbitMQResourceException extends RuntimeException {
                public RabbitMQResourceException(String message) {
                        super(message);
                }

                public RabbitMQResourceException(String message, Throwable cause) {
                        super(message, cause);
                }
        }
}