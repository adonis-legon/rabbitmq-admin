// RabbitMQ Resource Types

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationRequest {
  page?: number;
  pageSize?: number;
  name?: string;
  useRegex?: boolean;
}

// Connection Types
export interface RabbitMQConnection {
  name: string;
  state: 'running' | 'blocked' | 'blocking' | 'closed';
  channels: number;
  client_properties: {
    connection_name?: string;
    platform?: string;
    product?: string;
    version?: string;
    [key: string]: any;
  };
  host: string;
  peer_host: string;
  port: number;
  peer_port: number;
  protocol: string;
  user: string;
  vhost: string;
  timeout: number;
  frame_max: number;
  recv_oct: number;
  recv_cnt: number;
  send_oct: number;
  send_cnt: number;
  connected_at: number;
}

// Channel Types
export interface RabbitMQChannel {
  name: string;
  connection_details: {
    name: string;
    peer_host: string;
  };
  number: number;
  state: 'running' | 'flow' | 'starting' | 'closing';
  consumer_count: number;
  messages_unacknowledged: number;
  messages_unconfirmed: number;
  messages_uncommitted: number;
  acks_uncommitted: number;
  prefetch_count: number;
  global_prefetch_count: number;
  transactional: boolean;
  confirm: boolean;
  user: string;
  vhost: string;
  consumer_details?: Array<{
    consumer_tag: string;
    queue: {
      name: string;
      vhost: string;
    };
    ack_required: boolean;
    prefetch_count: number;
    arguments: Record<string, any>;
  }>;
  message_stats?: {
    ack: number;
    ack_details: { rate: number };
    deliver: number;
    deliver_details: { rate: number };
    deliver_get: number;
    deliver_get_details: { rate: number };
    deliver_no_ack: number;
    deliver_no_ack_details: { rate: number };
    get: number;
    get_details: { rate: number };
    get_no_ack: number;
    get_no_ack_details: { rate: number };
    publish: number;
    publish_details: { rate: number };
    redeliver: number;
    redeliver_details: { rate: number };
  };
}

// Exchange Types
export interface RabbitMQExchange {
  name: string;
  type: 'direct' | 'fanout' | 'topic' | 'headers';
  durable: boolean;
  auto_delete: boolean;
  internal: boolean;
  arguments: Record<string, any>;
  vhost: string;
  message_stats?: {
    publish_in: number;
    publish_in_details: { rate: number };
    publish_out: number;
    publish_out_details: { rate: number };
  };
}

// Queue Types
export interface RabbitMQQueue {
  name: string;
  state: 'running' | 'idle' | 'flow' | 'down';
  durable: boolean;
  auto_delete: boolean;
  exclusive: boolean;
  arguments: Record<string, any>;
  node: string;
  vhost: string;
  messages: number;
  messages_ready: number;
  messages_unacknowledged: number;
  consumers: number;
  consumer_utilisation?: number;
  memory: number;
  message_stats?: {
    deliver_get: number;
    deliver_get_details: { rate: number };
    publish: number;
    publish_details: { rate: number };
  };
  consumer_details?: Array<{
    consumer_tag: string;
    channel_details: {
      name: string;
      connection_name: string;
      peer_host: string;
    };
    ack_required: boolean;
    prefetch_count: number;
  }>;
}

// Binding Types
export interface RabbitMQBinding {
  source: string;
  destination: string;
  destination_type: 'queue' | 'exchange';
  routing_key: string;
  arguments: Record<string, any>;
  properties_key: string;
  vhost: string;
}

// Filter Types
export interface ResourceFilters {
  page: number;
  pageSize: number;
  searchTerm: string;
  stateFilter: string[];
  typeFilter: string[];
}

// Error Types
export interface ResourceError {
  type: 'network' | 'authentication' | 'authorization' | 'cluster_unavailable' | 'api_error';
  message: string;
  details?: string;
  retryable: boolean;
  timestamp: number;
}