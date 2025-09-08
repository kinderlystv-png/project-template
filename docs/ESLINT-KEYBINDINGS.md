# ESLint VS Code Горячие Клавиши

Добавьте эти горячие клавиши в ваш `keybindings.json` (Ctrl+Shift+P → "Preferences: Open Keyboard Shortcuts (JSON)"):

```json
{
  // ESLint команды
  {
    "key": "ctrl+shift+l",
    "command": "workbench.action.terminal.sendSequence",
    "args": {
      "text": "pnpm run lint\n"
    }
  },
  {
    "key": "ctrl+shift+x",
    "command": "workbench.action.terminal.sendSequence",
    "args": {
      "text": "pnpm run lint:fix\n"
    }
  },
  {
    "key": "ctrl+shift+h",
    "command": "workbench.action.terminal.sendSequence",
    "args": {
      "text": "pnpm run lint:report\n"
    }
  },
  {
    "key": "ctrl+shift+e",
    "command": "workbench.action.terminal.sendSequence",
    "args": {
      "text": ".\\scripts\\test-eslint-integration.ps1\n"
    }
  }
}
```

## Команды:

- **Ctrl+Shift+L** - Запустить ESLint проверку
- **Ctrl+Shift+X** - Запустить ESLint с автоисправлением
- **Ctrl+Shift+H** - Сгенерировать HTML отчет
- **Ctrl+Shift+E** - Протестировать интеграцию ESLint

## Автоматические действия VS Code:

- **При сохранении файла**: автоматический запуск ESLint fix
- **При вводе кода**: подсветка ошибок в реальном времени
- **При commit**: автоматическая проверка через pre-commit hook
