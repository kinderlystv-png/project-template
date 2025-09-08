param(
    [string]$ProcessName = "node",
    [int]$RefreshSeconds = 3
)

# Простой скрипт мониторинга без сложных зависимостей
Write-Host "🔍 Простой мониторинг процессов '$ProcessName'" -ForegroundColor Green
Write-Host "⏱️  Обновление каждые $RefreshSeconds секунд" -ForegroundColor Yellow
Write-Host "⛔ Для остановки нажмите Ctrl+C" -ForegroundColor Red
Write-Host ("=" * 60) -ForegroundColor Cyan

while ($true) {
    Clear-Host
    Write-Host "🕒 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Мониторинг процессов: $ProcessName" -ForegroundColor Green
    Write-Host ("=" * 60) -ForegroundColor Cyan
    
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    
    if ($processes) {
        Write-Host "✅ Найдено процессов: $($processes.Count)" -ForegroundColor Green
        $processes | Format-Table Id, ProcessName, CPU, WorkingSet, StartTime -AutoSize
    } else {
        Write-Host "❌ Процессы '$ProcessName' не найдены" -ForegroundColor Red
    }
    
    Write-Host "🔄 Следующее обновление через $RefreshSeconds секунд..." -ForegroundColor Yellow
    Start-Sleep -Seconds $RefreshSeconds
}
