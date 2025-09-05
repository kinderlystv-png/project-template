import type { ILogger } from '../types';

/**
 * Генерирует уникальный идентификатор сессии
 */
export function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Генерирует уникальный ID для лога
 */
export function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Извлекает детали ошибки для логирования
 */
export function getErrorDetails(error: unknown): string {
  if (!error) return 'Unknown error';

  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack || ''}`;
  }

  try {
    return JSON.stringify(error);
  } catch (e) {
    return String(error);
  }
}

/**
 * Получает информацию о производительности памяти
 */
export function getMemoryInfo(): { used: number; total: number; percentage: number } | undefined {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
    const memory = (
      window.performance as unknown as {
        memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      }
    ).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
    };
  }
  return undefined;
}

/**
 * Измеряет время выполнения функции
 */
export function measureExecutionTime<T>(fn: () => T, logger: ILogger, operationName: string): T {
  const startTime = performance.now();
  try {
    const result = fn();
    const endTime = performance.now();
    logger.debug(
      `${operationName} completed`,
      {
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        operation: operationName,
        memory: getMemoryInfo(),
      },
      ['performance']
    );
    return result;
  } catch (error) {
    const endTime = performance.now();
    logger.error(
      `${operationName} failed`,
      {
        errorMessage: getErrorDetails(error),
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        operation: operationName,
        memory: getMemoryInfo(),
      },
      ['performance', 'error']
    );
    throw error;
  }
}

/**
 * Измеряет время выполнения асинхронной функции
 */
export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>,
  logger: ILogger,
  operationName: string
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await fn();
    const endTime = performance.now();
    logger.debug(
      `${operationName} completed (async)`,
      {
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        operation: operationName,
        memory: getMemoryInfo(),
      },
      ['performance', 'async']
    );
    return result;
  } catch (error) {
    const endTime = performance.now();
    logger.error(
      `${operationName} failed (async)`,
      {
        errorMessage: getErrorDetails(error),
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        operation: operationName,
        memory: getMemoryInfo(),
      },
      ['performance', 'async', 'error']
    );
    throw error;
  }
}

/**
 * Создает декоратор для измерения производительности методов
 */
export function logPerformance(logger: ILogger, operationName?: string) {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = operationName || propertyKey;

    descriptor.value = function (...args: unknown[]) {
      const startTime = performance.now();
      try {
        const result = originalMethod.apply(this, args);
        const endTime = performance.now();

        // Для промисов добавляем дополнительное измерение после завершения
        if (result instanceof Promise) {
          return result
            .then(value => {
              const finalTime = performance.now();
              logger.debug(
                `${methodName} completed (async)`,
                {
                  duration: `${(finalTime - startTime).toFixed(2)}ms`,
                  operation: methodName,
                  memory: getMemoryInfo(),
                },
                ['performance', 'async']
              );
              return value;
            })
            .catch(error => {
              const finalTime = performance.now();
              logger.error(
                `${methodName} failed (async)`,
                {
                  errorMessage: getErrorDetails(error),
                  duration: `${(finalTime - startTime).toFixed(2)}ms`,
                  operation: methodName,
                  memory: getMemoryInfo(),
                },
                ['performance', 'async', 'error']
              );
              throw error;
            });
        }

        // Для синхронных методов
        logger.debug(
          `${methodName} completed`,
          {
            duration: `${(endTime - startTime).toFixed(2)}ms`,
            operation: methodName,
            memory: getMemoryInfo(),
          },
          ['performance']
        );
        return result;
      } catch (error) {
        const endTime = performance.now();
        logger.error(
          `${methodName} failed`,
          {
            errorMessage: getErrorDetails(error),
            duration: `${(endTime - startTime).toFixed(2)}ms`,
            operation: methodName,
            memory: getMemoryInfo(),
          },
          ['performance', 'error']
        );
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Форматирует размер в байтах в читаемый формат
 */
export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Безопасное JSON.stringify с обработкой циклических ссылок
 */
export function safeStringify(obj: unknown, maxDepth = 5): string {
  const seen = new WeakSet();

  const replacer = (_key: string, value: unknown, depth = 0): unknown => {
    if (depth > maxDepth) {
      return '[Max Depth Reached]';
    }

    if (value !== null && typeof value === 'object') {
      if (seen.has(value as object)) {
        return '[Circular Reference]';
      }
      seen.add(value as object);
    }

    return value;
  };

  try {
    return JSON.stringify(obj, replacer);
  } catch (error) {
    return '[Stringify Error]';
  }
}

/**
 * Получает информацию о браузере и системе
 */
export function getSystemInfo(): Record<string, unknown> {
  if (typeof window === 'undefined') {
    return { environment: 'server' };
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookiesEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine,
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    connection: (
      navigator as unknown as { connection?: { effectiveType?: string; downlink?: number } }
    ).connection
      ? {
          effectiveType: (navigator as unknown as { connection: { effectiveType?: string } })
            .connection.effectiveType,
          downlink: (navigator as unknown as { connection: { downlink?: number } }).connection
            .downlink,
        }
      : undefined,
  };
}
