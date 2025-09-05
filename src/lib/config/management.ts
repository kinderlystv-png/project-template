/**
 * ADVANCED Configuration Management System v1.0
 * Динамическая система управления конфигурацией
 *
 * Возможности:
 * - Динамическая загрузка конфигурации
 * - Валидация и схемы конфигурации
 * - Hot reload конфигурации
 * - Многоуровневые конфигурации (dev/staging/prod)
 * - Конфигурация по окружению и feature flags
 * - Безопасное хранение секретов
 * - Резервное копирование и версионирование
 */

// Базовые типы для конфигурации
interface ConfigSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: unknown;
  validation?: (value: unknown) => boolean;
  description?: string;
  sensitive?: boolean; // Для секретов
}

interface ConfigDefinition {
  [key: string]: ConfigSchema | ConfigDefinition;
}

interface ConfigSource {
  name: string;
  priority: number;
  loader: () => Promise<Record<string, unknown>>;
  watcher?: () => void;
  canReload: boolean;
}

interface FeatureFlag {
  name: string;
  enabled: boolean;
  conditions?: {
    environment?: string[];
    userAgent?: RegExp;
    percentage?: number; // 0-100 for A/B testing
    customRules?: (context: Record<string, unknown>) => boolean;
  };
  rolloutStrategy?: 'immediate' | 'gradual' | 'conditional';
  metadata?: {
    description?: string;
    owner?: string;
    expiryDate?: Date;
  };
}

interface ConfigValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    value?: unknown;
  }>;
  warnings: Array<{
    path: string;
    message: string;
  }>;
}

interface ConfigSnapshot {
  id: string;
  timestamp: number;
  environment: string;
  config: Record<string, unknown>;
  featureFlags: FeatureFlag[];
  hash: string;
}

/**
 * Продвинутая система управления конфигурацией
 */
export class AdvancedConfigManager {
  private config: Record<string, unknown> = {};
  private schema: ConfigDefinition = {};
  private sources: ConfigSource[] = [];
  private featureFlags = new Map<string, FeatureFlag>();
  private watchers = new Map<string, Set<(value: unknown) => void>>();
  private snapshots: ConfigSnapshot[] = [];
  private environment: string;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  // Кэш для быстрого доступа
  private cache = new Map<string, unknown>();
  private cacheTimeout = 5000; // 5 секунд

  constructor(environment = 'development') {
    this.environment = environment;
    this.initializeDefaultSources();
    this.initializeDefaultSchema();
  }

  /**
   * Инициализация источников конфигурации по умолчанию
   */
  private initializeDefaultSources(): void {
    // Переменные окружения (высший приоритет)
    this.addSource({
      name: 'environment',
      priority: 100,
      canReload: false,
      loader: async () => {
        const envConfig: Record<string, unknown> = {};

        if (typeof process !== 'undefined' && process.env) {
          for (const [key, value] of Object.entries(process.env)) {
            if (key.startsWith('APP_')) {
              const configKey = key.substring(4).toLowerCase().replace(/_/g, '.');
              envConfig[configKey] = this.parseEnvValue(value);
            }
          }
        }

        return envConfig;
      },
    });

    // Локальный файл конфигурации
    this.addSource({
      name: 'local',
      priority: 50,
      canReload: true,
      loader: async () => {
        try {
          const response = await fetch(`/config/${this.environment}.json`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.warn('Failed to load local config:', error);
        }
        return {};
      },
    });

    // Удаленная конфигурация
    this.addSource({
      name: 'remote',
      priority: 30,
      canReload: true,
      loader: async () => {
        try {
          const configUrl = this.get('config.remote.url', '');
          if (configUrl) {
            const response = await fetch(configUrl as string, {
              headers: {
                Authorization: `Bearer ${this.get('config.remote.token', '')}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              return await response.json();
            }
          }
        } catch (error) {
          console.warn('Failed to load remote config:', error);
        }
        return {};
      },
    });

    // Дефолтная конфигурация (низший приоритет)
    this.addSource({
      name: 'defaults',
      priority: 1,
      canReload: false,
      loader: async () => ({
        app: {
          name: 'SvelteKit Template',
          version: '1.0.0',
          debug: this.environment === 'development',
        },
        api: {
          baseUrl: 'http://localhost:3000',
          timeout: 30000,
          retries: 3,
        },
        cache: {
          enabled: true,
          ttl: 300000,
          maxSize: 100,
        },
        monitoring: {
          enabled: this.environment === 'production',
          endpoint: '/api/metrics',
          interval: 60000,
        },
        features: {
          newUI: false,
          analytics: this.environment === 'production',
          debugMode: this.environment === 'development',
        },
      }),
    });
  }

  /**
   * Инициализация схемы конфигурации по умолчанию
   */
  private initializeDefaultSchema(): void {
    this.setSchema({
      app: {
        name: { type: 'string', required: true, description: 'Application name' },
        version: { type: 'string', required: true, description: 'Application version' },
        debug: { type: 'boolean', default: false, description: 'Debug mode' },
      },
      api: {
        baseUrl: { type: 'string', required: true, description: 'API base URL' },
        timeout: { type: 'number', default: 30000, description: 'Request timeout in ms' },
        retries: { type: 'number', default: 3, description: 'Retry attempts' },
        key: { type: 'string', sensitive: true, description: 'API key' },
      },
      cache: {
        enabled: { type: 'boolean', default: true },
        ttl: { type: 'number', default: 300000 },
        maxSize: { type: 'number', default: 100 },
      },
      monitoring: {
        enabled: { type: 'boolean', default: false },
        endpoint: { type: 'string', default: '/api/metrics' },
        interval: { type: 'number', default: 60000 },
      },
    });
  }

  /**
   * Добавление источника конфигурации
   */
  addSource(source: ConfigSource): void {
    // Удаляем существующий источник с таким же именем
    this.sources = this.sources.filter(s => s.name !== source.name);

    // Добавляем новый источник и сортируем по приоритету
    this.sources.push(source);
    this.sources.sort((a, b) => b.priority - a.priority);

    // Если конфигурация уже загружена, перезагружаем
    if (this.isLoaded) {
      this.reload();
    }
  }

  /**
   * Установка схемы конфигурации
   */
  setSchema(schema: ConfigDefinition): void {
    this.schema = { ...this.schema, ...schema };
  }

  /**
   * Загрузка конфигурации из всех источников
   */
  async load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.performLoad();
    return this.loadPromise;
  }

  private async performLoad(): Promise<void> {
    try {
      const configs: Record<string, unknown>[] = [];

      // Загружаем конфигурацию из всех источников параллельно
      const loadPromises = this.sources.map(async source => {
        try {
          const config = await source.loader();
          return { source: source.name, config, priority: source.priority };
        } catch (error) {
          console.warn(`Failed to load config from ${source.name}:`, error);
          return { source: source.name, config: {}, priority: source.priority };
        }
      });

      const results = await Promise.all(loadPromises);

      // Сортируем по приоритету и объединяем
      results
        .sort((a, b) => a.priority - b.priority)
        .forEach(result => {
          configs.push(result.config);
        });

      // Объединяем конфигурации (с высшим приоритетом переписывает низший)
      this.config = this.deepMerge({}, ...configs);

      // Валидируем конфигурацию
      const validation = this.validate();
      if (!validation.valid) {
        console.warn('Configuration validation failed:', validation.errors);
      }

      // Применяем дефолтные значения для отсутствующих параметров
      this.applyDefaults();

      // Загружаем feature flags
      await this.loadFeatureFlags();

      // Создаем снапшот
      this.createSnapshot();

      // Очищаем кэш
      this.cache.clear();

      this.isLoaded = true;
      this.loadPromise = null;

      console.info('Configuration loaded successfully');
    } catch (error) {
      this.loadPromise = null;
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }

  /**
   * Перезагрузка конфигурации
   */
  async reload(): Promise<void> {
    this.isLoaded = false;
    await this.load();
  }

  /**
   * Получение значения конфигурации
   */
  get<T = unknown>(path: string, defaultValue?: T): T {
    // Проверяем кэш
    const cacheKey = `${path}:${defaultValue}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as T;
    }

    const value = this.getByPath(this.config, path) ?? defaultValue;

    // Кэшируем результат
    this.cache.set(cacheKey, value);
    setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

    return value as T;
  }

  /**
   * Установка значения конфигурации (только для runtime)
   */
  set(path: string, value: unknown): void {
    this.setByPath(this.config, path, value);
    this.cache.clear(); // Очищаем кэш
    this.notifyWatchers(path, value);
  }

  /**
   * Проверка существования значения
   */
  has(path: string): boolean {
    return this.getByPath(this.config, path) !== undefined;
  }

  /**
   * Получение всей конфигурации
   */
  getAll(): Record<string, unknown> {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Валидация конфигурации
   */
  validate(config?: Record<string, unknown>): ConfigValidationResult {
    const targetConfig = config || this.config;
    const result: ConfigValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    this.validateObject(targetConfig, this.schema, '', result);

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Подписка на изменения значения
   */
  watch(path: string, callback: (value: unknown) => void): () => void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Set());
    }

    this.watchers.get(path)!.add(callback);

    // Возвращаем функцию для отписки
    return () => {
      const callbacks = this.watchers.get(path);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.watchers.delete(path);
        }
      }
    };
  }

  /**
   * Feature Flags
   */
  addFeatureFlag(flag: FeatureFlag): void {
    this.featureFlags.set(flag.name, flag);
  }

  isFeatureEnabled(name: string, context: Record<string, unknown> = {}): boolean {
    const flag = this.featureFlags.get(name);
    if (!flag) {
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // Проверяем условия
    if (flag.conditions) {
      const { environment, userAgent, percentage, customRules } = flag.conditions;

      // Проверка окружения
      if (environment && !environment.includes(this.environment)) {
        return false;
      }

      // Проверка User Agent
      if (userAgent && typeof navigator !== 'undefined') {
        if (!userAgent.test(navigator.userAgent)) {
          return false;
        }
      }

      // A/B тестирование по проценту
      if (percentage !== undefined) {
        const hash = this.simpleHash(name + JSON.stringify(context));
        if (hash % 100 >= percentage) {
          return false;
        }
      }

      // Кастомные правила
      if (customRules && !customRules(context)) {
        return false;
      }
    }

    return true;
  }

  getFeatureFlag(name: string): FeatureFlag | undefined {
    return this.featureFlags.get(name);
  }

  getAllFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  /**
   * Снапшоты конфигурации
   */
  createSnapshot(): ConfigSnapshot {
    const snapshot: ConfigSnapshot = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      environment: this.environment,
      config: this.getAll(),
      featureFlags: this.getAllFeatureFlags(),
      hash: this.calculateHash(this.config),
    };

    this.snapshots.push(snapshot);

    // Ограничиваем количество снапшотов
    if (this.snapshots.length > 10) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  getSnapshots(): ConfigSnapshot[] {
    return [...this.snapshots];
  }

  restoreSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      return false;
    }

    this.config = JSON.parse(JSON.stringify(snapshot.config));
    this.featureFlags.clear();
    snapshot.featureFlags.forEach(flag => {
      this.featureFlags.set(flag.name, flag);
    });

    this.cache.clear();
    return true;
  }

  /**
   * Экспорт конфигурации
   */
  export(includeSensitive = false): Record<string, unknown> {
    if (includeSensitive) {
      return this.getAll();
    }

    // Фильтруем чувствительные данные
    return this.filterSensitive(this.getAll(), this.schema);
  }

  /**
   * Импорт конфигурации
   */
  import(config: Record<string, unknown>, validate = true): boolean {
    if (validate) {
      const validation = this.validate(config);
      if (!validation.valid) {
        console.error('Import validation failed:', validation.errors);
        return false;
      }
    }

    this.config = JSON.parse(JSON.stringify(config));
    this.cache.clear();
    return true;
  }

  // Вспомогательные методы

  private async loadFeatureFlags(): Promise<void> {
    const flags = this.get('features', {}) as Record<string, boolean>;

    for (const [name, enabled] of Object.entries(flags)) {
      this.addFeatureFlag({
        name,
        enabled,
        metadata: {
          description: `Feature flag for ${name}`,
        },
      });
    }
  }

  private parseEnvValue(value: string | undefined): unknown {
    if (!value) return undefined;

    // Пытаемся парсить как JSON
    if (
      value.startsWith('{') ||
      value.startsWith('[') ||
      value === 'true' ||
      value === 'false' ||
      /^\d+$/.test(value)
    ) {
      try {
        return JSON.parse(value);
      } catch {
        // Если не JSON, возвращаем как строку
      }
    }

    return value;
  }

  private deepMerge(
    target: Record<string, unknown>,
    ...sources: Record<string, unknown>[]
  ): Record<string, unknown> {
    if (!sources.length) return target;
    const source = sources.shift()!;

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        this.deepMerge(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>
        );
      } else {
        target[key] = source[key];
      }
    }

    return this.deepMerge(target, ...sources);
  }

  private getByPath(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && key in current
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj);
  }

  private setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;

    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key] as Record<string, unknown>;
    }, obj);

    target[lastKey] = value;
  }

  private validateObject(
    obj: Record<string, unknown>,
    schema: ConfigDefinition,
    basePath: string,
    result: ConfigValidationResult
  ): void {
    for (const [key, schemaValue] of Object.entries(schema)) {
      const currentPath = basePath ? `${basePath}.${key}` : key;
      const value = obj[key];

      if ('type' in schemaValue) {
        // Это конечное поле
        const fieldSchema = schemaValue as ConfigSchema;

        if (fieldSchema.required && value === undefined) {
          result.errors.push({
            path: currentPath,
            message: `Required field is missing`,
          });
          continue;
        }

        if (value !== undefined) {
          if (!this.validateType(value, fieldSchema.type)) {
            result.errors.push({
              path: currentPath,
              message: `Expected ${fieldSchema.type} but got ${typeof value}`,
              value,
            });
          }

          if (fieldSchema.validation && !fieldSchema.validation(value)) {
            result.errors.push({
              path: currentPath,
              message: 'Custom validation failed',
              value,
            });
          }
        }
      } else {
        // Это вложенный объект
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          this.validateObject(
            value as Record<string, unknown>,
            schemaValue as ConfigDefinition,
            currentPath,
            result
          );
        }
      }
    }
  }

  private validateType(value: unknown, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  private applyDefaults(): void {
    this.applyDefaultsToObject(this.config, this.schema, '');
  }

  private applyDefaultsToObject(
    obj: Record<string, unknown>,
    schema: ConfigDefinition,
    basePath: string
  ): void {
    for (const [key, schemaValue] of Object.entries(schema)) {
      if ('type' in schemaValue) {
        const fieldSchema = schemaValue as ConfigSchema;
        if (obj[key] === undefined && fieldSchema.default !== undefined) {
          obj[key] = fieldSchema.default;
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.applyDefaultsToObject(
          obj[key] as Record<string, unknown>,
          schemaValue as ConfigDefinition,
          basePath ? `${basePath}.${key}` : key
        );
      }
    }
  }

  private notifyWatchers(path: string, value: unknown): void {
    const callbacks = this.watchers.get(path);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in config watcher for ${path}:`, error);
        }
      });
    }
  }

  private filterSensitive(
    obj: Record<string, unknown>,
    schema: ConfigDefinition
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const schemaValue = schema[key];

      if (schemaValue) {
        if ('type' in schemaValue) {
          const fieldSchema = schemaValue as ConfigSchema;
          if (!fieldSchema.sensitive) {
            result[key] = value;
          }
        } else if (typeof value === 'object' && value !== null) {
          result[key] = this.filterSensitive(
            value as Record<string, unknown>,
            schemaValue as ConfigDefinition
          );
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  private calculateHash(obj: Record<string, unknown>): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return this.simpleHash(str).toString(36);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Глобальный экземпляр менеджера конфигурации
 */
export const configManager = new AdvancedConfigManager(
  typeof process !== 'undefined' ? process.env.NODE_ENV || 'development' : 'development'
);

// Автоматическая загрузка при импорте
if (typeof window !== 'undefined') {
  configManager.load().catch(console.error);
}

/**
 * Хелпер для получения конфигурации
 */
export function getConfig<T = unknown>(path: string, defaultValue?: T): T {
  return configManager.get(path, defaultValue);
}

/**
 * Хелпер для проверки feature flag
 */
export function isFeatureEnabled(name: string, context?: Record<string, unknown>): boolean {
  return configManager.isFeatureEnabled(name, context);
}

/**
 * Хелпер для подписки на изменения конфигурации
 */
export function watchConfig(path: string, callback: (value: unknown) => void): () => void {
  return configManager.watch(path, callback);
}
