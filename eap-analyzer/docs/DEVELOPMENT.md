# 🛠️ Руководство разработчика ЭАП

## Архитектура проекта

```
src/
├── analyzer.ts           # Главный анализатор
├── cli.ts               # CLI интерфейс
├── index.ts             # Точка входа модуля
├── test.ts              # Тестовый запуск
├── analyze-main.ts      # Анализ основного проекта
├── types/
│   └── index.ts         # TypeScript интерфейсы
├── checkers/
│   ├── emt.ts           # ЭМТ проверки
│   └── docker.ts        # Docker проверки
└── utils/
    └── index.ts         # Утилиты
```

## Добавление нового checker'а

### 1. Создать новый файл проверки

```typescript
// src/checkers/my-component.ts
import { CheckContext, ComponentResult } from '../types/index.js';

export class MyComponentChecker {
  static async checkComponent(context: CheckContext): Promise<ComponentResult> {
    // Ваша логика проверки
  }
}
```

### 2. Определить проверки

```typescript
private static getChecks(): Check[] {
  return [
    {
      id: 'my.check.id',
      name: 'Название проверки',
      description: 'Описание что проверяется',
      category: 'code-quality', // из CheckCategory
      score: 10,
      level: 'high',
      tags: ['typescript', 'quality']
    }
  ];
}
```

### 3. Добавить в анализатор

```typescript
// src/analyzer.ts
import { MyComponentChecker } from './checkers/my-component.js';

private getAvailableCheckers() {
  return [
    // ...existing checkers
    {
      name: 'My Component',
      checkComponent: MyComponentChecker.checkComponent.bind(MyComponentChecker)
    }
  ];
}
```

## Типы проверок

### CheckLevel

- `critical` - Критически важные
- `high` - Высокий приоритет
- `medium` - Средний приоритет
- `optional` - Опциональные

### CheckCategory

- `testing` - Тестирование
- `docker` - Контейнеризация
- `framework` - Фреймворки
- `cicd` - CI/CD
- `code-quality` - Качество кода
- `dependencies` - Зависимости
- `security` - Безопасность
- `performance` - Производительность
- `documentation` - Документация
- `structure` - Структура проекта

## Утилиты FileSystemUtils

```typescript
import { FileSystemUtils } from '../utils/index.js';

// Проверка существования файла
await FileSystemUtils.fileExists('/path/to/file');

// Чтение JSON файла
const packageJson = await FileSystemUtils.readJsonFile('package.json');

// Поиск файлов по паттерну
const testFiles = await FileSystemUtils.findFiles('**/*.test.ts', projectPath);

// Чтение текстового файла
const content = await FileSystemUtils.readTextFile('README.md');
```

## Отладка

### Запуск тестов

```bash
# Тест в папке анализатора
node dist/test.js

# Тест основного проекта
node dist/analyze-main.js
```

### Сборка с отслеживанием

```bash
npm run build:watch
```

### Логирование

Используйте `console.log` с ESLint комментариями:

```typescript
// eslint-disable-next-line no-console
console.log('Debug info:', data);
```

## Соглашения о коде

### Именование

- **Классы**: PascalCase (`EMTChecker`)
- **Методы**: camelCase (`checkComponent`)
- **Константы**: SCREAMING_SNAKE_CASE (`DEFAULT_CONFIG`)
- **ID проверок**: kebab-case (`emt.unit.tests`)

### Комментарии

```typescript
/**
 * Описание функции на русском языке
 * @param context - контекст анализа
 * @returns результат проверки компонента
 */
```

### Обработка ошибок

```typescript
try {
  // логика проверки
} catch (error) {
  passed = false;
  details = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
}
```

## Тестирование новых checker'ов

1. Создайте тестовый проект
2. Добавьте checker в анализатор
3. Запустите анализ
4. Проверьте корректность результатов
5. Добавьте unit тесты

## Публикация

### Подготовка к релизу

```bash
# Сборка
npm run build

# Проверка
npm run lint
npm run test

# Версионирование
npm version patch|minor|major
```

### NPM публикация

```bash
npm publish
```

## Поддержка

- Slack: #eap-development
- Email: dev@shinomontagka.dev
- Issues: GitHub Issues
