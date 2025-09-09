# 📦 EAP Analyzer v3.0 - Упаковка и запуск на других проектах

## 🚀 Как EAP упакован

### 📦 **NPM пакет**
```json
{
  "name": "@kinderlystv-png/eap-analyzer",
  "version": "3.0.0",
  "type": "module"
}
```

### 🏗️ **Структура сборки**
```
eap-analyzer/
├── dist/           # ES модули (.js + .d.ts)
├── dist-cjs/       # CommonJS модули (.cjs)
├── bin/            # CLI исполняемые файлы
│   ├── eap.js      # Основная команда
│   ├── eap-ai.js   # AI анализ
│   └── test-fixes.js
├── templates/      # Шаблоны отчетов
└── docs/          # Документация
```

### 🎯 **Точки входа**
- **ES модули:** `./dist/index.js`
- **CommonJS:** `./dist/index.cjs`
- **CLI:** `./bin/eap.js`
- **TypeScript:** `./dist/index.d.ts`

---

## 🚀 Способы запуска на других проектах

### 1️⃣ **Глобальная установка (рекомендуется)**

```bash
# Установка глобально
npm install -g @kinderlystv-png/eap-analyzer

# Использование в любом проекте
cd /path/to/your/project
eap analyze
```

### 2️⃣ **Локальная установка в проекте**

```bash
# В вашем проекте
npm install --save-dev @kinderlystv-png/eap-analyzer

# Запуск через npx
npx eap analyze

# Или добавить в scripts package.json
{
  "scripts": {
    "analyze": "eap analyze",
    "audit": "eap analyze --format=html"
  }
}
```

### 3️⃣ **Использование через API**

```typescript
// ES модули
import { createEAPAnalyzer } from '@kinderlystv-png/eap-analyzer';

// CommonJS
const { createEAPAnalyzer } = require('@kinderlystv-png/eap-analyzer');

// Создание анализатора
const analyzer = createEAPAnalyzer();

// Анализ проекта
const results = await analyzer.runFullAnalysis('./path/to/project');
const report = await analyzer.generateReport(results);

console.log('Качество:', report.aiInsights.qualityScore.overall);
console.log('Технический долг:', report.technicalDebtAnalysis.totalDebt);
```

### 4️⃣ **Docker запуск**

```bash
# Построить образ
cd eap-analyzer
docker build -t eap-analyzer:latest .

# Запустить анализ
docker run --rm -v /path/to/project:/workspace eap-analyzer:latest analyze /workspace

# Web интерфейс
docker run -p 3000:3000 eap-analyzer:latest web
```

### 5️⃣ **Прямое копирование (для разработки)**

```bash
# Скопировать собранный пакет
cp -r eap-analyzer/dist /your/project/tools/
cp -r eap-analyzer/bin /your/project/tools/

# Запуск
node tools/bin/eap.js analyze
```

---

## 🎯 CLI команды

### **Основные команды**
```bash
# Полный анализ текущей папки
eap analyze

# Анализ конкретной папки
eap analyze /path/to/project

# С выбором формата отчета
eap analyze --format=json|html|markdown

# Только AI анализ
eap-ai analyze

# С настройками
eap analyze --config=./eap.config.json
```

### **Доступные опции**
```bash
Options:
  -f, --format <type>     Формат отчета (json|html|markdown)
  -o, --output <path>     Папка для отчетов
  -c, --config <path>     Файл конфигурации
  -v, --verbose          Подробный вывод
  -q, --quiet            Тихий режим
  --ai-only              Только AI анализ
  --debt-only            Только технический долг
  --no-cache             Отключить кэширование
  -h, --help             Помощь
```

---

## 📊 Примеры использования

### **Пример 1: Быстрый анализ**
```bash
# Перейти в проект
cd ~/projects/my-app

# Запустить анализ
eap analyze

# Результаты в папке reports/
ls reports/
# ├── comprehensive-report.json
# ├── ai-insights.html
# ├── technical-debt.md
# └── refactoring-plan.md
```

### **Пример 2: Настройка через package.json**
```json
{
  "scripts": {
    "audit": "eap analyze --format=html",
    "debt": "eap analyze --debt-only",
    "ai": "eap-ai analyze --verbose"
  },
  "devDependencies": {
    "@kinderlystv-png/eap-analyzer": "^3.0.0"
  }
}
```

### **Пример 3: Программное использование**
```typescript
import { createEAPAnalyzer } from '@kinderlystv-png/eap-analyzer';

async function auditProject(projectPath: string) {
  const analyzer = createEAPAnalyzer();

  // Запуск полного анализа
  const results = await analyzer.runFullAnalysis(projectPath);

  // Генерация отчета
  const report = await analyzer.generateReport(results);

  // Анализ результатов
  const quality = report.aiInsights.qualityScore.overall;
  const debt = report.technicalDebtAnalysis.totalDebt;
  const roi = report.technicalDebtAnalysis.roiAnalysis.expectedReturn;

  console.log(`Качество: ${quality}/100`);
  console.log(`Долг: ${debt} часов`);
  console.log(`ROI: ${roi}%`);

  // Сохранение отчетов
  await saveReports(report, './audit-results/');

  return {
    quality,
    debt,
    roi,
    recommendation: quality < 50 ? 'Критический рефакторинг' : 'Постепенное улучшение'
  };
}
```

### **Пример 4: CI/CD интеграция**
```yaml
# .github/workflows/code-audit.yml
name: Code Quality Audit
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install EAP Analyzer
        run: npm install -g @kinderlystv-png/eap-analyzer

      - name: Run Analysis
        run: eap analyze --format=json --output=./audit-results

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: audit-results
          path: ./audit-results/
```

---

## ⚙️ Конфигурация

### **Файл конфигурации (eap.config.json)**
```json
{
  "thresholds": {
    "minScore": 70,
    "criticalThreshold": 40,
    "debtThreshold": 1000
  },
  "output": {
    "format": "html",
    "includeDetails": true,
    "generateCSV": true
  },
  "analysis": {
    "enableAI": true,
    "enableDebtAnalysis": true,
    "enableSecurityCheck": true,
    "parallelism": 4
  },
  "ignore": [
    "node_modules/**",
    "dist/**",
    "*.min.js"
  ]
}
```

---

## 📊 Форматы отчетов

### **JSON отчет** (машинно-читаемый)
```json
{
  "timestamp": "2025-09-09T...",
  "qualityScore": 75,
  "technicalDebt": 1250,
  "roi": 185,
  "recommendations": [...],
  "hotspots": [...]
}
```

### **HTML отчет** (визуальный)
- Интерактивные графики
- Drill-down по файлам
- Цветовая индикация проблем
- Executive summary

### **Markdown отчет** (для документации)
- Executive summary
- Ключевые метрики
- Рекомендации по улучшению
- План рефакторинга

---

## 🎯 Готовые примеры команд

```bash
# === Для разных типов проектов ===

# React проект
eap analyze ./my-react-app --format=html

# Node.js API
eap analyze ./api-server --debt-only

# Монорепозиторий
eap analyze ./packages --config=monorepo.config.json

# Legacy код
eap analyze ./legacy-system --ai-only --verbose

# === Для CI/CD ===

# GitHub Actions
eap analyze --format=json --output=./reports --quiet

# Jenkins
eap analyze --format=html --output=$WORKSPACE/reports

# GitLab CI
eap analyze --format=markdown --output=./audit
```

---

## 🎉 Готово к использованию!

**EAP Analyzer v3.0 готов для анализа любых проектов!**

Выберите подходящий способ установки и запуска для вашего workflow'а.
