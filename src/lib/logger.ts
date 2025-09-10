import { browser } from '$app/environment';

// Типы для метаданных логов
type LogMeta = Record<string, unknown>;

// Интерфейс логгера
interface Logger {
  error: (message: string, meta?: LogMeta) => void;
  warn: (message: string, meta?: LogMeta) => void;
  info: (message: string, meta?: LogMeta) => void;
  debug: (message: string, meta?: LogMeta) => void;
}

// Логгер для браузера (простая обертка над console)
const browserLogger: Logger = {
  debug: (message: string, meta: LogMeta = {}) =>
    // eslint-disable-next-line no-console
    console.debug('[Debug]', message, meta),
  info: (message: string, meta: LogMeta = {}) =>
    // eslint-disable-next-line no-console
    console.info('[Info]', message, meta),
  warn: (message: string, meta: LogMeta = {}) =>
    // eslint-disable-next-line no-console
    console.warn('[Warning]', message, meta),
  error: (message: string, meta: LogMeta = {}) =>
    // eslint-disable-next-line no-console
    console.error('[Error]', message, meta),
};

// Функция создания серверного логгера
const createServerLogger = async (): Promise<Logger> => {
  const winston = await import('winston');

  const level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

  const format = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  const winstonLogger = winston.createLogger({
    level,
    format,
    defaultMeta: { service: 'shinomontagka' },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
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

  return {
    error: (message: string, meta: LogMeta = {}) => winstonLogger.error(message, meta),
    warn: (message: string, meta: LogMeta = {}) => winstonLogger.warn(message, meta),
    info: (message: string, meta: LogMeta = {}) => winstonLogger.info(message, meta),
    debug: (message: string, meta: LogMeta = {}) => winstonLogger.debug(message, meta),
  };
};

// Создаем логгер в зависимости от среды
let logger: Logger;

if (browser) {
  // В браузере используем простой console логгер
  logger = browserLogger;
} else {
  // На сервере используем Winston
  logger = await createServerLogger();
}

// Хелперы для удобного логирования (обратная совместимость)
export const log = {
  error: (message: string, meta: LogMeta = {}) => logger.error(message, meta),
  warn: (message: string, meta: LogMeta = {}) => logger.warn(message, meta),
  info: (message: string, meta: LogMeta = {}) => logger.info(message, meta),
  debug: (message: string, meta: LogMeta = {}) => logger.debug(message, meta),
};

export default logger;
