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

/**
 * Утилита для тестирования калькуляторов
 */
export class CalculatorTestHelper {
  static validateCalculation(
    input: number[],
    expectedOutput: number,
    calculator: (inputs: number[]) => number
  ): boolean {
    try {
      const result = calculator(input);
      return Math.abs(result - expectedOutput) < 0.0001; // Учитываем погрешность float
    } catch {
      return false;
    }
  }

  static generateTestCases(count: number = 10): Array<{ input: number[]; expected: number }> {
    const cases = [];
    for (let i = 0; i < count; i++) {
      const input = [Math.random() * 100, Math.random() * 100];
      const expected = input[0] + input[1]; // Простой пример
      cases.push({ input, expected });
    }
    return cases;
  }
}

/**
 * Утилита для тестирования 3D компонентов
 */
export class ThreeJSTestHelper {
  static createMockScene() {
    return {
      add: vi.fn(),
      remove: vi.fn(),
      children: [],
      background: null,
    };
  }

  static createMockCamera() {
    return {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      fov: 75,
      aspect: 1,
      near: 0.1,
      far: 1000,
      updateProjectionMatrix: vi.fn(),
    };
  }

  static createMockRenderer() {
    return {
      render: vi.fn(),
      setSize: vi.fn(),
      setClearColor: vi.fn(),
      domElement: document.createElement('canvas'),
    };
  }
}
