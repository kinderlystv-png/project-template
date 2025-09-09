# ЭАП (Эталонный Анализатор Проектов) v2.0

Система унифицированного анализа проектов с модульной архитектурой.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.2-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🏗️ Новая архитектура v2.0

### Ядро системы
```
src/core/
├── interfaces/     # Базовые интерфейсы (IChecker, IAnalyzer, ...)
├── base/          # Базовые классы (BaseChecker, BaseAnalyzer, ...)
└── types/         # Система типов (CheckResult, AnalysisCategory, ...)
```

### Компоненты
```
src/
├── checkers/      # Проверщики качества (DockerChecker ✅, EMTChecker 🔄)
├── analyzers/     # Анализаторы метрик (📋 в планах)
├── evaluators/    # Оценщики проектов (📋 в планах)
└── reporters/     # Генераторы отчетов (📋 в планах)
```

- ✅ **Dockerfile** - многоэтапная сборка
- ✅ **Docker Compose** - оркестрация сервисов
- ✅ **Multi-environment** - dev/test/prod конфигурации
- ✅ **Security** - безопасность контейнеров
- ✅ **Health Checks** - мониторинг состояния

### 🛠️ SvelteKit Framework _(скоро)_

### 🔄 CI/CD Pipeline _(скоро)_

### 📝 Code Quality _(скоро)_

### 📦 Dependencies _(скоро)_

### 🔒 Security _(скоро)_

## 📈 Система оценок

| Оценка | Диапазон | Описание                  |
| ------ | -------- | ------------------------- |
| **A+** | 95-100%  | 🎉 Эталонный проект       |
| **A**  | 90-94%   | ⭐ Отличное качество      |
| **B**  | 80-89%   | 👍 Хорошее качество       |
| **C**  | 70-79%   | ⚠️ Требует улучшений      |
| **D**  | 60-69%   | 🔧 Много проблем          |
| **F**  | <60%     | 🚨 Критические недостатки |

## 🔧 Пример использования

```typescript
import { GoldenStandardAnalyzer } from '@kinderlystv-png/eap-analyzer';

const analyzer = new GoldenStandardAnalyzer();
const result = await analyzer.analyzeProject('./my-project');

console.log(`Оценка: ${result.summary.percentage}%`);
console.log(`Проверок пройдено: ${result.summary.passedChecks}/${result.summary.totalChecks}`);
```

## 📋 CLI Команды

### `eap analyze [path]`

Полный анализ проекта с детальным отчетом

```bash
eap analyze                    # Текущая папка
eap analyze ./my-project       # Конкретный проект
eap analyze --output report.json  # С сохранением в JSON
eap analyze --silent           # Тихий режим
```

### `eap check [path]`

Быстрая проверка готовности проекта

```bash
eap check                      # Краткий результат
eap check ./project            # Проверка конкретного проекта
```

### `eap standard`

Показать информацию о золотом стандарте

```bash
eap standard                   # Описание всех компонентов
```

### `eap init [path]` _(скоро)_

Инициализация проекта с базовыми файлами

## 📁 Структура проекта

```
eap-analyzer/
├── 📄 README.md              # Эта документация
├── 📦 package.json           # Конфигурация NPM
├── 🔧 tsconfig.json          # Настройки TypeScript
├── 📁 src/                   # Исходный код
│   ├── 🎯 analyzer.ts        # Главный анализатор
│   ├── 💻 cli.ts             # CLI интерфейс
│   ├── 📝 types/             # TypeScript типы
│   ├── 🔍 checkers/          # Модули проверок
│   │   ├── emt.ts            # ЭМТ (тестирование)
│   │   └── docker.ts         # Docker инфраструктура
│   └── 🛠️ utils/             # Утилиты
├── 📁 dist/                  # Собранный код
├── 📁 bin/                   # Исполняемые файлы
└── 📁 docs/                  # Документация
```

## 🎯 Пример результата

```
🔍 Анализ проекта SHINOMONTAGKA...
📂 Путь: /my-awesome-project

📋 Анализ ЭМТ (Эталонный Модуль Тестирования)...
✅ ЭМТ: 100% (10/10 проверок)

📋 Анализ Docker Infrastructure...
🐳 Docker: 100% (10/10 проверок)

🎯 ОБЩИЙ РЕЗУЛЬТАТ:
   Оценка: 100% (210/210 баллов)
   Оценка: A+
🎉 Отлично! Проект соответствует высоким стандартам!
```

## 🔨 Разработка

### Установка зависимостей

```bash
npm install
```

### Сборка

```bash
npm run build          # Одноразовая сборка
npm run build:watch    # Сборка с отслеживанием изменений
```

### Тестирование

```bash
npm test               # Запуск тестов
npm run test:coverage  # Тесты с покрытием
```

### Линтинг

```bash
npm run lint           # Проверка кода
npm run lint:fix       # Автоисправление
npm run format         # Форматирование
```

## 🤝 Вклад в развитие

1. 🍴 Fork репозитория
2. 🌿 Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit изменения (`git commit -m 'Add amazing feature'`)
4. 📤 Push в branch (`git push origin feature/amazing-feature`)
5. 🔃 Создайте Pull Request

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) для деталей.

## 🙋‍♂️ Поддержка

- 📧 **Email**: [support@shinomontagka.dev](mailto:support@shinomontagka.dev)
- 🐛 **Issues**: [GitHub Issues](https://github.com/kinderlystv-png/project-template/issues)
- 📖 **Docs**: [Полная документация](docs/)

---

**Made with ❤️ by SHINOMONTAGKA Team**

> _"Качество кода - это не роскошь, это необходимость"_
