# ЭТАЛОН СИСТЕМЫ ТЕСТИРОВАНИЯ ПРОЕКТОВ

## 1. ФИЛОСОФИЯ И ПРИНЦИПЫ

### 1.1. Основополагающие принципы

- **Тестируем поведение, а не реализацию** — тесты должны проверять, что делает компонент, а не как он это делает
- **Изоляция тестов** — тесты не должны зависеть друг от друга
- **Стабильность селекторов** — использование `data-testid` вместо текста или CSS-селекторов
- **Максимальная читаемость** — тесты должны быть понятны без комментариев
- **Фабрики данных** — генерация тестовых данных через фабрики
- **Централизованные моки** — единый подход к мокированию сервисов

### 1.2. Целевые метрики

- **Покрытие кода:** минимум 80% для бизнес-логики
- **Время выполнения:** до 2 минут для всего набора тестов
- **Стабильность:** 99.9% тестов должны проходить стабильно

## 2. СТРУКТУРА ТЕСТОВОЙ ИНФРАСТРУКТУРЫ

### 2.1. Файловая структура

```
tests/
├── utils/              # Утилиты для тестирования
│   ├── test-utils.tsx  # Основные утилиты (render, waitFor)
│   └── TestWrapper.tsx # Обертка с провайдерами
├── fixtures/           # Фабрики данных
│   ├── factories.ts    # Основные фабрики (event, user)
│   └── mocks.ts        # Моки для запросов
├── mocks/              # Моки сервисов
│   ├── services.ts     # Централизованные моки API
│   └── nextjs.ts       # Моки Next.js
├── pages/              # Page Object Model
│   └── CreateEventPage.ts  # POM для сложных компонентов
├── components/         # Тесты компонентов
├── api/                # Тесты API
├── e2e/                # E2E тесты
└── setup.ts            # Глобальная настройка тестов
```

### 2.2. Константы для селекторов

```typescript
// src/constants/test-ids.ts
export const TEST_IDS = {
  // Forms
  CREATE_EVENT_FORM: 'create-event-form',
  CREATE_EVENT_SUBMIT: 'create-event-submit',

  // Fields
  FIELD_EVENT_TITLE: 'field-event-title',
  FIELD_CLIENT_NAME: 'field-client-name',

  // Components
  PROFILE_STAGE: 'profile-stage',
  BUDGET_STAGE: 'budget-stage',

  // Common UI elements
  ERROR_MESSAGE: 'error-message',
  SUCCESS_MESSAGE: 'success-message',
  LOADING_INDICATOR: 'loading-indicator',

  // Tables and lists
  TABLE_ROW: 'table-row',
  TABLE_CELL_PRICE: 'table-cell-price',

  // Navigation
  NAV_CLIENT_LOGIN: 'nav-client-login',
  NAV_ADMIN_LOGIN: 'nav-admin-login',
} as const;

export type TestId = (typeof TEST_IDS)[keyof typeof TEST_IDS];
```

## 3. ТЕСТОВЫЕ УТИЛИТЫ

### 3.1. Базовые утилиты рендеринга

```typescript
// tests/utils/test-utils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { DebugProvider } from '@/lib/debug';
import { ThemeProvider } from '@/components/ThemeProvider';

// Универсальная обертка для всех тестов
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="light">
      <DebugProvider>
        {children}
      </DebugProvider>
    </ThemeProvider>
  );
};

// Кастомный render с провайдерами
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export всё из testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
```

### 3.2. Фабрики тестовых данных

```typescript
// tests/fixtures/factories.ts
import { faker } from '@faker-js/faker/locale/ru';
import { Event, User } from '@/types';

export const eventFactory = {
  create: (overrides = {}): Event => ({
    id: faker.string.uuid(),
    title: faker.lorem.sentence(3),
    event_date: faker.date.future().toISOString(),
    event_time: '14:00',
    client_name: faker.person.firstName(),
    client_phone: '+7999' + faker.string.numeric(7),
    child_name: faker.person.firstName(),
    child_age: faker.number.int({ min: 1, max: 18 }),
    adults_count: faker.number.int({ min: 1, max: 10 }),
    children_count: faker.number.int({ min: 1, max: 20 }),
    status: 'draft',
    created_by: 'test-user',
    last_modified_by: 'test-user',
    version: 1,
    ...overrides,
  }),

  createMany: (count: number, overrides = {}): Event[] =>
    Array.from({ length: count }, () => eventFactory.create(overrides)),
};

export const userFactory = {
  create: (overrides = {}): User => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    role: 'client',
    name: faker.person.fullName(),
    ...overrides,
  }),
};
```

### 3.3. Моки сервисов

```typescript
// tests/mocks/services.ts
import { vi } from 'vitest';
import { eventFactory, userFactory } from '../fixtures/factories';

export const createServiceMocks = () => ({
  eventsAPI: {
    createEvent: vi.fn().mockResolvedValue({
      success: true,
      data: eventFactory.create(),
    }),
    updateEvent: vi.fn().mockResolvedValue({ success: true }),
    deleteEvent: vi.fn().mockResolvedValue({ success: true }),
    getEvent: vi.fn().mockResolvedValue({
      success: true,
      data: eventFactory.create(),
    }),
    listEvents: vi.fn().mockResolvedValue({
      success: true,
      data: eventFactory.createMany(5),
    }),
  },

  whatsappService: {
    sendInvitation: vi.fn().mockResolvedValue({ success: true }),
    createInvitation: vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'inv-123', url: 'https://test.com/inv' },
    }),
  },

  authService: {
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn().mockResolvedValue({ success: true }),
    getCurrentUser: vi.fn().mockResolvedValue({
      success: true,
      data: userFactory.create(),
    }),
  },
});

// Автоматическое мокирование при импорте
vi.mock('@/api/events', () => createServiceMocks().eventsAPI);
vi.mock('@/lib/whatsapp', () => createServiceMocks().whatsappService);
vi.mock('@/services/auth', () => createServiceMocks().authService);
```

## 4. ПАТТЕРНЫ НАПИСАНИЯ ТЕСТОВ

### 4.1. Page Object Model для сложных компонентов

```typescript
// tests/pages/CreateEventFormPage.ts
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TEST_IDS } from '@/constants/test-ids';
import { Event } from '@/types';

export class CreateEventFormPage {
  constructor(private screen: typeof screen) {}

  get form() {
    return this.screen.getByTestId(TEST_IDS.CREATE_EVENT_FORM);
  }

  get titleInput() {
    return this.screen.getByTestId(TEST_IDS.FIELD_EVENT_TITLE);
  }

  get submitButton() {
    return this.screen.getByTestId(TEST_IDS.CREATE_EVENT_SUBMIT);
  }

  get errorMessage() {
    return this.screen.queryByTestId(TEST_IDS.ERROR_MESSAGE);
  }

  async fillTitle(title: string) {
    const user = userEvent.setup();
    await user.type(this.titleInput, title);
  }

  async submit() {
    const user = userEvent.setup();
    await user.click(this.submitButton);
  }

  async fillAndSubmit(data: Partial<Event>) {
    const user = userEvent.setup();
    if (data.title) await this.fillTitle(data.title);
    // ... заполнение остальных полей
    await this.submit();
  }
}

// Использование в тесте
it('should create event successfully', async () => {
  render(<CreateEventForm />);
  const page = new CreateEventFormPage(screen);

  await page.fillAndSubmit({
    title: 'Новый праздник',
    event_date: '2024-12-25'
  });

  expect(mocks.eventsAPI.createEvent).toHaveBeenCalled();
});
```

### 4.2. Структура отдельного теста

```typescript
// tests/components/ProfileStage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/tests/utils/test-utils';
import userEvent from '@testing-library/user-event';
import ProfileStage from '@/components/epupk/stages/ProfileStage';
import { eventFactory } from '@/tests/fixtures/factories';
import { createServiceMocks } from '@/tests/mocks/services';
import { TEST_IDS } from '@/constants/test-ids';

// Мокируем внешние сервисы
vi.mock('@/services/EventProfileService', () => ({
  EventProfileService: {
    updateEventProfileField: vi.fn().mockResolvedValue({ success: true })
  }
}));

describe('ProfileStage', () => {
  // Создаем мокированные данные
  const mocks = createServiceMocks();
  const mockEvent = eventFactory.create();

  const defaultProps = {
    stageKey: 'profile',
    eventData: mockEvent,
    stageData: {},
    userRole: 'client',
    confirmed: false,
    locked: false,
    onUpdate: vi.fn(),
    onConfirm: vi.fn()
  };

  // Сбрасываем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Группируем тесты по функциональности
  describe('Display', () => {
    it('should render profile stage with event data', () => {
      render(<ProfileStage {...defaultProps} />);

      // Используем data-testid вместо текста
      const stage = screen.getByTestId(TEST_IDS.PROFILE_STAGE);
      expect(stage).toBeInTheDocument();

      // Проверяем наличие полей через test-id
      expect(screen.getByTestId(TEST_IDS.FIELD_CHILD_NAME))
        .toHaveTextContent(mockEvent.child_name);
      expect(screen.getByTestId(TEST_IDS.FIELD_CHILD_AGE))
        .toHaveTextContent(String(mockEvent.child_age));
    });

    it('should show placeholders for empty fields', () => {
      const emptyEvent = eventFactory.create({
        child_name: '',
        child_age: null
      });

      render(<ProfileStage {...defaultProps} eventData={emptyEvent} />);

      expect(screen.getByTestId(TEST_IDS.FIELD_CHILD_NAME))
        .toHaveTextContent('Имя ребенка');
      expect(screen.getByTestId(TEST_IDS.FIELD_CHILD_AGE))
        .toHaveTextContent('лет');
    });
  });

  describe('Editing', () => {
    it('should save changes on Enter key', async () => {
      const user = userEvent.setup();
      render(<ProfileStage {...defaultProps} />);

      // Кликаем на поле
      const nameField = screen.getByTestId(TEST_IDS.FIELD_CHILD_NAME);
      await user.click(nameField);

      // Вводим новое значение
      const input = screen.getByTestId(TEST_IDS.INLINE_INPUT);
      await user.clear(input);
      await user.type(input, 'Новое имя');
      await user.keyboard('{Enter}');

      // Проверяем вызов API
      await waitFor(() => {
        expect(defaultProps.onUpdate).toHaveBeenCalledWith({
          child_name: 'Новое имя'
        });
      });
    });

    it('should handle numeric fields correctly', async () => {
      const user = userEvent.setup();
      render(<ProfileStage {...defaultProps} />);

      // Кликаем на поле возраста
      const ageField = screen.getByTestId(TEST_IDS.FIELD_CHILD_AGE);
      await user.click(ageField);

      // Вводим новое значение
      const input = screen.getByTestId(TEST_IDS.INLINE_INPUT);
      await user.clear(input);
      await user.type(input, '10');
      await user.keyboard('{Enter}');

      // Проверяем вызов API
      await waitFor(() => {
        expect(defaultProps.onUpdate).toHaveBeenCalledWith({
          child_age: 10
        });
      });
    });
  });
});
```

## 5. ИНТЕГРАЦИЯ С КОМПОНЕНТАМИ

### 5.1. Добавление data-testid в компоненты

```tsx
// src/components/epupk/stages/ProfileStage.tsx
import { TEST_IDS } from '@/constants/test-ids';

export default function ProfileStage({ eventData, stageData, locked }) {
  return (
    <div className="profile-stage" data-testid={TEST_IDS.PROFILE_STAGE}>
      <div className="stage-header">
        <h2>Профиль праздника</h2>
      </div>

      <div className="child-info" data-testid={TEST_IDS.PROFILE_CHILD_INFO}>
        <InlineInput
          value={eventData.child_name}
          placeholder="Имя ребенка"
          onSave={value => handleFieldSave('child_name', value)}
          disabled={locked}
          data-testid={TEST_IDS.FIELD_CHILD_NAME}
          input-testid={TEST_IDS.INPUT_CHILD_NAME}
        />

        <InlineInput
          value={eventData.child_age?.toString() || ''}
          placeholder="лет"
          onSave={value => handleFieldSave('child_age', parseInt(value))}
          disabled={locked}
          data-testid={TEST_IDS.FIELD_CHILD_AGE}
          input-testid={TEST_IDS.INPUT_CHILD_AGE}
        />
      </div>
    </div>
  );
}
```

### 5.2. Общие компоненты для форм

```tsx
// src/components/ui/Input.tsx
import { TEST_IDS } from '@/constants/test-ids';

interface InputProps {
  id?: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  testId?: string;
}

export function Input({
  id,
  name,
  label,
  value,
  onChange,
  error,
  testId = `field-${name}`,
}: InputProps) {
  return (
    <div className="form-field">
      <label htmlFor={id || name}>{label}</label>
      <input id={id || name} name={name} value={value} onChange={onChange} data-testid={testId} />
      {error && (
        <div className="error" data-testid={`${testId}-error`}>
          {error}
        </div>
      )}
    </div>
  );
}
```

## 6. КОНФИГУРАЦИЯ ТЕСТОВ

### 6.1. Vitest конфигурация

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '*.config.*', '**/types.ts', '**/constants.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
```

### 6.2. Глобальная настройка тестов

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Очистка после каждого теста
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Глобальные моки
beforeAll(() => {
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});
```

## 7. РЕШЕНИЕ ТИПИЧНЫХ ПРОБЛЕМ

### 7.1. Асинхронные операции и debounce

```typescript
// Проблема: debounced функция не вызывается сразу в тесте
it('should filter events when search term changes', async () => {
  render(<EventFilters onFilterChange={mockOnFilterChange} />);

  // Получаем поле поиска
  const searchInput = screen.getByTestId(TEST_IDS.FILTER_SEARCH);

  // Вводим значение
  await userEvent.type(searchInput, 'тест');

  // Используем waitFor для ожидания debounced вызова
  await waitFor(() => {
    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      search: 'тест'
    }));
  }, { timeout: 1000 }); // Больший timeout для debounce
});
```

### 7.2. Проблема с портал-компонентами

```typescript
// Проблема: модальное окно в портале не находится в тесте
it('should open modal and show content', async () => {
  render(<ModalExample />);

  // Кликаем на кнопку открытия модального окна
  await userEvent.click(screen.getByTestId(TEST_IDS.OPEN_MODAL_BUTTON));

  // Получаем модальное окно через document.body
  // Важно: в render не указываем { container: document.body }
  const modal = await screen.findByTestId(TEST_IDS.MODAL_CONTAINER);

  expect(modal).toBeInTheDocument();
  expect(modal).toHaveTextContent('Содержимое модального окна');
});
```

### 7.3. Тестирование с Next.js Router

```typescript
// Проблема: тесты падают из-за Next.js router
import { useRouter } from 'next/navigation';

// Мокируем модуль навигации
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn().mockReturnValue('/'),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}));

// В тесте настраиваем мок
beforeEach(() => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  };
  (useRouter as any).mockReturnValue(mockRouter);
});
```

### 7.4. Тестирование с изображениями

```typescript
// Проблема: тесты падают из-за Next.js Image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img
      src={props.src}
      alt={props.alt}
      width={props.width}
      height={props.height}
      data-testid={props['data-testid']}
    />
  }
}));
```

## 8. CONTINUOUS INTEGRATION

### 8.1. Pre-commit хуки

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Запуск только affected тестов
npm run test:affected
```

### 8.2. GitHub Actions настройка

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run coverage
        run: npm run coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: coverage/
```

## 9. ЛУЧШИЕ ПРАКТИКИ И РЕКОМЕНДАЦИИ

### 9.1. Группировка тестов

```typescript
// Плохо ❌
it('test 1', () => {...})
it('test 2', () => {...})
it('test 3', () => {...})

// Хорошо ✅
describe('Feature A', () => {
  it('should do X', () => {...})
  it('should handle Y', () => {...})
})

describe('Feature B', () => {
  it('should process Z', () => {...})
})
```

### 9.2. Эффективное описание тестов

```typescript
// Плохо ❌
it('works', () => {...})

// Хорошо ✅
it('should update counter when button is clicked', () => {...})
```

### 9.3. Избегайте вложенных describe

```typescript
// Плохо ❌
describe('Component', () => {
  describe('when prop is true', () => {
    describe('and user clicks', () => {
      it('should do something', () => {...})
    })
  })
})

// Хорошо ✅
describe('Component', () => {
  it('should do something when prop is true and user clicks', () => {...})
})
```

### 9.4. Использование before/after хуков

```typescript
// Лучшие практики для хуков
describe('Component with complex setup', () => {
  // Общие переменные
  let mockData;
  let mockService;

  // Настройка перед всеми тестами (только если нужно)
  beforeAll(() => {
    // Тяжелая настройка, выполняемая один раз
  });

  // Настройка перед каждым тестом
  beforeEach(() => {
    // Создание свежих данных для каждого теста
    mockData = eventFactory.create();
    mockService = createServiceMocks().eventsAPI;
    vi.clearAllMocks();
  });

  it('test 1', () => {
    // Тест с чистыми данными
  });

  it('test 2', () => {
    // Другой тест с чистыми данными
  });
});
```

## 10. МИГРАЦИЯ СУЩЕСТВУЮЩИХ ТЕСТОВ

### 10.1. Пошаговая стратегия миграции

1. **Добавьте data-testid к компоненту**
2. **Создайте дублирующий тест с новыми селекторами**
3. **Проверьте, что оба теста работают**
4. **Удалите старый тест**

### 10.2. Пример миграции

```typescript
// Шаг 1: Добавьте data-testid к компоненту
// src/components/Counter.tsx
export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div data-testid="counter-container">
      <p data-testid="counter-value">{count}</p>
      <button
        onClick={() => setCount(prev => prev + 1)}
        data-testid="counter-increment"
      >
        Increment
      </button>
    </div>
  );
}

// Шаг 2: Создайте дублирующий тест с новыми селекторами
// Старый тест (пока оставляем)
it('old-should increment counter', async () => {
  render(<Counter />);
  const button = screen.getByText('Increment');
  await userEvent.click(button);
  expect(screen.getByText('1')).toBeInTheDocument();
});

// Новый тест с data-testid
it('should increment counter', async () => {
  render(<Counter />);
  const button = screen.getByTestId(TEST_IDS.COUNTER_INCREMENT);
  await userEvent.click(button);
  expect(screen.getByTestId(TEST_IDS.COUNTER_VALUE)).toHaveTextContent('1');
});

// Шаг 3: Удалите старый тест после проверки
```

---

## 11. ШАБЛОНЫ ДЛЯ НОВЫХ ТЕСТОВ

### 11.1. Шаблон компонентного теста

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/tests/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { TEST_IDS } from '@/constants/test-ids';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render successfully', () => {
    render(<MyComponent />);
    expect(screen.getByTestId(TEST_IDS.MY_COMPONENT)).toBeInTheDocument();
  });

  it('should respond to user interaction', async () => {
    const user = userEvent.setup();
    const onChangeMock = vi.fn();

    render(<MyComponent onChange={onChangeMock} />);

    await user.click(screen.getByTestId(TEST_IDS.MY_BUTTON));

    expect(onChangeMock).toHaveBeenCalledTimes(1);
    expect(onChangeMock).toHaveBeenCalledWith(expect.any(Object));
  });
});
```

### 11.2. Шаблон теста для хуков

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { describe, it, expect, vi } from 'vitest';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useMyHook());

    expect(result.current.value).toBe(0);
    expect(typeof result.current.increment).toBe('function');
  });

  it('should increment value', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.increment();
    });

    expect(result.current.value).toBe(1);
  });
});
```

## 12. ЗАКЛЮЧЕНИЕ

Эта эталонная система тестирования обеспечивает:

1. **Стабильность** — тесты не зависят от изменений текста UI
2. **Производительность** — быстрое выполнение, минимальные зависимости
3. **Поддерживаемость** — легкая отладка и расширение тестов
4. **Понятность** — четкая организация и документация
5. **Масштабируемость** — единый подход для любого размера проекта

Внедрение этой системы гарантирует высокое качество кода, быстрое обнаружение регрессий и уверенность при рефакторинге.

---

## КРАТКИЙ ЧЕКЛИСТ ДЛЯ AI-АССИСТЕНТА

### Проверьте в проекте:

- [ ] Использование `data-testid` в компонентах
- [ ] Фабрики данных для генерации тестовых объектов
- [ ] Централизованные константы для селекторов
- [ ] Изоляция тестов (beforeEach с vi.clearAllMocks())
- [ ] Группировка тестов по функциональности
- [ ] Использование Page Object Model для сложных компонентов
- [ ] Покрытие тестами критической бизнес-логики
- [ ] Стабильность тестов (99%+ проходимость)

### Если НЕ соответствует эталону:

1. Создайте план миграции по приоритету
2. Начните с добавления TEST_IDS констант
3. Создайте базовые фабрики данных
4. Мигрируйте по одному компоненту за раз
5. Проверяйте стабильность после каждого изменения
