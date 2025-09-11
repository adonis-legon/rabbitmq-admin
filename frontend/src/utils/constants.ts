export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  CLUSTERS: '/clusters',
  RABBITMQ: '/rabbitmq'
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
  RABBITMQ: '/rabbitmq'
} as const;

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken'
} as const;