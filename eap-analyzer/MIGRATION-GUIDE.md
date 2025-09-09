# Миграция на унифицированную архитектуру ЭАП

## Обзор

Данный документ описывает процесс миграции существующих компонентов ЭАП на новую унифицированную архитектуру с базовыми классами и интерфейсами.

## Структура новой архитектуры

```
src/
├── core/                          # Ядро системы
│   ├── interfaces/               # Интерфейсы
│   │   ├── IAnalyzer.ts         # Базовый интерфейс анализаторов
│   │   ├── IChecker.ts          # Базовый интерфейс проверщиков
│   │   ├── IEvaluator.ts        # Базовый интерфейс оценщиков
│   │   ├── IReporter.ts         # Базовый интерфейс репортеров
│   │   └── index.ts
│   ├── base/                    # Базовые классы
│   │   ├── BaseAnalyzer.ts      # Базовый класс анализаторов
│   │   ├── BaseChecker.ts       # Базовый класс проверщиков
│   │   ├── BaseEvaluator.ts     # Базовый класс оценщиков
│   │   ├── BaseReporter.ts      # Базовый класс репортеров
│   │   └── index.ts
│   └── index.ts                 # Общий экспорт ядра
├── types/                       # Типы данных
│   ├── AnalysisCategory.ts      # Категории анализа
│   ├── SeverityLevel.ts         # Уровни серьезности
│   ├── Project.ts               # Интерфейс проекта
│   ├── CheckResult.ts           # Результаты проверок
│   └── ...
├── checkers/                    # Унифицированные проверщики
│   ├── docker/                  # Docker проверщики
│   │   ├── DockerChecker.ts     # ✅ Мигрирован
│   │   └── index.ts
│   ├── emt/                     # EMT проверщики
│   ├── security/                # Безопасность
│   ├── architecture/            # Архитектура
│   ├── quality/                 # Качество кода
│   ├── performance/             # Производительность
│   ├── documentation/           # Документация
│   └── index.ts
├── analyzers/                   # Унифицированные анализаторы
├── evaluators/                  # Унифицированные оценщики
└── reporters/                   # Унифицированные репортеры
```

## Принципы унификации

### 1. Naming Convention
- **Паттерн**: `[Domain][Type]`
- **Примеры**: `DockerChecker`, `SecurityAnalyzer`, `PerformanceEvaluator`
- **Исключения**: базовые интерфейсы с префиксом `I`

### 2. Стандартизация интерфейсов
- Все чекеры наследуют от `BaseChecker`
- Унифицированные методы: `check()`, `isApplicable()`, `getAvailableChecks()`
- Стандартные типы результатов: `CheckResult[]`

### 3. Конфигурируемость
- Поддержка конфигурации через `CheckerConfig`
- Возможность отключения отдельных проверок
- Настраиваемые пороги и веса

### 4. Обработка ошибок
- Безопасные методы: `safeCheck()`, `safeAnalyze()`
- Graceful degradation при ошибках
- Подробное логирование

## Миграция существующих компонентов

### Статус миграции

| Компонент | Старый файл | Новый файл | Статус |
|-----------|-------------|------------|--------|
| DockerChecker | `src/checkers/docker.ts` | `src/checkers/docker/DockerChecker.ts` | ✅ Завершено |
| EMTChecker | `src/checkers/emt.ts` | `src/checkers/emt/EMTChecker.ts` | 🔄 В планах |
| SecurityChecker | `src/checkers/security.checker.ts` | `src/checkers/security/SecurityChecker.ts` | 🔄 В планах |
| PerformanceChecker | `src/checkers/performance.checker.ts` | `src/checkers/performance/PerformanceChecker.ts` | 🔄 В планах |
| QualityChecker | `src/checkers/code-quality.checker.ts` | `src/checkers/quality/QualityChecker.ts` | 🔄 В планах |
| TestingChecker | `src/checkers/testing.checker.ts` | `src/checkers/testing/TestingChecker.ts` | 🔄 В планах |

### Пример миграции: DockerChecker

#### Было (старый подход):
```typescript
export class DockerChecker {
  static async checkComponent(context: CheckContext): Promise<ComponentResult> {
    // Статический метод с кастомной логикой
    const component: StandardComponent = {
      name: 'Docker Infrastructure',
      // ...
    };

    // Кастомная обработка результатов
    return {
      component,
      score,
      maxScore,
      // ...
    };
  }
}
```

#### Стало (новый подход):
```typescript
export class DockerChecker extends BaseChecker {
  constructor() {
    super(
      'DockerChecker',
      AnalysisCategory.INFRASTRUCTURE,
      'Проверка Docker инфраструктуры и контейнеризации',
      'Docker Best Practices',
      SeverityLevel.HIGH,
      '2.0.0'
    );
  }

  async check(project: Project): Promise<CheckResult[]> {
    // Унифицированная логика проверок
    const results: CheckResult[] = [];
    // ...
    return results;
  }

  getAvailableChecks(): CheckInfo[] {
    // Метаданные о доступных проверках
    return [...];
  }

  async isApplicable(project: Project): Promise<boolean> {
    // Логика применимости
    return await project.exists('Dockerfile') ||
           await project.exists('docker-compose.yml');
  }
}
```

## Преимущества новой архитектуры

### 1. Консистентность
- Единообразные интерфейсы для всех компонентов
- Стандартизированная обработка ошибок
- Унифицированные форматы результатов

### 2. Расширяемость
- Простое добавление новых типов анализа
- Модульная структура по доменам
- Переиспользование базовой функциональности

### 3. Тестируемость
- Четко определенные интерфейсы для моков
- Изолированная логика проверок
- Стандартизированные тестовые паттерны

### 4. Производительность
- Ленивая загрузка компонентов
- Возможность параллельного выполнения
- Оптимизированная обработка результатов

## Руководство по созданию новых компонентов

### Создание нового чекера

1. **Создать директорию**: `src/checkers/[domain]/`
2. **Наследоваться от BaseChecker**:
```typescript
export class MyDomainChecker extends BaseChecker {
  constructor() {
    super(
      'MyDomainChecker',           // Имя
      AnalysisCategory.CODE,       // Категория
      'Описание чекера',           // Описание
      'Standard Name',             // Стандарт
      SeverityLevel.MEDIUM,        // Серьезность
      '1.0.0'                      // Версия
    );
  }
}
```

3. **Реализовать обязательные методы**:
```typescript
async check(project: Project): Promise<CheckResult[]> {
  // Логика проверок
}

getAvailableChecks(): CheckInfo[] {
  // Метаданные проверок
}

async isApplicable(project: Project): Promise<boolean> {
  // Условия применимости
}
```

4. **Создать индексный файл**: `src/checkers/[domain]/index.ts`
5. **Добавить в общий экспорт**: `src/checkers/index.ts`
6. **Написать тесты**: `tests/checkers/[Domain]Checker.test.ts`

### Создание анализатора

```typescript
export class MyAnalyzer extends BaseAnalyzer<AnalysisData, AnalysisResult> {
  constructor() {
    super(
      'MyAnalyzer',
      AnalysisCategory.PERFORMANCE,
      'Описание анализатора',
      '1.0.0'
    );
  }

  async analyze(project: Project): Promise<AnalysisResult> {
    // Логика анализа
  }
}
```

### Создание оценщика

```typescript
export class MyEvaluator extends BaseEvaluator<InputData, Score> {
  constructor() {
    super(
      'MyEvaluator',
      AnalysisCategory.QUALITY,
      'Описание оценщика',
      'Quality Score',
      'points',
      '1.0.0',
      { thresholds: { excellent: 90, good: 70, fair: 50 } }
    );
  }

  evaluate(data: InputData): Score {
    // Логика оценки
  }
}
```

### Создание репортера

```typescript
export class MyReporter extends BaseReporter<ReportData> {
  constructor() {
    super(
      'MyReporter',
      AnalysisCategory.DOCUMENTATION,
      'Описание репортера',
      'html',
      '1.0.0'
    );
  }

  async generateReport(data: ReportData): Promise<Report> {
    // Логика создания отчета
  }
}
```

## Обратная совместимость

Для обеспечения плавной миграции:

1. **Старые компоненты остаются функциональными**
2. **Параллельное существование** старых и новых реализаций
3. **Постепенная миграция** клиентского кода
4. **Адаптеры** для интеграции с существующими системами

## План дальнейшей миграции

### Этап 1 - Базовая инфраструктура ✅
- [x] Создание базовых интерфейсов
- [x] Реализация базовых классов
- [x] Миграция DockerChecker
- [x] Создание тестов

### Этап 2 - Основные чекеры 🔄
- [ ] Миграция EMTChecker
- [ ] Миграция SecurityChecker
- [ ] Создание унифицированных тестов
- [ ] Обновление документации

### Этап 3 - Анализаторы и оценщики
- [ ] Создание основных анализаторов
- [ ] Создание оценщиков метрик
- [ ] Интеграция с существующими системами

### Этап 4 - Репортеры
- [ ] Унификация системы отчетов
- [ ] Создание шаблонов отчетов
- [ ] Интеграция с внешними системами

### Этап 5 - Оптимизация
- [ ] Рефакторинг устаревшего кода
- [ ] Оптимизация производительности
- [ ] Финальная документация

## Заключение

Новая унифицированная архитектура обеспечивает:
- **Масштабируемость**: легкое добавление новых компонентов
- **Поддерживаемость**: четкая структура и стандарты
- **Надежность**: унифицированная обработка ошибок
- **Производительность**: оптимизированные паттерны

Миграция выполняется поэтапно с сохранением обратной совместимости.
