/**
 * ADVANCED Error Handling System v1.0
 * Централизованная система обработки ошибок с восстановлением и аналитикой
 *
 * Возможности:
 * - Глобальная обработка всех типов ошибок
 * - Автоматическое восстановление и retry логика
 * - Контекстная информация об ошибках
 * - Система уведомлений и алертов
 * - Аналитика и группировка ошибок
 * - Интеграция с системами мониторинга
 */

// Базовые типы для системы обработки ошибок
interface WindowWithMonitoring extends Window {
  monitoring?: {
    recordMetric: (metric: {
      name: string;
      type: string;
      category: string;
      value: number;
      timestamp: number;
      unit: string;
      tags: Record<string, string>;
    }) => void;
  };
}

interface ErrorContext {
  timestamp: number;
  url?: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  stackTrace?: string;
  additionalData?: Record<string, unknown>;
}

interface ErrorInfo {
  id: string;
  type: 'javascript' | 'promise' | 'network' | 'validation' | 'business' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  code?: string | number;
  context: ErrorContext;
  resolved: boolean;
  recoveryAttempts: number;
  maxRetries: number;
  retryStrategy?: 'immediate' | 'exponential' | 'linear' | 'custom';
}

interface ErrorHandlerConfig {
  enableGlobalHandlers: boolean;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableNotifications: boolean;
  enableAnalytics: boolean;
  enableDebug: boolean;
  endpoints: {
    errorReporting?: string;
    analytics?: string;
  };
  ignoredErrors: string[];
  criticalPatterns: RegExp[];
}

interface RecoveryStrategy {
  name: string;
  canRecover: (error: ErrorInfo) => boolean;
  recover: (error: ErrorInfo) => Promise<boolean>;
  priority: number;
}

interface ErrorNotification {
  id: string;
  error: ErrorInfo;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

/**
 * Продвинутая система обработки ошибок
 */
export class AdvancedErrorHandler {
  private config: ErrorHandlerConfig;
  private errorLog: ErrorInfo[] = [];
  private notifications: ErrorNotification[] = [];
  private recoveryStrategies: RecoveryStrategy[] = [];
  private errorCallbacks = new Map<string, (error: ErrorInfo) => void>();
  private errorStats = new Map<
    string,
    {
      count: number;
      lastOccurrence: number;
      averageFrequency: number;
    }
  >();

  // Группировка ошибок по похожести
  private errorGroups = new Map<
    string,
    {
      signature: string;
      errors: ErrorInfo[];
      count: number;
      lastSeen: number;
      resolved: boolean;
    }
  >();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableGlobalHandlers: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableNotifications: true,
      enableAnalytics: true,
      enableDebug: process.env.NODE_ENV !== 'production',
      endpoints: {},
      ignoredErrors: [
        'Script error.',
        'Network Error',
        'Load failed',
        'Non-Error promise rejection captured',
      ],
      criticalPatterns: [/payment/i, /auth/i, /security/i, /database/i, /critical/i],
      ...config,
    };

    this.initializeDefaultStrategies();

    if (this.config.enableGlobalHandlers) {
      this.initializeGlobalHandlers();
    }
  }

  /**
   * Инициализация стратегий восстановления по умолчанию
   */
  private initializeDefaultStrategies(): void {
    // Стратегия для сетевых ошибок
    this.addRecoveryStrategy({
      name: 'NetworkRetry',
      priority: 1,
      canRecover: error => {
        return error.type === 'network' && error.recoveryAttempts < error.maxRetries;
      },
      recover: async error => {
        await this.delay(this.calculateRetryDelay(error.recoveryAttempts));
        return true; // Позволяет retry
      },
    });

    // Стратегия для JavaScript ошибок
    this.addRecoveryStrategy({
      name: 'ComponentReload',
      priority: 2,
      canRecover: error => {
        return !!(
          error.type === 'javascript' &&
          error.context.component &&
          error.recoveryAttempts < 2
        );
      },
      recover: async error => {
        try {
          // Попытка перезагрузить компонент
          if (error.context.component) {
            await this.reloadComponent(error.context.component);
          }
          return true;
        } catch {
          return false;
        }
      },
    });

    // Стратегия для ошибок валидации
    this.addRecoveryStrategy({
      name: 'ValidationFallback',
      priority: 3,
      canRecover: error => {
        return error.type === 'validation' && error.severity !== 'critical';
      },
      recover: async error => {
        // Применяем fallback значения
        this.debug('Applying validation fallback for:', error.message);
        return true;
      },
    });

    // Стратегия для бизнес-логики ошибок
    this.addRecoveryStrategy({
      name: 'BusinessLogicFallback',
      priority: 4,
      canRecover: error => {
        return error.type === 'business' && error.severity === 'low';
      },
      recover: async error => {
        // Применяем альтернативный путь выполнения
        this.debug('Applying business logic fallback for:', error.message);
        return true;
      },
    });
  }

  /**
   * Инициализация глобальных обработчиков ошибок
   */
  private initializeGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      // JavaScript errors
      window.addEventListener('error', event => {
        this.handleError({
          type: 'javascript',
          severity: this.determineSeverity(event.message),
          message: event.message,
          context: {
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            stackTrace: event.error?.stack,
            additionalData: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
            },
          },
        });
      });

      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', event => {
        this.handleError({
          type: 'promise',
          severity: this.determineSeverity(String(event.reason)),
          message: `Unhandled Promise Rejection: ${event.reason}`,
          context: {
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            additionalData: {
              reason: event.reason,
            },
          },
        });
      });
    }
  }

  /**
   * Основная функция обработки ошибок
   */
  async handleError(errorInput: {
    type: ErrorInfo['type'];
    severity: ErrorInfo['severity'];
    message: string;
    code?: string | number;
    context?: Partial<ErrorContext>;
    maxRetries?: number;
    retryStrategy?: ErrorInfo['retryStrategy'];
  }): Promise<void> {
    // Проверяем игнорируемые ошибки
    if (this.shouldIgnoreError(errorInput.message)) {
      return;
    }

    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      type: errorInput.type,
      severity: errorInput.severity,
      message: errorInput.message,
      code: errorInput.code,
      context: {
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        sessionId: this.getSessionId(),
        ...errorInput.context,
      },
      resolved: false,
      recoveryAttempts: 0,
      maxRetries: errorInput.maxRetries || this.config.maxRetries,
      retryStrategy: errorInput.retryStrategy || 'exponential',
    };

    // Добавляем в лог
    this.errorLog.push(errorInfo);

    // Обновляем статистику
    this.updateErrorStats(errorInfo);

    // Группируем ошибку
    this.groupError(errorInfo);

    // Уведомляем мониторинг
    this.notifyMonitoring(errorInfo);

    // Создаем уведомление
    if (this.config.enableNotifications) {
      this.createNotification(errorInfo);
    }

    // Пытаемся восстановиться
    if (this.config.enableRetry) {
      await this.attemptRecovery(errorInfo);
    }

    // Вызываем callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorInfo);
      } catch (callbackError) {
        this.debug('Error in callback:', callbackError);
      }
    });

    // Отправляем аналитику
    if (this.config.enableAnalytics) {
      await this.sendAnalytics(errorInfo);
    }

    this.debug('Error handled:', errorInfo);
  }

  /**
   * Проверка, нужно ли игнорировать ошибку
   */
  private shouldIgnoreError(message: string): boolean {
    return this.config.ignoredErrors.some(pattern => message.includes(pattern));
  }

  /**
   * Определение серьезности ошибки
   */
  private determineSeverity(message: string): ErrorInfo['severity'] {
    // Проверяем критические паттерны
    if (this.config.criticalPatterns.some(pattern => pattern.test(message))) {
      return 'critical';
    }

    // Базовая логика определения серьезности
    if (message.toLowerCase().includes('critical') || message.toLowerCase().includes('fatal')) {
      return 'critical';
    }

    if (message.toLowerCase().includes('error') || message.toLowerCase().includes('fail')) {
      return 'high';
    }

    if (message.toLowerCase().includes('warning') || message.toLowerCase().includes('warn')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Обновление статистики ошибок
   */
  private updateErrorStats(error: ErrorInfo): void {
    const key = `${error.type}_${error.message}`;
    const existing = this.errorStats.get(key);

    if (existing) {
      existing.count++;
      const timeDiff = error.context.timestamp - existing.lastOccurrence;
      existing.averageFrequency = (existing.averageFrequency + timeDiff) / 2;
      existing.lastOccurrence = error.context.timestamp;
    } else {
      this.errorStats.set(key, {
        count: 1,
        lastOccurrence: error.context.timestamp,
        averageFrequency: 0,
      });
    }
  }

  /**
   * Группировка ошибок по похожести
   */
  private groupError(error: ErrorInfo): void {
    const signature = this.generateErrorSignature(error);
    const existing = this.errorGroups.get(signature);

    if (existing) {
      existing.errors.push(error);
      existing.count++;
      existing.lastSeen = error.context.timestamp;
    } else {
      this.errorGroups.set(signature, {
        signature,
        errors: [error],
        count: 1,
        lastSeen: error.context.timestamp,
        resolved: false,
      });
    }
  }

  /**
   * Генерация подписи ошибки для группировки
   */
  private generateErrorSignature(error: ErrorInfo): string {
    // Простая подпись на основе типа и первых слов сообщения
    const messageWords = error.message.split(' ').slice(0, 3).join(' ');
    return `${error.type}_${messageWords}`;
  }

  /**
   * Уведомление системы мониторинга
   */
  private notifyMonitoring(error: ErrorInfo): void {
    try {
      // Предполагаем интеграцию с системой мониторинга
      const windowWithMonitoring = window as WindowWithMonitoring;
      if (typeof window !== 'undefined' && windowWithMonitoring.monitoring) {
        windowWithMonitoring.monitoring.recordMetric({
          name: `error.${error.type}`,
          type: 'system',
          category: 'error',
          value: 1,
          timestamp: Date.now(),
          unit: 'count',
          tags: {
            severity: error.severity,
            type: error.type,
            code: String(error.code || 'unknown'),
          },
        });
      }
    } catch (monitoringError) {
      this.debug('Failed to notify monitoring:', monitoringError);
    }
  }

  /**
   * Создание уведомления
   */
  private createNotification(error: ErrorInfo): void {
    const notification: ErrorNotification = {
      id: this.generateNotificationId(),
      error,
      level: this.mapSeverityToLevel(error.severity),
      message: this.formatNotificationMessage(error),
      timestamp: Date.now(),
      acknowledged: false,
    };

    this.notifications.push(notification);

    // Ограничиваем количество уведомлений
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(-50);
    }
  }

  /**
   * Маппинг серьезности в уровень уведомления
   */
  private mapSeverityToLevel(severity: ErrorInfo['severity']): ErrorNotification['level'] {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * Форматирование сообщения уведомления
   */
  private formatNotificationMessage(error: ErrorInfo): string {
    return `${error.type.toUpperCase()}: ${error.message}`;
  }

  /**
   * Попытка восстановления после ошибки
   */
  private async attemptRecovery(error: ErrorInfo): Promise<boolean> {
    // Находим подходящие стратегии восстановления
    const applicableStrategies = this.recoveryStrategies
      .filter(strategy => strategy.canRecover(error))
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of applicableStrategies) {
      try {
        error.recoveryAttempts++;

        this.debug(`Attempting recovery with strategy: ${strategy.name}`);

        const recovered = await strategy.recover(error);

        if (recovered) {
          error.resolved = true;
          this.debug(`Recovery successful with strategy: ${strategy.name}`);
          return true;
        }
      } catch (recoveryError) {
        this.debug(`Recovery failed with strategy: ${strategy.name}`, recoveryError);
      }
    }

    return false;
  }

  /**
   * Расчет задержки для retry
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay;
    return baseDelay * Math.pow(2, attempt);
  }

  /**
   * Задержка выполнения
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Попытка перезагрузки компонента
   */
  private async reloadComponent(componentName: string): Promise<void> {
    this.debug(`Attempting to reload component: ${componentName}`);

    // Здесь должна быть логика перезагрузки компонента
    // В зависимости от фреймворка (React, Vue, Svelte и т.д.)

    // Для примера - простая задержка
    await this.delay(100);
  }

  /**
   * Отправка аналитики
   */
  private async sendAnalytics(error: ErrorInfo): Promise<void> {
    if (!this.config.endpoints.analytics) {
      return;
    }

    try {
      await fetch(this.config.endpoints.analytics, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          error: {
            id: error.id,
            type: error.type,
            severity: error.severity,
            message: error.message,
            context: error.context,
          },
        }),
      });
    } catch (analyticsError) {
      this.debug('Failed to send analytics:', analyticsError);
    }
  }

  /**
   * Добавление стратегии восстановления
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
    this.recoveryStrategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Регистрация callback'а для ошибок
   */
  onError(name: string, callback: (error: ErrorInfo) => void): void {
    this.errorCallbacks.set(name, callback);
  }

  /**
   * Удаление callback'а для ошибок
   */
  offError(name: string): void {
    this.errorCallbacks.delete(name);
  }

  /**
   * Получение статистики ошибок
   */
  getErrorStats() {
    return {
      totalErrors: this.errorLog.length,
      errorsByType: this.getErrorsByType(),
      errorsBySeverity: this.getErrorsBySeverity(),
      recentErrors: this.getRecentErrors(10),
      topErrors: this.getTopErrors(5),
      errorGroups: Array.from(this.errorGroups.values()),
      notifications: this.notifications.filter(n => !n.acknowledged),
    };
  }

  /**
   * Группировка ошибок по типу
   */
  private getErrorsByType(): Record<string, number> {
    return this.errorLog.reduce(
      (acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Группировка ошибок по серьезности
   */
  private getErrorsBySeverity(): Record<string, number> {
    return this.errorLog.reduce(
      (acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Получение последних ошибок
   */
  private getRecentErrors(limit: number): ErrorInfo[] {
    return this.errorLog.sort((a, b) => b.context.timestamp - a.context.timestamp).slice(0, limit);
  }

  /**
   * Получение самых частых ошибок
   */
  private getTopErrors(limit: number): Array<{
    message: string;
    count: number;
    lastOccurrence: number;
  }> {
    return Array.from(this.errorStats.entries())
      .map(([key, stats]) => ({
        message: key,
        count: stats.count,
        lastOccurrence: stats.lastOccurrence,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Подтверждение уведомления
   */
  acknowledgeNotification(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.acknowledged = true;
    }
  }

  /**
   * Очистка старых данных
   */
  cleanup(): void {
    const oneHourAgo = Date.now() - 3600000; // 1 час

    // Очищаем старые ошибки
    this.errorLog = this.errorLog.filter(error => error.context.timestamp > oneHourAgo);

    // Очищаем старые уведомления
    this.notifications = this.notifications.filter(
      notification => notification.timestamp > oneHourAgo
    );

    // Очищаем старые группы ошибок
    this.errorGroups.forEach((group, key) => {
      if (group.lastSeen < oneHourAgo) {
        this.errorGroups.delete(key);
      }
    });
  }

  /**
   * Вспомогательные методы
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    // Здесь должна быть логика получения ID сессии
    return typeof window !== 'undefined' && window.sessionStorage
      ? window.sessionStorage.getItem('sessionId') || 'unknown'
      : 'server';
  }

  private debug(...args: unknown[]): void {
    if (this.config.enableDebug && typeof window !== 'undefined' && window.console) {
      window.console.log('[ErrorHandler]', ...args);
    }
  }

  /**
   * Уничтожение экземпляра
   */
  destroy(): void {
    this.errorLog.length = 0;
    this.notifications.length = 0;
    this.recoveryStrategies.length = 0;
    this.errorCallbacks.clear();
    this.errorStats.clear();
    this.errorGroups.clear();
  }
}

/**
 * Фабрика для создания конфигураций обработки ошибок
 */
export class ErrorHandlerConfigFactory {
  /**
   * Конфигурация для разработки
   */
  static createDevelopmentConfig(): Partial<ErrorHandlerConfig> {
    return {
      enableGlobalHandlers: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableNotifications: true,
      enableAnalytics: false,
      enableDebug: true,
      ignoredErrors: ['Script error.', 'Network Error'],
      criticalPatterns: [/critical/i, /fatal/i],
    };
  }

  /**
   * Конфигурация для продакшена
   */
  static createProductionConfig(): Partial<ErrorHandlerConfig> {
    return {
      enableGlobalHandlers: true,
      enableRetry: true,
      maxRetries: 2,
      retryDelay: 2000,
      enableNotifications: true,
      enableAnalytics: true,
      enableDebug: false,
      ignoredErrors: [
        'Script error.',
        'Network Error',
        'Load failed',
        'Non-Error promise rejection captured',
      ],
      criticalPatterns: [/payment/i, /auth/i, /security/i, /database/i, /critical/i, /fatal/i],
    };
  }

  /**
   * Конфигурация для тестирования
   */
  static createTestConfig(): Partial<ErrorHandlerConfig> {
    return {
      enableGlobalHandlers: false,
      enableRetry: false,
      enableNotifications: false,
      enableAnalytics: false,
      enableDebug: false,
      ignoredErrors: [],
      criticalPatterns: [],
    };
  }
}

// Глобальный экземпляр обработчика ошибок
export const errorHandler = new AdvancedErrorHandler(
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
    ? ErrorHandlerConfigFactory.createProductionConfig()
    : ErrorHandlerConfigFactory.createDevelopmentConfig()
);
