import { initErrorHandling, handleSvelteKitError } from '$lib/utils/error-handler';
import { log } from '$lib/logger';
import type { Handle, HandleServerError } from '@sveltejs/kit';

// Инициализация системы обработки ошибок
initErrorHandling();

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  const { method } = event.request;
  const { pathname } = event.url;

  log.info(`Request: ${method} ${pathname}`, {
    method,
    path: pathname,
    userAgent: event.request.headers.get('user-agent'),
  });

  try {
    const response = await resolve(event);

    const duration = Date.now() - start;
    log.info(`Response: ${response.status}`, {
      status: response.status,
      duration,
      method,
      path: pathname,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - start;
    log.error(
      `Error handling request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        error: error instanceof Error ? error.stack : error,
        duration,
        method,
        path: pathname,
      }
    );

    // Отправляем ошибку в систему мониторинга
    handleSvelteKitError(error instanceof Error ? error : new Error(String(error)), event);

    throw error;
  }
};

// Обработчик ошибок сервера
export const handleError: HandleServerError = ({ error, event }) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  log.error('Server error:', {
    message: errorObj.message,
    stack: errorObj.stack,
    path: event.url.pathname,
  });

  // Отправляем ошибку в систему мониторинга
  handleSvelteKitError(errorObj, event);

  return {
    message: 'An unexpected error occurred',
  };
};
