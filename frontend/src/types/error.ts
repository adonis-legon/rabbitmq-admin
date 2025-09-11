export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorContextType {
  showError: (message: string, details?: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  clearNotifications: () => void;
}

export type NotificationSeverity = 'error' | 'warning' | 'info' | 'success';

export interface Notification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  details?: string;
  timestamp: number;
  autoHide?: boolean;
}