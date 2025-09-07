# 🧪 Контур тестирования SHINOMONTAGKA

Комплексная система тестирования для платформы SHINOMONTAGKA, обеспечивающая полное покрытие всех компонентов и функциональности.

## 📁 Структура тестов

```
tests/
├── unit/                   # Модульные тесты (компоненты удалены)
├── integration/            # Интеграционные тесты
│   └── app-flow.test.ts       # Тесты пользовательских сценариев
├── e2e/                    # End-to-End тесты
│   └── main-flows.test.ts     # Основные пользовательские потоки
├── performance/            # Тесты производительности
│   └── benchmarks.test.ts     # Бенчмарки и оптимизация
├── visual/                 # Визуальные тесты
│   └── ui-components.test.ts  # Тесты UI компонентов
├── utils/                  # Утилиты для тестирования
│   ├── global-setup.ts        # Глобальная настройка
│   └── test-helpers.ts        # Вспомогательные функции
├── vitest.config.ts        # Конфигурация Vitest
├── playwright.config.ts    # Конфигурация Playwright
└── README.md              # Документация (этот файл)
```

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск всех тестов

```bash
npm run test:all
```

### Интерактивный выбор тестов

```bash
npm run test:quick
```

## 📋 Доступные команды

### Основные команды

| Команда                 | Описание                     |
| ----------------------- | ---------------------------- |
| `npm run test`          | Запуск всех тестов           |
| `npm run test:watch`    | Запуск тестов в watch режиме |
| `npm run test:ui`       | Запуск с веб-интерфейсом     |
| `npm run test:coverage` | Запуск с анализом покрытия   |

### Тесты по типам

| Команда                    | Описание                        |
| -------------------------- | ------------------------------- |
| `npm run test:unit`        | Только модульные тесты          |
| `npm run test:integration` | Только интеграционные тесты     |
| `npm run test:e2e`         | Только E2E тесты                |
| `npm run test:performance` | Только тесты производительности |
| `npm run test:visual`      | Только визуальные тесты         |

### Автоматизированные скрипты

| Команда              | Описание                          |
| -------------------- | --------------------------------- |
| `npm run test:all`   | Полный набор тестов с отчетностью |
| `npm run test:quick` | Интерактивный выбор тестов        |
| `npm run test:help`  | Справка по тестированию           |

## 🎯 Типы тестов

### 1. Модульные тесты (Unit Tests)

**Цель**: Проверка отдельных компонентов в изоляции

- ✅ Калькулятор цен и параметров
- ✅ Карточки товаров
- ✅ 3D конструктор
- ✅ Утилиты и хелперы

**Пример запуска**:

```bash
npm run test:unit
# или через PowerShell
pwsh ./scripts/test-runner.ps1 --type unit
```

### 2. Интеграционные тесты (Integration Tests)

**Цель**: Проверка взаимодействия между компонентами

- ✅ Потоки аутентификации
- ✅ Управление корзиной
- ✅ Поиск и фильтрация
- ✅ Интеграция с API

**Пример запуска**:

```bash
npm run test:integration
```

### 3. E2E тесты (End-to-End Tests)

**Цель**: Проверка полных пользовательских сценариев

- ✅ Процесс заказа от выбора до оплаты
- ✅ Регистрация и авторизация
- ✅ Создание кастомных изделий
- ✅ Админ-панель

**Пример запуска**:

```bash
npm run test:e2e
```

### 4. Тесты производительности (Performance Tests)

**Цель**: Проверка быстродействия и оптимизации

- ⚡ Скорость рендеринга компонентов
- ⚡ Производительность калькуляторов
- ⚡ Обработка больших данных
- ⚡ Память и утечки

**Пример запуска**:

```bash
npm run test:performance
```

### 5. Визуальные тесты (Visual Tests)

**Цель**: Проверка UI и доступности

- 🎨 Цветовые контрасты
- 🎨 Отзывчивость дизайна
- 🎨 Позиционирование элементов
- ♿ Accessibility (a11y)

**Пример запуска**:

```bash
npm run test:visual
```

## 🔧 Конфигурация

### Vitest Configuration

Основная конфигурация в `tests/vitest.config.ts`:

- Покрытие кода: 80% минимум
- Параллельное выполнение
- Отчеты в HTML, JSON, JUnit
- Интеграция с TypeScript

### Playwright Configuration

E2E тестирование в `tests/playwright.config.ts`:

- Мультибраузерность (Chrome, Firefox, Safari)
- Различные разрешения экрана
- Скриншоты при ошибках
- Видеозапись критических тестов

### Пороги покрытия

```typescript
coverage: {
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80
}
```

## 📊 Отчетность

### HTML отчеты

После выполнения тестов отчеты доступны в:

- `./coverage/` - Покрытие кода
- `./test-results/` - Результаты E2E тестов
- `./reports/` - Общие отчеты

### Continuous Integration

Интеграция с GitHub Actions:

- Автоматический запуск при Push/PR
- Проверка покрытия кода
- Уведомления о неуспешных тестах
- Кэширование зависимостей

## 🛠 Разработка тестов

### Создание нового теста

1. **Модульный тест**:

```typescript
// tests/unit/my-component.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MyComponent from '$lib/components/MyComponent.svelte';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(MyComponent, { props: { title: 'Test' } });
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

2. **Интеграционный тест**:

```typescript
// tests/integration/my-flow.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestEnvironment } from '../utils/test-helpers';

describe('My Flow Integration', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  it('should complete user flow', async () => {
    // Тест интеграции
  });
});
```

### Best Practices

1. **Именование**: Используйте описательные имена
2. **Изоляция**: Каждый тест должен быть независимым
3. **Моки**: Мокайте внешние зависимости
4. **Данные**: Используйте фикстуры для тестовых данных
5. **Async**: Правильно обрабатывайте асинхронные операции

## 🐛 Отладка тестов

### Дебаг режим

```bash
# С остановкой на ошибках
npm run test:watch

# С веб-интерфейсом
npm run test:ui

# С подробным выводом
npx vitest run --reporter=verbose
```

### Логирование

```typescript
import { vi } from 'vitest';

// Мокирование консоли
const consoleSpy = vi.spyOn(console, 'log');
expect(consoleSpy).toHaveBeenCalledWith('Expected message');
```

## 📈 Метрики качества

### Цели покрытия

- **Критические компоненты**: 95%+
- **Основная функциональность**: 85%+
- **Вспомогательные утилиты**: 80%+
- **Общее покрытие**: 80%+

### KPI тестирования

- Время выполнения всех тестов: < 5 минут
- Стабильность E2E тестов: > 95%
- Скорость обнаружения багов: < 1 день
- Покрытие критических путей: 100%

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:e2e
```

### Pre-commit hooks

```bash
# Установка husky
npm install --save-dev husky
npx husky install

# Добавление хука
npx husky add .husky/pre-commit "npm run test:quick"
```

## 📚 Ресурсы

### Документация

- [Vitest](https://vitest.dev/) - Основной тестовый фреймворк
- [Testing Library](https://testing-library.com/docs/svelte-testing-library/intro/) - Утилиты для тестирования Svelte
- [Playwright](https://playwright.dev/) - E2E тестирование
- [Jest DOM](https://github.com/testing-library/jest-dom) - DOM матчеры

### Полезные команды

```bash
# Обновление снапшотов
npx vitest run --update-snapshots

# Профилирование тестов
npx vitest run --reporter=verbose --pool=forks

# Анализ покрытия
npx vitest run --coverage --reporter=html
```

---

## 🎉 Заключение

Контур тестирования SHINOMONTAGKA обеспечивает:

- **Полное покрытие** всех типов тестирования
- **Автоматизацию** процессов тестирования
- **Быстрое выполнение** с параллельностью
- **Подробную отчетность** и метрики
- **Простоту использования** через скрипты
- **Интеграцию с CI/CD** для непрерывного контроля качества

Используйте `npm run test:help` для получения дополнительной информации о доступных командах.
