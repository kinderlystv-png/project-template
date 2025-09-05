/**
 * SHINOMONTAGKA Logger System
 * Централизованная система логирования для веб-приложения
 */

// Основные типы
export {
  LogLevel,
  type LogContext,
  type LogEntry,
  type LoggerConfig,
  type LogMetadata,
  type PerformanceMetrics,
} from './types/types';

// Основной класс Logger
export { Logger } from './core';

// Транспорты
export {
  ConsoleTransport,
  FileTransport,
  LocalStorageTransport,
  RemoteTransport,
  SentryTransport,
} from './transports';

// Утилиты
export { formatBytes, getSystemInfo, safeStringify } from './utils';

// Безопасность
export { GDPRCompliance, LogEncryption, Sanitizer } from './security';

// Импорты для использования в коде
import { Logger } from './core';
import {
  ConsoleTransport,
  LocalStorageTransport,
  RemoteTransport,
  SentryTransport,
} from './transports';
import { LogLevel, type LogContext } from './types/types';

// Фабрика для создания предконфигурированных логгеров
export class LoggerFactory {
  /**
   * Создает консольный логгер для разработки
   */
  static createConsoleLogger(level: LogLevel = LogLevel.DEBUG): Logger {
    const logger = new Logger({
      level,
      enableColors: true,
      enableStackTrace: true,
    });

    logger.addTransport(
      new ConsoleTransport({
        enableColors: true,
        enableGrouping: true,
      })
    );

    return logger;
  }

  /**
   * Создает продакшн логгер с удаленным сервером
   */
  static createProductionLogger(config: {
    level?: LogLevel;
    remoteUrl: string;
    apiKey: string;
    enableSentry?: boolean;
    sentryDsn?: string;
  }): Logger {
    const logger = new Logger({
      level: config.level || LogLevel.INFO,
      sanitize: true,
      gdprCompliant: true,
      enableAnalytics: true,
    });

    // Удаленный транспорт
    logger.addTransport(
      new RemoteTransport({
        url: config.remoteUrl,
        apiKey: config.apiKey,
        batchSize: 50,
      })
    );

    // Sentry для ошибок
    if (config.enableSentry && config.sentryDsn) {
      logger.addTransport(
        new SentryTransport({
          dsn: config.sentryDsn,
          minLevel: LogLevel.ERROR,
        })
      );
    }

    // LocalStorage для автономного режима
    logger.addTransport(
      new LocalStorageTransport({
        key: 'shinomontagka_logs',
        maxEntries: 500,
      })
    );

    return logger;
  }

  /**
   * Создает тестовый логгер
   */
  static createTestLogger(): Logger {
    const logger = new Logger({
      level: LogLevel.TRACE,
      enableStackTrace: false,
      sanitize: false,
    });

    // Минимальный консольный вывод для тестов
    logger.addTransport(
      new ConsoleTransport({
        enableColors: false,
        enableGrouping: false,
      })
    );

    return logger;
  }

  /**
   * Создает аналитический логгер для отслеживания пользователей
   */
  static createAnalyticsLogger(config: { remoteUrl: string; apiKey: string }): Logger {
    const logger = new Logger({
      level: LogLevel.INFO,
      enableAnalytics: true,
      sanitize: true,
      gdprCompliant: true,
    });

    logger.addTransport(
      new RemoteTransport({
        url: config.remoteUrl,
        apiKey: config.apiKey,
        batchSize: 20,
      })
    );

    return logger;
  }
}

// Глобальный экземпляр логгера
let globalLogger: Logger | null = null;

/**
 * Инициализирует глобальный логгер
 */
export function initLogger(
  config: {
    type: 'development' | 'production' | 'test';
    level?: LogLevel;
    remoteUrl?: string;
    apiKey?: string;
    sentryDsn?: string;
  } = { type: 'development' }
): Logger {
  const { type = 'development', ...options } = config;

  switch (type) {
    case 'production':
      if (!options.remoteUrl || !options.apiKey) {
        throw new Error('Production logger requires remoteUrl and apiKey');
      }
      globalLogger = LoggerFactory.createProductionLogger({
        level: options.level,
        remoteUrl: options.remoteUrl,
        apiKey: options.apiKey,
        enableSentry: !!options.sentryDsn,
        sentryDsn: options.sentryDsn,
      });
      break;

    case 'test':
      globalLogger = LoggerFactory.createTestLogger();
      break;

    default: // development
      globalLogger = LoggerFactory.createConsoleLogger(options.level);
      break;
  }

  return globalLogger;
}

/**
 * Получает глобальный экземпляр логгера
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = LoggerFactory.createConsoleLogger();
  }
  return globalLogger;
}

export const log = {
  trace: (message: string, context?: LogContext) => getLogger().trace(message, context),
  debug: (message: string, context?: LogContext) => getLogger().debug(message, context),
  info: (message: string, context?: LogContext) => getLogger().info(message, context),
  warn: (message: string, context?: LogContext) => getLogger().warn(message, context),
  error: (messageOrError: string | Error, context?: LogContext) =>
    getLogger().error(messageOrError, context),
  fatal: (messageOrError: string | Error, context?: LogContext) =>
    getLogger().fatal(messageOrError, context),
  group: (name: string) => getLogger().group(name),
  groupEnd: () => getLogger().groupEnd(),
  table: (data: unknown, context?: LogContext) => getLogger().table(data, context),
};
