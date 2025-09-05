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
