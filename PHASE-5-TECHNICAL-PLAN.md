# 🔧 EAP Phase 5: Технический план восстановления критических компонентов

**Базовый контекст**: Phase 4.2 завершена успешно (TestingChecker 86% на реальном проекте)
**Архитектура**: ProcessIsolatedAnalyzer + адаптеры → готова
**Цель**: Восстановить SecurityChecker и создать PerformanceChecker

---

## 📋 ФАЗА 5.1: SecurityChecker Recovery (7 дней)

### 🎯 Цель фазы
Восстановить работоспособность SecurityChecker с интеграцией в ProcessIsolatedAnalyzer

### 📅 Задача 5.1.1: Диагностика и базовая структура (2 дня)

**Техническая задача**: Исследовать поврежденный SecurityChecker и создать MVP
- ✅ Проанализировать существующий код `SecurityChecker.ts` (223 строки)
- ❌ Создать отсутствующие файлы: `DependenciesSecurityChecker.ts`, `CodeSecurityChecker.ts`, `ConfigSecurityChecker.ts`
- ✅ Адаптировать под архитектуру `ProcessIsolatedAnalyzer` (паттерн от TestingChecker)

**Файлы для создания:**
```
src/checkers/security/
├── SecurityChecker.ts              # [ИСПРАВИТЬ]
├── DependenciesSecurityChecker.ts  # [СОЗДАТЬ]
├── CodeSecurityChecker.ts          # [СОЗДАТЬ]
├── ConfigSecurityChecker.ts        # [СОЗДАТЬ]
└── SecurityAnalysisAdapter.ts      # [СОЗДАТЬ]
```

**Ключевой код** (паттерн от TestingChecker):
```typescript
export class SecurityChecker {
  private static analyzer = new ProcessIsolatedAnalyzer();

  static async checkComponent(context: CheckContext): Promise<ComponentResult> {
    const analysisResult = await this.analyzer.runSecurityAnalysis(context);
    return this.convertToCheckResults(analysisResult);
  }
}
```

### 📅 Задача 5.1.2: Core Security Checks (3 дня)

**Техническая задача**: Реализовать 5 ключевых проверок безопасности
- `npm audit` integration для зависимостей
- Сканирование секретов в коде (.env, API keys, passwords)
- Анализ Docker security best practices
- CORS/CSP конфигурации
- Basic static code security patterns

**Приоритет**: Простота > полнота (принцип Парето)

### 📅 Задача 5.1.3: Интеграция и тестирование (2 дня)

**Техническая задача**: Подключить к AnalysisOrchestrator
- Добавить в `analyzer.ts` → `getAvailableCheckers()`
- Создать `SecurityAnalysisAdapter.ts`
- Расширить `ProcessIsolatedAnalyzer.runSecurityAnalysis()`
- Протестировать на проекте `C:\alphacore\project-template`

---

## 📋 ФАЗА 5.2: PerformanceChecker Creation (6 дней)

### 🎯 Цель фазы
Создать с нуля PerformanceChecker с фокусом на bundle size и основные метрики

### 📅 Задача 5.2.1: Архитектура PerformanceChecker (2 дня)

**Техническая задача**: Создать базовую структуру
- Создать `PerformanceChecker.ts` по паттерну TestingChecker
- Определить 4-5 ключевых метрик производительности
- Интегрировать с `ProcessIsolatedAnalyzer`

**Файлы для создания:**
```
src/checkers/performance/
├── PerformanceChecker.ts          # [СОЗДАТЬ]
├── BundleSizeAnalyzer.ts          # [СОЗДАТЬ]
├── MemoryUsageAnalyzer.ts         # [СОЗДАТЬ]
└── PerformanceAnalysisAdapter.ts  # [СОЗДАТЬ]
```

### 📅 Задача 5.2.2: Core Performance Analyzers (3 дня)

**Техническая задача**: Реализовать основные анализаторы
- **Bundle Size**: Анализ webpack/vite build output
- **Memory Usage**: Базовый профилинг памяти
- **Load Time**: Оценка времени загрузки компонентов
- **DOM Performance**: Поиск тяжелых DOM операций

**MVP принцип**: Статический анализ > runtime профилинг

### 📅 Задача 5.2.3: Интеграция и валидация (1 день)

**Техническая задача**: Подключить к системе
- Добавить в `analyzer.ts` → `getAvailableCheckers()`
- Расширить `ProcessIsolatedAnalyzer.runPerformanceAnalysis()`
- Протестировать на проекте

---

## 🏗️ ТЕХНИЧЕСКАЯ АРХИТЕКТУРА

### Ключевые компоненты для создания/изменения

**ProcessIsolatedAnalyzer** [РАСШИРИТЬ]:
```typescript
// Добавить новые методы
async runSecurityAnalysis(context: CheckContext): Promise<SecurityResult>
async runPerformanceAnalysis(context: CheckContext): Promise<PerformanceResult>
```

**analyzer.ts** [ОБНОВИТЬ]:
```typescript
// В getAvailableCheckers() добавить:
{
  name: 'Security Analysis',
  checkComponent: SecurityChecker.checkComponent.bind(SecurityChecker),
},
{
  name: 'Performance Analysis',
  checkComponent: PerformanceChecker.checkComponent.bind(PerformanceChecker),
}
```

### Модели данных

**SecurityResult**:
```typescript
interface SecurityResult {
  vulnerabilities: VulnerabilityInfo[];
  secrets: SecretInfo[];
  configurations: ConfigIssue[];
  overallScore: number;
}
```

**PerformanceResult**:
```typescript
interface PerformanceResult {
  bundleSize: BundleAnalysis;
  memoryUsage: MemoryAnalysis;
  loadTime: LoadTimeAnalysis;
  overallScore: number;
}
```

### Библиотеки/зависимости
- `child_process` - для npm audit
- `fs/path` - статический анализ файлов
- Существующие EAP utils - повторное использование

---

## ✅ КРИТЕРИИ ПРИЁМКИ

### Функциональные требования
**Security (минимум):**
- ✅ Обнаруживает npm уязвимости
- ✅ Находит секреты в коде (.env files, API keys)
- ✅ Проверяет Docker security practices
- ✅ Генерирует рекомендации по исправлению

**Performance (минимум):**
- ✅ Анализирует bundle size (если есть build)
- ✅ Оценивает memory usage patterns
- ✅ Детектирует performance anti-patterns
- ✅ Предлагает оптимизации

### Нефункциональные требования
- ⏱️ Время выполнения каждого checker'а: <15 секунд
- 🔒 Безопасность: изолированное выполнение через ProcessIsolatedAnalyzer
- 📊 Качество: минимум 70% точность обнаружения проблем
- 🔄 Интеграция: совместимость с существующей архитектурой EAP

### Тестовые сценарии
1. **Проект с уязвимостями**: Детектирует npm audit проблемы + секреты
2. **Production проект**: Анализирует bundle size и производительность
3. **Integration test**: Работает в составе полного EAP анализа

### Ключевые контрольные точки
📊 **Checkpoint 1** (день 3): SecurityChecker MVP собирается без ошибок
📊 **Checkpoint 2** (день 7): Security + Performance интегрированы в систему
📊 **Checkpoint 3** (день 10): Оба checker'а показывают результаты на тестовом проекте

---

## 🚨 РИСКИ И ОГРАНИЧЕНИЯ

### Технические ограничения
- Compilation errors в других модулях могут блокировать интеграцию
- npm audit может требовать network доступа
- Bundle analysis зависит от наличия build конфигурации

### Вопросы для уточнения
1. **Network access**: Доступен ли интернет для npm audit checks?
2. **Build tools**: Какие bundlers поддерживать приоритетно (webpack/vite/rollup)?
3. **Performance scope**: Фокус на статический анализ или runtime профилинг?

### Plan B опции
- Если npm audit недоступен → статический анализ package.json на known vulnerabilities
- Если build analysis сложен → фокус на source code performance patterns
- Если integration блокирован → standalone JavaScript версии (по примеру simple-eap-test-js.mjs)

---

**📋 ИТОГО**: 13 дней, 6 задач, 2 критических компонента восстановлены
**🎯 MVP результат**: EAP coverage увеличится с 60% до 85%+ готовности
**✅ Готовность к production**: Security + Performance checker'ы работают в составе EAP анализа
