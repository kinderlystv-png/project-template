# Анализатор Структуры Проекта для ЭАП

Продвинутый модуль анализа структуры проектов с самообучающейся системой и генерацией дорожных карт рефакторинга.

## 🎯 Основные возможности

### ✅ Полный анализ структуры
- **Базовый анализ**: Метрики файлов, директорий, размеров
- **Продвинутый анализ**: Сложность, дублирование, техдолг
- **Самообучающаяся система**: Адаптивные пороги на основе паттернов

### 📋 Генерация дорожных карт
- **Приоритизация задач**: Высокая/Средняя/Низкая важность
- **Оценка трудозатрат**: Детальный расчет времени в часах
- **Фазовое планирование**: 0-2 нед. / 2-4 нед. / 4-8 нед.
- **ROI анализ**: Расчет рентабельности рефакторинга

### � Комплексная оценка
- **Балльная система**: 0-100 баллов с буквенными оценками
- **Вердикт**: Полное заключение с рекомендациями
- **План действий**: Конкретные следующие шаги
- **Мониторинг**: Критерии успеха и метрики отслеживания

## 🚀 Быстрый старт

### Базовое использование

```javascript
const StructureAnalyzer = require('./index.js');

const analyzer = new StructureAnalyzer();

// Простой анализ
const results = await analyzer.analyze('./my-project');
console.log('Оценка:', results.summary.score);

// Полный отчет с дорожной картой
const fullReport = await analyzer.generateFullReport('./my-project');
console.log('Дорожная карта:', fullReport.roadmap.content);
```

### Интеграция с ЭАП

```javascript
const { EAPStructureIntegration } = require('./integration-example.js');

const integration = new EAPStructureIntegration();

// Полный анализ с сохранением отчета
const report = await integration.analyzeProject(
  './my-project',
  './reports/analysis.json'
);

console.log(`Оценка: ${report.analysis.grade}`);
console.log(`ROI: ${report.roadmap.roi.roi}%`);
```

// Создание экземпляра анализатора
const analyzer = new StructureAnalyzer({
  enableLearning: true,
  enableAdvancedAnalysis: true,
  outputFormat: 'json'
});

// Полный анализ проекта
const results = await analyzer.analyzeProjectStructure('/path/to/project');

// Быстрая проверка
const quickCheck = await analyzer.quickStructureCheck('/path/to/project');

// Экспорт результатов
await analyzer.exportResults(results, './reports', 'html');
```

### Статические функции для ЭАП

```javascript
const {
  analyzeProjectStructure,
  quickStructureCheck,
  getModuleInfo
} = require('./src/modules/structure-analyzer');

// Интеграция с ЭАП
const structureResults = await analyzeProjectStructure(projectPath, {
  enableAdvanced: true,
  enableLearning: true
});

// Информация о модуле
const moduleInfo = getModuleInfo();
```

## Конфигурация

Модуль настраивается через файл `config.json`:

```json
{
  "thresholds": {
    "basic": {
      "maxFileSize": 300,
      "maxComplexity": 10,
      "minMaintainability": 70,
      "maxNestingDepth": 4
    }
  },
  "analysis": {
    "types": {
      "basic": { "enabled": true },
      "advanced": { "enabled": true },
      "learning": { "enabled": true }
    }
  },
  "integration": {
    "eap": {
      "scoreContribution": 0.25
    }
  }
}
```

## Структура модуля

```
structure-analyzer/
├── index.js              # Основной модуль и API
├── basic-analyzer.js     # Базовый анализ структуры
├── advanced-analyzer.js  # Расширенный анализ качества кода
├── learning.js          # Система самообучения
├── config.json          # Конфигурация модуля
└── README.md            # Документация
```

## Выходные данные

### Структура результатов

```javascript
{
  metadata: {
    projectPath: "string",
    analysisTime: "ISO-timestamp",
    executionTime: "number (ms)",
    analyzerVersion: "string",
    eapIntegration: true,
    analysisType: "basic|full"
  },
  basic: {
    totalFiles: "number",
    totalLines: "number",
    avgFileSize: "number",
    directoryDepth: "number",
    patterns: ["array of strings"],
    // ... другие базовые метрики
  },
  advanced: {
    avgMaintainabilityIndex: "number",
    duplicationPercentage: "number",
    hotspots: ["array of hotspot objects"],
    // ... другие расширенные метрики
  },
  recommendations: [
    {
      type: "string",
      priority: "high|medium|low",
      title: "string",
      description: "string"
    }
  ],
  score: "number (0-100)",
  summary: {
    // Краткое резюме анализа
  },
  eap: {
    // Данные для интеграции с ЭАП
    moduleVersion: "string",
    contributionToScore: "number",
    structureScore: "number",
    criticalIssues: "number",
    metrics: {
      maintainability: "number|null",
      testCoverage: "number",
      codeQuality: "number",
      structuralComplexity: "number"
    },
    flags: {
      needsRefactoring: "boolean",
      wellStructured: "boolean",
      hasTests: "boolean",
      documented: "boolean"
    }
  }
}
```

## Система самообучения

### Хранение данных

Система самообучения сохраняет данные в директории `data/learning/`:

- `metrics-history.json` - История анализов проектов
- `adaptive-thresholds.json` - Адаптивные пороговые значения
- `project-patterns.json` - Обнаруженные паттерны проектов

### Адаптация порогов

Система автоматически корректирует пороговые значения на основе:
- Статистики проанализированных проектов
- Распределения метрик
- Типов проектов и их особенностей

### Рекомендации

Генерируются на основе:
- Анализа схожих проектов
- Лучших практик для обнаруженных паттернов
- Статистики проблем и их решений

## Форматы экспорта

### JSON
Полная структурированная информация для программной обработки.

### HTML
Красиво оформленный отчет с графиками и интерактивными элементами.

### CSV
Табличные данные для анализа в Excel или других инструментах.

### Text
Простой текстовый отчет для консольного вывода.

## Интеграция с ЭАП

### Вклад в оценку

По умолчанию модуль вносит 25% в общий балл ЭАП. Оценка рассчитывается на основе:
- Базовых метрик структуры (60%)
- Расширенных метрик качества (40%)

### Флаги состояния

- `needsRefactoring` - Проект требует рефакторинга
- `wellStructured` - Хорошо структурированный проект
- `hasTests` - Наличие тестов
- `documented` - Наличие документации

### Критические проблемы

Количество проблем высокого приоритета, влияющих на общую оценку.

## Производительность

### Ограничения

- Максимум 10,000 файлов
- Максимальный размер файла: 50MB
- Таймаут полного анализа: 5 минут
- Таймаут быстрой проверки: 30 секунд

### Оптимизации

- Параллельная обработка файлов
- Кэширование результатов
- Исключение служебных директорий
- Интеллектуальное ограничение глубины анализа

## Поддерживаемые технологии

### Фреймворки
- React, Next.js
- Vue.js
- Angular
- Svelte/SvelteKit
- Node.js (Express, Fastify)

### Языки программирования
- JavaScript/TypeScript
- Python
- Java
- C#
- PHP
- Ruby
- Go
- Rust
- C/C++

### Паттерны архитектуры
- Монолитная архитектура
- Микросервисы
- Serverless

## Расширение и кастомизация

### Добавление новых паттернов

Отредактируйте `config.json`:

```json
{
  "patterns": {
    "frameworks": {
      "your-framework": {
        "indicators": ["dependency-name"],
        "structure": ["expected-directories"],
        "recommendations": ["best-practices"]
      }
    }
  }
}
```

### Кастомные пороги

```javascript
const analyzer = new StructureAnalyzer({
  thresholds: {
    maxFileSize: 500,
    maxComplexity: 15,
    minMaintainability: 60
  }
});
```

### Отключение функций

```javascript
const analyzer = new StructureAnalyzer({
  enableLearning: false,
  enableAdvancedAnalysis: false
});
```

## Отладка и логирование

### Уровни логирования

- `info` - Общая информация о процессе
- `debug` - Подробная информация для отладки
- `error` - Ошибки и исключения

### Конфигурация логов

```json
{
  "logging": {
    "level": "info",
    "file": "./logs/structure-analyzer.log",
    "console": true,
    "verbose": false
  }
}
```

## Примеры использования

### Анализ React проекта

```javascript
const results = await analyzeProjectStructure('./my-react-app', {
  enableAdvanced: true
});

console.log(`Обнаружены паттерны: ${results.basic.patterns.join(', ')}`);
console.log(`Общий балл: ${results.score}/100`);

// Проверка специфичных для React рекомендаций
const reactRecommendations = results.recommendations.filter(
  r => r.description.includes('React') || r.description.includes('TypeScript')
);
```

### Быстрая проверка в CI/CD

```javascript
const quickCheck = await quickStructureCheck('./project');

if (quickCheck.score < 70) {
  console.error('Структура проекта требует улучшения');
  process.exit(1);
}
```

### Экспорт для команды

```javascript
// HTML отчет для команды разработки
await exportResults(results, './reports', 'html');

// CSV для аналитики
await exportResults(results, './reports', 'csv');
```

## Часто задаваемые вопросы

### Q: Как отключить систему обучения?

A: Установите `enableLearning: false` в конфигурации или опциях анализа.

### Q: Можно ли анализировать проекты без package.json?

A: Да, модуль работает с любыми проектами, package.json используется только для обнаружения паттернов.

### Q: Как добавить поддержку нового языка программирования?

A: Добавьте расширения файлов в `config.json` в секцию `fileTypes.source.extensions`.

### Q: Влияет ли размер проекта на точность анализа?

A: Для очень больших проектов (>10k файлов) может применяться сэмплирование, но это не влияет на качество основных метрик.

## Лицензия

Часть проекта ЭАП, использует ту же лицензию что и основной проект.

## Поддержка

Для вопросов и предложений по улучшению модуля обращайтесь к команде разработки ЭАП.

---

**Structure Analyzer v1.0.0** - Создан для ЭАП v3.0+
