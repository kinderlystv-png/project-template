import { log } from '$lib/logger';
import type { Handle } from '@sveltejs/kit';

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
    throw error;
  }
};
