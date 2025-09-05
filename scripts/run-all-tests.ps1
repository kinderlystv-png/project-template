#!/usr/bin/env pwsh

# Основной скрипт запуска всех тестов SHINOMONTAGKA

Write-Host "🧪 Запуск полного тестового набора SHINOMONTAGKA" -ForegroundColor Cyan

# Проверка наличия Node.js и npm
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js не найден. Установите Node.js для продолжения."
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm не найден. Установите npm для продолжения."
    exit 1
}

# Функция для отображения результатов
function Show-TestResults {
    param($TestType, $ExitCode)
    
    if ($ExitCode -eq 0) {
        Write-Host "✅ $TestType: ПРОЙДЕНЫ" -ForegroundColor Green
    } else {
        Write-Host "❌ $TestType: ОШИБКИ" -ForegroundColor Red
    }
    return $ExitCode
}

# Создание директории для отчетов
if (-not (Test-Path "tests/reports")) {
    New-Item -ItemType Directory -Path "tests/reports" -Force | Out-Null
}

# Переменные для отслеживания результатов
$AllTestsPassed = $true
$TestResults = @{}

Write-Host "`n📋 Проверка конфигурации тестов..." -ForegroundColor Yellow

# Проверка наличия файлов конфигурации
$RequiredFiles = @(
    "tests/vitest.config.ts",
    "tests/utils/global-setup.ts",
    "src/tests/setup.ts"
)

foreach ($file in $RequiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Warning "Файл конфигурации не найден: $file"
    } else {
        Write-Host "✓ $file" -ForegroundColor Green
    }
}

Write-Host "`n🔧 Установка зависимостей..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Ошибка при установке зависимостей"
    exit 1
}

# 1. Юнит-тесты
Write-Host "`n🧪 Запуск юнит-тестов..." -ForegroundColor Cyan
npx vitest run tests/unit --config=tests/vitest.config.ts --reporter=verbose
$UnitTestResult = Show-TestResults "Юнит-тесты" $LASTEXITCODE
$TestResults.Unit = $UnitTestResult
if ($UnitTestResult -ne 0) { $AllTestsPassed = $false }

# 2. Интеграционные тесты
Write-Host "`n🔗 Запуск интеграционных тестов..." -ForegroundColor Cyan
npx vitest run tests/integration --config=tests/vitest.config.ts --reporter=verbose
$IntegrationTestResult = Show-TestResults "Интеграционные тесты" $LASTEXITCODE
$TestResults.Integration = $IntegrationTestResult
if ($IntegrationTestResult -ne 0) { $AllTestsPassed = $false }

# 3. Тесты производительности
Write-Host "`n⚡ Запуск тестов производительности..." -ForegroundColor Cyan
npx vitest run tests/performance --config=tests/vitest.config.ts --reporter=verbose
$PerformanceTestResult = Show-TestResults "Тесты производительности" $LASTEXITCODE
$TestResults.Performance = $PerformanceTestResult
if ($PerformanceTestResult -ne 0) { $AllTestsPassed = $false }

# 4. Визуальные тесты
Write-Host "`n🎨 Запуск визуальных тестов..." -ForegroundColor Cyan
npx vitest run tests/visual --config=tests/vitest.config.ts --reporter=verbose
$VisualTestResult = Show-TestResults "Визуальные тесты" $LASTEXITCODE
$TestResults.Visual = $VisualTestResult
if ($VisualTestResult -ne 0) { $AllTestsPassed = $false }

# 5. Генерация отчета о покрытии
Write-Host "`n📊 Генерация отчета о покрытии кода..." -ForegroundColor Cyan
npx vitest run --coverage --config=tests/vitest.config.ts
$CoverageResult = Show-TestResults "Покрытие кода" $LASTEXITCODE
$TestResults.Coverage = $CoverageResult

# 6. Линтинг (если доступен)
Write-Host "`n🔍 Проверка качества кода..." -ForegroundColor Cyan
if (Get-Command npx -ErrorAction SilentlyContinue) {
    npx eslint src tests --ext .js,.ts,.svelte
    $LintResult = Show-TestResults "Линтинг" $LASTEXITCODE
    $TestResults.Lint = $LintResult
    if ($LintResult -ne 0) { $AllTestsPassed = $false }
}

# 7. Type checking
Write-Host "`n📝 Проверка типов TypeScript..." -ForegroundColor Cyan
npx tsc --noEmit
$TypeCheckResult = Show-TestResults "Проверка типов" $LASTEXITCODE
$TestResults.TypeCheck = $TypeCheckResult
if ($TypeCheckResult -ne 0) { $AllTestsPassed = $false }

# Итоговый отчет
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "📋 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan

foreach ($test in $TestResults.GetEnumerator()) {
    $status = if ($test.Value -eq 0) { "✅ ПРОЙДЕН" } else { "❌ ПРОВАЛЕН" }
    $color = if ($test.Value -eq 0) { "Green" } else { "Red" }
    Write-Host "$($test.Key): $status" -ForegroundColor $color
}

# Информация о отчетах
Write-Host "`n📁 Отчеты сохранены в:" -ForegroundColor Yellow
Write-Host "   • tests/reports/junit.xml (JUnit формат)" -ForegroundColor Gray
Write-Host "   • tests/reports/results.json (JSON формат)" -ForegroundColor Gray
Write-Host "   • tests/reports/index.html (HTML отчет)" -ForegroundColor Gray
Write-Host "   • tests/coverage/ (Покрытие кода)" -ForegroundColor Gray

# Рекомендации
if (-not $AllTestsPassed) {
    Write-Host "`n💡 РЕКОМЕНДАЦИИ:" -ForegroundColor Yellow
    Write-Host "   • Проверьте логи выше для деталей ошибок" -ForegroundColor Gray
    Write-Host "   • Запустите отдельные тесты для отладки:" -ForegroundColor Gray
    Write-Host "     npm run test:unit" -ForegroundColor Gray
    Write-Host "     npm run test:integration" -ForegroundColor Gray
    Write-Host "     npm run test:performance" -ForegroundColor Gray
    Write-Host "   • Откройте HTML отчет для детального анализа" -ForegroundColor Gray
}

# Финальный результат
if ($AllTestsPassed) {
    Write-Host "`n🎉 ВСЕ ТЕСТЫ УСПЕШНО ПРОЙДЕНЫ!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ!" -ForegroundColor Red
    exit 1
}
