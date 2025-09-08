# ESLint Integration Guide

## 🎯 Overview

Полная интеграция ESLint для автоматической проверки качества кода в проекте SHINOMONTAGKA.

## 📦 Installed Components

### Dependencies

- `eslint` v9.0.0 - основной линтер
- `@eslint/js` - базовые правила JavaScript
- `typescript-eslint` - поддержка TypeScript
- `eslint-plugin-svelte` - поддержка Svelte
- `eslint-config-prettier` - совместимость с Prettier
- `globals` - глобальные переменные

### Configuration Files

- `eslint.config.js` - основная конфигурация ESLint
- `.eslintignore` - файлы для игнорирования
- `.vscode/settings.json` - интеграция с VS Code
- `.husky/pre-commit` - Git хуки для автопроверки

## 🚀 Commands

### NPM Scripts

```bash
pnpm run lint          # Проверка кода
pnpm run lint:fix       # Автоисправление
pnpm run lint:report    # HTML отчет
```

### PowerShell Scripts

```bash
./scripts/eslint-setup.ps1           # Установка и проверка
./scripts/test-eslint-integration.ps1 # Тестирование интеграции
```

## ⚡ VS Code Integration

### Automatic Features

- ✅ Real-time error highlighting
- ✅ Auto-fix on save
- ✅ Import organization
- ✅ Code actions and quick fixes

### Manual Commands

- `Ctrl+Shift+P` → "ESLint: Fix all auto-fixable Problems"
- `Ctrl+Shift+P` → "ESLint: Restart ESLint Server"

## 🔗 Git Integration

### Pre-commit Hooks

- Автоматическая проверка при каждом commit
- Только измененные файлы проверяются (lint-staged)
- Блокировка commit при критических ошибках

### Workflow

1. Пишете код
2. Сохраняете файл → auto-fix применяется
3. Делаете commit → pre-commit проверка
4. Commit разрешается только при отсутствии ошибок

## 📊 Monitoring

### Reports

- HTML отчеты в `reports/eslint-report.html`
- Детализация по файлам и правилам
- Статистика исправлений

### Real-time Feedback

- Подсветка ошибок в редакторе
- Всплывающие подсказки с исправлениями
- Интеграция с проблемной панелью VS Code

## 🛠 Troubleshooting

### Common Issues

1. **ESLint not working**: Перезапустите VS Code
2. **Config errors**: Проверьте `eslint.config.js` синтаксис
3. **Performance issues**: Добавьте файлы в `.eslintignore`

### Debug Commands

```bash
pnpm eslint --print-config file.ts    # Проверить конфигурацию
pnpm eslint --debug file.ts          # Детальная диагностика
```

## ✅ Success Criteria

- [ ] ESLint установлен и работает
- [ ] VS Code показывает ошибки в реальном времени
- [ ] Auto-fix работает при сохранении
- [ ] Pre-commit хуки блокируют некорректный код
- [ ] Команды lint работают из терминала
- [ ] HTML отчеты генерируются корректно

## 🎉 Phase Complete

ESLint Integration успешно завершена! Качество кода теперь контролируется автоматически на всех этапах разработки.
