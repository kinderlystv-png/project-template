# Базовый образ с Node.js 20 Alpine
FROM node:20-alpine AS base
WORKDIR /app

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Включаем corepack для работы с pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Создаём непривилегированного пользователя
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 svelteuser

# Этап разработки
FROM base AS development
ENV NODE_ENV=development

# Копируем файлы конфигурации зависимостей
COPY package.json pnpm-lock.yaml* ./

# Устанавливаем зависимости с кэшированием
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Копируем исходный код
COPY . .

# Меняем владельца файлов
RUN chown -R svelteuser:nodejs /app
USER svelteuser

# Открываем порты для dev сервера и HMR
EXPOSE 3000 24678

# Команда по умолчанию для разработки
CMD ["pnpm", "dev", "--host"]

# Этап сборки
FROM base AS builder

# Копируем файлы конфигурации зависимостей
COPY package.json pnpm-lock.yaml* ./

# Устанавливаем зависимости
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Копируем исходный код
COPY . .

# Собираем приложение
RUN pnpm build

# Этап тестирования
FROM builder AS test
ENV NODE_ENV=test

# Создаём директорию для coverage
RUN mkdir -p coverage && chown -R svelteuser:nodejs /app
USER svelteuser

# Запускаем тесты
CMD ["pnpm", "test:coverage"]

# Финальный этап для продакшена
FROM base AS production

# Копируем package.json и lock файл
COPY --from=builder /app/package.json /app/pnpm-lock.yaml* ./

# Копируем собранное приложение
COPY --from=builder /app/build ./build

# Устанавливаем только production зависимости
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Меняем владельца и переключаемся на непривилегированного пользователя
RUN chown -R svelteuser:nodejs /app
USER svelteuser

# Открываем порт
EXPOSE 3000

# Добавляем health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Команда по умолчанию
CMD ["node", "build"]
