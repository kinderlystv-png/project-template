import { cache } from '../cache/manager.js';
import { AppError, NetworkError, ServerError } from '../errors/handler.js';
import type { APIClientConfig, RequestConfig } from './types.js';

export class APIClient {
  private config: APIClientConfig;

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
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      params,
      timeout = this.config.timeout,
      retry = this.config.retryAttempts,
      retryDelay = this.config.retryDelay,
      cache: cacheConfig,
      ...fetchConfig
    } = config;

    // Построение URL с параметрами
    const url = this.buildURL(endpoint, params);

    // Проверка кэша для GET запросов
    const cacheKey = cacheConfig?.key || url;
    if (fetchConfig.method === 'GET' && this.config.enableCache && cacheConfig) {
      const cached = await cache.get<T>(cacheKey);
      if (cached) return cached;
    }

    // Конфигурация запроса
    const finalConfig: RequestInit = {
      method: 'GET',
      ...fetchConfig,
      headers: {
        ...this.config.defaultHeaders,
        ...fetchConfig.headers,
      },
    };

    // CSRF токен для модифицирующих запросов
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(finalConfig.method || '')) {
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        (finalConfig.headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
      }
    }

    let lastError: Error | null = null;

    // Попытки с retry
    const maxAttempts = this.config.enableRetry ? retry : 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, finalConfig, timeout);

        if (!response.ok) {
          throw this.createAPIError(response);
        }

        const data = await response.json();

        // Кэширование успешного ответа
        if (fetchConfig.method === 'GET' && this.config.enableCache && cacheConfig) {
          await cache.set(cacheKey, data, {
            ttl: cacheConfig.ttl,
            tags: cacheConfig.tags,
            storage: 'memory',
          });
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;

        // Не повторяем для клиентских ошибок
        if (error instanceof AppError && error.statusCode < 500) {
          throw error;
        }

        // Экспоненциальная задержка между попытками
        if (attempt < maxAttempts - 1) {
          await this.delay(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    // Все попытки исчерпаны
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

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
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

  // Публичные методы HTTP

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

  clearCache(): void {
    cache.clear();
  }
}

// Глобальный экземпляр API клиента
export const api = new APIClient({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});
