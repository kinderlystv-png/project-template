# PowerShell скрипт для запуска EAP анализатора в Docker
param(
    [Parameter(Position=0)]
    [string]$Command = "help",

    [Parameter(Position=1)]
    [string]$ProjectPath = "",

    [Parameter(ValueFromRemainingArguments)]
    [string[]]$Arguments = @()
)

# Функции для цветного вывода
function Write-Log {
    param([string]$Message)
    Write-Host "[EAP] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[EAP WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[EAP ERROR] $Message" -ForegroundColor Red
    exit 1
}

# Проверка зависимостей
function Test-Dependencies {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker не установлен. Установите Docker Desktop и повторите попытку."
    }

    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        if (-not (Get-Command docker -ErrorAction SilentlyContinue | Where-Object { $_.Source -like "*compose*" })) {
            Write-Warning "docker-compose не найден. Попробуем использовать 'docker compose'."
            $script:DockerCompose = "docker compose"
        } else {
            $script:DockerCompose = "docker compose"
        }
    } else {
        $script:DockerCompose = "docker-compose"
    }
}

# Показать справку
function Show-Help {
    Write-Host "Эталонный Анализатор Проектов (ЭАП) - Docker Runner" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Использование:"
    Write-Host "  .\run.ps1 [КОМАНДА] [ОПЦИИ]"
    Write-Host ""
    Write-Host "Команды:"
    Write-Host "  analyze PROJECT_PATH    Анализировать проект"
    Write-Host "  build                   Собрать Docker образы"
    Write-Host "  web                     Запустить веб-интерфейс"
    Write-Host "  monitor                 Запустить с мониторингом"
    Write-Host "  clean                   Очистить образы и контейнеры"
    Write-Host "  logs                    Показать логи"
    Write-Host "  help                    Показать эту справку"
    Write-Host ""
    Write-Host "Опции для analyze:"
    Write-Host "  --format FORMAT         Формат отчета (markdown, json, html)"
    Write-Host "  --output OUTPUT         Путь для сохранения отчета"
    Write-Host "  --verbose               Детальное логирование"
    Write-Host "  --config CONFIG         Кастомная конфигурация"
    Write-Host ""
    Write-Host "Примеры:"
    Write-Host "  .\run.ps1 analyze C:\path\to\project --format markdown --verbose"
    Write-Host "  .\run.ps1 web"
    Write-Host "  .\run.ps1 monitor"
    Write-Host "  .\run.ps1 clean"
    Write-Host ""
}

# Сборка образов
function Build-Images {
    Write-Log "Сборка Docker образов EAP..."

    # Основной анализатор
    docker build -t eap-analyzer:latest .

    # Веб-интерфейс (если есть)
    if (Test-Path "Dockerfile.web") {
        docker build -f Dockerfile.web -t eap-web:latest .
    }

    Write-Log "✅ Образы собраны успешно"
}

# Анализ проекта
function Start-Analysis {
    param(
        [string]$ProjectPath,
        [string[]]$Args
    )

    if (-not (Test-Path $ProjectPath -PathType Container)) {
        Write-Error "Путь к проекту не найден: $ProjectPath"
    }

    $AbsProjectPath = (Resolve-Path $ProjectPath).Path
    $OutputDir = ".\reports\$(Split-Path $AbsProjectPath -Leaf)-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

    Write-Log "Анализируем проект: $AbsProjectPath"
    Write-Log "Отчеты будут сохранены в: $OutputDir"

    # Создаем директорию для отчетов
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

    # Конвертируем Windows пути для Docker
    $DockerProjectPath = $AbsProjectPath -replace '\\', '/' -replace '^([A-Z]):', '/host_mnt/$1'
    $DockerOutputPath = (Resolve-Path $OutputDir).Path -replace '\\', '/' -replace '^([A-Z]):', '/host_mnt/$1'

    # Запускаем анализ
    $DockerArgs = @(
        "run", "--rm",
        "-v", "${AbsProjectPath}:/projects:ro",
        "-v", "${PWD}\${OutputDir}:/app/reports",
        "-e", "EAP_LOG_LEVEL=info",
        "eap-analyzer:latest"
    ) + $Args

    & docker @DockerArgs

    Write-Log "✅ Анализ завершен. Отчеты в: $OutputDir"
}

# Запуск веб-интерфейса
function Start-Web {
    Write-Log "Запуск веб-интерфейса EAP..."

    & $DockerCompose --profile web up -d

    Write-Log "✅ Веб-интерфейс запущен на http://localhost:3000"
    Write-Log "Для остановки используйте: .\run.ps1 stop"
}

# Запуск с мониторингом
function Start-Monitoring {
    Write-Log "Запуск EAP с мониторингом..."

    & $DockerCompose --profile monitoring --profile web up -d

    Write-Log "✅ Система запущена с мониторингом:"
    Write-Log "   Веб-интерфейс: http://localhost:3000"
    Write-Log "   Prometheus: http://localhost:9090"
}

# Остановка сервисов
function Stop-Services {
    Write-Log "Остановка сервисов EAP..."

    & $DockerCompose --profile web --profile monitoring --profile cache down

    Write-Log "✅ Сервисы остановлены"
}

# Очистка
function Clear-Everything {
    Write-Log "Очистка Docker образов и контейнеров EAP..."

    # Остановка и удаление контейнеров
    & $DockerCompose down --volumes --remove-orphans

    # Удаление образов
    try {
        docker rmi eap-analyzer:latest eap-web:latest 2>$null
    } catch {
        # Игнорируем ошибки если образы не существуют
    }

    # Очистка неиспользуемых образов
    docker image prune -f

    Write-Log "✅ Очистка завершена"
}

# Показ логов
function Show-Logs {
    Write-Log "Показ логов EAP..."

    & $DockerCompose logs -f eap-analyzer eap-web
}

# Проверка статуса
function Get-Status {
    Write-Log "Статус сервисов EAP:"

    & $DockerCompose ps
}

# Главная функция
function Main {
    Test-Dependencies

    switch ($Command.ToLower()) {
        "analyze" {
            if (-not $ProjectPath) {
                Write-Error "Укажите путь к проекту. Использование: .\run.ps1 analyze PROJECT_PATH [ОПЦИИ]"
            }
            Start-Analysis -ProjectPath $ProjectPath -Args $Arguments
        }
        "build" {
            Build-Images
        }
        "web" {
            Start-Web
        }
        "monitor" {
            Start-Monitoring
        }
        "stop" {
            Stop-Services
        }
        "clean" {
            Clear-Everything
        }
        "logs" {
            Show-Logs
        }
        "status" {
            Get-Status
        }
        "help" {
            Show-Help
        }
        default {
            Write-Error "Неизвестная команда: $Command. Используйте '.\run.ps1 help' для справки."
        }
    }
}

# Запуск главной функции
Main
