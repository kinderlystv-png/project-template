# Скрипт мониторинга процессов
# Автор: SHINOMONTAGKA
# Использование: .\monitor-processes.ps1

param(
    [string]$ProcessName = "node",
    [int]$RefreshSeconds = 5,
    [switch]$Background = $false
)

# Сначала очищаем все предыдущие экземпляры мониторинга и CMD процессы
Write-Host "🧹 Очистка предыдущих экземпляров мониторинга..." -ForegroundColor Yellow
taskkill /F /IM powershell.exe /FI "WINDOWTITLE eq *monitor-processes*" 2>$null
taskkill /F /IM cmd.exe 2>$null
Start-Sleep -Seconds 1

# Если запрос фонового режима, запускаем в новом окне
if ($Background) {
    Write-Host "🔄 Запуск мониторинга в фоновом режиме..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-File", $PSCommandPath, "-ProcessName", $ProcessName, "-RefreshSeconds", $RefreshSeconds -WindowStyle Minimized
    Write-Host "✅ Мониторинг запущен в фоне. Терминал свободен для других команд." -ForegroundColor Green
    return
}

# Проверяем, не запущен ли уже другой экземпляр этого скрипта
$currentPID = $PID
$scriptName = $MyInvocation.MyCommand.Name
$runningInstances = Get-WmiObject Win32_Process | Where-Object { 
    $_.Name -eq "powershell.exe" -and 
    $_.CommandLine -like "*$scriptName*" -and 
    $_.ProcessId -ne $currentPID 
}

if ($runningInstances) {
    Write-Host "⚠️  Обнаружен уже запущенный экземпляр мониторинга!" -ForegroundColor Yellow
    Write-Host "🔄 Останавливаю предыдущие экземпляры..." -ForegroundColor Cyan
    $runningInstances | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

Write-Host "🔍 Мониторинг процессов: $ProcessName" -ForegroundColor Green
Write-Host "📊 Обновление каждые $RefreshSeconds секунд" -ForegroundColor Yellow
Write-Host "⏹️  Нажмите Ctrl+C для остановки`n" -ForegroundColor Cyan

while ($true) {
    Clear-Host
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "🕒 $timestamp - Активные процессы: $ProcessName" -ForegroundColor Green
    Write-Host "=" * 80
    
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    
    if ($processes) {
        $processes | Select-Object @{
            Name="PID"; Expression={$_.Id}
        }, @{
            Name="Имя"; Expression={$_.ProcessName}
        }, @{
            Name="CPU(s)"; Expression={[math]::Round($_.CPU, 2)}
        }, @{
            Name="Память(MB)"; Expression={[math]::Round($_.WorkingSet/1MB, 2)}
        }, @{
            Name="Время запуска"; Expression={$_.StartTime}
        } | Format-Table -AutoSize
        
        Write-Host "📈 Всего процессов: $($processes.Count)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Процессы '$ProcessName' не найдены" -ForegroundColor Green
    }
    
    Write-Host "`n🔄 Следующее обновление через $RefreshSeconds секунд..."
    Start-Sleep -Seconds $RefreshSeconds
}
