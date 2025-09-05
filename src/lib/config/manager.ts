import type { AppConfig } from './types.js';

export class ConfigManager {
  private config: AppConfig;
  private readonly environment: string;

  constructor() {
    this.environment = import.meta.env.MODE || 'development';
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): AppConfig {
    const env = import.meta.env;

    const baseConfig: AppConfig = {
      api: {
        baseURL: env.VITE_API_URL || '/api',
        timeout: Number(env.VITE_API_TIMEOUT) || 30000,
        retryAttempts: Number(env.VITE_API_RETRY) || 3,
      },
      auth: {
        tokenKey: env.VITE_AUTH_TOKEN_KEY || 'auth_token',
        refreshInterval: Number(env.VITE_AUTH_REFRESH) || 3600000, // 1 hour
        loginPath: env.VITE_LOGIN_PATH || '/login',
      },
      cache: {
        defaultTTL: Number(env.VITE_CACHE_TTL) || 3600000, // 1 hour
        maxSize: Number(env.VITE_CACHE_SIZE) || 1000,
      },
      features: {
        enableAnalytics: env.VITE_ENABLE_ANALYTICS === 'true',
        enableSentry: env.VITE_ENABLE_SENTRY === 'true',
        enablePWA: env.VITE_ENABLE_PWA === 'true',
        enableDevTools: env.VITE_ENABLE_DEV_TOOLS === 'true' || this.isDevelopment(),
      },
      sentry: {
        dsn: env.VITE_SENTRY_DSN || '',
        environment: this.environment,
        tracesSampleRate: Number(env.VITE_SENTRY_TRACES_RATE) || 0.1,
      },
      analytics: {
        trackingId: env.VITE_ANALYTICS_ID || '',
        enablePageViews: env.VITE_ANALYTICS_PAGE_VIEWS !== 'false',
        enableEvents: env.VITE_ANALYTICS_EVENTS !== 'false',
      },
      ui: {
        theme: (env.VITE_DEFAULT_THEME as 'light' | 'dark' | 'auto') || 'auto',
        language: env.VITE_DEFAULT_LANGUAGE || 'ru',
        enableAnimations: env.VITE_ENABLE_ANIMATIONS !== 'false',
      },
      development: {
        enableMocks: env.VITE_ENABLE_MOCKS === 'true' || this.isDevelopment(),
        apiDelay: Number(env.VITE_API_DELAY) || 0,
        showDebugInfo: env.VITE_SHOW_DEBUG === 'true' || this.isDevelopment(),
      },
    };

    // Применяем настройки для конкретной среды
    return this.applyEnvironmentOverrides(baseConfig);
  }

  private applyEnvironmentOverrides(config: AppConfig): AppConfig {
    const overrides: Partial<AppConfig> = {};

    switch (this.environment) {
      case 'production':
        overrides.features = {
          ...config.features,
          enableDevTools: false,
        };
        overrides.development = {
          ...config.development,
          enableMocks: false,
          apiDelay: 0,
          showDebugInfo: false,
        };
        break;

      case 'test':
        overrides.api = {
          ...config.api,
          baseURL: 'http://localhost:3000/api',
          timeout: 5000,
        };
        overrides.features = {
          ...config.features,
          enableAnalytics: false,
          enableSentry: false,
        };
        break;

      case 'development':
        overrides.features = {
          ...config.features,
          enableDevTools: true,
        };
        overrides.development = {
          ...config.development,
          showDebugInfo: true,
        };
        break;
    }

    return this.deepMerge(config, overrides);
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Валидация API конфигурации
    if (!this.config.api.baseURL) {
      errors.push('API baseURL is required');
    }

    if (this.config.api.timeout < 1000) {
      this.config.api.timeout = 1000;
      if (this.isDevelopment()) {
        console.warn('API timeout was too low, set to 1000ms');
      }
    }

    // Валидация Sentry
    if (this.config.features.enableSentry && !this.config.sentry.dsn) {
      errors.push('Sentry DSN is required when Sentry is enabled');
      this.config.features.enableSentry = false;
    }

    // Валидация Analytics
    if (this.config.features.enableAnalytics && !this.config.analytics.trackingId) {
      errors.push('Analytics tracking ID is required when analytics is enabled');
      this.config.features.enableAnalytics = false;
    }

    // Валидация кэша
    if (this.config.cache.maxSize < 10) {
      this.config.cache.maxSize = 10;
      if (this.isDevelopment()) {
        console.warn('Cache max size was too low, set to 10');
      }
    }

    if (errors.length > 0 && this.isDevelopment()) {
      console.error('Configuration validation errors:', errors);
    }
  }

  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== undefined) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof target[key] === 'object' &&
          target[key] !== null &&
          !Array.isArray(target[key])
        ) {
          (result as Record<string, unknown>)[key] = this.deepMerge(
            target[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>
          );
        } else {
          (result as Record<string, unknown>)[key] = source[key];
        }
      }
    }

    return result;
  }

  // Публичные методы

  get<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return this.config[section];
  }

  getAll(): AppConfig {
    return { ...this.config };
  }

  isProduction(): boolean {
    return this.environment === 'production';
  }

  isDevelopment(): boolean {
    return this.environment === 'development';
  }

  isTest(): boolean {
    return this.environment === 'test';
  }

  getEnvironment(): string {
    return this.environment;
  }

  // Динамическое обновление конфигурации
  updateConfig<K extends keyof AppConfig>(section: K, updates: Partial<AppConfig[K]>): void {
    this.config[section] = {
      ...this.config[section],
      ...updates,
    };
  }

  // Сохранение пользовательских настроек
  saveUserPreference(key: string, value: unknown): void {
    try {
      const preferences = JSON.parse(localStorage.getItem('user_preferences') || '{}');
      preferences[key] = value;
      localStorage.setItem('user_preferences', JSON.stringify(preferences));
    } catch (error) {
      if (this.isDevelopment()) {
        console.error('Failed to save user preference:', error);
      }
    }
  }

  getUserPreference<T = unknown>(key: string, defaultValue?: T): T | undefined {
    try {
      const preferences = JSON.parse(localStorage.getItem('user_preferences') || '{}');
      return preferences[key] !== undefined ? (preferences[key] as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  // Получение конфигурации для отдельных модулей
  getAPIConfig() {
    return this.config.api;
  }

  getCacheConfig() {
    return this.config.cache;
  }

  getFeatureFlags() {
    return this.config.features;
  }

  getSentryConfig() {
    return this.config.sentry;
  }

  getAnalyticsConfig() {
    return this.config.analytics;
  }

  getUIConfig() {
    return this.config.ui;
  }

  // Проверка функциональности
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  // Отладочная информация
  getDebugInfo(): Record<string, unknown> {
    if (!this.isDevelopment()) {
      return { message: 'Debug info only available in development' };
    }

    return {
      environment: this.environment,
      config: this.config,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
  }
}

// Глобальный экземпляр конфигурации
export const config = new ConfigManager();
