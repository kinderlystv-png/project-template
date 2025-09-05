// Расширенные типы для оптимизированного API клиента
export interface RequestConfig {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retry?: number;
  retryDelay?: number;
  cache?: {
    ttl?: number;
    key?: string;
    tags?: string[];
  };
  // Новые опции для оптимизированного клиента
  abortKey?: string; // Ключ для отмены запроса
}

export interface APIResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface APIError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  defaultHeaders: HeadersInit;
  enableCache: boolean;
  enableRetry: boolean;
}

// GraphQL типы
export interface GraphQLResponse<T> {
  data: T;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}
