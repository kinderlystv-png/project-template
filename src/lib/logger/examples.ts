/**
 * Примеры использования системы логирования SHINOMONTAGKA
 */

import {
  getLogger,
  initLogger,
  LocalStorageTransport,
  log,
  LoggerFactory,
  LogLevel,
  type LogContext,
} from './index';

// ===== ИНИЦИАЛИЗАЦИЯ =====

// 1. Простая инициализация для разработки
void initLogger({ type: 'development' });

// 2. Продакшн конфигурация
void initLogger({
  type: 'production',
  level: LogLevel.INFO,
  remoteUrl: 'https://api.shinomontagka.com/logs',
  apiKey: 'your-api-key',
  sentryDsn: 'https://your-sentry-dsn.ingest.sentry.io/project-id',
});

// 3. Тестовое окружение
void initLogger({ type: 'test' });

// ===== ОСНОВНОЕ ИСПОЛЬЗОВАНИЕ =====

// Простое логирование
log.info('Приложение запущено');
log.debug('Отладочная информация', { userId: '12345' });
log.warn('Предупреждение о низкой памяти');
log.error('Ошибка подключения к API');

// Логирование с контекстом
const context: LogContext = {
  userId: '12345',
  sessionId: 'sess_abcdef',
  action: 'user_login',
  metadata: {
    browser: 'Chrome',
    version: '121.0.0.0',
  },
};

log.info('Пользователь вошел в систему', context);

// Логирование ошибок
try {
  throw new Error('Что-то пошло не так');
} catch (error) {
  log.error(error as Error, { component: 'AuthService' });
}

// ===== ПРОДВИНУТОЕ ИСПОЛЬЗОВАНИЕ =====

// Создание кастомного логгера
const customLogger = LoggerFactory.createConsoleLogger(LogLevel.TRACE);
customLogger.addTransport(
  new LocalStorageTransport({
    key: 'custom_logs',
    maxEntries: 200,
  })
);

// Групповое логирование
log.group('Инициализация 3D сцены');
log.info('Загрузка Three.js');
log.info('Создание рендерера');
log.info('Настройка камеры');
log.groupEnd();

// Табличные данные
const performanceData = [
  { component: 'Renderer', time: '16ms', memory: '24MB' },
  { component: 'Physics', time: '8ms', memory: '12MB' },
  { component: 'Audio', time: '4ms', memory: '6MB' },
];
log.table(performanceData, { category: 'performance' });

// Логирование с измерением производительности
const logger = getLogger();
void logger.logWithPerformance(
  LogLevel.INFO,
  'Выполнение сложной операции',
  () => {
    // Имитация тяжелой операции
    const start = Date.now();
    while (Date.now() - start < 100) {
      // Ждем 100ms
    }
    return 'Результат операции';
  },
  { operation: 'complex_calculation' }
);

// ===== ИСПОЛЬЗОВАНИЕ В КОМПОНЕНТАХ =====

// Svelte компонент
export class ComponentLogger {
  private logger = getLogger();

  onMount() {
    this.logger.info('Компонент Calculator смонтирован', {
      component: 'Calculator',
      timestamp: Date.now(),
    });
  }

  onDestroy() {
    this.logger.info('Компонент Calculator размонтирован', {
      component: 'Calculator',
    });
  }

  calculate(a: number, b: number, operation: string) {
    this.logger.debug('Выполнение вычисления', {
      component: 'Calculator',
      operation,
      inputs: { a, b },
    });

    try {
      let result: number;
      switch (operation) {
        case '+':
          result = a + b;
          break;
        case '-':
          result = a - b;
          break;
        case '*':
          result = a * b;
          break;
        case '/':
          if (b === 0) {
            throw new Error('Деление на ноль');
          }
          result = a / b;
          break;
        default:
          throw new Error(`Неизвестная операция: ${operation}`);
      }

      this.logger.info('Вычисление успешно завершено', {
        component: 'Calculator',
        operation,
        result,
      });

      return result;
    } catch (error) {
      this.logger.error('Ошибка при вычислении', {
        component: 'Calculator',
        operation,
        inputs: { a, b },
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }
}

// ===== АНАЛИТИКА И ОТСЛЕЖИВАНИЕ =====

// Отслеживание пользовательских действий
function trackUserAction(action: string, data?: Record<string, unknown>) {
  log.info(`Действие пользователя: ${action}`, {
    category: 'analytics',
    action,
    timestamp: Date.now(),
    ...data,
  });
}

// Примеры использования аналитики
trackUserAction('page_view', { page: '/calculator' });
trackUserAction('button_click', { button: 'calculate', value: '2+2' });
trackUserAction('feature_used', { feature: '3d_constructor', duration: 1500 });

// ===== ОТСЛЕЖИВАНИЕ ПРОИЗВОДИТЕЛЬНОСТИ =====

// Измерение времени загрузки
function measureLoadTime() {
  const startTime = performance.now();

  // Имитация загрузки
  setTimeout(() => {
    const loadTime = performance.now() - startTime;
    log.info('Время загрузки приложения', {
      category: 'performance',
      loadTime: `${loadTime.toFixed(2)}ms`,
      performance: {
        duration: loadTime,
        memory: {
          used:
            (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
              ?.usedJSHeapSize || 0,
          total: 0,
          percentage: 0,
        },
      },
    });
  }, 100);
}

measureLoadTime();

// ===== ОБРАБОТКА ОШИБОК =====

// Глобальный обработчик ошибок
window.addEventListener('error', event => {
  log.fatal('Необработанная ошибка JavaScript', {
    category: 'error',
    error: new Error(`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`),
    details: {
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
    },
  });
});

// Обработчик отклоненных промисов
window.addEventListener('unhandledrejection', event => {
  log.fatal('Необработанное отклонение промиса', {
    category: 'error',
    reason: event.reason,
    promise: 'Promise rejection',
  });
});

// ===== КОНФИГУРАЦИЯ ДЛЯ РАЗНЫХ СРЕД =====

// Определение окружения
function getEnvironment(): 'development' | 'production' | 'test' {
  if (process.env.NODE_ENV === 'test') return 'test';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'development';
}

// Инициализация в зависимости от окружения
const environment = getEnvironment();
const appLogger = initLogger({
  type: environment,
  level: environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  remoteUrl: process.env.VITE_LOGS_URL,
  apiKey: process.env.VITE_LOGS_API_KEY,
  sentryDsn: process.env.VITE_SENTRY_DSN,
});

// eslint-disable-next-line no-console
console.log(`Logger initialized for ${environment} environment`);

export { appLogger };
