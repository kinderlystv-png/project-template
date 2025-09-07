# PowerShell скрипт для управления Docker контейнерами SHINOMONTAGKA
param(
    [Parameter(Position=0)]
    [ValidateSet("development", "dev", "test", "production", "prod", "down", "logs", "clean")]
    [string]$Environment = "development",
    
    [switch]$Help,
    [switch]$Detached,
    [switch]$Build
)

# Цвета для вывода
$Colors = @{
    Green = "Green"
    Blue = "Cyan"
    Yellow = "Yellow"
    Red = "Red"
    White = "White"
}

function Write-Header {
    param([string]$Message)
    Write-Host "===========================================" -ForegroundColor $Colors.Blue
    Write-Host "  $Message" -ForegroundColor $Colors.Blue
    Write-Host "===========================================" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Colors.Red
}

function Show-Help {
    Write-Header "SHINOMONTAGKA Docker Management Script"
    Write-Host ""
    Write-Host "Использование:" -ForegroundColor $Colors.White
    Write-Host "  .\docker\run.ps1 [ENVIRONMENT] [OPTIONS]" -ForegroundColor $Colors.Blue
    Write-Host ""
    Write-Host "Окружения:" -ForegroundColor $Colors.White
    Write-Host "  development, dev    Запуск в режиме разработки" -ForegroundColor $Colors.Blue
    Write-Host "  test               Запуск тестов" -ForegroundColor $Colors.Blue
    Write-Host "  production, prod   Запуск в продакшен режиме" -ForegroundColor $Colors.Blue
    Write-Host "  down              Остановка всех контейнеров" -ForegroundColor $Colors.Blue
    Write-Host "  logs              Просмотр логов" -ForegroundColor $Colors.Blue
    Write-Host "  clean             Очистка всех контейнеров и образов" -ForegroundColor $Colors.Blue
    Write-Host ""
    Write-Host "Опции:" -ForegroundColor $Colors.White
    Write-Host "  -Detached         Запуск в фоновом режиме" -ForegroundColor $Colors.Blue
    Write-Host "  -Build            Пересборка образов" -ForegroundColor $Colors.Blue
    Write-Host "  -Help             Показать это сообщение" -ForegroundColor $Colors.Blue
    Write-Host ""
    Write-Host "Примеры:" -ForegroundColor $Colors.White
    Write-Host "  .\docker\run.ps1 dev" -ForegroundColor $Colors.Blue
    Write-Host "  .\docker\run.ps1 test" -ForegroundColor $Colors.Blue
    Write-Host "  .\docker\run.ps1 prod -Detached" -ForegroundColor $Colors.Blue
    exit 0
}

if ($Help) {
    Show-Help
}

# Проверка наличия Docker
try {
    $null = docker --version
    Write-Success "Docker найден"
} catch {
    Write-Error "Docker не установлен или не доступен"
    exit 1
}

# Проверка наличия Docker Compose
try {
    $null = docker-compose --version
    Write-Success "Docker Compose найден"
} catch {
    Write-Error "Docker Compose не установлен или не доступен"
    exit 1
}

# Создание файла окружения если не существует
$envFile = ".env.$Environment"
if (-not (Test-Path $envFile) -and $Environment -ne "down" -and $Environment -ne "logs" -and $Environment -ne "clean") {
    Write-Warning "Файл $envFile не найден. Создаём из шаблона..."
    $templateFile = ".env.example.$Environment"
    if (Test-Path $templateFile) {
        Copy-Item $templateFile $envFile
        Write-Success "Создан файл $envFile из шаблона"
    } else {
        Write-Warning "Шаблон не найден. Создаём базовый файл окружения..."
        "NODE_ENV=$Environment" | Out-File -FilePath $envFile -Encoding utf8
        Write-Success "Создан базовый файл $envFile"
    }
}

# Определение команд docker-compose
$composeArgs = @()
if ($Build) { $composeArgs += "--build" }
if ($Detached) { $composeArgs += "-d" }

switch ($Environment) {
    { $_ -in "development", "dev" } {
        Write-Header "Запуск в режиме разработки"
        Write-Warning "Убедитесь, что порты 3000 и 24678 свободны"
        $composeFile = "docker-compose.yml"
        docker-compose -f $composeFile up @composeArgs
    }
    "test" {
        Write-Header "Запуск тестов"
        $composeFile = "docker-compose.test.yml"
        docker-compose -f $composeFile up --build --abort-on-container-exit
    }
    { $_ -in "production", "prod" } {
        Write-Header "Запуск в продакшен режиме"
        Write-Warning "Убедитесь, что переменные окружения настроены корректно"
        $composeFile = "docker-compose.prod.yml"
        docker-compose -f $composeFile up @composeArgs
        if ($Detached) {
            Write-Success "Приложение запущено в фоновом режиме"
            Write-Host "Для просмотра логов используйте: " -NoNewline -ForegroundColor $Colors.Blue
            Write-Host "docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor $Colors.White
            Write-Host "Для остановки используйте: " -NoNewline -ForegroundColor $Colors.Blue
            Write-Host "docker-compose -f docker-compose.prod.yml down" -ForegroundColor $Colors.White
        }
    }
    "down" {
        Write-Header "Остановка всех контейнеров"
        docker-compose -f docker-compose.yml down --remove-orphans 2>$null
        docker-compose -f docker-compose.test.yml down --remove-orphans 2>$null
        docker-compose -f docker-compose.prod.yml down --remove-orphans 2>$null
        Write-Success "Все контейнеры остановлены"
    }
    "logs" {
        Write-Header "Просмотр логов"
        Write-Host "Выберите окружение для просмотра логов (dev/test/prod): " -NoNewline -ForegroundColor $Colors.Blue
        $logEnv = Read-Host
        switch ($logEnv) {
            { $_ -in "dev", "development" } {
                docker-compose -f docker-compose.yml logs -f
            }
            "test" {
                docker-compose -f docker-compose.test.yml logs -f
            }
            { $_ -in "prod", "production" } {
                docker-compose -f docker-compose.prod.yml logs -f
            }
            default {
                Write-Error "Неизвестное окружение: $logEnv"
            }
        }
    }
    "clean" {
        Write-Header "Очистка контейнеров и образов"
        Write-Warning "Это удалит все контейнеры и образы SHINOMONTAGKA"
        $confirm = Read-Host "Продолжить? (y/N)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            docker-compose -f docker-compose.yml down --rmi all --volumes --remove-orphans 2>$null
            docker-compose -f docker-compose.test.yml down --rmi all --volumes --remove-orphans 2>$null
            docker-compose -f docker-compose.prod.yml down --rmi all --volumes --remove-orphans 2>$null
            docker system prune -f
            Write-Success "Очистка завершена"
        } else {
            Write-Warning "Очистка отменена"
        }
    }
    default {
        Write-Error "Неизвестное окружение: $Environment"
        Show-Help
    }
}

Write-Success "Операция завершена успешно!"
