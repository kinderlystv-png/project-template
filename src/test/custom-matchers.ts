/**
 * Custom Vitest Matchers
 * Кастомные матчеры для расширения возможностей тестирования
 */

import { expect } from 'vitest';

// Расширяем типы для TypeScript
declare module 'vitest' {
  interface Assertion {
    toBeValidEmail(): void;
    toBeValidUrl(): void;
    toHaveCorrectStructure(structure: Record<string, string>): void;
    toBeWithinRange(min: number, max: number): void;
    toBePerformant(maxTime: number): void;
    toHaveApiFormat(): void;
    toBeAccessible(): void;
  }
}

// Матчер для валидации email
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`,
    };
  },
});

// Матчер для валидации URL
expect.extend({
  toBeValidUrl(received: string) {
    try {
      new URL(received);
      return {
        pass: true,
        message: () => `Expected ${received} not to be a valid URL`,
      };
    } catch {
      return {
        pass: false,
        message: () => `Expected ${received} to be a valid URL`,
      };
    }
  },
});

// Матчер для проверки структуры объекта
expect.extend({
  toHaveCorrectStructure(received: Record<string, unknown>, structure: Record<string, string>) {
    const errors: string[] = [];

    for (const [key, expectedType] of Object.entries(structure)) {
      if (!(key in received)) {
        errors.push(`Missing property: ${key}`);
        continue;
      }

      const actualType = typeof received[key];
      if (actualType !== expectedType) {
        errors.push(`Property ${key}: expected ${expectedType}, got ${actualType}`);
      }
    }

    const pass = errors.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? `Expected object not to have correct structure`
          : `Expected object to have correct structure. Errors: ${errors.join(', ')}`,
    };
  },
});

// Матчер для проверки числового диапазона
expect.extend({
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be within range ${min}-${max}`
          : `Expected ${received} to be within range ${min}-${max}`,
    };
  },
});

// Матчер для проверки производительности
expect.extend({
  toBePerformant(received: () => void | Promise<void>, maxTime: number) {
    return new Promise<{ pass: boolean; message: () => string }>(resolve => {
      const startTime = performance.now();

      Promise.resolve(received())
        .then(() => {
          const endTime = performance.now();
          const executionTime = endTime - startTime;
          const pass = executionTime <= maxTime;

          resolve({
            pass,
            message: () =>
              pass
                ? `Expected function not to execute within ${maxTime}ms (took ${executionTime.toFixed(2)}ms)`
                : `Expected function to execute within ${maxTime}ms but took ${executionTime.toFixed(2)}ms`,
          });
        })
        .catch(() => {
          resolve({
            pass: false,
            message: () => `Function threw an error during performance test`,
          });
        });
    });
  },
});

// Матчер для проверки API формата ответа
expect.extend({
  toHaveApiFormat(received: Record<string, unknown>) {
    const requiredFields = ['success', 'data'];
    const optionalFields = ['message', 'error', 'timestamp', 'meta'];

    const hasRequired = requiredFields.every(field => field in received);
    const hasOnlyAllowed = Object.keys(received).every(
      key => requiredFields.includes(key) || optionalFields.includes(key)
    );

    const pass = hasRequired && hasOnlyAllowed;

    return {
      pass,
      message: () =>
        pass
          ? `Expected object not to have API format`
          : `Expected object to have API format with fields: ${requiredFields.join(', ')} and optionally: ${optionalFields.join(', ')}`,
    };
  },
});

// Матчер для проверки доступности (a11y)
expect.extend({
  toBeAccessible(received: HTMLElement | Element) {
    const errors: string[] = [];

    // Проверка наличия alt текста для изображений
    const images = received.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.getAttribute('alt')) {
        errors.push(`Image ${index + 1} missing alt attribute`);
      }
    });

    // Проверка наличия labels для input элементов
    const inputs = received.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');

      if (id) {
        const label = received.querySelector(`label[for="${id}"]`);
        if (!label && !ariaLabel && !ariaLabelledby) {
          errors.push(`Input ${index + 1} missing accessible label`);
        }
      } else if (!ariaLabel && !ariaLabelledby) {
        errors.push(`Input ${index + 1} missing accessible label`);
      }
    });

    // Проверка контрастности (базовая)
    const elementsWithText = received.querySelectorAll('*');
    elementsWithText.forEach(element => {
      const style = getComputedStyle(element as HTMLElement);
      const color = style.color;
      const backgroundColor = style.backgroundColor;

      // Простая проверка - если цвет и фон слишком похожи
      if (color && backgroundColor && color === backgroundColor) {
        errors.push(`Element has same text and background color: ${color}`);
      }
    });

    // Проверка наличия heading структуры
    const headings = received.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0 && received.textContent && received.textContent.length > 100) {
      errors.push('Long content without heading structure');
    }

    const pass = errors.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to be accessible`
          : `Expected element to be accessible. Issues: ${errors.join(', ')}`,
    };
  },
});

// Экспортируем кастомные утилиты для тестов
export const testUtils = {
  /**
   * Создает мок для API ответа
   */
  createApiResponse: (data: unknown, success = true, message?: string) => ({
    success,
    data,
    message,
    timestamp: Date.now(),
  }),

  /**
   * Создает мок элемента DOM
   */
  createMockElement: (tagName: string, attributes: Record<string, string> = {}) => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  },

  /**
   * Ждет определенное время
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Создает мок для асинхронной функции с задержкой
   */
  createAsyncMock: <T>(returnValue: T, delay = 100) => {
    return vi
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(returnValue), delay))
      );
  },

  /**
   * Создает мок для функции с ошибкой
   */
  createErrorMock: (error: Error | string, delay = 0) => {
    return vi
      .fn()
      .mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(typeof error === 'string' ? new Error(error) : error), delay)
          )
      );
  },

  /**
   * Тестирует производительность функции
   */
  measurePerformance: async (fn: () => void | Promise<void>, iterations = 1) => {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await Promise.resolve(fn());
      const end = performance.now();
      times.push(end - start);
    }

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      times,
    };
  },

  /**
   * Создает мок для localStorage
   */
  createLocalStorageMock: () => {
    const store = new Map<string, string>();

    return {
      getItem: vi.fn((key: string) => store.get(key) || null),
      setItem: vi.fn((key: string, value: string) => store.set(key, value)),
      removeItem: vi.fn((key: string) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
      key: vi.fn((index: number) => Array.from(store.keys())[index] || null),
      get length() {
        return store.size;
      },
    };
  },

  /**
   * Создает мок для fetch API
   */
  createFetchMock: (
    responses: Array<{
      url?: string | RegExp;
      response: Response | Record<string, unknown>;
      delay?: number;
    }>
  ) => {
    return vi.fn().mockImplementation((url: string, _options?: RequestInit) => {
      const match = responses.find(r => {
        if (!r.url) return true;
        if (typeof r.url === 'string') return url.includes(r.url);
        return r.url.test(url);
      });

      if (!match) {
        return Promise.reject(new Error(`No mock response for ${url}`));
      }

      const delay = match.delay || 0;
      const response =
        match.response instanceof Response
          ? match.response
          : new Response(JSON.stringify(match.response), {
              headers: { 'Content-Type': 'application/json' },
            });

      return new Promise(resolve => setTimeout(() => resolve(response), delay));
    });
  },
};
