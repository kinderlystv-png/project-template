# 🐳 Ultimate EAP Analyzer v3.0 - Production Docker Image
FROM node:18-alpine AS builder

# Установка основных зависимостей
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Сборка проекта
RUN pnpm run build

# Продакшн образ
FROM node:18-alpine AS production

# Установка системных зависимостей для анализа
RUN apk add --no-cache \
    git \
    curl \
    bash \
    findutils \
    grep \
    && addgroup -g 1001 -S nodejs \
    && adduser -S eap -u 1001

# Установка рабочей директории
WORKDIR /app

# Копирование собранного приложения
COPY --from=builder --chown=eap:nodejs /app/dist ./dist
COPY --from=builder --chown=eap:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=eap:nodejs /app/package.json ./

# Создание директории для проектов
RUN mkdir -p /projects && chown -R eap:nodejs /projects

# Установка переменных окружения
ENV NODE_ENV=production
ENV EAP_WORK_DIR=/projects
ENV EAP_CONFIG_DIR=/app/config
ENV EAP_LOG_LEVEL=info

# Создание конфигурационной директории
RUN mkdir -p /app/config && chown -R eap:nodejs /app/config

# Создание конфигурации по умолчанию
COPY <<EOF /app/config/default.json
{
  "analysis": {
    "maxFileSize": "10MB",
    "timeout": 300000,
    "concurrency": 4,
    "excludePaths": [
      "node_modules",
      "dist",
      "build",
      ".git",
      "coverage",
      "test-results"
    ]
  },
  "thresholds": {
    "fileSize": 300,
    "complexity": 15,
    "nesting": 4,
    "duplication": 10,
    "maintainabilityIndex": 65
  },
  "reporting": {
    "format": "markdown",
    "includeDetails": true,
    "generateRoadmap": true
  },
  "encoding": {
    "default": "utf8",
    "detectWin1251": true,
    "convertToUtf8": true
  }
}
EOF

# Создание скрипта запуска
COPY <<EOF /app/entrypoint.sh
#!/bin/bash
set -e

# Функция логирования
log() {
    echo "[\\$(date +'%Y-%m-%d %H:%M:%S')] EAP: \\$*"
}

# Проверка входных параметров
if [ \\$# -eq 0 ]; then
    log "Использование: docker run eap-analyzer [OPTIONS] <PROJECT_PATH>"
    log "Опции:"
    log "  --format FORMAT     Формат вывода (markdown, json, html)"
    log "  --output OUTPUT     Путь для сохранения отчета"
    log "  --config CONFIG     Путь к файлу конфигурации"
    log "  --verbose           Детальное логирование"
    log "  --help              Показать справку"
    exit 1
fi

# Проверка доступности проекта
PROJECT_PATH="/projects"
if [ ! -d "\\$PROJECT_PATH" ]; then
    log "Ошибка: Директория проекта не найдена. Убедитесь, что вы примонтировали проект в /projects"
    exit 1
fi

# Настройка логирования
if [ "\\$EAP_LOG_LEVEL" = "debug" ]; then
    set -x
fi

# Проверка доступности Node.js
if ! command -v node &> /dev/null; then
    log "Ошибка: Node.js не найден"
    exit 1
fi

# Информация о системе
log "Запуск анализатора проектов v\\$(cat package.json | grep version | cut -d '\"' -f 4)"
log "Node.js версия: \\$(node --version)"
log "Рабочая директория: \\$(pwd)"
log "Проект для анализа: \\$PROJECT_PATH"

# Запуск анализатора
log "Начинаем анализ..."
exec node dist/cli.js "\\$@" "\\$PROJECT_PATH"
EOF

# Установка прав на выполнение
RUN chmod +x /app/entrypoint.sh && chown eap:nodejs /app/entrypoint.sh

# Переключение на пользователя
USER eap

# Открытие порта (если понадобится веб-интерфейс)
EXPOSE 3000

# Создание volume для проектов
VOLUME ["/projects", "/app/reports"]

# Создание health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('EAP is healthy')" || exit 1

# Метаданные
LABEL maintainer="eap-team@example.com"
LABEL description="Эталонный Анализатор Проектов (ЭАП) - инструмент для анализа качества кода"
LABEL version="2.0"
LABEL org.opencontainers.image.title="EAP Analyzer"
LABEL org.opencontainers.image.description="Анализатор проектов с поддержкой множественных форматов и адаптивными порогами"
LABEL org.opencontainers.image.vendor="AlphaCore"

# Точка входа
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["--help"]
