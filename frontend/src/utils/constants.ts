export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  CLUSTERS: '/clusters',
  RABBITMQ: '/rabbitmq',
  PROFILE: '/profile',
  AUDIT: '/audit',
  // Resource management routes
  RESOURCES: '/resources',
  RESOURCES_CONNECTIONS: '/resources/connections',
  RESOURCES_CHANNELS: '/resources/channels',
  RESOURCES_EXCHANGES: '/resources/exchanges',
  RESOURCES_QUEUES: '/resources/queues'
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh'
  },
  USERS: '/users',
  CLUSTERS: '/clusters',
  RABBITMQ: '/rabbitmq',
  AUDIT: '/audit',
  // Resource management endpoints
  RESOURCES: {
    CONNECTIONS: (clusterId: string) => `/rabbitmq/${clusterId}/resources/connections`,
    CHANNELS: (clusterId: string) => `/rabbitmq/${clusterId}/resources/channels`,
    EXCHANGES: (clusterId: string) => `/rabbitmq/${clusterId}/resources/exchanges`,
    QUEUES: (clusterId: string) => `/rabbitmq/${clusterId}/resources/queues`,
    EXCHANGE_BINDINGS: (clusterId: string, exchangeName: string) =>
      `/rabbitmq/${clusterId}/resources/exchanges/${encodeURIComponent(exchangeName)}/bindings`,
    QUEUE_BINDINGS: (clusterId: string, queueName: string) =>
      `/rabbitmq/${clusterId}/resources/queues/${encodeURIComponent(queueName)}/bindings`
  }
} as const;

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken'
} as const;