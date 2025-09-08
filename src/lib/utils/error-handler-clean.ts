import { dev } from '$app/environment';
import * as Sentry from '@sentry/sveltekit';
import type { RequestEvent } from '@sveltejs/kit';

// Типы для контекста ошибок
export interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    userAgent?: string;
  };
  component?: {
    name?: string;
    props?: Record<string, unknown>;
  };
  extra?: Record<string, unknown>;
}

// Класс для кастомных ошибок приложения
export class AppError extends Error {
  public readonly context: ErrorContext;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly statusCode?: number;

  constructor(
    message: string,
    options: {
      code?: string;
      context?: ErrorContext;
      isOperational?: boolean;
      statusCode?: number;
    } = {}
  ) {
    super(message);

    this.name = this.constructor.name;
    this.code = options.code || 'APP_ERROR';
    this.context = options.context || {};
    this.isOperational = options.isOperational ?? true;
    this.statusCode = options.statusCode;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// API ошибки
export class ApiError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    options: {
      code?: string;
      context?: ErrorContext;
    } = {}
  ) {
    super(message, {
      code: options.code || `HTTP_${statusCode}`,
      context: options.context,
      statusCode,
    });
  }
}

// Инициализация системы обработки ошибок
export function initErrorHandling() {
  if (!dev && typeof window !== 'undefined') {
    // Инициализация Sentry только в продакшене и на клиенте
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.VITE_APP_ENV || 'production',
      debug: false,
    });

    // Глобальный обработчик необработанных ошибок
    window.addEventListener('error', event => {
      captureException(event.error, {
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          message: event.message,
        },
      });
    });

    // Обработчик необработанных Promise rejections
    window.addEventListener('unhandledrejection', event => {
      captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          extra: {
            type: 'unhandledrejection',
            reason: event.reason,
          },
        }
      );
    });
  }
}

// Захват исключений
export function captureException(error: Error, context?: ErrorContext) {
  if (!dev && typeof window !== 'undefined') {
    Sentry.withScope(scope => {
      if (context?.user) {
        scope.setUser(context.user);
      }

      if (context?.request) {
        scope.setContext('request', context.request);
      }

      if (context?.component) {
        scope.setContext('component', context.component);
      }

      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      scope.setLevel('error');
      Sentry.captureException(error);
    });
  }
}

// Захват сообщений
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
) {
  if (!dev && typeof window !== 'undefined') {
    Sentry.withScope(scope => {
      if (context?.user) {
        scope.setUser(context.user);
      }

      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      scope.setLevel(level);
      Sentry.captureMessage(message);
    });
  }
}

// Обработчик для SvelteKit ошибок
export function handleSvelteKitError(error: Error, event?: RequestEvent) {
  const context: ErrorContext = {
    request: event
      ? {
          url: event.url?.href,
          method: event.request?.method,
          headers: event.request?.headers ? Object.fromEntries(event.request.headers) : undefined,
          userAgent: event.request?.headers?.get('user-agent') || undefined,
        }
      : undefined,
  };

  captureException(error, context);
}

// Утилита для безопасного выполнения асинхронных операций
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<{ data?: T; error?: Error }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    captureException(err, context);
    return { error: err };
  }
}
