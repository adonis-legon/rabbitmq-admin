import apiClient from './apiClient';
import {
  RabbitMQConnection,
  RabbitMQChannel,
  RabbitMQExchange,
  RabbitMQQueue,
  RabbitMQBinding,
  PagedResponse,
  PaginationRequest
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
  }
};