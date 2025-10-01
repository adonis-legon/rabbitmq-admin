import apiClient from './apiClient';
import {
  RabbitMQConnection,
  RabbitMQChannel,
  RabbitMQExchange,
  RabbitMQQueue,
  RabbitMQBinding,
  PagedResponse,
  PaginationRequest,
  VirtualHost,
  CreateExchangeRequest,
  CreateQueueRequest,
  CreateBindingRequest,
  PublishMessageRequest,
  GetMessagesRequest,
  PublishResponse,
  Message,
  CreateShovelRequest
} from '../../types/rabbitmq';

export const rabbitmqResourcesApi = {
  // Connections
  getConnections: async (
    clusterId: string,
    params: PaginationRequest = {}
  ): Promise<PagedResponse<RabbitMQConnection>> => {
    const searchParams = new URLSearchParams();

    // Convert 0-based pagination to 1-based for backend
    if (params.page !== undefined) searchParams.append('page', (params.page + 1).toString());
    if (params.pageSize !== undefined) searchParams.append('pageSize', params.pageSize.toString());
    if (params.name) searchParams.append('name', params.name);
    if (params.useRegex !== undefined) searchParams.append('useRegex', params.useRegex.toString());

    const response = await apiClient.get<PagedResponse<RabbitMQConnection>>(
      `/rabbitmq/${clusterId}/resources/connections?${searchParams.toString()}`
    );
    return response.data;
  },

  // Channels
  getChannels: async (
    clusterId: string,
    params: PaginationRequest = {}
  ): Promise<PagedResponse<RabbitMQChannel>> => {
    const searchParams = new URLSearchParams();

    // Convert 0-based pagination to 1-based for backend
    if (params.page !== undefined) searchParams.append('page', (params.page + 1).toString());
    if (params.pageSize !== undefined) searchParams.append('pageSize', params.pageSize.toString());
    if (params.name) searchParams.append('name', params.name);
    if (params.useRegex !== undefined) searchParams.append('useRegex', params.useRegex.toString());

    const response = await apiClient.get<PagedResponse<RabbitMQChannel>>(
      `/rabbitmq/${clusterId}/resources/channels?${searchParams.toString()}`
    );
    return response.data;
  },

  // Exchanges
  getExchanges: async (
    clusterId: string,
    params: PaginationRequest = {}
  ): Promise<PagedResponse<RabbitMQExchange>> => {
    const searchParams = new URLSearchParams();

    // Convert 0-based pagination to 1-based for backend
    if (params.page !== undefined) searchParams.append('page', (params.page + 1).toString());
    if (params.pageSize !== undefined) searchParams.append('pageSize', params.pageSize.toString());
    if (params.name) searchParams.append('name', params.name);
    if (params.useRegex !== undefined) searchParams.append('useRegex', params.useRegex.toString());

    const response = await apiClient.get<PagedResponse<RabbitMQExchange>>(
      `/rabbitmq/${clusterId}/resources/exchanges?${searchParams.toString()}`
    );
    return response.data;
  },

  // Queues
  getQueues: async (
    clusterId: string,
    params: PaginationRequest = {}
  ): Promise<PagedResponse<RabbitMQQueue>> => {
    const searchParams = new URLSearchParams();

    // Convert 0-based pagination to 1-based for backend
    if (params.page !== undefined) searchParams.append('page', (params.page + 1).toString());
    if (params.pageSize !== undefined) searchParams.append('pageSize', params.pageSize.toString());
    if (params.name) searchParams.append('name', params.name);
    if (params.useRegex !== undefined) searchParams.append('useRegex', params.useRegex.toString());

    const response = await apiClient.get<PagedResponse<RabbitMQQueue>>(
      `/rabbitmq/${clusterId}/resources/queues?${searchParams.toString()}`
    );
    return response.data;
  },

  // Bindings
  getExchangeBindings: async (
    clusterId: string,
    vhost: string,
    exchangeName: string
  ): Promise<RabbitMQBinding[]> => {
    // Use base64 encoding for vhost to avoid URL encoding issues with "/"
    const encodedVhost = btoa(vhost);
    const encodedExchangeName = encodeURIComponent(exchangeName);
    const response = await apiClient.get<RabbitMQBinding[]>(
      `/rabbitmq/${clusterId}/resources/exchanges/${encodedVhost}/${encodedExchangeName}/bindings`
    );
    return response.data;
  },

  getQueueBindings: async (
    clusterId: string,
    vhost: string,
    queueName: string
  ): Promise<RabbitMQBinding[]> => {
    // Use base64 encoding for vhost to avoid URL encoding issues with "/"
    const encodedVhost = btoa(vhost);
    const encodedQueueName = encodeURIComponent(queueName);
    const response = await apiClient.get<RabbitMQBinding[]>(
      `/rabbitmq/${clusterId}/resources/queues/${encodedVhost}/${encodedQueueName}/bindings`
    );
    return response.data;
  },

  // Virtual Hosts
  getVirtualHosts: async (clusterId: string): Promise<VirtualHost[]> => {
    try {
      const response = await apiClient.get<VirtualHost[]>(`/rabbitmq/${clusterId}/vhosts`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch virtual hosts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Exchange Write Operations
  createExchange: async (
    clusterId: string,
    request: CreateExchangeRequest
  ): Promise<void> => {
    try {
      await apiClient.put(`/rabbitmq/${clusterId}/resources/exchanges`, request);
    } catch (error) {
      throw new Error(`Failed to create exchange: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  deleteExchange: async (
    clusterId: string,
    vhost: string,
    name: string,
    ifUnused?: boolean
  ): Promise<void> => {
    try {
      // Use base64 encoding for vhost to avoid URL encoding issues with "/"
      const encodedVhost = btoa(vhost);
      const encodedName = encodeURIComponent(name);
      const params = new URLSearchParams();
      if (ifUnused !== undefined) {
        params.append('if-unused', ifUnused.toString());
      }
      const queryString = params.toString();
      const url = `/rabbitmq/${clusterId}/resources/exchanges/${encodedVhost}/${encodedName}${queryString ? `?${queryString}` : ''}`;
      await apiClient.delete(url);
    } catch (error) {
      throw new Error(`Failed to delete exchange: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Queue Write Operations
  createQueue: async (
    clusterId: string,
    request: CreateQueueRequest
  ): Promise<void> => {
    try {
      await apiClient.put(`/rabbitmq/${clusterId}/resources/queues`, request);
    } catch (error) {
      throw new Error(`Failed to create queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  deleteQueue: async (
    clusterId: string,
    vhost: string,
    name: string,
    ifEmpty?: boolean,
    ifUnused?: boolean
  ): Promise<void> => {
    try {
      // Use base64 encoding for vhost to avoid URL encoding issues with "/"
      const encodedVhost = btoa(vhost);
      const encodedName = encodeURIComponent(name);
      const params = new URLSearchParams();
      if (ifEmpty !== undefined) {
        params.append('if-empty', ifEmpty.toString());
      }
      if (ifUnused !== undefined) {
        params.append('if-unused', ifUnused.toString());
      }
      const queryString = params.toString();
      const url = `/rabbitmq/${clusterId}/resources/queues/${encodedVhost}/${encodedName}${queryString ? `?${queryString}` : ''}`;
      await apiClient.delete(url);
    } catch (error) {
      throw new Error(`Failed to delete queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  purgeQueue: async (
    clusterId: string,
    vhost: string,
    name: string
  ): Promise<void> => {
    try {
      // Use base64 encoding for vhost to avoid URL encoding issues with "/"
      const encodedVhost = btoa(vhost);
      const encodedName = encodeURIComponent(name);
      await apiClient.delete(`/rabbitmq/${clusterId}/resources/queues/${encodedVhost}/${encodedName}/contents`);
    } catch (error) {
      throw new Error(`Failed to purge queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Binding Operations
  createExchangeToQueueBinding: async (
    clusterId: string,
    vhost: string,
    source: string,
    destination: string,
    request: CreateBindingRequest
  ): Promise<void> => {
    try {
      // Use base64 encoding for vhost to avoid URL encoding issues with "/"
      const encodedVhost = btoa(vhost);
      const encodedSource = encodeURIComponent(source);
      const encodedDestination = encodeURIComponent(destination);
      await apiClient.post(
        `/rabbitmq/${clusterId}/resources/bindings/${encodedVhost}/e/${encodedSource}/q/${encodedDestination}`,
        request
      );
    } catch (error) {
      throw new Error(`Failed to create exchange-to-queue binding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  createExchangeToExchangeBinding: async (
    clusterId: string,
    vhost: string,
    source: string,
    destination: string,
    request: CreateBindingRequest
  ): Promise<void> => {
    try {
      // Use base64 encoding for vhost to avoid URL encoding issues with "/"
      const encodedVhost = btoa(vhost);
      const encodedSource = encodeURIComponent(source);
      const encodedDestination = encodeURIComponent(destination);
      await apiClient.post(
        `/rabbitmq/${clusterId}/resources/bindings/${encodedVhost}/e/${encodedSource}/e/${encodedDestination}`,
        request
      );
    } catch (error) {
      throw new Error(`Failed to create exchange-to-exchange binding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Message Operations
  publishMessage: async (
    clusterId: string,
    vhost: string,
    exchange: string,
    request: PublishMessageRequest
  ): Promise<PublishResponse> => {
    try {
      // Use base64 encoding for vhost to avoid URL encoding issues with "/"
      const encodedVhost = btoa(vhost);
      const encodedExchange = encodeURIComponent(exchange);
      const response = await apiClient.post<PublishResponse>(
        `/rabbitmq/${clusterId}/resources/exchanges/${encodedVhost}/${encodedExchange}/publish`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to publish message to exchange: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  publishToQueue: async (
    clusterId: string,
    vhost: string,
    queue: string,
    request: PublishMessageRequest
  ): Promise<PublishResponse> => {
    try {
      // Use base64 encoding for vhost to avoid URL encoding issues with "/"
      const encodedVhost = btoa(vhost);
      const encodedQueue = encodeURIComponent(queue);
      const response = await apiClient.post<PublishResponse>(
        `/rabbitmq/${clusterId}/resources/queues/${encodedVhost}/${encodedQueue}/publish`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to publish message to queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  getMessages: async (
    clusterId: string,
    vhost: string,
    queue: string,
    request: GetMessagesRequest
  ): Promise<Message[]> => {
    try {
      // Use base64 encoding for vhost to avoid URL encoding issues with "/"
      const encodedVhost = btoa(vhost);
      const encodedQueue = encodeURIComponent(queue);
      const response = await apiClient.post<Message[]>(
        `/rabbitmq/${clusterId}/resources/queues/${encodedVhost}/${encodedQueue}/get`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get messages from queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Message Movement Operations
  createShovel: async (
    clusterId: string,
    request: CreateShovelRequest
  ): Promise<void> => {
    try {
      await apiClient.post(`/rabbitmq/${clusterId}/resources/shovels`, request);
    } catch (error) {
      // Check if error is due to shovel plugin not enabled (503 Service Unavailable)
      if (error instanceof Error && error.message.includes('503')) {
        throw new Error('Message transfer is not enabled in the RabbitMQ cluster. Please enable the rabbitmq_shovel plugin.');
      }
      throw new Error(`Failed to move messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};