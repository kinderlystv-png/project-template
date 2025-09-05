/**
 * Утилиты для тестирования компонентов Svelte
 * Предоставляет хелперы для рендеринга, взаимодействия и проверок
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { ComponentType, SvelteComponent } from 'svelte';
import { vi } from 'vitest';

export interface TestUtils {
  render: typeof render;
  screen: typeof screen;
  fireEvent: typeof fireEvent;
  waitFor: typeof waitFor;
  cleanup: typeof cleanup;
  vi: typeof vi;
}

/**
 * Рендер компонента с предустановленными параметрами
 */
export function renderComponent<T extends SvelteComponent>(
  Component: ComponentType<T>,
  props = {} as Record<string, unknown>,
  options = {} as { context?: Map<unknown, unknown> }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return render(Component, { props, ...options } as any);
}

/**
 * Ожидание появления элемента
 */
export async function waitForElement(selector: string, timeout = 5000) {
  return waitFor(() => screen.getByTestId(selector), { timeout });
}

/**
 * Симуляция пользовательского клика с задержкой
 */
export async function userClick(element: Element, delay = 0) {
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  await fireEvent.click(element);
}

/**
 * Симуляция ввода текста
 */
export async function userType(element: Element, text: string, delay = 0) {
  for (const char of text) {
    await fireEvent.input(element, { target: { value: char } });
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Мок для localStorage
 */
export function createLocalStorageMock() {
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
    length: Object.keys(store).length,
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
}

/**
 * Мок для fetch API
 */
export function createFetchMock() {
  return vi.fn().mockImplementation((_url: string, _options?: RequestInit) => {
    const response = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue(''),
      blob: vi.fn().mockResolvedValue(new Blob()),
    };

    return Promise.resolve(response);
  });
}

/**
 * Генератор тестовых данных
 */
export class TestDataGenerator {
  static randomString(length = 10) {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  }

  static randomNumber(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomBoolean() {
    return Math.random() > 0.5;
  }

  static randomEmail() {
    return `${this.randomString(8)}@${this.randomString(5)}.com`;
  }

  static randomDate(start = new Date(2020, 0, 1), end = new Date()) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  static randomArray<T>(generator: () => T, length = 5) {
    return Array.from({ length }, generator);
  }
}

/**
 * Мок для анимационных библиотек
 */
export function createAnimationMock() {
  return {
    gsap: {
      to: vi.fn().mockReturnValue({
        then: vi.fn(callback => callback()),
        kill: vi.fn(),
      }),
      from: vi.fn().mockReturnValue({
        then: vi.fn(callback => callback()),
        kill: vi.fn(),
      }),
      set: vi.fn(),
      timeline: vi.fn(() => ({
        to: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        add: vi.fn().mockReturnThis(),
        play: vi.fn().mockReturnThis(),
        pause: vi.fn().mockReturnThis(),
        restart: vi.fn().mockReturnThis(),
        kill: vi.fn(),
      })),
    },
    lottie: {
      loadAnimation: vi.fn(() => ({
        play: vi.fn(),
        pause: vi.fn(),
        stop: vi.fn(),
        destroy: vi.fn(),
        goToAndStop: vi.fn(),
        goToAndPlay: vi.fn(),
        setSpeed: vi.fn(),
        setDirection: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    },
  };
}

/**
 * Мок для Three.js сцены
 */
export function createThreeJSMock() {
  return {
    Scene: vi.fn(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      traverse: vi.fn(),
      getObjectByName: vi.fn(),
    })),
    WebGLRenderer: vi.fn(() => ({
      setSize: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: document.createElement('canvas'),
      setClearColor: vi.fn(),
      setPixelRatio: vi.fn(),
    })),
    PerspectiveCamera: vi.fn(() => ({
      position: { x: 0, y: 0, z: 0 },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
    })),
    Mesh: vi.fn(() => ({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    })),
    BoxGeometry: vi.fn(),
    MeshBasicMaterial: vi.fn(),
  };
}

/**
 * Утилиты для тестирования форм
 */
export class FormTestUtils {
  static async fillForm(form: Element, data: Record<string, string | number>) {
    for (const [name, value] of Object.entries(data)) {
      const field = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
      if (field) {
        await fireEvent.input(field, { target: { value } });
      }
    }
  }

  static async submitForm(form: Element) {
    await fireEvent.submit(form);
  }

  static getFormData(form: Element) {
    const formData = new FormData(form as HTMLFormElement);
    const data: Record<string, string | File> = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    return data;
  }
}

/**
 * Утилиты для тестирования производительности
 */
export class PerformanceTestUtils {
  static async measureExecutionTime(fn: () => Promise<void> | void) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  }

  static async measureMemoryUsage(fn: () => Promise<void> | void) {
    if ('memory' in performance) {
      const beforeMemory = (performance as { memory: { usedJSHeapSize: number } }).memory
        .usedJSHeapSize;
      await fn();
      const afterMemory = (performance as { memory: { usedJSHeapSize: number } }).memory
        .usedJSHeapSize;
      return afterMemory - beforeMemory;
    }
    return 0;
  }

  static createPerformanceObserver(entryTypes: string[]) {
    const entries: PerformanceEntry[] = [];

    const observer = vi.fn().mockImplementation(() => ({
      observe: vi.fn((_options: { entryTypes: string[] }) => {
        entryTypes.forEach(type => {
          // Симуляция записей производительности
          entries.push({
            name: `test-${type}`,
            entryType: type,
            startTime: performance.now(),
            duration: Math.random() * 100,
          } as PerformanceEntry);
        });
      }),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => entries),
    }));

    return observer;
  }
}

/**
 * Очистка после тестов
 */
export function cleanupTests() {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
  document.body.innerHTML = '';
}
