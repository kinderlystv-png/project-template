# EAP Debugger

Модуль отладки для EAP (Enterprise Analysis Platform) - инструмент для визуализации зарегистрированных компонентов анализа в удобном HTML формате с **автоматическим открытием браузера**.

## 🎯 Назначение

EAP Debugger предназначен для отладки и мониторинга состояния AnalysisOrchestrator, предоставляя:
- HTML-отчет со списком всех зарегистрированных компонентов
- **Автоматическое открытие браузера** при срабатывании анализатора
- Автоматическое обновление каждые 5 секунд
- **Удобные npm команды** для быстрого запуска

## 🚀 Быстрый запуск

### Команды npm (рекомендуется)
```bash
# Основная команда запуска
npm run debug:eap

# Альтернативная команда
npm run debug:eap:runner
```

### Прямые команды
```bash
# TypeScript запуск
npx tsx run-simple-debugger.ts

# ES модуль запуск
node debug-eap.mjs
```
- Статистику по типам компонентов (чекеры, модули)
- Детальную информацию о каждом компоненте
- Интеграцию с существующими AnalysisOrchestrator

## 📁 Структура проекта

```
eap-debugger/
├── src/
│   ├── models/
│   │   └── Component.ts          # Интерфейсы для компонентов
│   ├── core/
│   │   ├── ComponentRegistry.ts  # Извлечение данных из оркестратора
│   │   └── HtmlGenerator.ts      # Генерация HTML отчетов
│   ├── integration/
│   │   └── OrchestratorIntegration.ts # Интеграция с оркестратором
│   ├── templates/
│   │   └── components.html       # HTML шаблон с CSS стилями
│   ├── EapDebugger.ts           # Основной класс
│   └── index.ts                 # Главный экспорт
├── examples/
│   └── orchestrator-integration.ts # Примеры интеграции
├── demo/
│   ├── integration-demo.ts       # Демонстрация хуков
│   └── realistic-integration.ts  # Реалистичная демонстрация
└── tests/
    ├── debugger.test.ts         # Модульные тесты
    ├── integration.test.ts      # Интеграционные тесты
    └── browser-open.test.ts     # Тесты автооткрытия браузера
```

## 🚀 Быстрая интеграция с оркестратором

### Автоматическое открытие браузера при анализе

```typescript
import { addDebuggerToOrchestrator } from './eap-debugger/examples/orchestrator-integration.js';

// Добавляем к существующему оркестратору
addDebuggerToOrchestrator(orchestrator, true); // true = автооткрытие браузера

// Теперь при вызове orchestrator.runAnalysis()
// автоматически откроется браузер с отладочным HTML!
const results = await orchestrator.runAnalysis();
```

### Быстрая генерация с автооткрытием

```typescript
import { EapDebugger } from './eap-debugger/src/EapDebugger.js';

// Быстрая генерация с автоматическим открытием браузера
const html = await EapDebugger.quickGenerateAndOpen(orchestrator, 'debug-report.html');
```

## 🔧 Варианты использования

### 1. Базовое использование

```typescript
import { EapDebugger } from './eap-debugger/src/EapDebugger.js';

// Быстрая генерация отчета
const html = await EapDebugger.quickGenerate(orchestrator, 'debug-report.html');

// Или создание экземпляра для расширенного использования
const debugger = new EapDebugger();
await debugger.generateComponentsHtml(orchestrator, 'components.html');
```

### 2. Автоматическое обновление

```typescript
const debugger = new EapDebugger();

// Запуск автоматического обновления каждые 5 секунд
await debugger.startAutoRefresh(orchestrator, 'live-debug.html');

// Остановка автообновления
debugger.stopAutoRefresh();
```

### 3. Интеграция с автооткрытием браузера

```typescript
const debugger = new EapDebugger();

// Генерация HTML с автоматическим открытием браузера
await debugger.generateComponentsHtmlWithAutoOpen(
  orchestrator,
  'debug.html',
  true // автооткрытие браузера
);
```

### 4. Продвинутая интеграция через хуки

```typescript
import { OrchestratorIntegration } from './eap-debugger/src/integration/OrchestratorIntegration.js';

// Настройка интеграции
const hooks = OrchestratorIntegration.setupQuickIntegration(
  true, // автооткрытие браузера
  './live-debug.html' // путь к HTML
);

// Интеграция хуков в ваш оркестратор
const originalRunAnalysis = orchestrator.runAnalysis.bind(orchestrator);
orchestrator.runAnalysis = async function(...args) {
  await hooks.onAnalysisStart?.(this);
  const result = await originalRunAnalysis(...args);
  await hooks.onAnalysisComplete?.(this, result);
  return result;
};
```

## 🔧 API Reference

### EapDebugger

Основной класс для работы с отладчиком.

#### Методы

- `generateComponentsHtml(orchestrator, outputPath?)` - Генерирует HTML отчет
- `generateComponentsHtmlWithAutoOpen(orchestrator, outputPath?, openInBrowser?)` - Генерирует HTML с автооткрытием браузера
- `startAutoRefresh(orchestrator, outputPath, interval?)` - Запускает автообновление
- `stopAutoRefresh()` - Останавливает автообновление
- `getComponentStats()` - Возвращает статистику компонентов
- `getState()` - Возвращает текущее состояние отладчика
- `static quickGenerate(orchestrator, outputPath?, openInBrowser?)` - Быстрая генерация отчета
- `static quickGenerateAndOpen(orchestrator, outputPath?)` - Быстрая генерация с автооткрытием браузера

### OrchestratorIntegration

Класс для интеграции с AnalysisOrchestrator через систему хуков.

#### Методы

- `static getInstance()` - Получение singleton экземпляра
- `setAutoOpenBrowser(autoOpen)` - Включение/выключение автооткрытия браузера
- `setDebugHtmlPath(path)` - Установка пути для HTML файла
- `getHooks()` - Получение объекта хуков для интеграции
- `static setupQuickIntegration(autoOpenBrowser?, htmlPath?)` - Быстрая настройка

### ComponentRegistry

Класс для извлечения данных из AnalysisOrchestrator.

#### Методы

- `getRegisteredComponents(orchestrator)` - Возвращает данные всех компонентов

### HtmlGenerator

Класс для генерации HTML отчетов.

#### Методы

- `generateHtml(registration)` - Генерирует HTML из данных
- `saveHtml(html, outputPath)` - Сохраняет HTML в файл

## 🧪 Тестирование и демонстрации

### Запуск тестов

```bash
# Модульные тесты
cd eap-debugger
npx tsx tests/debugger.test.ts

# Интеграционные тесты
npx tsx tests/integration.test.ts

# Тест автооткрытия браузера
npx tsx tests/browser-open.test.ts
```

### Демонстрации

```bash
# Реалистичная интеграция с автооткрытием браузера
npx tsx demo/realistic-integration.ts

# Демонстрация хуков интеграции
npx tsx demo/integration-demo.ts
```

### Результаты тестов

Тесты создают следующие файлы:
- `eap-debugger-test-output.html` - результат модульных тестов
- `eap-auto-browser-test.html` - результат теста автооткрытия
- `eap-orchestrator-debug.html` - результат интеграции с оркестратором
- `eap-before-integration.html` - снимок состояния до интеграции

## 🎨 HTML Отчет

Сгенерированный HTML отчет включает:

### Элементы интерфейса
- **Заголовок** с названием и описанием
- **Статистические карточки** с количеством компонентов
- **Списки компонентов** разделенные по типам
- **Индикатор автообновления** в правом верхнем углу

### Информация о компонентах
- ID и название компонента
- Тип (checker/module) с иконкой
- Статус активности
- Время регистрации
- Путь к файлу (если есть)
- Метаданные в JSON формате

### Стили
- Адаптивный дизайн с CSS Grid
- Градиентные фоны и тени
- Анимация для индикатора обновления
- Цветовое кодирование типов компонентов

## 🔄 Автообновление

HTML страница автоматически перезагружается каждые 5 секунд для отображения актуальных данных:

```javascript
// Встроенный JavaScript в шаблоне
setTimeout(() => {
    location.reload();
}, 5000);
```

## 📋 Требования

- Node.js с поддержкой ES Modules
- TypeScript
- AnalysisOrchestrator с Map структурами checkers и modules

## 🔧 Конфигурация

### Изменение интервала обновления

```typescript
// Кастомный интервал (10 секунд)
await debugger.startAutoRefresh(orchestrator, 'debug.html', 10000);
```

### Кастомизация шаблона

Отредактируйте файл `src/templates/components.html` для изменения внешнего вида.

## 🐛 Отладка

### Логирование

EapDebugger использует встроенный Logger класс:

```typescript
// Логи видны в консоли при работе
🔍 EAP Debugger: HTML сохранен в debug-report.html
```

### Типичные проблемы

1. **Ошибка загрузки шаблона**: Проверьте структуру папок
2. **Ошибка сохранения**: Проверьте права на запись в директорию
3. **Пустой отчет**: Убедитесь, что orchestrator содержит компоненты

## 📈 Расширение функциональности

### Добавление новых полей

1. Обновите интерфейс `DebuggerComponent` в `models/Component.ts`
2. Модифицируйте `generateComponentCard` в `HtmlGenerator.ts`
3. Обновите CSS стили в `templates/components.html`

### Добавление фильтрации

Можно расширить HtmlGenerator для поддержки фильтров:

```typescript
// Пример фильтрации по типу
const activeCheckers = components.filter(c =>
    c.category === 'checker' && c.isActive
);
```

## 📄 Лицензия

Этот модуль является частью проекта EAP и использует ту же лицензию.

## 🤝 Вклад в разработку

При внесении изменений:
1. Добавьте тесты для новой функциональности
2. Обновите документацию
3. Проверьте работу автообновления
4. Убедитесь в совместимости с существующими оркестраторами
