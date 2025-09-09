# 🎯 Ultimate EAP Analyzer v3.0

[![NPM Version](https://img.shields.io/npm/v/@kinderlystv-png/eap-analyzer)](https://www.npmjs.com/package/@kinderlystv-png/eap-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/kinderlystv-png/eap-analyzer/workflows/Node.js%20CI/badge.svg)](https://github.com/kinderlystv-png/eap-analyzer/actions)

> **Эталонный Анализатор Проектов** - мощный инструмент для комплексного анализа качества кода с AI-инсайтами, анализом технического долга и ROI-расчетами.

## 🚀 Быстрый старт

```bash
# Глобальная установка
npm install -g @kinderlystv-png/eap-analyzer

# Анализ проекта
cd your-project
eap analyze

# Или через npx без установки
npx @kinderlystv-png/eap-analyzer analyze
```

## 🎯 Возможности

- ✅ **AI-анализ качества** - Умные рекомендации по улучшению
- ✅ **Технический долг** - Расчет стоимости и ROI рефакторинга
- ✅ **Множественные форматы** - JSON, HTML, Markdown отчеты
- ✅ **CLI и API** - Интеграция в любой workflow
- ✅ **CI/CD готовность** - GitHub Actions, Jenkins, GitLab
- ✅ **Docker поддержка** - Контейнеризованный анализ

## 📊 Пример результата

```
🔍 Ultimate EAP Analyzer v3.0 - Анализ завершен!

📁 Проект: my-awesome-app
📊 Файлов проанализировано: 298
📏 Строк кода: 116,524

🎯 Найденные проблемы:
🔒 Security: 3 рекомендации
⚡ Performance: 5 оптимизаций
✨ Quality: 8 улучшений
💸 Technical Debt: $45,000 потенциальной экономии

💰 ROI Анализ: 400% прибыльность
```

## 🛠 Установка и использование

### Глобальная установка
```bash
npm install -g @kinderlystv-png/eap-analyzer
eap analyze /path/to/project
```

### Локальная установка в проекте
```bash
npm install --save-dev @kinderlystv-png/eap-analyzer
npx eap analyze
```

### Использование через API
```typescript
import { createEAPAnalyzer } from '@kinderlystv-png/eap-analyzer';

const analyzer = createEAPAnalyzer();
const results = await analyzer.runFullAnalysis('./project');
const report = await analyzer.generateReport(results);

console.log('Качество:', report.aiInsights.qualityScore.overall);
console.log('Технический долг:', report.technicalDebtAnalysis.totalDebt);
```

### Docker
```bash
docker run --rm -v $(pwd):/workspace kinderlystv-png/eap-analyzer analyze /workspace
```

## 📋 CLI команды

```bash
# Основные команды
eap analyze                    # Анализ текущей папки
eap analyze /path/to/project   # Анализ конкретного проекта
eap analyze --format=html      # HTML отчет
eap analyze --ai-only          # Только AI анализ
eap analyze --debt-only        # Только технический долг

# Опции
--format=json|html|markdown    # Формат отчета
--output=/path/to/reports      # Папка для результатов
--config=./eap.config.json     # Файл конфигурации
--verbose                      # Подробный вывод
--quiet                        # Тихий режим
```

## ⚙️ Конфигурация

Создайте `eap.config.json` в корне проекта:

```json
{
  "thresholds": {
    "minScore": 70,
    "criticalThreshold": 40
  },
  "analysis": {
    "enableAI": true,
    "enableDebtAnalysis": true,
    "parallelism": 4
  },
  "ignore": [
    "node_modules/**",
    "dist/**",
    "*.min.js"
  ]
}
```

## 🚀 CI/CD интеграция

### GitHub Actions
```yaml
- name: Code Quality Analysis
  run: |
    npm install -g @kinderlystv-png/eap-analyzer
    eap analyze --format=json --output=./reports
```

### Jenkins
```groovy
sh 'npm install -g @kinderlystv-png/eap-analyzer'
sh 'eap analyze --format=html --output=${WORKSPACE}/reports'
```

## 📊 Форматы отчетов

- **JSON** - Машинно-читаемый для интеграций
- **HTML** - Интерактивные графики и drill-down
- **Markdown** - Для документации и README

## 🎯 Примеры использования

### React проект
```bash
eap analyze ./my-react-app --format=html
```

### Node.js API
```bash
eap analyze ./api-server --debt-only
```

### Монорепозиторий
```bash
eap analyze ./packages --config=monorepo.config.json
```

## 🔧 Разработка

```bash
# Клонирование
git clone https://github.com/kinderlystv-png/eap-analyzer.git
cd eap-analyzer

# Установка зависимостей
npm install

# Сборка
npm run build

# Тестирование
npm test

# Локальный анализ
npm run quick-analyze
```

## 📈 Roadmap

- [ ] Интеграция с SonarQube
- [ ] Поддержка Python/Java проектов
- [ ] Web Dashboard
- [ ] VS Code расширение
- [ ] Slack/Teams интеграция

## 📄 Лицензия

MIT © [kinderlystv-png](https://github.com/kinderlystv-png)

## 🤝 Поддержка

- [Issues](https://github.com/kinderlystv-png/eap-analyzer/issues)
- [Discussions](https://github.com/kinderlystv-png/eap-analyzer/discussions)
- [Documentation](https://github.com/kinderlystv-png/eap-analyzer/wiki)

---

**Анализируйте код, находите возможности, улучшайте качество! 🚀**
