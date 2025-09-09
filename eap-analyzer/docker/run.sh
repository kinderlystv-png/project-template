#!/usr/bin/env bash

# Скрипт для быстрого запуска EAP анализатора в Docker
set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция логирования
log() {
    echo -e "${GREEN}[EAP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[EAP WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[EAP ERROR]${NC} $1"
    exit 1
}

# Проверка зависимостей
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker и повторите попытку."
    fi

    if ! command -v docker-compose &> /dev/null; then
        warn "docker-compose не найден. Попробуем использовать 'docker compose'."
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
}

# Показать справку
show_help() {
    cat << EOF
${BLUE}Эталонный Анализатор Проектов (ЭАП) - Docker Runner${NC}

Использование:
  $0 [КОМАНДА] [ОПЦИИ]

Команды:
  analyze PROJECT_PATH    Анализировать проект
  build                   Собрать Docker образы
  web                     Запустить веб-интерфейс
  monitor                 Запустить с мониторингом
  clean                   Очистить образы и контейнеры
  logs                    Показать логи
  help                    Показать эту справку

Опции для analyze:
  --format FORMAT         Формат отчета (markdown, json, html)
  --output OUTPUT         Путь для сохранения отчета
  --verbose              Детальное логирование
  --config CONFIG        Кастомная конфигурация

Примеры:
  $0 analyze /path/to/project --format markdown --verbose
  $0 web
  $0 monitor
  $0 clean

EOF
}

# Сборка образов
build_images() {
    log "Сборка Docker образов EAP..."

    # Основной анализатор
    docker build -t eap-analyzer:latest .

    # Веб-интерфейс (если есть)
    if [ -f "Dockerfile.web" ]; then
        docker build -f Dockerfile.web -t eap-web:latest .
    fi

    log "✅ Образы собраны успешно"
}

# Анализ проекта
analyze_project() {
    local project_path="$1"
    shift
    local args=("$@")

    if [ ! -d "$project_path" ]; then
        error "Путь к проекту не найден: $project_path"
    fi

    local abs_project_path=$(realpath "$project_path")
    local output_dir="./reports/$(basename "$abs_project_path")-$(date +%Y%m%d-%H%M%S)"

    log "Анализируем проект: $abs_project_path"
    log "Отчеты будут сохранены в: $output_dir"

    # Создаем директорию для отчетов
    mkdir -p "$output_dir"

    # Запускаем анализ
    docker run --rm \
        -v "$abs_project_path:/projects:ro" \
        -v "$(pwd)/$output_dir:/app/reports" \
        -e EAP_LOG_LEVEL=info \
        eap-analyzer:latest \
        "${args[@]}"

    log "✅ Анализ завершен. Отчеты в: $output_dir"
}

# Запуск веб-интерфейса
start_web() {
    log "Запуск веб-интерфейса EAP..."

    $DOCKER_COMPOSE --profile web up -d

    log "✅ Веб-интерфейс запущен на http://localhost:3000"
    log "Для остановки используйте: $0 stop"
}

# Запуск с мониторингом
start_monitoring() {
    log "Запуск EAP с мониторингом..."

    $DOCKER_COMPOSE --profile monitoring --profile web up -d

    log "✅ Система запущена с мониторингом:"
    log "   Веб-интерфейс: http://localhost:3000"
    log "   Prometheus: http://localhost:9090"
}

# Остановка сервисов
stop_services() {
    log "Остановка сервисов EAP..."

    $DOCKER_COMPOSE --profile web --profile monitoring --profile cache down

    log "✅ Сервисы остановлены"
}

# Очистка
clean_up() {
    log "Очистка Docker образов и контейнеров EAP..."

    # Остановка и удаление контейнеров
    $DOCKER_COMPOSE down --volumes --remove-orphans

    # Удаление образов
    docker rmi eap-analyzer:latest eap-web:latest 2>/dev/null || true

    # Очистка неиспользуемых образов
    docker image prune -f

    log "✅ Очистка завершена"
}

# Показ логов
show_logs() {
    log "Показ логов EAP..."

    $DOCKER_COMPOSE logs -f eap-analyzer eap-web
}

# Проверка статуса
check_status() {
    log "Статус сервисов EAP:"

    $DOCKER_COMPOSE ps
}

# Главная функция
main() {
    check_dependencies

    case "${1:-help}" in
        analyze)
            if [ $# -lt 2 ]; then
                error "Укажите путь к проекту. Использование: $0 analyze PROJECT_PATH [ОПЦИИ]"
            fi
            analyze_project "${@:2}"
            ;;
        build)
            build_images
            ;;
        web)
            start_web
            ;;
        monitor)
            start_monitoring
            ;;
        stop)
            stop_services
            ;;
        clean)
            clean_up
            ;;
        logs)
            show_logs
            ;;
        status)
            check_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Неизвестная команда: $1. Используйте '$0 help' для справки."
            ;;
    esac
}

main "$@"
