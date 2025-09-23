import { ResourceError } from '../types/rabbitmq';

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  category: 'resource' | 'auth' | 'network' | 'ui' | 'general';
  message: string;
  details?: any;
  context?: {
    userId?: string;
    clusterId?: string;
    resourceType?: string;
    operation?: string;
    url?: string;
    userAgent?: string;
    sessionId?: string;
  };
  stackTrace?: string;
  resolved?: boolean;
}

class ErrorLoggingService {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 1000;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeLogging();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeLogging() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.logError({
        category: 'ui',
        message: `Unhandled error: ${event.message}`,
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        },
        stackTrace: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        category: 'general',
        message: `Unhandled promise rejection: ${event.reason}`,
        details: event.reason,
        stackTrace: event.reason?.stack
      });
    });

    // Log initial session info
    this.logInfo({
      category: 'general',
      message: 'Error logging service initialized',
      details: {
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    });
  }

  private createLogEntry(
    level: ErrorLogEntry['level'],
    category: ErrorLogEntry['category'],
    message: string,
    details?: any,
    context?: ErrorLogEntry['context'],
    stackTrace?: string
  ): ErrorLogEntry {
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      details,
      context: {
        ...context,
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent
      },
      stackTrace,
      resolved: false
    };
  }

  private addLog(entry: ErrorLogEntry) {
    this.logs.unshift(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = entry.level === 'error' ? console.error :
        entry.level === 'warning' ? console.warn : console.info;

      logMethod(`[${entry.category.toUpperCase()}] ${entry.message}`, {
        id: entry.id,
        details: entry.details,
        context: entry.context,
        stackTrace: entry.stackTrace
      });
    }

    // In production, you might want to send critical errors to a logging service
    if (process.env.NODE_ENV === 'production' && entry.level === 'error') {
      this.sendToLoggingService(entry);
    }
  }

  private async sendToLoggingService(_entry: ErrorLogEntry) {
    try {
      // Example: Send to external logging service
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (error) {
      console.error('Failed to send log to service:', error);
    }
  }

  public logError(params: {
    category: ErrorLogEntry['category'];
    message: string;
    details?: any;
    context?: ErrorLogEntry['context'];
    stackTrace?: string;
  }) {
    const entry = this.createLogEntry(
      'error',
      params.category,
      params.message,
      params.details,
      params.context,
      params.stackTrace
    );
    this.addLog(entry);
    return entry.id;
  }

  public logWarning(params: {
    category: ErrorLogEntry['category'];
    message: string;
    details?: any;
    context?: ErrorLogEntry['context'];
  }) {
    const entry = this.createLogEntry(
      'warning',
      params.category,
      params.message,
      params.details,
      params.context
    );
    this.addLog(entry);
    return entry.id;
  }

  public logInfo(params: {
    category: ErrorLogEntry['category'];
    message: string;
    details?: any;
    context?: ErrorLogEntry['context'];
  }) {
    const entry = this.createLogEntry(
      'info',
      params.category,
      params.message,
      params.details,
      params.context
    );
    this.addLog(entry);
    return entry.id;
  }

  public logResourceError(
    error: ResourceError,
    context?: {
      userId?: string;
      clusterId?: string;
      resourceType?: string;
      operation?: string;
    }
  ): string {
    return this.logError({
      category: 'resource',
      message: `Resource error: ${error.message}`,
      details: {
        errorType: error.type,
        retryable: error.retryable,
        originalTimestamp: error.timestamp,
        errorDetails: error.details
      },
      context
    });
  }

  public logNetworkError(
    url: string,
    method: string,
    status?: number,
    error?: any,
    context?: ErrorLogEntry['context']
  ): string {
    return this.logError({
      category: 'network',
      message: `Network error: ${method} ${url}`,
      details: {
        url,
        method,
        status,
        error: error?.message || error,
        code: error?.code
      },
      context,
      stackTrace: error?.stack
    });
  }

  public logAuthError(
    operation: string,
    error?: any,
    context?: ErrorLogEntry['context']
  ): string {
    return this.logError({
      category: 'auth',
      message: `Authentication error during ${operation}`,
      details: {
        operation,
        error: error?.message || error,
        status: error?.response?.status
      },
      context,
      stackTrace: error?.stack
    });
  }

  public markResolved(logId: string) {
    const log = this.logs.find(l => l.id === logId);
    if (log) {
      log.resolved = true;
    }
  }

  public getLogs(filters?: {
    level?: ErrorLogEntry['level'];
    category?: ErrorLogEntry['category'];
    resolved?: boolean;
    since?: number;
  }): ErrorLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
      }
      if (filters.resolved !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.resolved === filters.resolved);
      }
      if (filters.since !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.since!);
      }
    }

    return filteredLogs;
  }

  public getErrorSummary(): {
    total: number;
    byLevel: Record<ErrorLogEntry['level'], number>;
    byCategory: Record<ErrorLogEntry['category'], number>;
    unresolved: number;
    recent: number; // Last hour
  } {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    const summary = {
      total: this.logs.length,
      byLevel: { error: 0, warning: 0, info: 0 },
      byCategory: { resource: 0, auth: 0, network: 0, ui: 0, general: 0 },
      unresolved: 0,
      recent: 0
    };

    this.logs.forEach(log => {
      summary.byLevel[log.level]++;
      summary.byCategory[log.category]++;
      if (!log.resolved) summary.unresolved++;
      if (log.timestamp >= oneHourAgo) summary.recent++;
    });

    return summary;
  }

  public exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
      summary: this.getErrorSummary(),
      logs: this.logs
    }, null, 2);
  }

  public clearLogs() {
    this.logs = [];
    this.logInfo({
      category: 'general',
      message: 'Error logs cleared'
    });
  }

  public getSessionId(): string {
    return this.sessionId;
  }
}

// Create singleton instance
export const errorLoggingService = new ErrorLoggingService();

// Export for debugging in development
if (process.env.NODE_ENV === 'development') {
  (window as any).errorLoggingService = errorLoggingService;
}