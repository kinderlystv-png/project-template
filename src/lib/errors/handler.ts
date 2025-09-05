import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  NotFoundError,
  ServerError,
  ValidationError,
} from './types.js';

export interface ErrorBoundary {
  (error: Error): void;
}

export interface ErrorHandlerConfig {
  enableGlobalHandlers: boolean;
  enableNotifications: boolean;
  enableReporting: boolean;
  reportEndpoint?: string;
  maxErrorLogs: number;
}

export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorBoundaries = new Set<ErrorBoundary>();
  private errorCount = 0;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableGlobalHandlers: true,
      enableNotifications: true,
      enableReporting: false,
      maxErrorLogs: 100,
      ...config,
    };

    if (this.config.enableGlobalHandlers) {
      this.setupGlobalHandlers();
    }
  }

  private setupGlobalHandlers(): void {
    // Необработанные ошибки JavaScript
    window.addEventListener('error', event => {
      const error = new AppError(event.message, 'UNCAUGHT_ERROR', 500, false, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
      this.handleError(error);
      event.preventDefault();
    });

    // Необработанные Promise rejections
    window.addEventListener('unhandledrejection', event => {
      const error = new AppError(
        `Unhandled Promise Rejection: ${String(event.reason)}`,
        'UNHANDLED_REJECTION',
        500,
        false,
        { reason: event.reason }
      );
      this.handleError(error);
      event.preventDefault();
    });
  }

  public handleError(error: Error | AppError, context?: Record<string, unknown>): void {
    this.errorCount++;

    // Создаем AppError если это обычная ошибка
    const appError =
      error instanceof AppError
        ? error
        : new AppError(error.message, 'UNKNOWN_ERROR', 500, false, context);

    // Логирование
    this.logError(appError);

    // Определяем тип обработки
    if (appError.isOperational) {
      // Операционная ошибка - показываем пользователю
      if (this.config.enableNotifications) {
        this.showUserNotification(appError);
      }
    } else {
      // Программная ошибка - отправляем в систему мониторинга
      if (this.config.enableReporting) {
        this.reportError(appError);
      }
    }

    // Уведомляем подписчиков
    this.errorBoundaries.forEach(handler => {
      try {
        handler(appError);
      } catch (boundaryError) {
        console.error('Error in error boundary:', boundaryError);
      }
    });

    // Сохраняем в localStorage для отладки
    this.saveErrorLog(appError);
  }

  public createError(
    type: 'validation' | 'auth' | 'authorization' | 'notFound' | 'network' | 'server',
    message?: string,
    context?: Record<string, unknown>
  ): AppError {
    switch (type) {
      case 'validation':
        return new ValidationError(message || 'Validation failed', context);
      case 'auth':
        return new AuthenticationError(message, context);
      case 'authorization':
        return new AuthorizationError(message, context);
      case 'notFound':
        return new NotFoundError(message, context);
      case 'network':
        return new NetworkError(message, context);
      case 'server':
        return new ServerError(message, context);
      default:
        return new AppError(message || 'Unknown error', 'UNKNOWN_ERROR', 500, false, context);
    }
  }

  public registerErrorBoundary(handler: ErrorBoundary): () => void {
    this.errorBoundaries.add(handler);
    return () => this.errorBoundaries.delete(handler);
  }

  public getErrorStats(): { count: number; recentErrors: AppError[] } {
    const logs = this.getErrorLogs();
    return {
      count: this.errorCount,
      recentErrors: logs.slice(-10), // Последние 10 ошибок
    };
  }

  public clearErrorLogs(): void {
    localStorage.removeItem('error_logs');
    this.errorCount = 0;
  }

  public getErrorLogs(): AppError[] {
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      return logs.map((log: any) => Object.assign(new AppError('', ''), log));
    } catch {
      return [];
    }
  }

  // Приватные методы

  private logError(error: AppError): void {
    const logLevel = error.isOperational ? 'warn' : 'error';
    console[logLevel]('Error occurred:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      stack: error.stack,
    });
  }

  private showUserNotification(error: AppError): void {
    const message = this.getUserFriendlyMessage(error.code);

    // Dispatch custom event для UI компонентов
    window.dispatchEvent(
      new CustomEvent('app:error', {
        detail: {
          message,
          code: error.code,
          statusCode: error.statusCode,
          isOperational: error.isOperational,
        },
      })
    );
  }

  private getUserFriendlyMessage(code: string): string {
    const messages: Record<string, string> = {
      AUTH_FAILED: 'Ошибка авторизации. Пожалуйста, войдите снова.',
      NETWORK_ERROR: 'Проблема с подключением. Проверьте интернет.',
      VALIDATION_ERROR: 'Проверьте правильность введенных данных.',
      PERMISSION_DENIED: 'У вас нет прав для выполнения этого действия.',
      NOT_FOUND: 'Запрашиваемый ресурс не найден.',
      SERVER_ERROR: 'Произошла ошибка на сервере. Попробуйте позже.',
      UNCAUGHT_ERROR: 'Произошла непредвиденная ошибка.',
      UNHANDLED_REJECTION: 'Произошла ошибка при обработке запроса.',
    };

    return messages[code] || 'Произошла непредвиденная ошибка.';
  }

  private async reportError(error: AppError): void {
    if (!this.config.reportEndpoint) return;

    try {
      await fetch(this.config.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.toJSON(),
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          sessionId: this.getSessionId(),
        }),
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  private saveErrorLog(error: AppError): void {
    try {
      const logs = this.getErrorLogs();
      logs.push(error);

      // Храним только последние N ошибок
      if (logs.length > this.config.maxErrorLogs) {
        logs.splice(0, logs.length - this.config.maxErrorLogs);
      }

      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (saveError) {
      console.error('Failed to save error log:', saveError);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
}

// Глобальный экземпляр обработчика ошибок
export const errorHandler = new ErrorHandler();

// Экспорт типов ошибок для удобства
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  NotFoundError,
  ServerError,
  ValidationError,
};
