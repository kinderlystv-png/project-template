param(
    [int]$RefreshSeconds = 5
)

# Скрипт для мониторинга статуса всех терминалов и процессов разработки
Write-Host "🖥️  МОНИТОРИНГ СТАТУСА ТЕРМИНАЛОВ И ПРОЦЕССОВ" -ForegroundColor Cyan
Write-Host "⏱️  Обновление каждые $RefreshSeconds секунд" -ForegroundColor Yellow
Write-Host "⛔ Для остановки нажмите Ctrl+C" -ForegroundColor Red
Write-Host ("=" * 80) -ForegroundColor Cyan

function Get-ProcessInfo {
    param($ProcessName)
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($processes) {
        return @{
            Count = $processes.Count
            MemoryMB = [math]::Round(($processes | Measure-Object WorkingSet -Sum).Sum / 1MB, 1)
            Status = "✅ Активен"
            Color = "Green"
        }
    } else {
        return @{
            Count = 0
            MemoryMB = 0
            Status = "❌ Остановлен"
            Color = "Red"
        }
    }
}

while ($true) {
    Clear-Host
    
    # Заголовок с временем
    Write-Host "🕒 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - СТАТУС СИСТЕМЫ РАЗРАБОТКИ" -ForegroundColor Cyan
    Write-Host ("=" * 80) -ForegroundColor Cyan
    
    # Мониторинг процессов
    Write-Host "`n📋 СТАТУС ПРОЦЕССОВ:" -ForegroundColor Yellow
    
    # Node.js процессы (dev сервер)
    $nodeInfo = Get-ProcessInfo "node"
    Write-Host "  🟢 Node.js (Dev Server):  " -NoNewline
    Write-Host "$($nodeInfo.Status)" -ForegroundColor $nodeInfo.Color -NoNewline
    if ($nodeInfo.Count -gt 0) {
        Write-Host "  [Процессов: $($nodeInfo.Count), Память: $($nodeInfo.MemoryMB) MB]" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
    
    # PowerShell процессы
    $psInfo = Get-ProcessInfo "powershell"
    Write-Host "  🔵 PowerShell:            " -NoNewline
    Write-Host "$($psInfo.Status)" -ForegroundColor $psInfo.Color -NoNewline
    if ($psInfo.Count -gt 0) {
        Write-Host "  [Процессов: $($psInfo.Count), Память: $($psInfo.MemoryMB) MB]" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
    
    # VS Code процессы
    $codeInfo = Get-ProcessInfo "Code"
    Write-Host "  🎨 VS Code:               " -NoNewline
    Write-Host "$($codeInfo.Status)" -ForegroundColor $codeInfo.Color -NoNewline
    if ($codeInfo.Count -gt 0) {
        Write-Host "  [Процессов: $($codeInfo.Count), Память: $($codeInfo.MemoryMB) MB]" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
    
    # Статус портов
    Write-Host "`n🌐 СТАТУС ПОРТОВ:" -ForegroundColor Yellow
    
    # Проверка порта 5173 (Vite dev server)
    try {
        # Несколько способов проверки порта
        $port5173_netstat = netstat -an | Select-String ":5173.*LISTENING"
        $port5173_test = Test-NetConnection -ComputerName "localhost" -Port 5173 -InformationLevel Quiet -ErrorAction SilentlyContinue
        
        if ($port5173_netstat -or $port5173_test) {
            Write-Host "  🟢 Порт 5173 (Vite):      ✅ Слушает" -ForegroundColor Green
            Write-Host "     📍 URL: http://localhost:5173" -ForegroundColor Cyan
        } else {
            Write-Host "  🔴 Порт 5173 (Vite):      ❌ Не активен" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ⚠️  Порт 5173 (Vite):      ❓ Не удалось проверить" -ForegroundColor Yellow
    }
    
    # Системная информация (совместимая версия)
    Write-Host "`n💻 СИСТЕМА:" -ForegroundColor Yellow
    try {
        # Используем CIM вместо WMI для совместимости
        $memory = Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction SilentlyContinue
        $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction SilentlyContinue
        
        if ($memory -and $os) {
            $totalMemoryGB = [math]::Round($memory.TotalPhysicalMemory / 1GB, 1)
            $freeMemoryGB = [math]::Round($os.FreePhysicalMemory / 1MB / 1024, 1)
            $usedMemoryGB = [math]::Round($totalMemoryGB - $freeMemoryGB, 1)
            Write-Host "  💾 Память: $usedMemoryGB GB / $totalMemoryGB GB используется" -ForegroundColor Gray
        } else {
            Write-Host "  💾 Память: Информация недоступна" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  💾 Память: Ошибка получения данных" -ForegroundColor Red
    }
    
    # Быстрые команды
    Write-Host "`n⚡ БЫСТРЫЕ КОМАНДЫ:" -ForegroundColor Yellow
    Write-Host "  Ctrl+Shift+D - Запустить dev сервер" -ForegroundColor Cyan
    Write-Host "  Ctrl+Shift+R - Перезапустить dev сервер" -ForegroundColor Cyan
    Write-Host "  Ctrl+Shift+S - Остановить все node процессы" -ForegroundColor Cyan
    
    Write-Host "`n🔄 Следующее обновление через $RefreshSeconds секунд..." -ForegroundColor Yellow
    Write-Host ("=" * 80) -ForegroundColor DarkGray
    
    Start-Sleep -Seconds $RefreshSeconds
}
