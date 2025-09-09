# Отчет о структуре проекта и необходимости рефакторинга

## 📊 Общая информация

| Метрика | Значение |
|---------|---------|
| Всего файлов | 135 |
| Всего строк кода | 64541 |
| Файлов требующих рефакторинга | 70 (51.9%) |
| Циклических зависимостей | 0 |

## 🔄 Необходимость рефакторинга: ВЫСОКАЯ

### 📁 Распределение файлов по типам

- **.js**: 27 файлов (20.0%)
- **.ts**: 102 файлов (75.6%)
- **.svelte**: 3 файлов (2.2%)
- **.tsx**: 3 файлов (2.2%)

## 🔥 Топ файлов требующих рефакторинга

### 1. index-14ea7095.js
**Путь**: `..\tests\reports\assets\index-14ea7095.js`
**Строк**: 31866
**Сложность**: 5613
**Исправлений багов**: 1
**Причины для рефакторинга**:
- Large file (31866 lines > 300)
- High complexity (5613 > 15)

### 2. index-D_ryMEPs.js
**Путь**: `..\test-results\assets\index-D_ryMEPs.js`
**Строк**: 59
**Сложность**: 5247
**Исправлений багов**: 0
**Причины для рефакторинга**:
- High complexity (5247 > 15)

### 3. advanced-project-analyzer.js
**Путь**: `..\scripts\advanced-project-analyzer.js`
**Строк**: 1291
**Сложность**: 190
**Исправлений багов**: 0
**Причины для рефакторинга**:
- Large file (1291 lines > 300)
- High complexity (190 > 15)

### 4. project-detector-v3.0-stable.js
**Путь**: `..\emt-v3-stable-clean\utils\project-detector-v3.0-stable.js`
**Строк**: 1420
**Сложность**: 184
**Исправлений багов**: 1
**Причины для рефакторинга**:
- Large file (1420 lines > 300)
- High complexity (184 > 15)

### 5. project-detector.js
**Путь**: `..\emt-v3-stable-clean\project-detector.js`
**Строк**: 1420
**Сложность**: 184
**Исправлений багов**: 0
**Причины для рефакторинга**:
- Large file (1420 lines > 300)
- High complexity (184 > 15)

### 6. dependencies.ts
**Путь**: `..\eap-analyzer\src\checkers\dependencies.ts`
**Строк**: 744
**Сложность**: 118
**Исправлений багов**: 0
**Причины для рефакторинга**:
- Large file (744 lines > 300)
- High complexity (118 > 15)

### 7. management.ts
**Путь**: `..\src\lib\config\management.ts`
**Строк**: 812
**Сложность**: 108
**Исправлений багов**: 1
**Причины для рефакторинга**:
- Large file (812 lines > 300)
- High complexity (108 > 15)

### 8. project-structure-analyzer.js
**Путь**: `..\scripts\project-structure-analyzer.js`
**Строк**: 741
**Сложность**: 106
**Исправлений багов**: 0
**Причины для рефакторинга**:
- Large file (741 lines > 300)
- High complexity (106 > 15)

### 9. optimized.ts
**Путь**: `..\src\lib\cache\optimized.ts`
**Строк**: 981
**Сложность**: 102
**Исправлений багов**: 0
**Причины для рефакторинга**:
- Large file (981 lines > 300)
- High complexity (102 > 15)

### 10. vitest.ts
**Путь**: `..\eap-analyzer\src\checkers\vitest.ts`
**Строк**: 733
**Сложность**: 101
**Исправлений багов**: 0
**Причины для рефакторинга**:
- Large file (733 lines > 300)
- High complexity (101 > 15)


## 📊 Тепловая карта директорий

| Директория | Файлов | Строк кода | Средняя сложность | Статус |
|------------|--------|------------|-------------------|--------|
| `..\tests\reports\assets` | 1 | 31866 | 5613.0 | 🔴 |
| `..\test-results\assets` | 1 | 59 | 5247.0 | 🔴 |
| `..\emt-v3-stable-clean` | 1 | 1420 | 184.0 | 🔴 |
| `..\emt-v3-stable-clean\utils` | 1 | 1420 | 184.0 | 🔴 |
| `..\eap-analyzer\src\checkers` | 8 | 5031 | 80.5 | 🔴 |
| `..\src\lib\logger\types` | 2 | 409 | 72.0 | 🔴 |
| `..\src\lib\errorHandling` | 1 | 797 | 66.0 | 🔴 |
| `..\scripts` | 10 | 3681 | 45.3 | 🔴 |
| `..\tests\performance` | 1 | 372 | 45.0 | 🔴 |
| `..\eap-analyzer\src\utils` | 1 | 467 | 43.0 | 🔴 |
| `..\testing-integration-package\utils` | 2 | 837 | 39.0 | 🔴 |
| `..\src\lib\cache` | 5 | 1710 | 38.8 | 🔴 |
| `..\src\lib\logger\transports` | 1 | 319 | 37.0 | 🔴 |
| `..\src\lib\security` | 4 | 1594 | 34.8 | 🔴 |
| `..\src\lib\utils` | 6 | 995 | 34.5 | 🔴 |
| `..\src\lib\logger\core` | 1 | 352 | 34.0 | 🔴 |
| `..\src\lib\config` | 4 | 1136 | 33.0 | 🔴 |
| `..\src\lib\logger\utils` | 1 | 280 | 32.0 | 🔴 |
| `..\src\lib\migrations` | 6 | 1808 | 31.7 | 🔴 |
| `..\src\lib\monitoring` | 4 | 1303 | 31.0 | 🔴 |
| `..\tests\e2e` | 3 | 619 | 30.0 | 🔴 |
| `..\tests\unit` | 4 | 611 | 30.0 | 🔴 |
| `..\src\types` | 1 | 73 | 26.0 | 🔴 |
| `..\src\lib\pwa` | 3 | 653 | 24.3 | 🔴 |
| `..\src\lib\logger\security` | 1 | 230 | 24.0 | 🔴 |
| `..\src\lib\api` | 6 | 1199 | 23.7 | 🔴 |
| `..\src\lib\logger` | 3 | 772 | 23.3 | 🔴 |
| `..\eap-analyzer\src\types` | 1 | 249 | 20.0 | 🔴 |
| `..\eap-analyzer\src` | 5 | 712 | 16.8 | 🔴 |
| `..\src\test` | 3 | 496 | 16.3 | 🔴 |
| `..\tests\visual` | 1 | 86 | 13.0 | 🔴 |
| `..\src\lib\errors` | 3 | 355 | 12.7 | 🔴 |
| `..\tests\integration` | 1 | 49 | 10.0 | 🟡 |
| `..\tests\mocks` | 1 | 197 | 9.0 | 🟡 |
| `..\tests` | 6 | 313 | 8.2 | 🟡 |
| `..\tests\utils` | 4 | 420 | 8.0 | 🟡 |
| `..\src` | 2 | 88 | 5.5 | 🟡 |
| `..\src\lib` | 2 | 119 | 5.0 | 🟢 |
| `..\src\tests` | 1 | 337 | 5.0 | 🟢 |
| `..\src\routes\health` | 1 | 44 | 4.0 | 🟢 |
| `..` | 11 | 828 | 2.5 | 🟢 |
| `..\tests\components` | 1 | 7 | 2.0 | 🟢 |
| `..\src\routes` | 2 | 135 | 1.5 | 🟢 |
| `..\eap-analyzer\bin` | 1 | 9 | 1.0 | 🟢 |
| `..\src\constants` | 2 | 25 | 1.0 | 🟢 |
| `..\src\stores` | 2 | 28 | 1.0 | 🟢 |
| `..\tests\fixtures` | 2 | 30 | 1.0 | 🟢 |
| `..\tests\pages` | 1 | 1 | 1.0 | 🟢 |
| `..\.github` | 0 | 0 | 0.0 | 🟢 |
| `..\.github\workflows` | 0 | 0 | 0.0 | 🟢 |
| `..\.husky` | 0 | 0 | 0.0 | 🟢 |
| `..\.husky\_` | 0 | 0 | 0.0 | 🟢 |
| `..\.vscode` | 0 | 0 | 0.0 | 🟢 |
| `..\docker` | 0 | 0 | 0.0 | 🟢 |
| `..\docs` | 0 | 0 | 0.0 | 🟢 |
| `..\docs\api` | 0 | 0 | 0.0 | 🟢 |
| `..\eap-analyzer` | 0 | 0 | 0.0 | 🟢 |
| `..\eap-analyzer\docs` | 0 | 0 | 0.0 | 🟢 |
| `..\eap-analyzer\templates` | 0 | 0 | 0.0 | 🟢 |
| `..\logs` | 0 | 0 | 0.0 | 🟢 |
| `..\reports` | 0 | 0 | 0.0 | 🟢 |
| `..\scripts\logs` | 0 | 0 | 0.0 | 🟢 |
| `..\scripts\utils` | 0 | 0 | 0.0 | 🟢 |
| `..\src\app` | 0 | 0 | 0.0 | 🟢 |
| `..\static` | 0 | 0 | 0.0 | 🟢 |
| `..\test-results` | 0 | 0 | 0.0 | 🟢 |
| `..\test-results\data` | 0 | 0 | 0.0 | 🟢 |
| `..\test-results\real-e2e-Real-E2E-Tests-sh-3274b-dle-JavaScript-interactions-firefox` | 0 | 0 | 0.0 | 🟢 |
| `..\test-results\real-e2e-Real-E2E-Tests-should-be-responsive-firefox` | 0 | 0 | 0.0 | 🟢 |
| `..\test-results\real-e2e-Real-E2E-Tests-should-have-accessible-content-chromium` | 0 | 0 | 0.0 | 🟢 |
| `..\test-results\real-e2e-Real-E2E-Tests-should-have-accessible-content-firefox` | 0 | 0 | 0.0 | 🟢 |
| `..\test-results\real-e2e-Real-E2E-Tests-should-have-accessible-content-Mobile-Chrome` | 0 | 0 | 0.0 | 🟢 |
| `..\test-results\real-e2e-Real-E2E-Tests-should-have-accessible-content-Mobile-Safari` | 0 | 0 | 0.0 | 🟢 |
| `..\test-results\real-e2e-Real-E2E-Tests-should-have-accessible-content-webkit` | 0 | 0 | 0.0 | 🟢 |
| `..\test-results\real-e2e-Real-E2E-Tests-should-have-working-navigation-firefox` | 0 | 0 | 0.0 | 🟢 |
| `..\test-results\real-e2e-Real-E2E-Tests-should-load-homepage-successfully-firefox` | 0 | 0 | 0.0 | 🟢 |
| `..\testing-integration-package` | 0 | 0 | 0.0 | 🟢 |
| `..\tests\reports` | 0 | 0 | 0.0 | 🟢 |
| `..\tests\reports\e2e-html` | 0 | 0 | 0.0 | 🟢 |
| `..\tests\reports\e2e-html\data` | 0 | 0 | 0.0 | 🟢 |

## 🧠 Самообучение анализатора

### 📐 Обнаруженные паттерны проекта

- **Архитектурный паттерн**: React/Next.js
- **Распределение размеров файлов**:
  - Медиана: 0 строк
  - 75-й процентиль: 229 строк
  - 90-й процентиль: 528 строк
- **Распределение сложности**:
  - Медиана: 41
  - 75-й процентиль: 70

### 🛠️ Рекомендации по улучшению критериев анализа

#### Корректировка порогов для текущего проекта

| Метрика | Текущий порог | Рекомендуемый | Причина |
|---------|---------------|---------------|---------|
| Цикломатическая сложность | 15 | 45 | Распределение сложности в проекте (медиана: 41) |

#### Предлагаемые дополнительные метрики

- **Анализ размера пропсов компонентов**: Выявление компонентов с избыточным количеством props (>8)
- **Когнитивная сложность**: Дополнение к цикломатической сложности, оценивающее понятность кода
- **Функциональная когезия**: Оценка, насколько функции в модуле связаны одной задачей

#### Специфичные для данного проекта правила

- **Правила для React-хуков**: Проверка корректности использования правила зависимостей в useEffect/useMemo/useCallback

## 💡 Рекомендации по рефакторингу

1. **Приоритеты рефакторинга**:
   - Сначала устраните циклические зависимости (0)
   - Разбейте крупные файлы на модули
   - Уменьшите сложность функций

2. **Разделение ответственности**:
   - Выделите бизнес-логику из компонентов UI
   - Создайте отдельные слои для данных, логики и представления

3. **Улучшение тестирования**:
   - Добавьте тесты перед рефакторингом сложных файлов
   - Следуйте принципу "красный-зеленый-рефакторинг"

4. **План действий**:
   - Рефакторинг `index-14ea7095.js`: Large file (31866 lines > 300)
   - Рефакторинг `index-D_ryMEPs.js`: High complexity (5247 > 15)
   - Рефакторинг `advanced-project-analyzer.js`: Large file (1291 lines > 300)


---

Анализ выполнен: 2025-09-08T17:49:01.299Z
