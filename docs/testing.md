# Testing Guide

## 🧪 Руководство по тестированию

Этот проект использует современный стек тестирования с Vitest, обеспечивающий высокую производительность и отличный developer experience.

## 🏗️ Архитектура тестирования

### Test Stack

- **Vitest**: Быстрый тест-раннер с поддержкой ES modules
- **@testing-library/svelte**: Тестирование Svelte компонентов
- **jsdom**: DOM окружение для браузерных тестов
- **Playwright**: E2E тестирование
- **MSW**: Мокирование API запросов

### Test Types

```
├── Unit Tests           # Изолированное тестирование модулей
├── Component Tests      # Тестирование UI компонентов
├── Integration Tests    # Взаимодействие между модулями
├── E2E Tests           # Сквозное тестирование
└── Performance Tests   # Тестирование производительности
```

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск тестов

```bash
# Запуск всех тестов
npm run test

# Режим watch (разработка)
npm run test:watch

# Покрытие кода
npm run test:coverage

# UI режим
npm run test:ui
```

## 📝 Написание тестов

### 1. Unit Tests

#### Структура теста

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheManager } from '$lib/cache/CacheManager';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should store and retrieve values', () => {
    // Arrange
    const key = 'test-key';
    const value = 'test-value';

    // Act
    cache.set(key, value);
    const result = cache.get(key);

    // Assert
    expect(result).toBe(value);
  });

  it('should return null for non-existent keys', () => {
    const result = cache.get('non-existent');
    expect(result).toBeNull();
  });
});
```

#### Тестирование асинхронного кода

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ApiClient } from '$lib/api/ApiClient';

describe('ApiClient', () => {
  it('should handle async requests', async () => {
    const client = new ApiClient();

    // Mock fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: 'Test' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await client.get('/users/1');

    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(mockFetch).toHaveBeenCalledWith('/users/1', expect.any(Object));
  });
});
```

### 2. Component Tests

#### Тестирование Svelte компонентов

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Button from '$lib/components/ui/Button.svelte';

describe('Button', () => {
  it('renders with correct text', () => {
    render(Button, { props: { text: 'Click me' } });

    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    let clicked = false;

    render(Button, {
      props: {
        text: 'Click me',
        onClick: () => {
          clicked = true;
        },
      },
    });

    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('applies custom classes', () => {
    render(Button, {
      props: {
        text: 'Test',
        class: 'custom-class',
      },
    });

    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
```

#### Тестирование состояния компонента

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Counter from '$lib/components/Counter.svelte';

describe('Counter', () => {
  it('increments counter on button click', async () => {
    const user = userEvent.setup();
    render(Counter, { props: { initialValue: 0 } });

    const button = screen.getByRole('button', { name: /increment/i });
    const counter = screen.getByText('0');

    await user.click(button);

    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
```

### 3. Integration Tests

#### Тестирование взаимодействия модулей

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '$lib/api/ApiClient';
import { CacheManager } from '$lib/cache/CacheManager';
import { Logger } from '$lib/logger/Logger';

describe('API with Cache Integration', () => {
  let apiClient: ApiClient;
  let cache: CacheManager;
  let logger: Logger;

  beforeEach(() => {
    cache = new CacheManager();
    logger = new Logger();
    apiClient = new ApiClient({ cache, logger });
  });

  it('should cache API responses', async () => {
    // Mock successful API response
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })
    );

    // First request - should hit API
    await apiClient.get('/test');
    expect(fetch).toHaveBeenCalledTimes(1);

    // Second request - should hit cache
    await apiClient.get('/test');
    expect(fetch).toHaveBeenCalledTimes(1); // No additional call

    // Verify cache contains the data
    expect(cache.has('/test')).toBe(true);
  });
});
```

### 4. Mock Strategies

#### API Mocking с MSW

```typescript
// tests/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ])
    );
  }),

  rest.post('/api/users', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: 3, name: 'New User' }));
  }),

  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.json({ id: Number(id), name: `User ${id}` }));
  }),
];
```

```typescript
// tests/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### Function Mocking

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Logger with mocked dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log to console in development', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const logger = new Logger({ env: 'development' });
    logger.info('Test message');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test message'));
  });
});
```

## 🎯 Custom Matchers

### Performance Matchers

```typescript
import { expect } from 'vitest';

// tests/custom-matchers.ts
expect.extend({
  toBePerformant(received: number, threshold = 100) {
    const pass = received <= threshold;
    return {
      pass,
      message: () =>
        `Expected execution time ${received}ms to be ${
          pass ? 'not ' : ''
        }less than or equal to ${threshold}ms`,
    };
  },
});

// Usage
it('should execute quickly', async () => {
  const start = Date.now();
  await performOperation();
  const duration = Date.now() - start;

  expect(duration).toBePerformant(50);
});
```

### Accessibility Matchers

```typescript
expect.extend({
  toBeAccessible(element: HTMLElement) {
    const hasAria = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
    const hasRole = element.hasAttribute('role');

    return {
      pass: hasAria && hasRole,
      message: () => 'Element should have proper ARIA attributes',
    };
  },
});
```

## 📊 Coverage Configuration

### Coverage Setup

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,js,svelte}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.{ts,js}', 'src/**/*.spec.{ts,js}', 'src/test/**/*'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

## 🚨 Testing Best Practices

### 1. Test Organization

```typescript
// ✅ Good: Descriptive test names
describe('UserService', () => {
  describe('when creating a new user', () => {
    it('should return user with generated ID', () => {});
    it('should validate email format', () => {});
    it('should hash password before saving', () => {});
  });
});

// ❌ Bad: Vague test names
describe('UserService', () => {
  it('should work', () => {});
  it('test user creation', () => {});
});
```

### 2. Test Data Management

```typescript
// ✅ Good: Use factories for test data
const createUser = (overrides = {}) => ({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  ...overrides,
});

it('should validate user email', () => {
  const user = createUser({ email: 'invalid-email' });
  expect(() => validateUser(user)).toThrow();
});

// ❌ Bad: Hardcoded test data
it('should validate user email', () => {
  const user = { id: 1, name: 'John', email: 'invalid' };
  expect(() => validateUser(user)).toThrow();
});
```

### 3. Async Testing

```typescript
// ✅ Good: Proper async handling
it('should fetch user data', async () => {
  const userData = await fetchUser(1);
  expect(userData).toEqual(expectedUser);
});

// ❌ Bad: Not awaiting promises
it('should fetch user data', () => {
  fetchUser(1).then(userData => {
    expect(userData).toEqual(expectedUser);
  });
});
```

### 4. Error Testing

```typescript
// ✅ Good: Test error conditions
it('should throw error for invalid user ID', async () => {
  await expect(fetchUser(-1)).rejects.toThrow('Invalid user ID');
});

it('should handle network errors gracefully', async () => {
  vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

  const result = await apiClient.get('/users');
  expect(result).toEqual({ error: 'Network error' });
});
```

## 🔧 Debug Tests

### Debug Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Enable debugging
    reporter: 'verbose',
    logHeapUsage: true,

    // Timeout for debugging
    testTimeout: 60000,

    // Single thread for debugging
    threads: false,
  },
});
```

### Debug Commands

```bash
# Debug specific test
npm run test -- --reporter=verbose UserService

# Run single test file
npm run test -- user.test.ts

# Debug with Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

## 📈 Performance Testing

### Benchmark Tests

```typescript
import { bench, describe } from 'vitest';

describe('Performance Tests', () => {
  bench('cache.set() performance', () => {
    const cache = new CacheManager();
    for (let i = 0; i < 1000; i++) {
      cache.set(`key-${i}`, `value-${i}`);
    }
  });

  bench('cache.get() performance', () => {
    const cache = new CacheManager();
    // Pre-populate cache
    for (let i = 0; i < 1000; i++) {
      cache.set(`key-${i}`, `value-${i}`);
    }

    // Benchmark retrieval
    for (let i = 0; i < 1000; i++) {
      cache.get(`key-${i}`);
    }
  });
});
```

## 🎨 Visual Testing

### Screenshot Testing

```typescript
import { test, expect } from '@playwright/test';

test('homepage visual test', async ({ page }) => {
  await page.goto('/');

  // Wait for content to load
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await expect(page).toHaveScreenshot('homepage.png');
});
```

## 📚 Дополнительные ресурсы

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [Playwright Documentation](https://playwright.dev/)

## 🎯 Testing Checklist

- [ ] Unit tests для всех модулей
- [ ] Component tests для UI компонентов
- [ ] Integration tests для взаимодействий
- [ ] Error handling tests
- [ ] Performance benchmarks
- [ ] Accessibility tests
- [ ] Coverage ≥ 80%
- [ ] E2E tests для критических путей
