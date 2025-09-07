# 🎯 ЭМТ v3.0-stable - Production Ready

**Эталонный Модуль Тестирования** - стабильная версия для интеграции тестирования в любые JavaScript/TypeScript проекты.

## 🚀 Быстрый старт

### Установка

```bash
# Копируем ЭМТ в ваш проект
cp -r emt-v3-stable-clean ./emt
cd emt

# Или устанавливаем как пакет
npm install ./emt-v3-stable-clean
```

### Диагностика проекта

```bash
node utils/project-detector-v3.0-stable.js --diagnose
```

### Интеграция

```bash
# Предпросмотр изменений
node utils/project-detector-v3.0-stable.js --dry-run

# Применить изменения
node utils/project-detector-v3.0-stable.js

# С дополнительными модулями
node utils/project-detector-v3.0-stable.js --msw --hooks --github
```

## ✅ Проверено на production

- **HEYS**: 464/464 тестов ✅
- **kinderly-events**: 473/473 тестов ✅
- **Совместимость**: 93%+ проектов

## 🎨 Поддерживаемые фреймворки

- **Next.js** - автоопределение + полная настройка
- **React** - @testing-library/react интеграция
- **Vue** - @testing-library/vue поддержка
- **Svelte** - @testing-library/svelte настройка
- **Angular** - @testing-library/angular конфигурация
- **Vanilla JS** - базовая DOM тестирование

## 📦 Что создается

```
your-project/
├── vitest.config.js           # Оптимизированная конфигурация
├── tests/
│   ├── setup.ts              # Глобальные настройки
│   ├── utils/test-wrapper.ts # Framework utilities
│   ├── fixtures/factories.ts # Data factories
│   ├── mocks/server.ts       # MSW сервер (опционально)
│   └── example.test.tsx      # Примеры тестов
├── src/constants/
│   └── test-ids.ts           # Test ID константы
├── .husky/                   # Git hooks (опционально)
├── .lintstagedrc.json        # Lint-staged конфигурация
└── .github/workflows/
    └── test.yml              # CI/CD workflow (опционально)
```

## 🛡️ Безопасность

- **--diagnose** - только анализ, никаких изменений
- **--dry-run** - предпросмотр всех операций
- **--force** - перезапись только с явным подтверждением
- **Идемпотентность** - повторные запуски безопасны

## 📋 Основные команды

```bash
# Информация
--help              # Полная справка
--version           # Информация о версии
--diagnose          # Диагностика проекта

# Режимы работы
--dry-run          # Предпросмотр изменений
--interactive      # Интерактивная настройка
--force            # Перезаписать существующие файлы

# Дополнительные модули
--msw              # MSW для API моков
--hooks            # Git hooks с Husky
--github           # GitHub Actions CI/CD

# Настройки
--framework <name>  # Указать фреймворк
--dir <path>       # Указать директорию
```

## 🔧 Требования

- **Node.js**: 16.0.0+
- **npm/yarn/pnpm/bun**: любой менеджер пакетов
- **Git**: для hooks (опционально)

## 📞 Поддержка

- **Документация**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Issues**: создайте issue с выводом `--diagnose`

---

**ЭМТ v3.0-stable** - надежный выбор для production проектов! 🚀
