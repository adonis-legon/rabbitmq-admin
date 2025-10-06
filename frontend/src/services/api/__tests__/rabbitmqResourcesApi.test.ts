import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { AxiosResponse } from 'axios';
import { rabbitmqResourcesApi } from '../rabbitmqResourcesApi';
import apiClient from '../apiClient';
import {
    CreateExchangeRequest,
    CreateQueueRequest,
    CreateBindingRequest,
    PublishMessageRequest,
    GetMessagesRequest,
    VirtualHost,
    PublishResponse,
    Message
} from '../../../types/rabbitmq';

// Mock the apiClient
vi.mock('../apiClient');

const mockApiClient = vi.mocked(apiClient);

// Helper function to create mock Axios responses
const createMockResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any
});

describe('rabbitmqResourcesApi - Write Operations', () => {
    const clusterId = 'test-cluster-id';
    const vhost = '/';
    const encodedVhost = btoa(vhost); // Base64 encoded vhost

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.restoreAllMocks();
    });

    describe('Virtual Hosts', () => {
        it('should get virtual hosts successfully', async () => {
            const mockVirtualHosts: VirtualHost[] = [
                {
                    name: '/',
                    description: 'Default virtual host',
                    tags: '',
                    defaultQueueType: 'classic',
                    tracing: false,
                    messageStats: {}
                },
                {
                    name: 'test-vhost',
                    description: 'Test virtual host',
                    tags: 'test',
                    defaultQueueType: 'classic',
                    tracing: true,
                    messageStats: { publish: 100 }
                }
            ];

            mockApiClient.get.mockResolvedValue(createMockResponse(mockVirtualHosts));

            const result = await rabbitmqResourcesApi.getVirtualHosts(clusterId);

            expect(mockApiClient.get).toHaveBeenCalledWith(`/rabbitmq/${clusterId}/vhosts`);
            expect(result).toEqual(mockVirtualHosts);
        });

        it('should handle virtual hosts API error', async () => {
            const error = new Error('API Error');
            mockApiClient.get.mockRejectedValue(error);

            await expect(rabbitmqResourcesApi.getVirtualHosts(clusterId)).rejects.toThrow('Failed to fetch virtual hosts: API Error');
            expect(mockApiClient.get).toHaveBeenCalledWith(`/rabbitmq/${clusterId}/vhosts`);
        });
    });

    describe('Exchange Operations', () => {
        it('should create exchange successfully', async () => {
            const request: CreateExchangeRequest = {
                name: 'test-exchange',
                type: 'direct',
                vhost: '/',
                durable: true,
                autoDelete: false,
                internal: false,
                arguments: { 'x-message-ttl': 60000 }
            };

            mockApiClient.put.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.createExchange(clusterId, request);

            expect(mockApiClient.put).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/exchanges`,
                request
            );
        });

        it('should delete exchange without conditions', async () => {
            const exchangeName = 'test-exchange';
            const encodedName = encodeURIComponent(exchangeName);

            mockApiClient.delete.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.deleteExchange(clusterId, vhost, exchangeName);

            expect(mockApiClient.delete).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/exchanges/${encodedVhost}/${encodedName}`
            );
        });

        it('should delete exchange with if-unused condition', async () => {
            const exchangeName = 'test-exchange';
            const encodedName = encodeURIComponent(exchangeName);

            mockApiClient.delete.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.deleteExchange(clusterId, vhost, exchangeName, true);

            expect(mockApiClient.delete).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/exchanges/${encodedVhost}/${encodedName}?if-unused=true`
            );
        });

        it('should handle exchange creation error', async () => {
            const request: CreateExchangeRequest = {
                name: 'test-exchange',
                type: 'direct',
                vhost: '/',
                durable: true
            };

            const error = new Error('Exchange creation failed');
            mockApiClient.put.mockRejectedValue(error);

            await expect(rabbitmqResourcesApi.createExchange(clusterId, request)).rejects.toThrow('Failed to create exchange: Exchange creation failed');
        });
    });

    describe('Queue Operations', () => {
        it('should create queue successfully', async () => {
            const request: CreateQueueRequest = {
                name: 'test-queue',
                vhost: '/',
                durable: true,
                autoDelete: false,
                exclusive: false,
                arguments: { 'x-max-length': 1000 },
                node: 'rabbit@node1'
            };

            mockApiClient.put.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.createQueue(clusterId, request);

            expect(mockApiClient.put).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/queues`,
                request
            );
        });

        it('should delete queue without conditions', async () => {
            const queueName = 'test-queue';
            const encodedName = encodeURIComponent(queueName);

            mockApiClient.delete.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.deleteQueue(clusterId, vhost, queueName);

            expect(mockApiClient.delete).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/queues/${encodedVhost}/${encodedName}`
            );
        });

        it('should delete queue with conditions', async () => {
            const queueName = 'test-queue';
            const encodedName = encodeURIComponent(queueName);

            mockApiClient.delete.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.deleteQueue(clusterId, vhost, queueName, true, true);

            expect(mockApiClient.delete).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/queues/${encodedVhost}/${encodedName}?if-empty=true&if-unused=true`
            );
        });

        it('should purge queue successfully', async () => {
            const queueName = 'test-queue';
            const encodedName = encodeURIComponent(queueName);

            mockApiClient.delete.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.purgeQueue(clusterId, vhost, queueName);

            expect(mockApiClient.delete).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/queues/${encodedVhost}/${encodedName}/contents`
            );
        });

        it('should handle queue creation error', async () => {
            const request: CreateQueueRequest = {
                name: 'test-queue',
                vhost: '/'
            };

            const error = new Error('Queue creation failed');
            mockApiClient.put.mockRejectedValue(error);

            await expect(rabbitmqResourcesApi.createQueue(clusterId, request)).rejects.toThrow('Failed to create queue: Queue creation failed');
        });
    });

    describe('Binding Operations', () => {
        it('should create exchange-to-queue binding successfully', async () => {
            const source = 'test-exchange';
            const destination = 'test-queue';
            const request: CreateBindingRequest = {
                routingKey: 'test.routing.key',
                arguments: { 'x-match': 'all' }
            };

            const encodedSource = encodeURIComponent(source);
            const encodedDestination = encodeURIComponent(destination);

            mockApiClient.post.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.createExchangeToQueueBinding(
                clusterId,
                vhost,
                source,
                destination,
                request
            );

            expect(mockApiClient.post).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/bindings/${encodedVhost}/e/${encodedSource}/q/${encodedDestination}`,
                request
            );
        });

        it('should create exchange-to-exchange binding successfully', async () => {
            const source = 'source-exchange';
            const destination = 'destination-exchange';
            const request: CreateBindingRequest = {
                routingKey: 'test.routing.key',
                arguments: {}
            };

            const encodedSource = encodeURIComponent(source);
            const encodedDestination = encodeURIComponent(destination);

            mockApiClient.post.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.createExchangeToExchangeBinding(
                clusterId,
                vhost,
                source,
                destination,
                request
            );

            expect(mockApiClient.post).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/bindings/${encodedVhost}/e/${encodedSource}/e/${encodedDestination}`,
                request
            );
        });

        it('should handle binding creation error', async () => {
            const request: CreateBindingRequest = {
                routingKey: 'test.key'
            };

            const error = new Error('Binding creation failed');
            mockApiClient.post.mockRejectedValue(error);

            await expect(
                rabbitmqResourcesApi.createExchangeToQueueBinding(
                    clusterId,
                    vhost,
                    'source',
                    'destination',
                    request
                )
            ).rejects.toThrow('Failed to create exchange-to-queue binding: Binding creation failed');
        });
    });

    describe('Message Operations', () => {
        it('should publish message to exchange successfully', async () => {
            const exchange = 'test-exchange';
            const request: PublishMessageRequest = {
                routingKey: 'test.routing.key',
                properties: { delivery_mode: 2, priority: 1 },
                payload: 'Hello, World!',
                payloadEncoding: 'string'
            };

            const mockResponse: PublishResponse = { routed: true };
            const encodedExchange = encodeURIComponent(exchange);

            mockApiClient.post.mockResolvedValue(createMockResponse(mockResponse));

            const result = await rabbitmqResourcesApi.publishMessage(
                clusterId,
                vhost,
                exchange,
                request
            );

            expect(mockApiClient.post).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/exchanges/${encodedVhost}/${encodedExchange}/publish`,
                request
            );
            expect(result).toEqual(mockResponse);
        });

        it('should publish message to queue successfully', async () => {
            const queue = 'test-queue';
            const request: PublishMessageRequest = {
                payload: 'Direct queue message',
                payloadEncoding: 'string'
            };

            const mockResponse: PublishResponse = { routed: true };
            const encodedQueue = encodeURIComponent(queue);

            mockApiClient.post.mockResolvedValue(createMockResponse(mockResponse));

            const result = await rabbitmqResourcesApi.publishToQueue(
                clusterId,
                vhost,
                queue,
                request
            );

            expect(mockApiClient.post).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/queues/${encodedVhost}/${encodedQueue}/publish`,
                request
            );
            expect(result).toEqual(mockResponse);
        });

        it('should get messages from queue successfully', async () => {
            const queue = 'test-queue';
            const request: GetMessagesRequest = {
                count: 5,
                ackmode: 'ack_requeue_false',
                encoding: 'auto',
                truncate: 1000
            };

            const mockMessages: Message[] = [
                {
                    payloadEncoding: 'string',
                    payload: 'Message 1',
                    properties: { delivery_mode: 2 },
                    routingKey: 'test.key',
                    redelivered: false,
                    exchange: 'test-exchange',
                    messageCount: 10
                },
                {
                    payloadEncoding: 'string',
                    payload: 'Message 2',
                    properties: { delivery_mode: 1 },
                    routingKey: 'test.key2',
                    redelivered: true,
                    exchange: 'test-exchange',
                    messageCount: 9
                }
            ];

            const encodedQueue = encodeURIComponent(queue);

            mockApiClient.post.mockResolvedValue(createMockResponse(mockMessages));

            const result = await rabbitmqResourcesApi.getMessages(
                clusterId,
                vhost,
                queue,
                request
            );

            expect(mockApiClient.post).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/queues/${encodedVhost}/${encodedQueue}/get`,
                request
            );
            expect(result).toEqual(mockMessages);
        });

        it('should handle message publishing error', async () => {
            const request: PublishMessageRequest = {
                payload: 'Test message'
            };

            const error = new Error('Message publishing failed');
            mockApiClient.post.mockRejectedValue(error);

            await expect(
                rabbitmqResourcesApi.publishMessage(clusterId, vhost, 'exchange', request)
            ).rejects.toThrow('Failed to publish message to exchange: Message publishing failed');
        });

        it('should handle message retrieval error', async () => {
            const request: GetMessagesRequest = {
                count: 1
            };

            const error = new Error('Message retrieval failed');
            mockApiClient.post.mockRejectedValue(error);

            await expect(
                rabbitmqResourcesApi.getMessages(clusterId, vhost, 'queue', request)
            ).rejects.toThrow('Failed to get messages from queue: Message retrieval failed');
        });
    });

    describe('URL Encoding', () => {
        it('should properly encode special characters in resource names', async () => {
            const specialVhost = 'test/vhost';
            const specialExchange = 'test exchange with spaces';
            const specialQueue = 'test-queue-with-special-chars!@#';

            const encodedSpecialVhost = btoa(specialVhost);
            const encodedSpecialExchange = encodeURIComponent(specialExchange);
            const encodedSpecialQueue = encodeURIComponent(specialQueue);

            mockApiClient.delete.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.deleteExchange(clusterId, specialVhost, specialExchange);
            await rabbitmqResourcesApi.purgeQueue(clusterId, specialVhost, specialQueue);

            expect(mockApiClient.delete).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/exchanges/${encodedSpecialVhost}/${encodedSpecialExchange}`
            );
            expect(mockApiClient.delete).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/queues/${encodedSpecialVhost}/${encodedSpecialQueue}/contents`
            );
        });

        it('should handle default vhost encoding correctly', async () => {
            const defaultVhost = '/';
            const encodedDefaultVhost = btoa(defaultVhost); // Should be 'Lw=='

            mockApiClient.delete.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.purgeQueue(clusterId, defaultVhost, 'test-queue');

            expect(mockApiClient.delete).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/queues/${encodedDefaultVhost}/test-queue/contents`
            );
            expect(encodedDefaultVhost).toBe('Lw==');
        });
    });

    describe('Request Validation', () => {
        it('should handle empty routing keys correctly', async () => {
            const request: CreateBindingRequest = {
                routingKey: '',
                arguments: {}
            };

            mockApiClient.post.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.createExchangeToQueueBinding(
                clusterId,
                vhost,
                'source',
                'destination',
                request
            );

            expect(mockApiClient.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    routingKey: '',
                    arguments: {}
                })
            );
        });

        it('should handle undefined optional parameters', async () => {
            const request: PublishMessageRequest = {
                payload: 'Test message'
                // routingKey, properties, payloadEncoding are undefined
            };

            mockApiClient.post.mockResolvedValue(createMockResponse({ routed: true }));

            await rabbitmqResourcesApi.publishMessage(clusterId, vhost, 'exchange', request);

            expect(mockApiClient.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    payload: 'Test message'
                })
            );
        });
    });

    describe('Shovel Operations', () => {
        it('should create shovel successfully', async () => {
            const request = {
                name: 'test-shovel',
                vhost: '/',
                sourceQueue: 'source-queue',
                destinationQueue: 'dest-queue',
                sourceUri: 'amqp://localhost',
                destinationUri: 'amqp://localhost',
                deleteAfter: 'queue-length' as const,
                ackMode: 'on-confirm' as const
            };

            mockApiClient.post.mockResolvedValue(createMockResponse(undefined));

            await rabbitmqResourcesApi.createShovel(clusterId, request);

            expect(mockApiClient.post).toHaveBeenCalledWith(
                `/rabbitmq/${clusterId}/resources/shovels`,
                request
            );
        });

        it('should handle shovel plugin not enabled error', async () => {
            const request = {
                name: 'test-shovel',
                vhost: '/',
                sourceQueue: 'source-queue',
                destinationQueue: 'dest-queue'
            };

            const error = new Error('Request failed with status code 503');
            mockApiClient.post.mockRejectedValue(error);

            await expect(rabbitmqResourcesApi.createShovel(clusterId, request))
                .rejects
                .toThrow('Shovel plugin is not enabled in the RabbitMQ cluster. Please enable the rabbitmq_shovel plugin.');
        });
    });
});