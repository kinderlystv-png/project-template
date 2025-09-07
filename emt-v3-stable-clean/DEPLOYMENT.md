# 🚀 ЭМТ v3.0-stable - Инструкция по развертыванию

## 📦 Способы развертывания

### Способ 1: Копирование модуля (рекомендуется)

```bash
# Копируем главный файл в корень проекта
copy utils\project-detector-v3.0-stable.js c:\your-project\

# Или копируем всю папку utils
xcopy utils c:\your-project\utils\ /E
```

### Способ 2: Установка NPM пакета

```bash
# NPM пакет находится в архиве
npm install c:\kinderly-events\emt-archive\emt-stable-3.0.0-stable.tgz
npx emt --diagnose
```

### Способ 3: Прямое использование

```bash
node c:\kinderly-events\emt-v3-stable-clean\utils\project-detector-v3.0-stable.js --diagnose
```

## 🔍 Процесс интеграции

### 1. Анализ проекта

```bash
node utils/project-detector-v3.0-stable.js --diagnose
```

Показывает:

- Определенный фреймворк
- Существующие тесты
- Текущие конфигурации
- Рекомендации

### 2. Предпросмотр изменений

```bash
node utils/project-detector-v3.0-stable.js --dry-run
```

Покажет что будет создано/изменено без применения.

### 3. Применение изменений

```bash
# Базовая интеграция
node utils/project-detector-v3.0-stable.js

# С дополнительными модулями
node utils/project-detector-v3.0-stable.js --msw --hooks --github

# Интерактивный режим
node utils/project-detector-v3.0-stable.js --interactive
```

### 4. Установка зависимостей

После интеграции выполните команды, которые покажет ЭМТ:

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/jest-dom ...
```

### 5. Запуск тестов

```bash
npm test
npm run test:ui
npm run test:coverage
```

## ⚙️ Конфигурация

### Поддерживаемые опции

- `--diagnose` - только анализ
- `--dry-run` - предпросмотр
- `--force` - перезапись файлов
- `--framework <name>` - указать фреймворк
- `--dir <path>` - указать директорию
- `--msw` - настроить MSW моки
- `--hooks` - настроить Git hooks
- `--github` - создать GitHub Actions
- `--interactive` - интерактивный режим

### Поддерживаемые фреймворки

- `nextjs` - Next.js проекты
- `react` - React приложения
- `vue` - Vue.js проекты
- `svelte` - Svelte приложения
- `angular` - Angular проекты
- `vanilla` - Vanilla JS/TS

## 🛡️ Безопасность

### Рекомендуемая последовательность

1. **Backup** - сделайте резервную копию важных файлов
2. **Диагностика** - `--diagnose` для анализа
3. **Предпросмотр** - `--dry-run` для проверки
4. **Применение** - основная команда
5. **Тестирование** - проверка работоспособности

### Что безопасно

- ✅ Диагностика не меняет файлы
- ✅ Dry-run показывает изменения
- ✅ Существующие файлы не перезаписываются без --force
- ✅ Можно отменить изменения

## 🔧 Troubleshooting

### Проблемы с правами

```bash
# Linux/macOS
chmod +x utils/project-detector-v3.0-stable.js

# Windows PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Проблемы с ES modules

Убедитесь что в package.json есть:

```json
{
  "type": "module"
}
```

### Конфликты зависимостей

При конфликтах используйте:

```bash
npm install --legacy-peer-deps
```

## 📊 Результаты интеграции

После успешной интеграции у вас будет:

- ✅ Настроенный Vitest
- ✅ Структура тестов
- ✅ Примеры тестов
- ✅ Data factories
- ✅ Test utilities
- ✅ MSW моки (опционально)
- ✅ Git hooks (опционально)
- ✅ CI/CD (опционально)

---

**Готово к тестированию!** 🎯
