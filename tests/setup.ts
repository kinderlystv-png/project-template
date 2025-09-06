/**
 * Настройка тестовой среды Vitest
 */

import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { mockHelpers, resetAllMocks } from './mocks/services';

// Расширяем глобальные типы для тестов
declare global {
  interface Window {
    matchMedia: (query: string) => MediaQueryList;
    ResizeObserver: typeof ResizeObserver;
    IntersectionObserver: typeof IntersectionObserver;
  }

  namespace NodeJS {
    interface Global {
      TextEncoder: typeof TextEncoder;
      TextDecoder: typeof TextDecoder;
      fetch: typeof fetch;
    }
  }
}

// Типы для моков
interface MockedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  mockImplementation: (fn: T) => MockedFunction<T>;
  mockReturnValue: (value: ReturnType<T>) => MockedFunction<T>;
  mockResolvedValue: (value: Awaited<ReturnType<T>>) => MockedFunction<T>;
  mockRejectedValue: (error: any) => MockedFunction<T>;
  mockClear: () => void;
  mockReset: () => void;
  mockRestore: () => void;
}

interface TestEnvironment {
  isClient: boolean;
  isServer: boolean;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

interface TestProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  inStock: boolean;
  image?: string;
}

interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  isAuthenticated: boolean;
}

interface TestCartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface TestCart {
  items: TestCartItem[];
  total: number;
  itemCount: number;
}

// Настройка глобальных моков
beforeAll(() => {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  // Mock fetch
  global.fetch = async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    // Базовые моки для API
    if (url.includes('/api/products')) {
      return new Response(JSON.stringify([{ id: '1', name: 'Test Product', price: 100 }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  };

  // Mock TextEncoder/TextDecoder
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;

  // Настройка DOM моков
  mockHelpers.setupDOMMocks();
  mockHelpers.setupLocalStorageMocks();
});

beforeEach(() => {
  // Сброс всех моков перед каждым тестом
  resetAllMocks();

  // Очистка DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Сброс localStorage
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  // Очистка после каждого теста
  document.body.innerHTML = '';
});

afterAll(() => {
  // Финальная очистка
  resetAllMocks();
});

// Вспомогательные функции для тестов
const testUtils = {
  /**
   * Создает тестовую среду
   */
  createTestEnvironment: (): TestEnvironment => ({
    isClient: typeof window !== 'undefined',
    isServer: typeof window === 'undefined',
    userAgent: 'test-environment',
    viewport: {
      width: 1024,
      height: 768,
    },
  }),

  /**
   * Создает мок компонента Svelte
   */
  createMockSvelteComponent: (name: string) => {
    return class MockSvelteComponent {
      constructor(options: { target: Element; props?: Record<string, unknown> }) {
        this.target = options.target;
        this.props = options.props || {};
        this.target.innerHTML = `<div data-testid="mock-${name}">${name} Component</div>`;
      }

      target: Element;
      props: Record<string, unknown>;

      $set(props: Record<string, unknown>) {
        this.props = { ...this.props, ...props };
      }

      $destroy() {
        this.target.innerHTML = '';
      }
    };
  },

  /**
   * Ожидает обновления DOM
   */
  waitForDOMUpdate: async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  },

  /**
   * Симулирует событие
   */
  fireEvent: (element: Element, eventName: string, eventInit?: EventInit) => {
    const event = new Event(eventName, eventInit);
    element.dispatchEvent(event);
  },

  /**
   * Симулирует клик мыши
   */
  fireClickEvent: (element: Element) => {
    testUtils.fireEvent(element, 'click');
  },

  /**
   * Симулирует ввод текста
   */
  fireInputEvent: (element: HTMLInputElement, value: string) => {
    element.value = value;
    testUtils.fireEvent(element, 'input');
  },
};

// Экспорт всех необходимых утилит и типов для тестов
export { testUtils };
export type { MockedFunction, TestCart, TestCartItem, TestEnvironment, TestProduct, TestUser };
