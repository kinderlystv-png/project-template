import { vi, type MockedFunction } from 'vitest';

/**
 * Создание мок-функции с типизацией
 */
export function createMock<T extends (...args: any[]) => any>(
  implementation?: T
): MockedFunction<T> {
  return implementation
    ? (vi.fn(implementation) as MockedFunction<T>)
    : (vi.fn() as MockedFunction<T>);
}

/**
 * Утилита для ожидания асинхронных операций
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Мок для локального хранилища
 */
export const createLocalStorageMock = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

/**
 * Мок для fetch API
 */
export const createFetchMock = () => {
  return vi.fn().mockImplementation((url: string, _options?: RequestInit) => {
    const response = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue(''),
      blob: vi.fn().mockResolvedValue(new Blob()),
      headers: new Headers(),
      url,
    };

    return Promise.resolve(response);
  });
};
