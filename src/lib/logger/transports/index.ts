import type { LoggerTransport } from '../core';
import type { LogEntry } from '../types/types';
import { LogLevel } from '../types/types';

/**
 * Консольный транспорт для вывода логов в браузерную консоль
 */
export class ConsoleTransport implements LoggerTransport {
  private colors: Record<string, string> = {
    [LogLevel.TRACE]: '#6B7280', // gray
    [LogLevel.DEBUG]: '#3B82F6', // blue
    [LogLevel.INFO]: '#10B981', // green
    [LogLevel.WARN]: '#F59E0B', // yellow
    [LogLevel.ERROR]: '#EF4444', // red
    [LogLevel.FATAL]: '#DC2626', // dark red
  };

  private enableColors: boolean;
  private enableGrouping: boolean;

  constructor(options: { enableColors?: boolean; enableGrouping?: boolean } = {}) {
    this.enableColors = options.enableColors ?? true;
    this.enableGrouping = options.enableGrouping ?? false;
  }

  log(entry: LogEntry): void {
    const { level, message, timestamp, context } = entry;

    // Форматируем время
    const time = new Date(timestamp).toISOString();

    // Основное сообщение
    const logMessage = `[${time}] ${level}: ${message}`;

    // Выбираем метод консоли
    const method = this.getConsoleMethod(level);

    // Отключаем ESLint для использования console
    // eslint-disable-next-line no-console
    if (this.enableColors && typeof console[method] === 'function') {
      // eslint-disable-next-line no-console
      (console[method] as (message: string, style?: string) => void)(
        `%c${logMessage}`,
        `color: ${this.colors[level]}`
      );
    } else {
      // eslint-disable-next-line no-console
      (console[method] as (message: string) => void)(logMessage);
    }

    // Выводим контекст если есть
    if (context && Object.keys(context).length > 0) {
      // eslint-disable-next-line no-console
      console.groupCollapsed('Context:');
      // eslint-disable-next-line no-console
      console.table(context);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }

    // Группировка
    if (this.enableGrouping && context?.group) {
      if (context.group === 'start') {
        // eslint-disable-next-line no-console
        console.group(message);
      } else if (context.group === 'end') {
        // eslint-disable-next-line no-console
        console.groupEnd();
      }
    }
  }

  logBatch(entries: LogEntry[]): void {
    // eslint-disable-next-line no-console
    console.group(`Batch Log (${entries.length} entries)`);
    entries.forEach(entry => this.log(entry));
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  private getConsoleMethod(level: LogLevel): keyof Console {
    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return 'error';
      default:
        return 'log';
    }
  }
}

/**
 * Транспорт для отправки логов на удаленный сервер
 */
export class RemoteTransport implements LoggerTransport {
  private url: string;
  private apiKey: string;
  private batchSize: number;
  private buffer: LogEntry[] = [];
  private headers: Record<string, string>;

  constructor(options: {
    url: string;
    apiKey: string;
    batchSize?: number;
    headers?: Record<string, string>;
  }) {
    this.url = options.url;
    this.apiKey = options.apiKey;
    this.batchSize = options.batchSize || 10;
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...options.headers,
    };
  }

  log(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  logBatch(entries: LogEntry[]): void {
    this.buffer.push(...entries);
    this.flush();
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const payload = {
      logs: [...this.buffer],
      timestamp: Date.now(),
      source: 'web-app',
    };

    this.buffer = [];

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error('Failed to send logs to remote server:', response.statusText);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending logs:', error);
      // Можно добавить retry логику
    }
  }
}

/**
 * Транспорт для сохранения логов в localStorage
 */
export class LocalStorageTransport implements LoggerTransport {
  private key: string;
  private maxEntries: number;

  constructor(options: { key?: string; maxEntries?: number } = {}) {
    this.key = options.key || 'app_logs';
    this.maxEntries = options.maxEntries || 1000;
  }

  log(entry: LogEntry): void {
    try {
      const existingLogs = this.getLogs();
      existingLogs.push(entry);

      // Ограничиваем количество записей
      if (existingLogs.length > this.maxEntries) {
        existingLogs.splice(0, existingLogs.length - this.maxEntries);
      }

      localStorage.setItem(this.key, JSON.stringify(existingLogs));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save log to localStorage:', error);
    }
  }

  logBatch(entries: LogEntry[]): void {
    entries.forEach(entry => this.log(entry));
  }

  getLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearLogs(): void {
    localStorage.removeItem(this.key);
  }

  exportLogs(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }
}

/**
 * Транспорт для интеграции с Sentry
 */
export class SentryTransport implements LoggerTransport {
  private minLevel: LogLevel;

  constructor(options: { dsn: string; minLevel?: LogLevel }) {
    this.minLevel = options.minLevel || LogLevel.ERROR;
  }

  log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // Проверяем наличие Sentry
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      const Sentry = (
        window as unknown as {
          Sentry: {
            captureMessage: (message: string, level: string) => void;
            captureException: (error: Error) => void;
            addBreadcrumb: (breadcrumb: {
              message: string;
              level: string;
              timestamp: number;
            }) => void;
          };
        }
      ).Sentry;

      if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
        if (entry.context?.error) {
          const error = new Error(entry.message);
          error.stack = entry.context.error.stack as string;
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(entry.message, String(entry.level).toLowerCase());
        }
      } else {
        Sentry.addBreadcrumb({
          message: entry.message,
          level: String(entry.level).toLowerCase(),
          timestamp: entry.timestamp,
        });
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('Sentry not available, falling back to console');
      // eslint-disable-next-line no-console
      console.error(`[SENTRY] ${entry.level}: ${entry.message}`);
    }
  }

  logBatch(entries: LogEntry[]): void {
    entries.forEach(entry => this.log(entry));
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.TRACE,
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ];
    const minIndex = levels.indexOf(this.minLevel);
    const levelIndex = levels.indexOf(level);
    return levelIndex >= minIndex;
  }
}

/**
 * Файловый транспорт (для Node.js окружения)
 */
export class FileTransport implements LoggerTransport {
  constructor(options: { filePath: string; maxFileSize?: number; maxFiles?: number }) {
    // Сохраняем опции для будущего использования
    void options;
  }

  log(entry: LogEntry): void {
    // Этот транспорт предназначен для Node.js
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('FileTransport is not supported in browser environment');
      return;
    }

    const logLine = JSON.stringify(entry) + '\n';

    // В реальном приложении здесь был бы код для записи в файл
    // eslint-disable-next-line no-console
    console.log(`[FILE] ${logLine}`);
  }

  logBatch(entries: LogEntry[]): void {
    entries.forEach(entry => this.log(entry));
  }
}
