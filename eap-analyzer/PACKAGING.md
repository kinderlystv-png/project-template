# 📦 ЭАП - Структура упаковки

## 🏗️ Архитектура проекта

```
eap-analyzer/
├── 📁 bin/                    # Исполняемые файлы CLI
│   └── eap.js                 # Главная точка входа
├── 📁 src/                    # Исходный код TypeScript
│   ├── cli.ts                 # CLI интерфейс
│   ├── analyzer.ts            # Основной анализатор
│   ├── 📁 checkers/           # Модули проверок
│   │   ├── emt.ts            # ЭМТ проверки
│   │   ├── docker.ts         # Docker проверки
│   │   ├── sveltekit.ts      # SvelteKit проверки
│   │   ├── ci-cd.ts          # CI/CD проверки
│   │   ├── code-quality.ts   # Качество кода
│   │   ├── vitest.ts         # Vitest проверки
│   │   ├── dependencies.ts   # Управление зависимостями
│   │   └── logging.ts        # Система логирования
│   ├── 📁 types/             # TypeScript типы
│   └── 📁 utils/             # Вспомогательные утилиты
├── 📁 dist/                   # Скомпилированный код JS
├── 📁 docs/                   # Документация
├── package.json               # Конфигурация npm пакета
├── README.md                  # Основная документация
├── QUICK-START.md            # Быстрый старт
└── CHANGELOG.md              # История изменений
```

## 🚀 Способы использования

### 1. **Локальный запуск** (рекомендуется)

```bash
# Клонировать репозиторий
git clone https://github.com/kinderlystv-png/project-template.git
cd project-template/eap-analyzer

# Установить зависимости
pnpm install

# Запустить анализ
node bin/eap.js analyze /path/to/your/project
```

### 2. **NPM пакет** (когда опубликован)

```bash
# Глобально
npm install -g @kinderlystv-png/eap-analyzer
eap analyze /path/to/project

# Локально в проект
npm install --save-dev @kinderlystv-png/eap-analyzer
npx eap analyze
```

### 3. **Docker контейнер** (планируется)

```bash
docker run --rm -v $(pwd):/app shinomontagka/eap-analyzer analyze /app
```

## 📋 CLI команды

```bash
# Основные команды
node bin/eap.js analyze <path>    # Полный анализ проекта
node bin/eap.js check <path>      # Быстрая проверка
node bin/eap.js standard          # Показать эталонный стандарт
node bin/eap.js init              # Инициализация проекта
node bin/eap.js --help            # Справка

# Примеры
node bin/eap.js analyze .                           # Текущая папка
node bin/eap.js analyze /home/user/my-project      # Абсолютный путь
node bin/eap.js analyze ../another-project         # Относительный путь
```

## 🔧 Конфигурация

### package.json

```json
{
  "name": "@kinderlystv-png/eap-analyzer",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "eap": "./bin/eap.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

### CLI алиасы

- `eap` - основная команда
- `eap-analyze` - алиас для анализа
- `golden-analyze` - альтернативное название

## 📊 Что анализируется

### 🎯 **8 категорий (72 проверки)**

1. **ЭМТ** (10 проверок) - Тестирование
2. **Docker** (10 проверок) - Контейнеризация
3. **SvelteKit** (10 проверок) - Framework
4. **CI/CD** (8 проверок) - Автоматизация
5. **Code Quality** (9 проверок) - Качество кода
6. **Vitest** (9 проверок) - Тестовый фреймворк
7. **Dependencies** (9 проверок) - Управление зависимостями
8. **Logging** (6 проверок) - Система логирования

## 📈 Формат результата

```
🎯 Общая оценка: A (93/100)
✅ Пройдено проверок: 67/71
⚡ Критических проблем: 0
⏱️ Время анализа: 0.07с

📋 ДЕТАЛИЗАЦИЯ ПО КОМПОНЕНТАМ:
A EMT (100%) - ✅ 10/10
A Docker (100%) - ✅ 10/10
A SvelteKit (100%) - ✅ 10/10
...

💡 РЕКОМЕНДАЦИИ:
1. Создайте .github/dependabot.yml
2. Добавьте npm audit в CI/CD
...
```

## 🎁 Готовые возможности

- ✅ TypeScript компиляция
- ✅ ESLint конфигурация
- ✅ CLI интерфейс с Commander.js
- ✅ Цветной вывод с Chalk
- ✅ Файловый поиск с fast-glob
- ✅ Семантическая версионность
- ✅ Экспорт в JSON/HTML (планируется)
- ✅ Интеграция с CI/CD

## 🔄 Обновления

```bash
# Обновить ЭАП анализатор
cd eap-analyzer
git pull origin master
pnpm install
```
