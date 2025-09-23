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
                    auditService.logResourceAccess(user.getUsername(), clusterId, "connections", "list", auditParams);
                    logger.debug("Successfully fetched {} connections for cluster {} in {}ms",
                            result.getItems().size(), clusterId, duration.toMillis());
                })
                .doOnError(error -> {
                    Duration duration = Duration.between(startTime, Instant.now());
                    metricsService.recordConnectionError();
                    auditService.logResourceAccessFailure(user.getUsername(), clusterId, "connections", "list",
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
                    auditService.logResourceAccess(user.getUsername(), clusterId, "channels", "list", auditParams);
                    logger.debug("Successfully fetched {} channels for cluster {} in {}ms",
                            result.getItems().size(), clusterId, duration.toMillis());
                })
                .doOnError(error -> {
                    Duration duration = Duration.between(startTime, Instant.now());
                    metricsService.recordChannelError();
                    auditService.logResourceAccessFailure(user.getUsername(), clusterId, "channels", "list",
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
                    auditService.logResourceAccess(user.getUsername(), clusterId, "exchanges", "list", auditParams);
                    logger.debug("Successfully fetched {} exchanges for cluster {} in {}ms",
                            result.getItems().size(), clusterId, duration.toMillis());
                })
                .doOnError(error -> {
                    Duration duration = Duration.between(startTime, Instant.now());
                    metricsService.recordExchangeError();
                    auditService.logResourceAccessFailure(user.getUsername(), clusterId, "exchanges", "list",
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
                    auditService.logResourceAccess(user.getUsername(), clusterId, "queues", "list", auditParams);
                    logger.debug("Successfully fetched {} queues for cluster {} in {}ms",
                            result.getItems().size(), clusterId, duration.toMillis());
                })
                .doOnError(error -> {
                    Duration duration = Duration.between(startTime, Instant.now());
                    metricsService.recordQueueError();
                    auditService.logResourceAccessFailure(user.getUsername(), clusterId, "queues", "list",
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
    public Mono<List<BindingDto>> getExchangeBindings(UUID clusterId, String vhost, String exchangeName, User user) {
        logger.debug("Fetching bindings for exchange {} in vhost {} in cluster {}", exchangeName, vhost, clusterId);

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
                        throw new RabbitMQResourceException("Failed to parse exchange bindings response", e);
                    }
                })
                .onErrorMap(throwable -> {
                    if (throwable instanceof RabbitMQResourceException) {
                        return throwable;
                    }
                    return new RabbitMQResourceException("Failed to fetch exchange bindings", throwable);
                })
                .doOnSuccess(result -> {
                    Duration duration = Duration.between(startTime, Instant.now());
                    metricsService.recordBindingRequestDuration(duration);
                    auditService.logResourceAccess(user.getUsername(), clusterId, "bindings", "exchange_bindings",
                            auditParams);
                    logger.debug("Successfully fetched {} bindings for exchange {} in vhost {} in cluster {} in {}ms",
                            result.size(), exchangeName, vhost, clusterId, duration.toMillis());
                })
                .doOnError(error -> {
                    Duration duration = Duration.between(startTime, Instant.now());
                    metricsService.recordBindingError();
                    auditService.logResourceAccessFailure(user.getUsername(), clusterId, "bindings",
                            "exchange_bindings",
                            error.getMessage(), error.getClass().getSimpleName());
                    logger.error("Failed to fetch bindings for exchange {} in vhost {} in cluster {} after {}ms: {}",
                            exchangeName, vhost, clusterId, duration.toMillis(), error.getMessage());
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
        String path = "/api/queues/" + encodePathSegment(vhost) + "/" + encodePathSegment(queueName) + "/bindings";

        // Record metrics and audit
        metricsService.recordClusterAccess(clusterId);
        metricsService.recordUserAccess(user.getUsername());

        Map<String, Object> auditParams = Map.of("vhost", vhost, "queueName", queueName);

        return proxyService.get(clusterId, path, List.class, user)
                .map(response -> {
                    try {
                        return objectMapper.convertValue(response, new TypeReference<List<BindingDto>>() {
                        });
                    } catch (Exception e) {
                        logger.error("Failed to parse queue bindings response for cluster {}: {}",
                                clusterId, e.getMessage());
                        throw new RabbitMQResourceException("Failed to parse queue bindings response", e);
                    }
                })
                .onErrorMap(throwable -> {
                    if (throwable instanceof RabbitMQResourceException) {
                        return throwable;
                    }
                    return new RabbitMQResourceException("Failed to fetch queue bindings", throwable);
                })
                .doOnSuccess(result -> {
                    Duration duration = Duration.between(startTime, Instant.now());
                    metricsService.recordBindingRequestDuration(duration);
                    auditService.logResourceAccess(user.getUsername(), clusterId, "bindings", "queue_bindings",
                            auditParams);
                    logger.debug("Successfully fetched {} bindings for queue {} in vhost {} in cluster {} in {}ms",
                            result.size(), queueName, vhost, clusterId, duration.toMillis());
                })
                .doOnError(error -> {
                    Duration duration = Duration.between(startTime, Instant.now());
                    metricsService.recordBindingError();
                    auditService.logResourceAccessFailure(user.getUsername(), clusterId, "bindings", "queue_bindings",
                            error.getMessage(), error.getClass().getSimpleName());
                    logger.error("Failed to fetch bindings for queue {} in vhost {} in cluster {} after {}ms: {}",
                            queueName, vhost, clusterId, duration.toMillis(), error.getMessage());
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
                    return new RabbitMQResourceException("Failed to execute paginated request", throwable);
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