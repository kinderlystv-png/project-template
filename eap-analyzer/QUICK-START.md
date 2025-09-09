# 🚀 Быстрый старт с EAP Analyzer v3.0

## 📦 Установка

### Метод 1: NPM (Рекомендуется)
```bash
npm install @kinderlystv-png/eap-analyzer
npx @kinderlystv-png/eap-analyzer
```

### Метод 2: Клонирование
```bash
git clone https://github.com/kinderlystv-png/eap-analyzer.git
cd eap-analyzer
npm install
npm run quick-analyze
```

### Метод 3: Копирование папки
```bash
# Скопируйте папку eap-analyzer в ваш проект
# Перейдите в папку и запустите:
npm install
npm run quick-analyze
```

## 🎯 Быстрые команды

```bash
# Анализ текущей папки (ES модули - по умолчанию)
npm run quick-analyze

# Анализ конкретного проекта
npm run quick-analyze:project /path/to/project

# Анализ через CommonJS (для совместимости)
npm run quick-analyze:cjs

# Полный анализ с AI рекомендациями
npm run analyze
```

## 🔧 Совместимость модулей

### ES Modules (современный стандарт)
- Файл: `bin/quick-analyze.js`
- Команда: `npm run quick-analyze`
- Поддерживает: Node.js 14+, современные проекты

### CommonJS (классический формат)
- Файл: `bin/quick-analyze.cjs`
- Команда: `npm run quick-analyze:cjs`
- Поддерживает: Все версии Node.js, legacy проекты

## 📊 Что анализируется

- 📁 **Структура проекта**: файлы, размеры, типы
- � **Качество кода**: сложность, дублирование, стиль
- 🔒 **Безопасность**: уязвимости, небезопасные паттерны
- ⚡ **Производительность**: медленные операции, оптимизации
- 💸 **Технический долг**: TODO/FIXME, legacy код
- 💰 **ROI расчеты**: экономия времени и денег

## Пример результата

```
🎯 ОБЩИЙ РЕЗУЛЬТАТ:
   Оценка: 85% (178/210 баллов)
   Оценка: B+
👍 Хорошо! Есть области для улучшения.
```

## Что проверяется?

- 🧪 **Тестирование** (Vitest, Playwright, Coverage)
- 🐳 **Docker** (Контейнеризация, Безопасность)
- 🔄 **CI/CD** (Автоматизация, Развертывание)
- 📝 **Качество кода** (Линтинг, Форматирование)
- 📦 **Зависимости** (Актуальность, Безопасность)

## Больше информации?

📖 [Полная документация](README.md)
