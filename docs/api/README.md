# 📖 API Reference

Полное описание API всех систем шаблона.

## 🗄️ Cache System

### OptimizedCacheManager

Многоуровневая система кэширования с интеллектуальными стратегиями.

#### Методы

##### `get<T>(key: string, loader?: () => Promise<T>, options?: CacheOptions): Promise<T>`

Получение данных из кэша или выполнение loader функции.

**Параметры:**

- `key` - уникальный ключ кэша
- `loader` - функция для загрузки данных при отсутствии в кэше
- `options` - опции кэширования

**Опции:**

```typescript
interface CacheOptions {
  ttl?: number; // Время жизни в мс
  tags?: string[]; // Теги для группировки
  compress?: boolean; // Сжатие данных
  strategy?: 'lru' | 'lfu' | 'fifo'; // Стратегия вытеснения
  level?: 1 | 2 | 3; // Уровень кэша
  priority?: 'low' | 'normal' | 'high'; // Приоритет
}
```

**Пример:**

```typescript
import { optimizedCache } from '$lib/cache/optimized';

// Простое кэширование
const users = await optimizedCache.get('users', async () => {
  return await fetchUsers();
});

// С опциями
const data = await optimizedCache.get(
  'api:products',
  async () => {
    return await fetchProducts();
  },
  {
    ttl: 300000, // 5 минут
    compress: true, // Сжимать данные
    tags: ['products'], // Тег для инвалидации
    level: 2, // L2 кэш
  }
);
```

##### `set(key: string, value: unknown, options?: CacheOptions): Promise<void>`

Установка значения в кэш.

##### `invalidate(pattern: string | string[]): Promise<void>`

Инвалидация кэша по ключам или тегам.

**Пример:**

```typescript
// Инвалидация по ключу
await optimizedCache.invalidate('users');

// Инвалидация по паттерну
await optimizedCache.invalidate('api:*');

// Инвалидация по тегам
await optimizedCache.invalidateByTags(['products', 'categories']);
```

##### `getStats(): CacheStats`

Получение статистики кэша.

```typescript
interface CacheStats {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  itemCount: number;
  compressionRatio: number;
}
```

## 📊 Monitoring System

### AdvancedMonitoringSystem

Комплексная система мониторинга производительности и аналитики.

#### Методы

##### `recordMetric(name: string, value: number, tags?: Record<string, string>): void`

Запись кастомной метрики.

**Пример:**

```typescript
import { monitoringSystem } from '$lib/monitoring/system';

// Простая метрика
monitoringSystem.recordMetric('user.login', 1);

// С тегами
monitoringSystem.recordMetric('api.response_time', 245, {
  endpoint: '/api/users',
  method: 'GET',
  status: '200',
});
```

##### `startWebVitalsTracking(): void`

Запуск отслеживания Web Vitals.

##### `trackPerformanceObserver(type: string): void`

Отслеживание производительности по типу.

**Типы:**

- `navigation` - Навигация
- `resource` - Ресурсы
- `paint` - Отрисовка
- `layout-shift` - Сдвиги макета

##### `createAlert(condition: AlertCondition): string`

Создание алерта.

```typescript
interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  threshold: number;
  duration?: number;
  callback: (alert: Alert) => void;
}

// Пример
const alertId = monitoringSystem.createAlert({
  metric: 'memory.usage',
  operator: '>',
  threshold: 0.8, // 80%
  duration: 30000, // 30 секунд
  callback: alert => {
    console.warn('High memory usage detected!', alert);
  },
});
```

## 🛡️ Error Handling System

### AdvancedErrorHandler

Централизованная система обработки ошибок с восстановлением.

#### Методы

##### `handle(error: Error, context?: ErrorContext): Promise<void>`

Обработка ошибки с автоматическим восстановлением.

```typescript
interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, unknown>;
}
```

**Пример:**

```typescript
import { errorHandler } from '$lib/errorHandling/system';

try {
  await riskyOperation();
} catch (error) {
  await errorHandler.handle(error, {
    component: 'UserDashboard',
    action: 'loadData',
    userId: user.id,
  });
}
```

##### `addRecoveryStrategy(strategy: RecoveryStrategy): void`

Добавление стратегии восстановления.

```typescript
interface RecoveryStrategy {
  name: string;
  canRecover: (error: ErrorInfo) => boolean;
  recover: (error: ErrorInfo) => Promise<boolean>;
  priority: number;
}

// Пример
errorHandler.addRecoveryStrategy({
  name: 'NetworkRetry',
  priority: 1,
  canRecover: error => error.type === 'network',
  recover: async error => {
    await delay(1000);
    return true; // Разрешить retry
  },
});
```

## ⚙️ Configuration Management

### AdvancedConfigManager

Динамическая система управления конфигурацией.

#### Методы

##### `get<T>(path: string, defaultValue?: T): T`

Получение значения конфигурации.

**Пример:**

```typescript
import { configManager } from '$lib/config/management';

// Простое получение
const apiUrl = configManager.get('api.baseUrl');

// С дефолтным значением
const timeout = configManager.get('api.timeout', 30000);

// Типизированное получение
const debug = configManager.get<boolean>('app.debug', false);
```

##### `isFeatureEnabled(name: string, context?: Record<string, unknown>): boolean`

Проверка feature flag.

**Пример:**

```typescript
// Простая проверка
if (configManager.isFeatureEnabled('newDashboard')) {
  // Новая функциональность
}

// С контекстом для A/B тестирования
if (
  configManager.isFeatureEnabled('betaFeature', {
    userId: user.id,
    plan: user.plan,
  })
) {
  // Beta функциональность
}
```

##### `addFeatureFlag(flag: FeatureFlag): void`

Добавление feature flag.

```typescript
interface FeatureFlag {
  name: string;
  enabled: boolean;
  conditions?: {
    environment?: string[];
    userAgent?: RegExp;
    percentage?: number;
    customRules?: (context: Record<string, unknown>) => boolean;
  };
}

// Пример
configManager.addFeatureFlag({
  name: 'experimentalUI',
  enabled: true,
  conditions: {
    environment: ['development', 'staging'],
    percentage: 20, // 20% пользователей
    customRules: context => context.userId?.startsWith('beta_'),
  },
});
```

## 🔄 Migration System

### AdvancedMigrationSystem

Система миграций с rollback и backup.

#### Методы

##### `migrate(context?: MigrationContext): Promise<void>`

Выполнение всех pending миграций.

```typescript
interface MigrationContext {
  dryRun?: boolean;
  skipBackup?: boolean;
  force?: boolean;
  targetVersion?: string;
}

// Пример
await migrationSystem.migrate({
  dryRun: false,
  skipBackup: false,
  force: false,
});
```

##### `rollback(target?: string, context?: MigrationContext): Promise<void>`

Откат миграций.

**Пример:**

```typescript
// Откат последней миграции
await migrationSystem.rollback();

// Откат до определенной версии
await migrationSystem.rollback('001_init_schema');
```

##### `addMigration(migration: MigrationDefinition): void`

Добавление новой миграции.

```typescript
interface MigrationDefinition {
  id: string;
  version: string;
  name: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  dependencies?: string[];
  critical?: boolean;
}

// Пример
migrationSystem.addMigration({
  id: 'add_user_preferences',
  version: '1.1.0',
  name: 'Add User Preferences',
  description: 'Adds user preferences table',
  up: async () => {
    // Логика миграции вперед
  },
  down: async () => {
    // Логика отката
  },
});
```

## 🔧 Utilities

### Общие утилиты

#### `debounce<T>(func: T, wait: number): T`

Debounce функция.

#### `throttle<T>(func: T, limit: number): T`

Throttle функция.

#### `retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T>`

Retry с настройками.

```typescript
interface RetryOptions {
  retries?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (error: Error, attempt: number) => void;
}
```

#### `formatBytes(bytes: number): string`

Форматирование размера в читаемый вид.

#### `generateId(): string`

Генерация уникального ID.

## 📞 Events

### Система событий

Все системы поддерживают подписку на события:

```typescript
// Кэш события
optimizedCache.on('hit', data => console.log('Cache hit:', data));
optimizedCache.on('miss', data => console.log('Cache miss:', data));

// Мониторинг события
monitoringSystem.on('metric:recorded', metric => console.log('Metric:', metric));
monitoringSystem.on('alert:triggered', alert => console.warn('Alert:', alert));

// Ошибки события
errorHandler.on('error:handled', error => console.log('Error handled:', error));
errorHandler.on('recovery:attempted', recovery => console.log('Recovery:', recovery));

// Конфигурация события
configManager.on('config:changed', change => console.log('Config changed:', change));
configManager.on('feature:toggled', flag => console.log('Feature toggled:', flag));

// Миграции события
migrationSystem.on('migration:started', migration => console.log('Migration started:', migration));
migrationSystem.on('migration:completed', migration =>
  console.log('Migration completed:', migration)
);
```

## 🔗 Chaining API

Многие методы поддерживают chaining:

```typescript
await optimizedCache
  .withTags(['users', 'api'])
  .withTTL(300000)
  .withCompression(true)
  .get('api:users', fetchUsers);

monitoringSystem.withTags({ component: 'UserDashboard' }).recordMetric('page.load', loadTime);
```

## 🚨 Error Codes

### Коды ошибок системы

- `CACHE_001` - Cache storage error
- `CACHE_002` - Cache compression error
- `MONITOR_001` - Monitoring initialization failed
- `CONFIG_001` - Configuration validation failed
- `CONFIG_002` - Feature flag condition error
- `MIGRATION_001` - Migration execution failed
- `MIGRATION_002` - Rollback failed
- `SECURITY_001` - Security validation failed
