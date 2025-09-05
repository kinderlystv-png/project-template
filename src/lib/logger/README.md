# SHINOMONTAGKA Logging System

Система логирования предназначена для централизованного сбора, обработки и анализа логов веб-приложения SHINOMONTAGKA.

## 🚀 Возможности

- **Многоуровневое логирование** - 6 уровней от TRACE до FATAL
- **Множественные транспорты** - Console, Remote, LocalStorage, Sentry, File
- **Производительность** - Буферизация, батчинг, измерение времени выполнения
- **Безопасность** - Санитизация данных, GDPR соответствие, шифрование
- **Аналитика** - Отслеживание пользователей, бизнес-события
- **DevTools** - Интеграция с инструментами разработчика
- **TypeScript** - Полная типизация

## 📦 Установка

```typescript
import { initLogger, log, LogLevel } from '$lib/logger';

// Инициализация для разработки
initLogger({ type: 'development' });

// Простое использование
log.info('Приложение запущено');
log.error('Ошибка подключения');
```

## 🔧 Быстрый старт

### Разработка

```typescript
import { initLogger, log } from '$lib/logger';

// Инициализация
initLogger({ type: 'development' });

// Использование
log.debug('Отладочная информация');
log.info('Информационное сообщение');
log.warn('Предупреждение');
log.error('Ошибка');
```

### Продакшн

```typescript
import { initLogger } from '$lib/logger';

initLogger({
  type: 'production',
  level: LogLevel.INFO,
  remoteUrl: 'https://logs.shinomontagka.com',
  apiKey: 'your-api-key',
  sentryDsn: 'https://sentry.io/dsn',
});
```

## 📊 Уровни логирования

| Уровень | Описание                 | Использование           |
| ------- | ------------------------ | ----------------------- |
| `TRACE` | Детальная отладка        | Трассировка выполнения  |
| `DEBUG` | Отладочная информация    | Разработка              |
| `INFO`  | Информационные сообщения | Общие события           |
| `WARN`  | Предупреждения           | Потенциальные проблемы  |
| `ERROR` | Ошибки                   | Обработанные исключения |
| `FATAL` | Критические ошибки       | Аварийные ситуации      |

## 🔌 Транспорты

### Console Transport

```typescript
import { ConsoleTransport } from '$lib/logger';

logger.addTransport(
  new ConsoleTransport({
    enableColors: true,
    enableGrouping: true,
  })
);
```

### Remote Transport

```typescript
import { RemoteTransport } from '$lib/logger';

logger.addTransport(
  new RemoteTransport({
    url: 'https://api.example.com/logs',
    apiKey: 'your-api-key',
    batchSize: 50,
  })
);
```

### LocalStorage Transport

```typescript
import { LocalStorageTransport } from '$lib/logger';

logger.addTransport(
  new LocalStorageTransport({
    key: 'app_logs',
    maxEntries: 1000,
  })
);
```

### Sentry Transport

```typescript
import { SentryTransport } from '$lib/logger';

logger.addTransport(
  new SentryTransport({
    dsn: 'https://sentry.io/dsn',
    minLevel: LogLevel.ERROR,
  })
);
```

## 🎯 Специальные возможности

### Логирование с контекстом

```typescript
log.info('Пользователь вошел в систему', {
  userId: '12345',
  sessionId: 'sess_abc',
  action: 'login',
});
```

### Измерение производительности

```typescript
const result = logger.logWithPerformance(
  LogLevel.INFO,
  'Сложная операция',
  () => {
    // Код операции
    return computeComplexData();
  },
  { operation: 'data_processing' }
);
```

### Групповое логирование

```typescript
log.group('Инициализация 3D сцены');
log.info('Загрузка Three.js');
log.info('Создание рендерера');
log.groupEnd();
```

### Табличные данные

```typescript
const data = [
  { component: 'Renderer', time: '16ms' },
  { component: 'Physics', time: '8ms' },
];
log.table(data);
```

## 🔒 Безопасность

### Санитизация данных

```typescript
import { Sanitizer } from '$lib/logger/security';

const sanitizer = new Sanitizer();
const cleanEntry = sanitizer.sanitize(logEntry);
```

### GDPR соответствие

```typescript
import { GDPRCompliance } from '$lib/logger/security';

const anonymized = GDPRCompliance.anonymize(userData);
```

## 📈 Аналитика

### Отслеживание действий пользователя

```typescript
log.info('Действие пользователя', {
  category: 'analytics',
  action: 'button_click',
  label: 'calculate',
});
```

### Бизнес-события

```typescript
log.info('Покупка завершена', {
  category: 'business',
  event: 'purchase_completed',
  value: 99.99,
  currency: 'USD',
});
```

## 🏗️ Использование в компонентах

### Svelte компонент

```typescript
import { getLogger } from '$lib/logger';

export class Calculator {
  private logger = getLogger();

  onMount() {
    this.logger.info('Calculator mounted');
  }

  calculate(a: number, b: number) {
    this.logger.debug('Calculation started', { a, b });

    try {
      const result = a + b;
      this.logger.info('Calculation completed', { result });
      return result;
    } catch (error) {
      this.logger.error('Calculation failed', { error });
      throw error;
    }
  }
}
```

## ⚙️ Конфигурация

### Полная конфигурация

```typescript
const logger = new Logger({
  level: LogLevel.INFO,
  enableColors: true,
  enableTimestamp: true,
  enableStackTrace: true,
  bufferSize: 100,
  flushInterval: 5000,
  sanitize: true,
  gdprCompliant: true,
  enableAnalytics: true,
});
```

### Фабрика логгеров

```typescript
import { LoggerFactory } from '$lib/logger';

// Консольный логгер для разработки
const devLogger = LoggerFactory.createConsoleLogger();

// Продакшн логгер
const prodLogger = LoggerFactory.createProductionLogger({
  remoteUrl: 'https://api.logs.com',
  apiKey: 'key',
});

// Аналитический логгер
const analyticsLogger = LoggerFactory.createAnalyticsLogger({
  remoteUrl: 'https://analytics.com',
  apiKey: 'analytics-key',
});
```

## 🧪 Тестирование

```typescript
import { LoggerFactory } from '$lib/logger';

const testLogger = LoggerFactory.createTestLogger();

// В тестах
beforeEach(() => {
  initLogger({ type: 'test' });
});
```

## 🔧 API Reference

### Logger Methods

- `trace(message, context?)` - Трассировка
- `debug(message, context?)` - Отладка
- `info(message, context?)` - Информация
- `warn(message, context?)` - Предупреждение
- `error(messageOrError, context?)` - Ошибка
- `fatal(messageOrError, context?)` - Критическая ошибка
- `group(name)` - Начало группы
- `groupEnd()` - Конец группы
- `table(data, context?)` - Табличные данные
- `logWithPerformance(level, message, operation, context?)` - С измерением

### Utility Functions

- `safeStringify(obj)` - Безопасная сериализация
- `getSystemInfo()` - Информация о системе
- `formatBytes(bytes)` - Форматирование размера

### Security Classes

- `Sanitizer` - Санитизация данных
- `GDPRCompliance` - GDPR соответствие
- `LogEncryption` - Шифрование логов

## 🐛 Обработка ошибок

```typescript
// Глобальный обработчик ошибок
window.addEventListener('error', event => {
  log.fatal('Необработанная ошибка', {
    error: {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
    },
  });
});

// Обработчик отклоненных промисов
window.addEventListener('unhandledrejection', event => {
  log.fatal('Отклоненный промис', {
    reason: event.reason,
  });
});
```

## 📊 Мониторинг производительности

```typescript
// Измерение времени загрузки
function measureLoadTime() {
  const startTime = performance.now();

  addEventListener('load', () => {
    const loadTime = performance.now() - startTime;
    log.info('Время загрузки', {
      category: 'performance',
      loadTime: `${loadTime.toFixed(2)}ms`,
    });
  });
}
```

## 🌍 Интернационализация

```typescript
// Логирование с локализацией
log.info('user.login.success', {
  userId: '123',
  locale: 'ru',
  translation: 'Пользователь успешно вошел в систему',
});
```

## 🔄 Миграция

При обновлении версий системы логирования:

1. Проверьте совместимость транспортов
2. Обновите конфигурацию
3. Тестируйте в безопасной среде
4. Мониторьте после развертывания

## 📝 Лицензия

MIT License - см. файл LICENSE

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request

## 📞 Поддержка

- GitHub Issues: [ссылка на issues]
- Документация: [ссылка на docs]
- Email: support@shinomontagka.com
