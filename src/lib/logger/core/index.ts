import { GDPRCompliance, Sanitizer } from '../security';
import type { LogContext, LogEntry, LoggerConfig, PerformanceMetrics } from '../types/types';
import { LogLevel } from '../types/types';
import { safeStringify } from '../utils';

export interface LoggerTransport {
  log(entry: LogEntry): void;
  logBatch?(entries: LogEntry[]): void;
}

export class Logger {
  private config: LoggerConfig;
  private transports: LoggerTransport[] = [];
  private sanitizer: Sanitizer;
  private logBuffer: LogEntry[] = [];
  private bufferFlushTimer: number | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || LogLevel.INFO,
      enableColors: config.enableColors ?? true,
      enableTimestamp: config.enableTimestamp ?? true,
      enableStackTrace: config.enableStackTrace ?? false,
      bufferSize: config.bufferSize || 100,
      flushInterval: config.flushInterval || 1000,
      sanitize: config.sanitize ?? true,
      gdprCompliant: config.gdprCompliant ?? false,
      enableAnalytics: config.enableAnalytics ?? false,
      ...config,
    };

    this.sanitizer = new Sanitizer();
    this.startBufferFlush();
  }

  /**
   * Уровни логирования в порядке приоритета
   */
  private static readonly LOG_LEVELS = {
    [LogLevel.TRACE]: 0,
    [LogLevel.DEBUG]: 1,
    [LogLevel.INFO]: 2,
    [LogLevel.WARN]: 3,
    [LogLevel.ERROR]: 4,
    [LogLevel.FATAL]: 5,
    [LogLevel.SILENT]: 6,
  } as const;

  /**
   * Добавляет транспорт для вывода логов
   */
  addTransport(transport: LoggerTransport): Logger {
    this.transports.push(transport);
    return this;
  }

  /**
   * Удаляет транспорт
   */
  removeTransport(transport: LoggerTransport): Logger {
    const index = this.transports.indexOf(transport);
    if (index > -1) {
      this.transports.splice(index, 1);
    }
    return this;
  }

  /**
   * Основной метод логирования
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context);
    this.processLogEntry(entry);
  }

  /**
   * Удобные методы для каждого уровня
   */
  trace(message: string, context?: LogContext): void {
    this.log(LogLevel.TRACE, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(messageOrError: string | Error, context?: LogContext): void {
    if (messageOrError instanceof Error) {
      this.log(LogLevel.ERROR, messageOrError.message, {
        ...context,
        error: {
          name: messageOrError.name,
          message: messageOrError.message,
          stack: messageOrError.stack,
        },
      });
    } else {
      this.log(LogLevel.ERROR, messageOrError, context);
    }
  }

  fatal(messageOrError: string | Error, context?: LogContext): void {
    if (messageOrError instanceof Error) {
      this.log(LogLevel.FATAL, messageOrError.message, {
        ...context,
        error: {
          name: messageOrError.name,
          message: messageOrError.message,
          stack: messageOrError.stack,
        },
      });
    } else {
      this.log(LogLevel.FATAL, messageOrError, context);
    }
  }

  /**
   * Логирование с измерением производительности
   */
  logWithPerformance(
    level: LogLevel,
    message: string,
    operation: () => unknown,
    context?: LogContext
  ): unknown {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();

    const performanceMetrics: PerformanceMetrics = {
      duration: endTime - startTime,
      memory: {
        used: this.getMemoryUsage(),
        total: 0,
        percentage: 0,
      },
    };

    this.log(level, message, {
      ...context,
      performance: performanceMetrics,
    });

    return result;
  }

  /**
   * Групповое логирование
   */
  group(name: string): void {
    this.log(LogLevel.INFO, `▼ ${name}`, { group: 'start' });
  }

  groupEnd(): void {
    this.log(LogLevel.INFO, '▲ Group End', { group: 'end' });
  }

  /**
   * Табличное логирование для данных
   */
  table(data: unknown, context?: LogContext): void {
    this.log(LogLevel.INFO, 'Table Data', {
      ...context,
      table: safeStringify(data),
    });
  }

  /**
   * Принудительная очистка буфера
   */
  flush(): void {
    if (this.logBuffer.length > 0) {
      const entries = [...this.logBuffer];
      this.logBuffer = [];

      for (const transport of this.transports) {
        transport.logBatch?.(entries) || entries.forEach(entry => transport.log(entry));
      }
    }
  }

  /**
   * Создание записи лога
   */
  private createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      level,
      message,
      timestamp: Date.now(),
      context: context || {},
      metadata: {
        source: 'web-app',
        tags: [],
        correlationId: this.generateId(),
        sequenceNumber: 0,
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
      },
    };

    // Добавляем stack trace для ошибок
    if (this.config.enableStackTrace && (level === LogLevel.ERROR || level === LogLevel.FATAL)) {
      (entry as LogEntry & { stackTrace?: string }).stackTrace = new Error().stack;
    }

    return entry;
  }

  /**
   * Обработка записи лога
   */
  private processLogEntry(entry: LogEntry): void {
    let processedEntry = entry;

    // Санитизация
    if (this.config.sanitize) {
      processedEntry = this.sanitizer.sanitize(processedEntry);
    }

    // GDPR соответствие
    if (this.config.gdprCompliant) {
      processedEntry.context = GDPRCompliance.anonymize(processedEntry.context) as LogContext;
    }

    // Буферизация
    if (this.config.bufferSize && this.config.bufferSize > 0) {
      this.logBuffer.push(processedEntry);

      if (this.logBuffer.length >= this.config.bufferSize) {
        this.flush();
      }
    } else {
      // Немедленная отправка
      for (const transport of this.transports) {
        transport.log(processedEntry);
      }
    }

    // Аналитика
    if (this.config.enableAnalytics) {
      this.trackAnalytics(processedEntry);
    }
  }

  /**
   * Проверка, нужно ли логировать на данном уровне
   */
  private shouldLog(level: LogLevel): boolean {
    const currentLevelValue = Logger.LOG_LEVELS[this.config.level];
    const messageLevelValue = Logger.LOG_LEVELS[level];
    return messageLevelValue >= currentLevelValue;
  }

  /**
   * Запуск автоматической очистки буфера
   */
  private startBufferFlush(): void {
    if (this.config.flushInterval && this.config.flushInterval > 0) {
      this.bufferFlushTimer = window.setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  /**
   * Генерация уникального ID для записи
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Получение использования памяти
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      return memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Отслеживание аналитики
   */
  private trackAnalytics(entry: LogEntry): void {
    // Здесь можно добавить отправку в аналитические системы
    // Google Analytics, Mixpanel, Amplitude и т.д.
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'log_entry', {
        event_category: 'logging',
        event_label: entry.level,
        value: 1,
      });
    }
  }

  /**
   * Очистка ресурсов
   */
  destroy(): void {
    if (this.bufferFlushTimer) {
      clearInterval(this.bufferFlushTimer);
      this.bufferFlushTimer = null;
    }

    this.flush();
    this.transports = [];
    this.logBuffer = [];
  }

  /**
   * Получение конфигурации
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Обновление конфигурации
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Получение статистики
   */
  getStats(): {
    bufferedEntries: number;
    transportsCount: number;
    totalProcessed: number;
  } {
    return {
      bufferedEntries: this.logBuffer.length,
      transportsCount: this.transports.length,
      totalProcessed: 0, // TODO: добавить счетчик обработанных записей
    };
  }
}
