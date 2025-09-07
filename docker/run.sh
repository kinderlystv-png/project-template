#!/bin/bash
set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода заголовков
print_header() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}===========================================${NC}"
}

# Функция для вывода успешных сообщений
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Функция для вывода предупреждений
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Функция для вывода ошибок
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Определяем окружение
ENV=${1:-development}

print_header "Запуск SHINOMONTAGKA в окружении: $ENV"

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker не установлен. Пожалуйста, установите Docker."
    exit 1
fi

# Проверяем наличие Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose не установлен. Пожалуйста, установите Docker Compose."
    exit 1
fi

# Проверяем наличие файла окружения
if [ ! -f .env.$ENV ]; then
    print_warning "Файл .env.$ENV не найден. Создаём из шаблона..."
    if [ -f .env.example.$ENV ]; then
        cp .env.example.$ENV .env.$ENV
        print_success "Создан файл .env.$ENV из шаблона"
    else
        print_warning "Шаблон не найден. Создаём базовый файл окружения..."
        echo "NODE_ENV=$ENV" > .env.$ENV
        print_success "Создан базовый файл .env.$ENV"
    fi
fi

# Функция для очистки контейнеров
cleanup() {
    print_header "Очистка контейнеров..."
    docker-compose down --remove-orphans 2>/dev/null || true
    print_success "Контейнеры остановлены"
}

# Обработка сигналов для корректного завершения
trap cleanup EXIT INT TERM

# Запускаем контейнеры в соответствующем окружении
case $ENV in
    development|dev)
        print_header "Запуск в режиме разработки"
        print_warning "Убедитесь, что порты 3000 и 24678 свободны"
        docker-compose -f docker-compose.yml up --build
        ;;
    test)
        print_header "Запуск тестов"
        docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
        ;;
    production|prod)
        print_header "Запуск в продакшен режиме"
        print_warning "Убедитесь, что переменные окружения настроены корректно"
        docker-compose -f docker-compose.prod.yml up --build -d
        print_success "Приложение запущено в фоновом режиме"
        echo -e "${BLUE}Для просмотра логов используйте:${NC} docker-compose -f docker-compose.prod.yml logs -f"
        echo -e "${BLUE}Для остановки используйте:${NC} docker-compose -f docker-compose.prod.yml down"
        ;;
    *)
        print_error "Неизвестное окружение: $ENV"
        echo -e "${BLUE}Доступные окружения:${NC}"
        echo "  - development (или dev)"
        echo "  - test"
        echo "  - production (или prod)"
        exit 1
        ;;
esac

print_success "Операция завершена успешно!"
