import { captureException, initErrorHandling } from '$lib/utils/error-handler';
import type { HandleClientError } from '@sveltejs/kit';

// Инициализация обработки ошибок на клиенте
initErrorHandling();

// Обработчик клиентских ошибок
export const handleError: HandleClientError = ({ error, event }) => {
  // Отправляем ошибку в систему мониторинга
  captureException(error instanceof Error ? error : new Error(String(error)), {
    request: {
      url: event.url.href,
      method: 'GET',
    },
  });

  return {
    message: 'An unexpected error occurred',
  };
};
