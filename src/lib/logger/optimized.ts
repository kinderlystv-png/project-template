/**
 * OPTIMIZED Logger System v2.0
 * Модернизированная система логирования с ленивой загрузкой
 *
 * Особенности:
 * - Динамические импорты для уменьшения bundle size
 * - Ленивая инициализация транспортов
 * - Tree-shaking оптимизация
 * - Современный TypeScript
 */

// Основные типы (всегда доступны)
export {
  LogLevel,
  type LogContext,
  type LogEntry,
  type LoggerConfig,
  type LogMetadata,
  type PerformanceMetrics,
} from './types/types';

import type { LogContext } from './types/types';
import { LogLevel } from './types/types';

// Кэш для динамически загружаемых модулей
const moduleCache = new Map<string, Promise<unknown>>();

/**
 * Ленивая загрузка модулей с кэшированием
 */
async function loadModule<T>(moduleName: string, loader: () => Promise<T>): Promise<T> {
  if (!moduleCache.has(moduleName)) {
    moduleCache.set(moduleName, loader());
  }
  return moduleCache.get(moduleName) as Promise<T>;
}

/**
 * Оптимизированная фабрика логгеров с ленивой загрузкой
 */
export class OptimizedLoggerFactory {
  /**
   * Создает консольный логгер для разработки (минимальная загрузка)
   */
  static async createConsoleLogger(level: LogLevel = LogLevel.DEBUG) {
    const [{ Logger }, { ConsoleTransport }] = await Promise.all([
      loadModule('logger-core', () => import('./core')),
      loadModule('transports', () => import('./transports')),
    ]);

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
   * Создает продакшн логгер с удаленным сервером (ленивая загрузка)
   */
  static async createProductionLogger(config: {
    level?: LogLevel;
    remoteUrl: string;
    apiKey: string;
    enableSentry?: boolean;
    sentryDsn?: string;
  }) {
    const [{ Logger }, { RemoteTransport, LocalStorageTransport, SentryTransport }] =
      await Promise.all([
        loadModule('logger-core', () => import('./core')),
        loadModule('transports', () => import('./transports')),
      ]);

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

    // Sentry для ошибок (только если нужен)
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
        key: 'app_logs',
        maxEntries: 500,
      })
    );

    return logger;
  }

  /**
   * Создает тестовый логгер (минимальная конфигурация)
   */
  static async createTestLogger() {
    const [{ Logger }, { ConsoleTransport }] = await Promise.all([
      loadModule('logger-core', () => import('./core')),
      loadModule('transports', () => import('./transports')),
    ]);

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
  static async createAnalyticsLogger(config: { remoteUrl: string; apiKey: string }) {
    const [{ Logger }, { RemoteTransport }] = await Promise.all([
      loadModule('logger-core', () => import('./core')),
      loadModule('transports', () => import('./transports')),
    ]);

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

// Глобальный экземпляр логгера с ленивой инициализацией (используем any для динамических типов)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalLogger: Promise<any> | null = null;

/**
 * Инициализирует глобальный логгер с оптимизированной загрузкой
 */
export async function initOptimizedLogger(
  config: {
    type: 'development' | 'production' | 'test';
    level?: LogLevel;
    remoteUrl?: string;
    apiKey?: string;
    sentryDsn?: string;
  } = { type: 'development' }
) {
  const { type = 'development', ...options } = config;

  switch (type) {
    case 'production':
      if (!options.remoteUrl || !options.apiKey) {
        throw new Error('Production logger requires remoteUrl and apiKey');
      }
      globalLogger = OptimizedLoggerFactory.createProductionLogger({
        level: options.level,
        remoteUrl: options.remoteUrl,
        apiKey: options.apiKey,
        enableSentry: !!options.sentryDsn,
        sentryDsn: options.sentryDsn,
      });
      break;

    case 'test':
      globalLogger = OptimizedLoggerFactory.createTestLogger();
      break;

    default: // development
      globalLogger = OptimizedLoggerFactory.createConsoleLogger(options.level);
      break;
  }

  return await globalLogger;
}

/**
 * Получает глобальный экземпляр логгера с ленивой инициализацией
 */
export async function getOptimizedLogger() {
  if (!globalLogger) {
    globalLogger = OptimizedLoggerFactory.createConsoleLogger();
  }
  return await globalLogger;
}

/**
 * Легковесный прокси для логирования с автоматической инициализацией
 */
export const optimizedLog = {
  async trace(message: string, context?: LogContext) {
    const logger = await getOptimizedLogger();
    return logger.trace(message, context);
  },

  async debug(message: string, context?: LogContext) {
    const logger = await getOptimizedLogger();
    return logger.debug(message, context);
  },

  async info(message: string, context?: LogContext) {
    const logger = await getOptimizedLogger();
    return logger.info(message, context);
  },

  async warn(message: string, context?: LogContext) {
    const logger = await getOptimizedLogger();
    return logger.warn(message, context);
  },

  async error(messageOrError: string | Error, context?: LogContext) {
    const logger = await getOptimizedLogger();
    return logger.error(messageOrError, context);
  },

  async fatal(messageOrError: string | Error, context?: LogContext) {
    const logger = await getOptimizedLogger();
    return logger.fatal(messageOrError, context);
  },

  async group(name: string) {
    const logger = await getOptimizedLogger();
    return logger.group(name);
  },

  async groupEnd() {
    const logger = await getOptimizedLogger();
    return logger.groupEnd();
  },

  async table(data: unknown, context?: LogContext) {
    const logger = await getOptimizedLogger();
    return logger.table(data, context);
  },
};

// Совместимость с существующим API (рекомендуется использовать optimizedLog)
export const log = optimizedLog;

// Экспорт фабрики для обратной совместимости
export const LoggerFactory = OptimizedLoggerFactory;

// Экспорт функций инициализации
export const initLogger = initOptimizedLogger;
export const getLogger = getOptimizedLogger;
