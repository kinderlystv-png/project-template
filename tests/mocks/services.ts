// Mock Services для тестирования
import { vi } from 'vitest';

// Mock API сервиса
export const mockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
};

// Mock данных продуктов
export const mockProducts = [
  {
    id: '1',
    name: 'iPhone 14',
    price: 79999,
    description: 'Latest iPhone model',
    category: 'electronics',
    inStock: true,
    image: '/images/iphone14.jpg',
  },
  {
    id: '2',
    name: 'MacBook Pro',
    price: 199999,
    description: 'Professional laptop',
    category: 'electronics',
    inStock: true,
    image: '/images/macbook.jpg',
  },
  {
    id: '3',
    name: 'AirPods Pro',
    price: 19999,
    description: 'Wireless earphones',
    category: 'electronics',
    inStock: false,
    image: '/images/airpods.jpg',
  },
];

// Mock пользователя
export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'customer',
  isAuthenticated: false,
};

// Mock корзины
export const mockCart = {
  items: [],
  total: 0,
  itemCount: 0,
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  clear: vi.fn(),
};

// Mock локального хранилища
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock уведомлений
export const mockNotifications = {
  show: vi.fn(),
  hide: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showWarning: vi.fn(),
};

// Mock навигации
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: { path: '/', name: 'home' },
};

// Mock WebGL контекста
export const mockWebGLContext = {
  canvas: document.createElement('canvas'),
  getExtension: vi.fn(),
  getParameter: vi.fn(),
  createProgram: vi.fn(),
  createShader: vi.fn(),
  compileShader: vi.fn(),
  linkProgram: vi.fn(),
  useProgram: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  viewport: vi.fn(),
  clear: vi.fn(),
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
};

// Mock форм
export const mockFormValidator = {
  validate: vi.fn(),
  validateField: vi.fn(),
  getErrors: vi.fn(),
  clearErrors: vi.fn(),
  isValid: vi.fn(),
};

// Mock событий
export const mockEventBus = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
};

// Helper функции для тестов
export const mockHelpers = {
  createMockProduct: (overrides = {}) => ({
    ...mockProducts[0],
    ...overrides,
  }),

  createMockUser: (overrides = {}) => ({
    ...mockUser,
    ...overrides,
  }),

  createMockCart: (items = []) => ({
    ...mockCart,
    items,
    itemCount: items.length,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }),

  setupApiMocks: () => {
    mockApiService.get.mockImplementation(url => {
      if (url.includes('/products')) {
        return Promise.resolve({ data: mockProducts });
      }
      if (url.includes('/user')) {
        return Promise.resolve({ data: mockUser });
      }
      return Promise.resolve({ data: null });
    });

    mockApiService.post.mockImplementation(() => {
      return Promise.resolve({ data: { success: true } });
    });
  },

  setupLocalStorageMocks: () => {
    const storage = new Map();
    mockLocalStorage.getItem.mockImplementation(key => storage.get(key) || null);
    mockLocalStorage.setItem.mockImplementation((key, value) => storage.set(key, value));
    mockLocalStorage.removeItem.mockImplementation(key => storage.delete(key));
    mockLocalStorage.clear.mockImplementation(() => storage.clear());
  },

  setupDOMMocks: () => {
    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockWebGLContext);

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  },
};

// Функция сброса всех моков
export const resetAllMocks = () => {
  vi.clearAllMocks();
  mockCart.items = [];
  mockCart.total = 0;
  mockCart.itemCount = 0;
  mockUser.isAuthenticated = false;
};
