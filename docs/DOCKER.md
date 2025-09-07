# Docker Guide для SHINOMONTAGKA

## Обзор

Проект SHINOMONTAGKA полностью контейнеризован с использованием Docker и Docker Compose. Это обеспечивает консистентную среду разработки, тестирования и продакшена.

## Требования

- **Docker**: 20.10.0 или выше
- **Docker Compose**: 2.0.0 или выше
- **Git**: для клонирования репозитория

## Быстрый старт

### 1. Клонирование и настройка

```bash
git clone https://github.com/kinderlystv-png/project-template.git
cd project-template
```

### 2. Запуск в разработке

```bash
# Использование npm скриптов
npm run docker:dev

# Или с помощью PowerShell скрипта (Windows)
.\docker\run.ps1 dev

# Или с помощью bash скрипта (Linux/macOS)
./docker/run.sh development
```

Приложение будет доступно по адресу: http://localhost:3000

### 3. Запуск тестов

```bash
# Использование npm скриптов
npm run docker:test

# Или с помощью скриптов
.\docker\run.ps1 test          # Windows
./docker/run.sh test           # Linux/macOS
```

### 4. Запуск в продакшене

```bash
# Использование npm скриптов
npm run docker:prod

# Или с помощью скриптов
.\docker\run.ps1 prod -Detached    # Windows
./docker/run.sh production         # Linux/macOS
```

## Структура Docker

### Dockerfile

Многоэтапный Dockerfile с оптимизацией для разных окружений:

- **base**: Базовый образ с Node.js 20 Alpine
- **development**: Окружение разработки с hot reload
- **builder**: Этап сборки приложения
- **test**: Этап тестирования
- **production**: Финальный продакшен образ

### Docker Compose файлы

- `docker-compose.yml`: Конфигурация для разработки
- `docker-compose.test.yml`: Конфигурация для тестирования
- `docker-compose.prod.yml`: Конфигурация для продакшена

## Переменные окружения

Каждое окружение имеет свой файл конфигурации:

- `.env.development`: Настройки для разработки
- `.env.test`: Настройки для тестирования
- `.env.production`: Настройки для продакшена

### Основные переменные

```bash
NODE_ENV=development|test|production
VITE_HOST=0.0.0.0
VITE_PORT=3000
VITE_API_URL=http://localhost:3000/api
VITE_APP_SECRET=your-secret-key
VITE_LOG_LEVEL=debug|info|warn|error
```

## Управление контейнерами

### NPM скрипты

```bash
npm run docker:dev      # Запуск в режиме разработки
npm run docker:test     # Запуск тестов
npm run docker:prod     # Запуск в продакшене
npm run docker:down     # Остановка контейнеров
npm run docker:logs     # Просмотр логов
npm run docker:clean    # Очистка контейнеров и образов
npm run docker:shell    # Вход в контейнер
```

### PowerShell скрипт (Windows)

```powershell
.\docker\run.ps1 dev                    # Разработка
.\docker\run.ps1 test                   # Тестирование
.\docker\run.ps1 prod -Detached         # Продакшен в фоне
.\docker\run.ps1 down                   # Остановка
.\docker\run.ps1 logs                   # Логи
.\docker\run.ps1 clean                  # Очистка
.\docker\run.ps1 -Help                  # Справка
```

### Bash скрипт (Linux/macOS)

```bash
./docker/run.sh development    # Разработка
./docker/run.sh test           # Тестирование
./docker/run.sh production     # Продакшен
```

## Health Check

Приложение включает endpoint для проверки здоровья:

```
GET /health
```

Ответ:

```json
{
  "status": "ok",
  "timestamp": "2025-09-07T14:00:00.000Z",
  "uptime": 120.5,
  "version": "2.0.0",
  "environment": "production",
  "memory": {
    "used": 45.2,
    "total": 128.0
  }
}
```

## Мониторинг и логирование

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f app

# Последние N строк
docker-compose logs --tail=100 app
```

### Мониторинг ресурсов

```bash
# Статистика контейнеров
docker stats

# Информация о контейнере
docker inspect shinomontagka-prod
```

## Отладка

### Вход в контейнер

```bash
# Продакшен контейнер
docker-compose exec app sh

# Разработка
docker-compose exec app sh

# Или через docker
docker exec -it shinomontagka-prod sh
```

### Проверка состояния

```bash
# Статус сервисов
docker-compose ps

# Здоровье контейнеров
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## Оптимизация производительности

### Кэширование

- Используется BuildKit для эффективного кэширования слоёв
- Volume монтирование для быстрого отражения изменений в разработке
- Multi-stage build для минимизации размера продакшен образа

### Ресурсы

Ограничения ресурсов в продакшене:

- Memory limit: 512MB
- Memory reservation: 256MB

### Сеть

- Изолированные сети для каждого окружения
- Healthcheck для автоматического мониторинга

## CI/CD интеграция

### GitHub Actions

Проект включает готовые workflows:

- **Docker Build and Test**: Автоматическая сборка и тестирование
- **Security Scanning**: Сканирование уязвимостей с Trivy
- **Image Publishing**: Публикация образов в GitHub Container Registry

### Автоматизация

При push в основные ветки:

1. Запускаются тесты в контейнере
2. Собирается продакшен образ
3. Выполняется сканирование безопасности
4. Образ публикуется в registry

## Безопасность

### Принципы

- Непривилегированный пользователь в контейнерах
- Минимальные Alpine образы
- Автоматическое сканирование уязвимостей
- Изолированные сети

### Обновления безопасности

```bash
# Сканирование уязвимостей
docker run --rm -v $(pwd):/app aquasec/trivy fs /app

# Обновление базового образа
docker pull node:20-alpine
docker-compose build --no-cache
```

## Troubleshooting

### Типичные проблемы

#### Порты заняты

```bash
# Найти процесс на порту 3000
netstat -tulpn | grep 3000

# Остановить все контейнеры
npm run docker:down
```

#### Проблемы с правами доступа

```bash
# Linux/macOS
sudo chown -R $USER:$USER .

# Windows (PowerShell)
icacls . /grant $env:USERNAME:F /T
```

#### Очистка места

```bash
# Удаление неиспользуемых образов
docker system prune -a

# Полная очистка проекта
npm run docker:clean
```

#### Проблемы сборки

```bash
# Пересборка без кэша
docker-compose build --no-cache

# Проверка Dockerfile
docker build --no-cache -t test .
```

### Диагностика

```bash
# Проверка Docker
docker --version
docker-compose --version

# Проверка образов
docker images | grep shinomontagka

# Проверка сетей
docker network ls

# Проверка volumes
docker volume ls
```

## Производственное развертывание

### Подготовка

1. Настройте переменные окружения в `.env.production`
2. Убедитесь в наличии SSL сертификатов
3. Настройте reverse proxy (nginx/apache)
4. Настройте мониторинг и алерты

### Развертывание

```bash
# Клонирование на сервер
git clone https://github.com/kinderlystv-png/project-template.git
cd project-template

# Настройка продакшен переменных
cp .env.production.example .env.production
# Отредактируйте .env.production

# Запуск
npm run docker:prod
```

### Мониторинг продакшена

```bash
# Статус приложения
curl http://localhost:3000/health

# Логи приложения
docker-compose -f docker-compose.prod.yml logs -f

# Мониторинг ресурсов
docker stats shinomontagka-prod
```

## Поддержка

Для получения помощи:

1. Проверьте [документацию проекта](../docs/README.md)
2. Ознакомьтесь с [troubleshooting секцией](#troubleshooting)
3. Создайте issue в [GitHub репозитории](https://github.com/kinderlystv-png/project-template/issues)

---

**Примечание**: Этот guide предполагает базовое понимание Docker и контейнеризации. Для изучения основ Docker рекомендуется официальная документация Docker.
