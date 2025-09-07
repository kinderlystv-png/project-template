import winston from 'winston';

// Создаем разные уровни логов для разных окружений
const level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

// Создаем базовый форматтер
const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Создаем минимальную конфигурацию логгера
const logger = winston.createLogger({
  level,
  format,
  defaultMeta: { service: 'shinomontagka' },
  transports: [
    // Всегда пишем в консоль
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    // В продакшене добавляем файловый лог
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
          }),
        ]
      : []),
  ],
});

// Типы для метаданных логов
type LogMeta = Record<string, unknown>;

// Хелперы для удобного логирования
export const log = {
  error: (message: string, meta: LogMeta = {}) => logger.error(message, meta),
  warn: (message: string, meta: LogMeta = {}) => logger.warn(message, meta),
  info: (message: string, meta: LogMeta = {}) => logger.info(message, meta),
  debug: (message: string, meta: LogMeta = {}) => logger.debug(message, meta),
};

export default logger;
