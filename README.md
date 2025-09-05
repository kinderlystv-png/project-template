# 🚀 Universal SvelteKit TypeScript Template

> Универсальный шаблон для быстрого создания production-ready SvelteKit проектов с полной инфраструктурой

## ⚡ Быстрый старт

### Вариант 1: GitHub Template (Рекомендуемый)

```bash
# 1. Нажмите "Use this template" на GitHub
# 2. Клонируйте ваш новый репозиторий
git clone https://github.com/your-username/your-project-name.git
cd your-project-name

# 3. Установите зависимости
npm install

# 4. Настройте проект
npm run setup:project

# 5. Начните разработку
npm run dev
```

### Вариант 2: NPM (В разработке)

```bash
npx create-alphacore-app my-awesome-project
cd my-awesome-project
npm run dev
```

### Вариант 3: Git Clone

```bash
git clone https://github.com/alphacore/project-template my-project
cd my-project
rm -rf .git && git init
npm install
npm run setup:project
```

## 🏗️ Что включено

### 🔧 Основная инфраструктура (8 модулей)

| Модуль               | Описание            | Возможности                              |
| -------------------- | ------------------- | ---------------------------------------- |
| 📝 **Logging**       | Система логирования | 5 транспортов, уровни, форматирование    |
| 🔄 **API Client**    | HTTP клиент         | Retry, кэш, CSRF защита, типизация       |
| 💾 **Cache**         | Кэширование         | LRU, TTL, теги, размер-лимиты            |
| 🛡️ **Security**      | Безопасность        | XSS/CSRF защита, шифрование, санитизация |
| 📊 **Monitoring**    | Мониторинг          | Web Vitals, метрики, ошибки              |
| ⚠️ **Error Handler** | Обработка ошибок    | Централизованная, типизированная         |
| ⚙️ **Config**        | Конфигурация        | Типизированная, валидация                |
| 🔄 **Migrations**    | Миграции            | Версионирование, откат                   |

### 🧪 Тестирование

- ✅ **Vitest** - Unit тесты с покрытием
- ✅ **Playwright** - E2E тесты на 3 браузерах
- ✅ **Visual Testing** - Скриншот тесты
- ✅ **Performance** - Lighthouse, Web Vitals
- ✅ **Coverage** - Детальная аналитика покрытия

### 🎨 UI & UX

- **SvelteKit 5** - Современный фреймворк
- **TypeScript** - Строгая типизация
- **PostCSS** - Современный CSS
- **Responsive** - Адаптивный дизайн
- **Accessibility** - WCAG 2.1 совместимость

## 📁 Структура проекта

```
my-project/
├── src/
│   ├── lib/                    # 🔧 Основная инфраструктура
│   │   ├── api/               # HTTP клиент
│   │   ├── cache/             # Система кэширования
│   │   ├── config/            # Конфигурация
│   │   ├── errors/            # Обработка ошибок
│   │   ├── logger/            # Логирование
│   │   ├── migrations/        # Миграции данных
│   │   ├── monitoring/        # Мониторинг
│   │   ├── security/          # Безопасность
│   │   └── utils/             # Утилиты
│   ├── components/            # 🎨 UI компоненты
│   │   └── ui/               # Базовые UI элементы
│   ├── routes/               # 📄 Страницы
│   └── stores/               # 🗄️ Состояние
├── tests/                    # 🧪 Все тесты
│   ├── unit/                # Юнит тесты
│   ├── integration/         # Интеграционные
│   ├── e2e/                 # End-to-End
│   ├── performance/         # Производительность
│   └── visual/              # Визуальные
├── docs/                    # 📚 Документация
└── scripts/                 # 🔨 Скрипты автоматизации
```

## 🎯 Возможности

### 🔥 Production Ready

- Оптимизированная сборка с code splitting
- Service Worker для PWA
- SEO оптимизация из коробки
- Error boundaries и graceful degradation

### 🛠️ Developer Experience

- Hot Module Replacement
- TypeScript строгий режим
- ESLint + Prettier настроены
- Git hooks с Husky

### 📈 Мониторинг

- Web Vitals отслеживание
- Error tracking (Sentry ready)
- Performance metrics
- User analytics готовность

### 🔒 Безопасность

- XSS защита
- CSRF токены
- Content Security Policy
- Данные шифрование

## 🚀 Команды

### Разработка

```bash
npm run dev          # Запуск dev сервера
npm run build        # Production сборка
npm run preview      # Предпросмотр сборки
```

### Тестирование

```bash
npm run test            # Все тесты
npm run test:unit       # Юнит тесты
npm run test:e2e        # E2E тесты
npm run test:visual     # Визуальные тесты
npm run test:performance # Производительность
npm run test:coverage   # Покрытие кода
```

### Качество кода

```bash
npm run lint         # ESLint проверка
npm run format       # Prettier форматирование
npm run type-check   # TypeScript проверка
```

## ⚙️ Конфигурация

### Переменные окружения

```bash
# API
VITE_API_URL=/api
VITE_API_TIMEOUT=30000

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false
VITE_ENABLE_PWA=false

# Development
VITE_DEBUG=true
VITE_LOG_LEVEL=info
```

### Настройка после установки

1. Скопируйте `.env.example` в `.env`
2. Настройте переменные под ваш проект
3. Обновите `src/lib/config/` под ваши нужды

## 📚 Документация

- [🏗️ Инфраструктура](docs/INFRASTRUCTURE.md)
- [🧪 Тестирование](docs/TESTING.md)
- [🚀 Деплой](docs/DEPLOYMENT.md)
- [🔧 API Reference](docs/API.md)

## 🤝 Совместимость

- **Node.js**: >=18.0.0
- **NPM**: >=8.0.0
- **Браузеры**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 📊 Метрики качества

- ✅ **TypeScript**: 100% покрытие типами
- ✅ **Тесты**: 80%+ покрытие кода
- ✅ **Performance**: Lighthouse 90+ баллов
- ✅ **Accessibility**: WCAG 2.1 AA
- ✅ **SEO**: 100% готовность

## 🔄 Обновления

Шаблон регулярно обновляется. Следите за новыми версиями:

```bash
# Проверить версию шаблона
cat template.config.json | grep version

# Посмотреть что нового
curl -s https://api.github.com/repos/alphacore/project-template/releases/latest
```

## 🆘 Поддержка

- 📖 [Wiki](https://github.com/alphacore/project-template/wiki)
- 🐛 [Issues](https://github.com/alphacore/project-template/issues)
- 💬 [Discussions](https://github.com/alphacore/project-template/discussions)

## 📄 Лицензия

MIT License - используйте свободно в коммерческих и некоммерческих проектах.

## 🙏 Благодарности

- **Svelte Team** - за отличный фреймворк
- **Vite Team** - за быструю сборку
- **Community** - за обратную связь и вклад

---

<div align="center">

**⭐ Поставьте звезду, если шаблон полезен!**

[🚀 Использовать шаблон](https://github.com/alphacore/project-template/generate) • [📚 Документация](docs/) • [🐛 Сообщить о проблеме](https://github.com/alphacore/project-template/issues)

</div>
