#!/usr/bin/env pwsh

# Скрипт для быстрого запуска конкретных типов тестов

param(
    [Parameter(Position=0)]
    [ValidateSet("unit", "integration", "performance", "visual", "e2e", "coverage", "all", "watch")]
    [string]$TestType = "all",
    
    [Parameter()]
    [string]$Filter = "",
    
    [Parameter()]
    [switch]$Watch = $false,
    
    [Parameter()]
    [switch]$Coverage = $false,
    
    [Parameter()]
    [switch]$Detailed = $false,
    
    [Parameter()]
    [switch]$Help = $false
)

# Функция для отображения справки
function Show-Help {
    Write-Host "🧪 SHINOMONTAGKA Test Runner" -ForegroundColor Cyan
    Write-Host "Использование: ./scripts/test-runner.ps1 [тип] [опции]" -ForegroundColor White
    Write-Host ""
    Write-Host "ТИПЫ ТЕСТОВ:" -ForegroundColor Yellow
    Write-Host "  unit         - Юнит-тесты компонентов" -ForegroundColor Gray
    Write-Host "  integration  - Интеграционные тесты" -ForegroundColor Gray
    Write-Host "  performance  - Тесты производительности" -ForegroundColor Gray
    Write-Host "  visual       - Визуальные тесты UI" -ForegroundColor Gray
    Write-Host "  e2e          - End-to-End тесты" -ForegroundColor Gray
    Write-Host "  coverage     - Анализ покрытия кода" -ForegroundColor Gray
    Write-Host "  all          - Все тесты (по умолчанию)" -ForegroundColor Gray
    Write-Host "  watch        - Режим наблюдения" -ForegroundColor Gray
    Write-Host ""
    Write-Host "ОПЦИИ:" -ForegroundColor Yellow
    Write-Host "  -Filter      - Фильтр по имени теста" -ForegroundColor Gray
    Write-Host "  -Watch       - Запустить в режиме наблюдения" -ForegroundColor Gray
    Write-Host "  -Coverage    - Включить анализ покрытия" -ForegroundColor Gray
    Write-Host "  -Detailed    - Подробный вывод" -ForegroundColor Gray
    Write-Host ""
    Write-Host "ПРИМЕРЫ:" -ForegroundColor Yellow
    Write-Host "  ./scripts/test-runner.ps1 unit" -ForegroundColor Gray
    Write-Host "  ./scripts/test-runner.ps1 unit -Filter Calculator" -ForegroundColor Gray
    Write-Host "  ./scripts/test-runner.ps1 integration -Watch" -ForegroundColor Gray
    Write-Host "  ./scripts/test-runner.ps1 all -Coverage" -ForegroundColor Gray
}

# Проверка аргументов справки
if ($Help -or $args -contains "-h" -or $args -contains "--help" -or $args -contains "help") {
    Show-Help
    exit 0
}

# Создание директории для отчетов
if (-not (Test-Path "tests/reports")) {
    New-Item -ItemType Directory -Path "tests/reports" -Force | Out-Null
}

# Базовые параметры для Vitest
$BaseArgs = @("--config=tests/vitest.config.ts")

if ($Detailed) {
    $BaseArgs += "--reporter=verbose"
}

if ($Watch -or $TestType -eq "watch") {
    $BaseArgs += "--watch"
}

if ($Coverage) {
    $BaseArgs += "--coverage"
}

if ($Filter) {
    $BaseArgs += "--grep=$Filter"
}

# Функция запуска тестов
function Invoke-TestCommand {
    param($TestPath, $TestName)
    
    Write-Host "🧪 Запуск $TestName..." -ForegroundColor Cyan
    
    # Формируем команду для npm run test
    $BaseCommand = "npm"
    $RunArgs = @("run")
    
    if ($Watch -or $TestType -eq "watch") {
        $RunArgs += "test:watch"
        $RunArgs += "--"
        $RunArgs += $TestPath
    } else {
        $RunArgs += "test"
        $RunArgs += "--"
        $RunArgs += $TestPath
    }
    
    $CommandString = "$BaseCommand $($RunArgs -join ' ')"
    Write-Host "Команда: $CommandString" -ForegroundColor Gray
    
    $Process = Start-Process -FilePath $BaseCommand -ArgumentList $RunArgs -Wait -PassThru -NoNewWindow
    
    if ($Process.ExitCode -eq 0) {
        Write-Host "✅ $TestName завершены успешно" -ForegroundColor Green
    } else {
        Write-Host "❌ $TestName завершились с ошибками" -ForegroundColor Red
    }
    
    return $Process.ExitCode
}

# Выполнение тестов в зависимости от типа
switch ($TestType) {
    "unit" {
        Invoke-TestCommand "tests/unit" "Юнит-тесты"
    }
    
    "integration" {
        Invoke-TestCommand "tests/integration" "Интеграционные тесты"
    }
    
    "performance" {
        Invoke-TestCommand "tests/performance" "Тесты производительности"
    }
    
    "visual" {
        Invoke-TestCommand "tests/visual" "Визуальные тесты"
    }
    
    "e2e" {
        Write-Host "🌐 Запуск E2E тестов с Playwright..." -ForegroundColor Cyan
        
        # Проверка установки Playwright
        if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
            Write-Error "npx не найден. Установите Node.js."
            exit 1
        }
        
        # Проверка и установка Playwright если необходимо
        if (-not (Test-Path "node_modules/@playwright/test")) {
            Write-Host "📦 Установка Playwright..." -ForegroundColor Yellow
            npm install @playwright/test
            npx playwright install
        }
        
        $PlaywrightArgs = @("playwright", "test")
        if ($Detailed) { $PlaywrightArgs += "--reporter=list" }
        if ($Filter) { $PlaywrightArgs += "--grep=$Filter" }
        
        & npx @PlaywrightArgs
    }
    
    "coverage" {
        Write-Host "📊 Генерация отчета о покрытии..." -ForegroundColor Cyan
        Invoke-TestCommand "tests/unit tests/integration" "Анализ покрытия кода"
        
        if (Test-Path "tests/coverage/index.html") {
            Write-Host "📁 Отчет о покрытии: tests/coverage/index.html" -ForegroundColor Green
            
            # Попытка открыть отчет в браузере
            try {
                Start-Process "tests/coverage/index.html"
            } catch {
                Write-Host "💡 Откройте tests/coverage/index.html в браузере для просмотра отчета" -ForegroundColor Yellow
            }
        }
    }
    
    "watch" {
        Write-Host "👀 Запуск в режиме наблюдения..." -ForegroundColor Cyan
        Write-Host "Нажмите Ctrl+C для остановки" -ForegroundColor Gray
        
        $WatchArgs = @("vitest") + $BaseArgs + @("--watch", "tests/unit", "tests/integration")
        & npx @WatchArgs
    }
    
    "all" {
        Write-Host "🎯 Запуск всех тестов..." -ForegroundColor Cyan
        
        $AllPassed = $true
        
        # Юнит-тесты
        $Result1 = Invoke-TestCommand "tests/unit" "Юнит-тесты"
        if ($Result1 -ne 0) { $AllPassed = $false }
        
        # Интеграционные тесты
        $Result2 = Invoke-TestCommand "tests/integration" "Интеграционные тесты"
        if ($Result2 -ne 0) { $AllPassed = $false }
        
        # Тесты производительности
        $Result3 = Invoke-TestCommand "tests/performance" "Тесты производительности"
        if ($Result3 -ne 0) { $AllPassed = $false }
        
        # Визуальные тесты
        $Result4 = Invoke-TestCommand "tests/visual" "Визуальные тесты"
        if ($Result4 -ne 0) { $AllPassed = $false }
        
        # Итоговый результат
        Write-Host "`n" + "="*50 -ForegroundColor Cyan
        if ($AllPassed) {
            Write-Host "🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "⚠️  НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ!" -ForegroundColor Red
            exit 1
        }
    }
    
    default {
        Write-Error "Неизвестный тип тестов: $TestType"
        Show-Help
        exit 1
    }
}

# Показать отчеты если они есть
if ((Test-Path "tests/reports") -and -not ($Watch -or $TestType -eq "watch")) {
    Write-Host "`n📁 Отчеты доступны в:" -ForegroundColor Yellow
    Get-ChildItem "tests/reports" | ForEach-Object {
        Write-Host "   • $($_.Name)" -ForegroundColor Gray
    }
}
