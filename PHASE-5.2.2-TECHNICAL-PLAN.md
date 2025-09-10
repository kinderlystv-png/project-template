# PHASE 5.2.2 - АНАЛИЗ ТРЕБОВАНИЙ
# Расширенный анализ XSS/CSRF/аутентификации

## 1. СТРУКТУРИРОВАНИЕ ЗАДАЧ

### 🎯 ФАЗА 1: XSS и CSRF Анализ (6 дней)
**Цель:** Добавить детекцию веб-специфичных уязвимостей

#### Задача 1.1: XSS Detection Engine (2 дня)
**Техническая цель:** Создать анализатор для поиска уязвимостей XSS
- ✅ Сканирование HTML/Svelte файлов на небезопасные выводы
- ✅ Детекция `{@html}` без санитизации
- ✅ Поиск `innerHTML`, `outerHTML` присваиваний
- ✅ Проверка URL параметров в шаблонах

#### Задача 1.2: CSRF Protection Checker (2 дня)
**Техническая цель:** Анализ защиты от CSRF атак
- ✅ Поиск форм без CSRF токенов
- ✅ Проверка API endpoints на CSRF middleware
- ✅ Анализ SvelteKit форм и actions
- ✅ Валидация SameSite cookie настроек

#### Задача 1.3: Integration & Templates (2 дня)
**Техническая цель:** Интеграция с RecommendationEngine
- ✅ Создание WebSecurityFixTemplates
- ✅ Добавление рекомендаций по исправлению
- ✅ Интеграция в SecurityChecker
- ✅ Тестирование и валидация

### 🔐 ФАЗА 2: Authentication & Authorization (8 дней)
**Цель:** Комплексная проверка систем аутентификации

#### Задача 2.1: Auth Flow Analysis (3 дня)
**Техническая цель:** Анализ потоков аутентификации
- ✅ Поиск небезопасного хранения паролей
- ✅ Проверка JWT токенов (секреты, алгоритмы)
- ✅ Анализ session управления
- ✅ Проверка logout процедур

#### Задача 2.2: Authorization Checks (3 дня)
**Техническая цель:** Проверка систем авторизации
- ✅ Анализ middleware для защиты роутов
- ✅ Поиск IDOR уязвимостей
- ✅ Проверка роль-based доступа
- ✅ Валидация API защиты

#### Задача 2.3: Security Headers & Final Integration (2 дня)
**Техническая цель:** Завершение системы безопасности
- ✅ Проверка security headers (CSP, HSTS, etc)
- ✅ Финальная интеграция всех компонентов
- ✅ Комплексное тестирование
- ✅ Документация и примеры

---

## 2. ТЕХНИЧЕСКИЙ АНАЛИЗ

### 🏗️ Архитектура и файлы

```
eap-analyzer/src/checkers/security/
├── SecurityChecker.ts              # ✅ Главный координатор
├── DependenciesSecurityChecker.ts  # ✅ Существует
├── CodeSecurityChecker.ts          # ✅ Существует
├── ConfigSecurityChecker.ts        # ✅ Существует
├── WebSecurityChecker.ts           # 🆕 Новый - XSS/CSRF/Auth
└── analyzers/
    ├── XSSAnalyzer.ts              # 🆕 XSS детекция
    ├── CSRFAnalyzer.ts             # 🆕 CSRF проверки
    ├── AuthAnalyzer.ts             # 🆕 Аутентификация
    └── SecurityHeadersAnalyzer.ts  # 🆕 HTTP заголовки

src/recommendations/
├── RecommendationEngine.ts         # ✅ Существует
├── WebSecurityFixTemplates.ts      # 🆕 Веб-безопасность
└── types.ts                        # ✅ Обновить типы
```

### 🔧 Компоненты для реализации

#### 1. WebSecurityChecker (Главный)
```typescript
export class WebSecurityChecker {
  private xssAnalyzer = new XSSAnalyzer();
  private csrfAnalyzer = new CSRFAnalyzer();
  private authAnalyzer = new AuthAnalyzer();

  async analyzeWebSecurity(context: CheckContext): Promise<WebSecurityResult>
}
```

#### 2. XSSAnalyzer
```typescript
export class XSSAnalyzer {
  async scanForXSS(context: CheckContext): Promise<XSSVulnerability[]>
  // Сканирует: .svelte, .html, .js, .ts файлы
  // Ищет: {@html}, innerHTML, опасные паттерны
}
```

#### 3. CSRFAnalyzer
```typescript
export class CSRFAnalyzer {
  async checkCSRFProtection(context: CheckContext): Promise<CSRFIssue[]>
  // Анализирует: формы, API endpoints, middleware
  // Проверяет: CSRF токены, SameSite cookies
}
```

### 📊 Модели данных

```typescript
// Новые типы в types.ts
interface WebSecurityResult {
  xssVulnerabilities: XSSVulnerability[];
  csrfIssues: CSRFIssue[];
  authProblems: AuthProblem[];
  securityHeaders: SecurityHeaderIssue[];
}

interface XSSVulnerability {
  type: 'innerHTML' | 'htmlOutput' | 'urlParam';
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium';
  context: string;
}
```

### 🔌 Интеграция

**SecurityChecker.ts** - добавить WebSecurityChecker:
```typescript
// В методе runSecurityAnalysis
const webSecurityResult = await this.webChecker.analyzeWebSecurity(context);
```

**RecommendationEngine.ts** - добавить веб-рекомендации:
```typescript
// В generateRecommendations
if (context.webSecurity) {
  recommendations.push(...WebSecurityFixTemplates.generateXSSFixes(xssIssues));
}
```

### 📚 Библиотеки
- **Используем существующие:** fs, path, glob для сканирования файлов
- **Парсинг:** Простые regex для начала, позже AST если нужно
- **Без новых зависимостей** - используем встроенные возможности

### ⚠️ Технические ограничения
- Статический анализ (без выполнения кода)
- Ограниченный контекст (без runtime данных)
- Возможны false positives (компенсируем приоритизацией)

---

## 3. КРИТЕРИИ ПРИЁМКИ

### ✅ Условия успешной реализации

**Фаза 1 (XSS/CSRF):**
- [ ] Находит XSS в {@html} конструкциях
- [ ] Обнаруживает формы без CSRF защиты
- [ ] Генерирует практические рекомендации исправления
- [ ] Интегрирован в RecommendationEngine

**Фаза 2 (Auth):**
- [ ] Анализирует JWT токены на безопасность
- [ ] Находит проблемы в системах авторизации
- [ ] Проверяет security headers
- [ ] Эффективность 75%+ (как в Phase 5.2.1)

### 🧪 Тестовые сценарии

1. **XSS Test:** Создать .svelte файл с `{@html userInput}` → должен найти уязвимость
2. **CSRF Test:** Создать форму без токена → должен предупредить
3. **Auth Test:** JWT с weak secret → должен найти проблему
4. **Integration Test:** Полный анализ реального проекта → 10+ рекомендаций

### 📈 Ключевые моменты прогресса

1. **День 2:** XSSAnalyzer работает и находит основные уязвимости
2. **День 4:** CSRFAnalyzer интегрирован и тестируется
3. **День 7:** AuthAnalyzer базовая версия готова
4. **День 10:** Полная интеграция, тестирование 75%+ эффективности

### ❓ Вопросы для уточнения

1. **Приоритеты:** Какие типы XSS атак важнее всего для проекта?
2. **CSRF:** Используется ли специфический CSRF middleware/библиотека?
3. **Auth:** Какая система аутентификации используется (JWT, sessions, custom)?

---

## 🎯 ИТОГОВАЯ ЦЕЛЬ
**Превратить SecurityChecker из "базового анализатора" в "экспертную систему веб-безопасности"**

**Результат:** Анализатор, который находит 80% реальных веб-уязвимостей и дает практические рекомендации по исправлению.

**Принцип Паретто:** Фокус на 3 самых опасных типа атак (XSS, CSRF, Auth) = 80% покрытия реальных проблем безопасности.
