/**
 * Настройка Vitest для тестов
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { setupDOMMocks } from './test-utils';

// Настройка DOM моков
setupDOMMocks();

// Глобальные моки
global.performance =
  global.performance ||
  ({
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
  } as Performance);

// Очистка моков после каждого теста
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

// Настройка перед каждым тестом
beforeEach(() => {
  vi.useFakeTimers();
});

// Восстановление после тестов
afterEach(() => {
  vi.useRealTimers();
});

// Подавление предупреждений в консоли для тестов
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: vi.fn(),
  error: vi.fn(),
};
