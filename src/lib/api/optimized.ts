/**
 * OPTIMIZED API Client v2.0
 * Модернизированный API клиент с улучшенной архитектурой
 *
 * Новые возможности:
 * - Модульная архитектура с плагинами
 * - Автоматическое управление состоянием
 * - Улучшенная типизация
 * - Реактивные interceptors
 * - Прогрессивное кэширование
 */

import { AppError, NetworkError, ServerError } from '../errors/handler.js';
import type { GraphQLResponse, RequestConfig } from './optimized-types.js';
import type { APIClientConfig } from './types.js';

// Интерфейсы для плагинов
interface APIPlugin {
  name: string;
  beforeRequest?: (config: RequestInit & { url: string }) => Promise<RequestInit & { url: string }>;
  afterResponse?: <T>(response: Response, data: T) => Promise<T>;
  onError?: (error: Error) => Promise<Error>;
}

interface CacheStrategy {
  shouldCache: (config: RequestConfig) => boolean;
  getCacheKey: (url: string, config: RequestConfig) => string;
  getCacheTTL: (config: RequestConfig) => number;
}

interface RetryStrategy {
  shouldRetry: (error: Error, attempt: number, maxAttempts: number) => boolean;
  getDelay: (attempt: number, baseDelay: number) => number;
}

/**
 * Оптимизированный API клиент с модульной архитектурой
 */
export class OptimizedAPIClient {
  private config: APIClientConfig;
  private plugins: APIPlugin[] = [];
  private interceptors: {
    request: Array<
      (config: RequestInit & { url: string }) => Promise<RequestInit & { url: string }>
    >;
    response: Array<<T>(response: Response, data: T) => Promise<T>>;
    error: Array<(error: Error) => Promise<Error>>;
  } = {
    request: [],
    response: [],
    error: [],
  };

  private cacheStrategy!: CacheStrategy;
  private retryStrategy!: RetryStrategy;
  private abortControllers = new Map<string, AbortController>();

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = {
      baseURL: '/api',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
      enableCache: true,
      enableRetry: true,
      ...config,
    };

    // Инициализируем стратегии
    this.initializeStrategies();

    // Устанавливаем базовые плагины
    this.setupDefaultPlugins();
  }

  private initializeStrategies() {
    // Стратегия кэширования
    this.cacheStrategy = {
      shouldCache: config => config.method === 'GET' && this.config.enableCache && !!config.cache,

      getCacheKey: (url, config) =>
        config.cache?.key || `${url}_${JSON.stringify(config.params || {})}`,

      getCacheTTL: config => config.cache?.ttl || 300000, // 5 минут по умолчанию
    };

    // Стратегия повторных попыток
    this.retryStrategy = {
      shouldRetry: (error, attempt, maxAttempts) => {
        if (attempt >= maxAttempts) return false;
        if (error instanceof AppError && error.statusCode < 500) return false;
        return true;
      },

      getDelay: (attempt, baseDelay) => baseDelay * Math.pow(2, attempt) + Math.random() * 1000, // Jitter
    };
  }

  private setupDefaultPlugins() {
    // Плагин для CSRF защиты
    this.use({
      name: 'csrf-protection',
      beforeRequest: async config => {
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method || '')) {
          const csrfToken = this.getCSRFToken();
          if (csrfToken) {
            config.headers = {
              ...config.headers,
              'X-CSRF-Token': csrfToken,
            };
          }
        }
        return config;
      },
    });

    // Плагин для логирования (только в development)
    if (import.meta.env.DEV) {
      this.use({
        name: 'dev-logger',
        beforeRequest: async config => {
          // eslint-disable-next-line no-console
          console.log(`🚀 API Request: ${config.method} ${config.url}`, config);
          return config;
        },
        afterResponse: async (response, data) => {
          // eslint-disable-next-line no-console
          console.log(`✅ API Response: ${response.status}`, data);
          return data;
        },
        onError: async error => {
          // eslint-disable-next-line no-console
          console.error('❌ API Error:', error);
          return error;
        },
      });
    }
  }

  /**
   * Добавляет плагин к API клиенту
   */
  use(plugin: APIPlugin): this {
    this.plugins.push(plugin);

    if (plugin.beforeRequest) {
      this.interceptors.request.push(plugin.beforeRequest);
    }
    if (plugin.afterResponse) {
      this.interceptors.response.push(plugin.afterResponse);
    }
    if (plugin.onError) {
      this.interceptors.error.push(plugin.onError);
    }

    return this;
  }

  /**
   * Основной метод для выполнения запросов
   */
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      params,
      timeout = this.config.timeout,
      retry = this.config.retryAttempts,
      retryDelay = this.config.retryDelay,
      abortKey,
      ...fetchConfig
    } = config;

    // Построение URL
    const url = this.buildURL(endpoint, params);

    // Проверка кэша
    if (this.cacheStrategy.shouldCache(config)) {
      const cacheKey = this.cacheStrategy.getCacheKey(url, config);
      const cached = await this.getFromCache<T>(cacheKey);
      if (cached) return cached;
    }

    // Abort controller для отмены запросов
    const abortController = new AbortController();
    if (abortKey) {
      // Отменяем предыдущий запрос с тем же ключом
      this.abortControllers.get(abortKey)?.abort();
      this.abortControllers.set(abortKey, abortController);
    }

    // Базовая конфигурация запроса
    let requestConfig: RequestInit & { url: string } = {
      method: 'GET',
      ...fetchConfig,
      url,
      headers: {
        ...this.config.defaultHeaders,
        ...fetchConfig.headers,
      },
      signal: abortController.signal,
    };

    // Применяем interceptors перед запросом
    for (const interceptor of this.interceptors.request) {
      requestConfig = await interceptor(requestConfig);
    }

    let lastError: Error | null = null;
    const maxAttempts = this.config.enableRetry ? retry : 1;

    // Цикл повторных попыток
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.fetchWithTimeout(requestConfig.url, requestConfig, timeout);

        if (!response.ok) {
          throw this.createAPIError(response);
        }

        let data = (await response.json()) as T;

        // Применяем interceptors после ответа
        for (const interceptor of this.interceptors.response) {
          data = await interceptor(response, data);
        }

        // Кэшируем успешный ответ
        if (this.cacheStrategy.shouldCache(config)) {
          const cacheKey = this.cacheStrategy.getCacheKey(url, config);
          const ttl = this.cacheStrategy.getCacheTTL(config);
          await this.setToCache(cacheKey, data, ttl);
        }

        return data;
      } catch (error) {
        lastError = error as Error;

        // Применяем interceptors для ошибок
        for (const interceptor of this.interceptors.error) {
          lastError = await interceptor(lastError);
        }

        // Проверяем, нужна ли повторная попытка
        if (!this.retryStrategy.shouldRetry(lastError, attempt, maxAttempts)) {
          throw lastError;
        }

        // Задержка перед следующей попыткой
        if (attempt < maxAttempts - 1) {
          const delay = this.retryStrategy.getDelay(attempt, retryDelay);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new NetworkError('Request failed after all retries');
  }

  private buildURL(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(`${this.config.baseURL}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Комбинируем abort signals
    const combinedSignal = this.combineAbortSignals(
      controller.signal,
      config.signal as AbortSignal
    );

    try {
      return await fetch(url, {
        ...config,
        signal: combinedSignal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private combineAbortSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal) {
        if (signal.aborted) {
          controller.abort();
          break;
        }
        signal.addEventListener('abort', () => controller.abort());
      }
    }

    return controller.signal;
  }

  private createAPIError(response: Response): AppError {
    if (response.status >= 500) {
      return new ServerError(`Server Error: ${response.status} ${response.statusText}`, {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });
    }

    return new AppError(
      `HTTP ${response.status}: ${response.statusText}`,
      'HTTP_ERROR',
      response.status,
      true,
      {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCSRFToken(): string | null {
    return (
      sessionStorage.getItem('csrf_token') ||
      document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
      null
    );
  }

  // Методы кэширования (используют ленивую загрузку)
  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const { cache } = await import('../cache/manager.js');
      return await cache.get<T>(key);
    } catch {
      return null;
    }
  }

  private async setToCache<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const { cache } = await import('../cache/manager.js');
      await cache.set(key, data, { ttl, storage: 'memory' });
    } catch {
      // Тихо игнорируем ошибки кэширования
    }
  }

  // Публичные HTTP методы
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Утилиты
  setBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
  }

  setDefaultHeader(key: string, value: string): void {
    (this.config.defaultHeaders as Record<string, string>)[key] = value;
  }

  removeDefaultHeader(key: string): void {
    delete (this.config.defaultHeaders as Record<string, string>)[key];
  }

  setCSRFToken(token: string): void {
    sessionStorage.setItem('csrf_token', token);
  }

  /**
   * Отменяет запрос по ключу
   */
  abortRequest(key: string): void {
    this.abortControllers.get(key)?.abort();
    this.abortControllers.delete(key);
  }

  /**
   * Отменяет все активные запросы
   */
  abortAllRequests(): void {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
  }

  /**
   * Очищает кэш
   */
  async clearCache(): Promise<void> {
    try {
      const { cache } = await import('../cache/manager.js');
      cache.clear();
    } catch {
      // Игнорируем ошибки
    }
  }
}

// Расширяем базовый клиент интерфейсом для GraphQL
interface GraphQLAPIClient extends OptimizedAPIClient {
  graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
}

/**
 * Фабрика для создания оптимизированных API клиентов
 */
export class OptimizedAPIClientFactory {
  /**
   * Создает базовый API клиент
   */
  static createBasic(config?: Partial<APIClientConfig>): OptimizedAPIClient {
    return new OptimizedAPIClient(config);
  }

  /**
   * Создает API клиент для аутентификации
   */
  static createAuthClient(config?: Partial<APIClientConfig>): OptimizedAPIClient {
    const client = new OptimizedAPIClient(config);

    // Плагин для автоматического добавления токена
    client.use({
      name: 'auth-token',
      beforeRequest: async config => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
        return config;
      },
      onError: async error => {
        // Перенаправляем на логин при 401
        if (error instanceof AppError && error.statusCode === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return error;
      },
    });

    return client;
  }

  /**
   * Создает API клиент для GraphQL
   */
  static createGraphQLClient(config?: Partial<APIClientConfig>): GraphQLAPIClient {
    const client = new OptimizedAPIClient({
      ...config,
      defaultHeaders: {
        'Content-Type': 'application/json',
        ...config?.defaultHeaders,
      },
    }) as GraphQLAPIClient;

    // Добавляем метод для GraphQL запросов
    client.graphql = async function <T>(
      query: string,
      variables?: Record<string, unknown>
    ): Promise<T> {
      const response = await this.post<GraphQLResponse<T>>('/graphql', {
        query,
        variables,
      });

      if (response.errors?.length) {
        throw new AppError('GraphQL Error', 'GRAPHQL_ERROR', 400, true, response.errors);
      }

      return response.data;
    };

    return client;
  }
}

// Экспортируем оптимизированный глобальный экземпляр
export const optimizedApi = OptimizedAPIClientFactory.createBasic({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Экспортируем аутентифицированный клиент
export const authApi = OptimizedAPIClientFactory.createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Для обратной совместимости
export const api = optimizedApi;
