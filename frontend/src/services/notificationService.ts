// Notification service that integrates with the NotificationContext
// This service provides a way to show notifications from anywhere in the app
// Components should use the useNotification hook directly when possible

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationService {
  success: (message: string, autoHideDuration?: number) => void;
  error: (message: string, autoHideDuration?: number) => void;
  info: (message: string, autoHideDuration?: number) => void;
  warning: (message: string, autoHideDuration?: number) => void;
}

// Global notification service instance
// This will be initialized by the NotificationProvider
let globalNotificationService: NotificationService | null = null;

export const setGlobalNotificationService = (service: NotificationService) => {
  globalNotificationService = service;
};

// Fallback implementation for when the service is not initialized
const fallbackService: NotificationService = {
  success: (message: string) => console.log('SUCCESS:', message),
  error: (message: string) => console.error('ERROR:', message),
  info: (message: string) => console.info('INFO:', message),
  warning: (message: string) => console.warn('WARNING:', message),
};

export const notificationService: NotificationService = {
  success: (message: string, autoHideDuration?: number) => {
    if (globalNotificationService) {
      globalNotificationService.success(message, autoHideDuration);
    } else {
      fallbackService.success(message);
    }
  },

  error: (message: string, autoHideDuration?: number) => {
    if (globalNotificationService) {
      globalNotificationService.error(message, autoHideDuration);
    } else {
      fallbackService.error(message);
    }
  },

  info: (message: string, autoHideDuration?: number) => {
    if (globalNotificationService) {
      globalNotificationService.info(message, autoHideDuration);
    } else {
      fallbackService.info(message);
    }
  },

  warning: (message: string, autoHideDuration?: number) => {
    if (globalNotificationService) {
      globalNotificationService.warning(message, autoHideDuration);
    } else {
      fallbackService.warning(message);
    }
  },
};