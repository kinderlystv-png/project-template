# SHINOMONTAGKA Web Platform

Современная веб-платформа с калькуляторами, карточками товаров, анимациями и 2D/3D конструктором.

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- pnpm 8+ (рекомендуется)

### Установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd SHINOMONTAGKA

# Установка зависимостей
pnpm install

# Настройка Git hooks
pnpm run prepare

# Запуск в режиме разработки
pnpm run dev
```

## 📋 Доступные команды

### Разработка

```bash
pnpm run dev          # Запуск dev сервера
pnpm run build        # Сборка для продакшена
pnpm run preview      # Предварительный просмотр сборки
```

### Тестирование

```bash
pnpm run test         # Запуск тестов в watch режиме
pnpm run test:run     # Одноразовый запуск тестов
pnpm run test:ui      # Запуск тестов с UI
pnpm run test:coverage # Запуск с покрытием кода
```

### Качество кода

```bash
pnpm run lint         # Линтинг и автофикс
pnpm run lint:check   # Только проверка линтинга
pnpm run format       # Форматирование кода
pnpm run format:check # Проверка форматирования
pnpm run type-check   # Проверка типов TypeScript
```

## 🏗️ Архитектура проекта

```
src/
├── components/       # Svelte компоненты
├── stores/          # Глобальные стейты
├── utils/           # Утилиты и хелперы
├── types/           # TypeScript типы
├── assets/          # Статические ресурсы
├── test/            # Тестовые утилиты
└── styles/          # Глобальные стили
```

## 🧪 Тестирование

Проект использует Vitest для unit-тестирования:

- **Unit тесты**: `*.test.ts`, `*.spec.ts`
- **Компонентные тесты**: `*.test.svelte`
- **Покрытие кода**: Автоматически в CI/CD
- **Тестовые утилиты**: В папке `src/test/`

## 🎨 Стандарты кода

### Форматирование

- **Prettier**: Автоматическое форматирование
- **ESLint**: Линтинг и проверка качества кода
- **Конвенции**: Conventional Commits для сообщений коммитов

### Git Flow

- `main` - стабильная ветка для продакшена
- `develop` - основная ветка разработки
- `feature/*` - новые функции
- `fix/*` - исправления багов

## 🚀 CI/CD

### GitHub Actions

- **Code Quality**: Проверка типов, линтинг, форматирование
- **Testing**: Запуск тестов на Node.js 18 и 20
- **Security**: Аудит зависимостей
- **Deploy**: Автоматический деплой в продакшн

### Pre-commit hooks

- Проверка типов TypeScript
- Линтинг и форматирование
- Запуск релевантных тестов
- Проверка формата commit message

## 🛠️ Технологический стек

### Frontend

- **Framework**: Svelte + SvelteKit
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS

### 3D/Анимации

- **3D Graphics**: Three.js
- **Animations**: GSAP, Lottie
- **Motion**: Framer Motion

### Testing

- **Test Runner**: Vitest
- **DOM Testing**: jsdom
- **Coverage**: v8

### Code Quality

- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript
- **Git Hooks**: Husky

## 📱 Особенности проекта

### Калькуляторы

- Научный калькулятор
- Финансовые калькуляторы
- Инженерные расчеты

### Карточки товаров

- Интерактивные карточки
- Фильтрация и сортировка
- Анимации при наведении

### 2D/3D Конструктор

- Three.js для 3D рендеринга
- Интерактивное редактирование
- Экспорт результатов

### Анимации

- GSAP для комплексных анимаций
- Lottie для векторной анимации
- Плавные переходы между состояниями

## 🤝 Участие в разработке

1. Создайте форк репозитория
2. Создайте feature ветку (`git checkout -b feature/amazing-feature`)
3. Внесите изменения
4. Проверьте, что все тесты проходят (`pnpm run test:run`)
5. Создайте коммит (`git commit -m 'feat: add amazing feature'`)
6. Отправьте в ветку (`git push origin feature/amazing-feature`)
7. Создайте Pull Request

## 📄 Лицензия

[MIT License](LICENSE)

## 📞 Поддержка

Если у вас есть вопросы или предложения, создайте issue в репозитории.
