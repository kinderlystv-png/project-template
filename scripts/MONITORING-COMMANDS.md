# Команды для мониторинга процессов

## VS Code Горячие клавиши

### Основные команды разработки

- **Ctrl+Shift+D** - Запустить dev сервер (`pnpm run dev`)
- **Ctrl+Shift+R** - Перезапустить dev сервер (остановить node + запустить dev)
- **Ctrl+Shift+S** - Остановить все процессы node

### Мониторинг процессов

- **Ctrl+Shift+A** - Показать активные процессы node в текущем терминале
- **Ctrl+Shift+F** - Запустить мониторинг в текущем терминале
- **Ctrl+Shift+T** - Запустить комплексный мониторинг статуса всех терминалов ⭐ **РЕКОМЕНДУЕТСЯ**
- **Ctrl+Shift+B** - Запустить расширенный мониторинг в отдельном окне PowerShell (с автоматической настройкой политик)
- **Ctrl+Shift+V** - Запустить простой мониторинг в отдельном окне PowerShell (без сложных зависимостей)
- **Ctrl+Shift+M** - Показать все активные процессы PowerShell

## ⭐ Рекомендуемый рабочий процесс

### Для сплит терминала (идеально подходит):

1. **Левая панель:** Основной PowerShell терминал для команд
2. **Правая панель:** Мониторинг - нажмите **Ctrl+Shift+T**

### Что показывает мониторинг:

- 🟢 **Node.js Dev Server** - статус и потребление памяти
- 🔵 **PowerShell процессы** - количество и память
- 🎨 **VS Code** - статус и потребление памяти
- 🌐 **Порт 5173** - доступность Vite dev сервера
- 💻 **Системная память** - общее потребление

### Автообновление каждые 5 секунд с цветовой индикацией!

## Ручные команды PowerShell

### Комплексный мониторинг статуса (рекомендуется)

```powershell
.\scripts\terminal-status-monitor.ps1 -RefreshSeconds 5
```

### Простой мониторинг процессов

```powershell
.\scripts\simple-monitor.ps1 -ProcessName node -RefreshSeconds 3
```

### Расширенный мониторинг

```powershell
.\scripts\monitor-processes.ps1 -ProcessName node -RefreshSeconds 3
```

### Фоновый запуск в отдельном окне

```powershell
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "C:\alphacore\SHINOMONTAGKA"; .\scripts\simple-monitor.ps1 -ProcessName node -RefreshSeconds 3' -WindowStyle Normal
```

## Решение проблем

### Проблема: "выполнение сценариев отключено в этой системе"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

### Проблема: "Не удалось загрузить модуль Microsoft.PowerShell.Security"

```powershell
Import-Module Microsoft.PowerShell.Security -Force
```

### Проблема: "Не удалось загрузить модуль PSReadline"

Используйте простой скрипт мониторинга:

```powershell
.\scripts\simple-monitor.ps1
```

## Параметры скриптов

### simple-monitor.ps1

- `-ProcessName` - Имя процесса для мониторинга (по умолчанию: "node")
- `-RefreshSeconds` - Интервал обновления в секундах (по умолчанию: 3)

### monitor-processes.ps1

- `-ProcessName` - Имя процесса для мониторинга (по умолчанию: "node")
- `-RefreshSeconds` - Интервал обновления в секундах (по умолчанию: 3)
- Дополнительные функции: цветная подсветка, автоочистка, статистика памяти

## Остановка мониторинга

- В том же терминале: **Ctrl+C**
- Закрыть отдельное окно PowerShell: просто закройте окно
- Остановить все процессы PowerShell (кроме текущего): **Ctrl+Shift+M** и следуйте инструкциям
