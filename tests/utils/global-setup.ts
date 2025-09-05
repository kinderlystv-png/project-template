import { tick } from 'svelte';
import { afterEach, vi } from 'vitest';

// Глобальная настройка тестового окружения

// Увеличиваем таймауты для тестов с анимациями
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000,
});

// Мок для requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => {
  setTimeout(cb, 16); // ~60fps
  return 1;
}) as typeof requestAnimationFrame;

global.cancelAnimationFrame = vi.fn();

// Мок для ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Мок для IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Мок для Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Мок для localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Мок для sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Мок для URL
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Хелперы для тестирования
export const waitForTick = () => tick();

export const waitForAnimation = (duration = 100) =>
  new Promise(resolve => setTimeout(resolve, duration));

export const mockComponent = (_name: string) => {
  return vi.fn().mockImplementation(() => ({
    $$: {},
    $on: vi.fn(),
    $set: vi.fn(),
    $destroy: vi.fn(),
  }));
};

// Хелпер для тестирования событий
export const createMockEvent = (type: string, detail = {}) => {
  return new CustomEvent(type, { detail });
};

// Утилиты для тестирования 3D
export const mock3DScene = () => ({
  add: vi.fn(),
  remove: vi.fn(),
  children: [],
  traverse: vi.fn(),
  getObjectByName: vi.fn(),
});

// Утилиты для тестирования анимаций
export const mockGSAP = () => ({
  to: vi.fn().mockReturnValue({ kill: vi.fn() }),
  from: vi.fn().mockReturnValue({ kill: vi.fn() }),
  timeline: vi.fn().mockReturnValue({
    to: vi.fn(),
    from: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    kill: vi.fn(),
  }),
});

// Очистка после каждого теста
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
