# 🚀 EAP Phase 5.2 & 5.3: Технический план развития критических компонентов

**Базовый контекст**: Phase 5.1.1 завершена (SecurityChecker 100% восстановлен)
**Архитектура**: ProcessIsolatedAnalyzer + SecurityChecker → протестированы и работают
**Цель**: Расширить SecurityChecker и создать PerformanceChecker по принципу Парето

---

## 📋 ФАЗА 5.2: SecurityChecker Enhancement (6 дней)

### 🎯 Цель фазы
Повысить практическую ценность SecurityChecker с 24% до 70%+ через умные рекомендации

### 📅 Задача 5.2.1: Система практических рекомендаций (2 дня)

**Техническая задача**: Создать templates для конкретных исправлений уязвимостей

**Действия:**
- Создать `RecommendationEngine.ts` с шаблонами исправлений
- Расширить каждый SecurityChecker компонент методами `getDetailedRecommendations()`
- Добавить примеры кода для fix'ов

**Структура файлов:**
```
src/checkers/security/
├── recommendations/
│   ├── RecommendationEngine.ts      # [СОЗДАТЬ]
│   ├── DependencyFixTemplates.ts    # [СОЗДАТЬ]
│   ├── CodeSecurityFixTemplates.ts  # [СОЗДАТЬ]
│   └── ConfigFixTemplates.ts        # [СОЗДАТЬ]
```

**Ключевой компонент:**
```typescript
export class RecommendationEngine {
  static generateFix(issueType: string, context: any): Recommendation {
    // Возвращает конкретный код исправления + объяснение
  }
}
```

### 📅 Задача 5.2.2: Расширение SecurityChecker анализа (2 дня)

**Техническая задача**: Добавить 3 критических типа анализа для повышения детекции

**Действия:**
- Расширить `CodeSecurityChecker` с XSS/CSRF detection
- Добавить JWT/Auth security анализ
- Создать интеграцию с CVE database для dependency checking

**Модификации файлов:**
```typescript
// CodeSecurityChecker.ts [РАСШИРИТЬ]
class CodeSecurityChecker {
  async checkXSSVulnerabilities(projectPath: string): Promise<Issue[]>
  async checkCSRFProtection(projectPath: string): Promise<Issue[]>
  async checkAuthSecurity(projectPath: string): Promise<Issue[]>
}
```

### 📅 Задача 5.2.3: Интеграция и тестирование (2 дня)

**Техническая задача**: Протестировать расширенный SecurityChecker на реальном проекте

**Критерий успеха**: SecurityChecker score 70%+ на project-template

---

## 📋 ФАЗА 5.3: PerformanceChecker Development (8 дней)

### 🎯 Цель фазы
Создать PerformanceChecker по образцу SecurityChecker с focus на bundle size + render

### 📅 Задача 5.3.1: Базовая архитектура PerformanceChecker (2 дня)

**Техническая задача**: Клонировать архитектуру SecurityChecker для performance анализа

**Действия:**
- Создать `PerformanceChecker.ts` как копию SecurityChecker паттерна
- Интегрировать с ProcessIsolatedAnalyzer
- Добавить в analyzer.ts getAvailableCheckers()

**Структура файлов:**
```
src/checkers/performance/
├── PerformanceChecker.ts           # [СОЗДАТЬ] - главный координатор
├── BundleSizeAnalyzer.ts           # [СОЗДАТЬ] - анализ размера bundle
├── RenderPerformanceChecker.ts     # [СОЗДАТЬ] - DOM операции
└── MemoryAnalyzer.ts               # [СОЗДАТЬ] - утечки памяти
```

### 📅 Задача 5.3.2: BundleSizeAnalyzer (3 дня)

**Техническая задача**: Анализ bundle size через Vite/Webpack stats

**Приоритет**: HIGH (самая частая проблема performance)

**Действия:**
- Интеграция с Vite bundle analyzer
- Детекция больших chunks (>500KB)
- Анализ tree-shaking эффективности
- Рекомендации по code-splitting

**Ключевая логика:**
```typescript
class BundleSizeAnalyzer {
  async analyzeBundleSize(projectPath: string): Promise<{
    totalSize: number,
    chunks: ChunkInfo[],
    recommendations: string[]
  }>
}
```

### 📅 Задача 5.3.3: RenderPerformanceChecker (2 дня)

**Техническая задача**: Статический анализ DOM операций и Svelte performance

**Действия:**
- Детекция неэффективных DOM queries
- Анализ Svelte reactivity patterns
- Поиск избыточных re-renders

### 📅 Задача 5.3.4: Интеграция и тестирование (1 день)

**Техническая задача**: Тест PerformanceChecker на project-template

**Критерий успеха**: Находит минимум 5 performance issues

---

## 🔧 Технический анализ

### Зависимости и ограничения:
1. **Phase 5.2** зависит от: SecurityChecker (✅ готов)
2. **Phase 5.3** зависит от: ProcessIsolatedAnalyzer (✅ готов), Vite configs (✅ есть)
3. **Ограничения**: Нет доступа к runtime metrics, только static analysis

### Интеграции:
- **npm audit** → уже работает в SecurityChecker
- **Vite bundle analyzer** → требует интеграция с build process
- **CVE Database** → публичный API доступен

### Файлы для модификации:
```
✏️ ИЗМЕНИТЬ:
- analyzer.ts → добавить PerformanceChecker
- SecurityChecker.ts → интеграция RecommendationEngine

📁 СОЗДАТЬ:
- recommendations/ → 4 файла
- performance/ → 4 файла (8 новых файлов всего)
```

---

## ✅ Критерии приёмки

### Функциональные требования:

**Phase 5.2 (SecurityChecker Enhancement):**
- SecurityChecker предоставляет конкретные fix templates для каждой уязвимости
- Добавлены 3 новых типа security checks (XSS, CSRF, Auth)
- Score на project-template поднялся с 24% до 70%+

**Phase 5.3 (PerformanceChecker):**
- PerformanceChecker обнаруживает bundle size issues
- Анализирует render performance patterns
- Интегрирован в analyzer.ts и работает через ProcessIsolatedAnalyzer

### Нефункциональные требования:
- **Performance**: каждый checker <10 секунд execution time
- **Accuracy**: <10% ложных срабатываний
- **Usability**: практические рекомендации с примерами кода

### Контрольные точки прогресса:

**Checkpoint 1** (после 5.2.1): RecommendationEngine возвращает fix templates
**Checkpoint 2** (после 5.2.3): SecurityChecker score >70% на test project
**Checkpoint 3** (после 5.3.2): BundleSizeAnalyzer находит реальные issues в project-template

### Тестовые сценарии:
1. **SecurityChecker** должен предложить конкретный fix для найденной уязвимости
2. **PerformanceChecker** должен обнаружить large bundle chunks в project-template
3. **Оба checker'а** должны успешно интегрироваться в полный EAP анализ

### Вопросы для уточнения:
1. **Приоритет security vs performance** - какой checker важнее довести до production quality?
2. **CVE интеграция** - нужен ли offline режим или можно полагаться на API?
3. **Bundle analysis** - фокус на Vite или нужна поддержка Webpack?

---

**📊 Ожидаемый результат:**
- SecurityChecker: 24% → 80% effectiveness
- PerformanceChecker: 0% → 70% effectiveness
- EAP система: 75% → 90% readiness
