# 🚀 SvelteKit Production Template v2.0

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![SvelteKit](https://img.shields.io/badge/SvelteKit-2.37+-orange.svg)
![Vite](https://img.shields.io/badge/Vite-7.1+-purple.svg)

**Профессиональный шаблон SvelteKit** с продвинутой инфраструктурой, готовый к продакшену. Включает современные инструменты разработки, системы мониторинга, оптимизации производительности и полную автоматизацию.

## ✨ Ключевые особенности

### 🏗️ **Современная архитектура**

- **SvelteKit 2.37+** с полной TypeScript поддержкой
- **Vite 7.1+** с оптимизированной конфигурацией
- **Модульная инфраструктура** с динамическими импортами
- **Production-ready** системы мониторинга и обработки ошибок

### � **Продвинутые системы**

- **Умное кэширование** (L1/L2/L3) с компрессией и предиктивной загрузкой
- **Система мониторинга** с Web Vitals, метриками производительности
- **Обработка ошибок** с автоматическим восстановлением и аналитикой
- **Конфигурация** с feature flags и hot reload
- **Миграции** с rollback и backup системой

### ⚡ **Оптимизация производительности**

- **Автоматическое разделение кода** (code splitting)
- **Параллельное тестирование** с Vitest
- **CSS оптимизация** с PostCSS и автопрефиксами
- **Bundle анализ** и оптимизация размера

### 🛡️ **Качество и безопасность**

- **100% TypeScript** с строгими типами
- **ESLint + Prettier** с автоматическим форматированием
- **Комплексное тестирование** (unit, integration, e2e)
- **Security middleware** с ML-анализом угроз

## 🚀 Быстрый старт

### Создание проекта

```bash
# Использование как GitHub Template
# 1. Нажмите "Use this template" на GitHub
# 2. Создайте новый репозиторий
# 3. Клонируйте репозиторий

# Или клонирование напрямую
git clone https://github.com/kinderlystv-png/project-template.git my-project
cd my-project
```

### Установка и настройка

```bash
# Установка зависимостей
npm install

# Автоматическая настройка проекта
npm run setup

# Запуск в режиме разработки
npm run dev

# Открыть в браузере: http://localhost:3000
```

### Быстрые команды

```bash
# Разработка
npm run dev          # Запуск dev сервера
npm run dev:debug    # Debug режим
npm run dev:https    # HTTPS режим

# Сборка
npm run build        # Продакшн сборка
npm run build:analyze # Анализ bundle
npm run preview      # Предварительный просмотр

# Тестирование
npm run test         # Запуск всех тестов
npm run test:coverage # Тесты с покрытием
npm run test:ui      # UI для тестов

# Качество кода
npm run lint         # Проверка линтером
npm run format       # Форматирование
npm run type-check   # Проверка типов

# Docker (рекомендуется)
npm run docker:dev   # Разработка в контейнере
npm run docker:test  # Тесты в контейнере
npm run docker:prod  # Продакшн в контейнере
```

## 🐳 Docker Support

Проект полностью контейнеризован с использованием Docker для обеспечения консистентной среды разработки.

### Быстрый старт с Docker

```bash
# Установка Docker (если не установлен)
# См. docs/DOCKER-INSTALL.md

# Запуск в разработке
npm run docker:dev

# Запуск тестов
npm run docker:test

# Продакшн
npm run docker:prod
```

### Docker команды

```bash
# Windows (PowerShell)
.\docker\run.ps1 dev                    # Разработка
.\docker\run.ps1 test                   # Тестирование
.\docker\run.ps1 prod -Detached         # Продакшн в фоне

# Linux/macOS
./docker/run.sh development             # Разработка
./docker/run.sh test                    # Тестирование
./docker/run.sh production              # Продакшн
```

**📚 Подробная документация**: [docs/DOCKER.md](docs/DOCKER.md)

# Start development server

npm run dev

# Run tests

npm run test

# Build for production

npm run build

```

## Project Structure

```

src/
├── lib/ # Core infrastructure
├── routes/ # Application pages
├── stores/ # State management
└── components/ # UI components

tests/
├── unit/ # Unit tests
├── e2e/ # End-to-end tests
├── integration/ # Integration tests
└── performance/ # Performance tests

```

## Author

йцу

## License

MIT
```
