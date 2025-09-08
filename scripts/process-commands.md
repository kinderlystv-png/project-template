# Полезные команды для мониторинга процессов

# Сохранено в: scripts/process-commands.md

## PowerShell команды:

### Основные:

```powershell
# Все процессы Node.js
Get-Process -Name "node" -ErrorAction SilentlyContinue

# Процессы, использующие порт 3000
netstat -ano | findstr ":3000"

# Процессы по имени с подробностями
Get-Process chrome | Format-List *

# Убить процесс по PID
Stop-Process -Id 1234 -Force

# Убить все процессы по имени
Stop-Process -Name "node" -Force
```

### Продвинутые:

```powershell
# Топ процессов по CPU
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10

# Процессы с высоким использованием памяти
Get-Process | Where-Object {$_.WorkingSet -gt 100MB}

# Мониторинг определенного процесса
Get-Process -Id 1234 | Select-Object ProcessName, CPU, WorkingSet

# Экспорт списка процессов в CSV
Get-Process | Export-Csv -Path "processes.csv" -NoTypeInformation
```

### CMD команды:

```cmd
# Список всех процессов
tasklist

# Процессы, использующие порт
netstat -ano | findstr ":5173"

# Убить процесс
taskkill /PID 1234 /F
taskkill /IM "node.exe" /F
```

## Графические инструменты:

1. **Диспетчер задач**: Ctrl+Shift+Esc
2. **Монитор ресурсов**: resmon
3. **Process Explorer**: https://docs.microsoft.com/sysinternals/downloads/process-explorer
4. **Process Monitor**: https://docs.microsoft.com/sysinternals/downloads/procmon

## VS Code расширения:

1. **Task Manager** - мониторинг прямо в VS Code
2. **System Monitor** - системная информация в статусной строке
