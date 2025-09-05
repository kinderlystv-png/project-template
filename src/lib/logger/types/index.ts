export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  SILENT = 6,
}

export interface LogEntry {
  // Базо  // Аналитика
  analytics?: {
    enabled: boolean;
    trackUserJourney: boolean;
    businessEvents: boolean;
    customDimensions?: Record<string, unknown>;
  };

  // DevTools
  devtools?: {
    enabled: boolean;
    showInConsole: boolean;
    persistLogs: boolean;
    maxStoredLogs: number;
  };
}

export interface LogContext {
  [key: string]: unknown;
  error?: Error | ErrorInfo;
  user?: UserInfo;
  session?: SessionInfo;
  request?: RequestInfo;
}

export interface LogMetadata {
  source: string;
  tags: string[];
  correlationId: string;
  sequenceNumber: number;
  hostname?: string;
  environment: string;
  version: string;
  fingerprint?: string;
}

export interface TraceInfo {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  flags: number;
}

export interface PerformanceMetrics {
  duration?: number;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu?: number;
  network?: NetworkTiming;
  render?: RenderTiming;
}

export interface ErrorInfo {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

export interface UserInfo {
  id?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionInfo {
  id: string;
  startTime: number;
  duration?: number;
  pageViews?: number;
}

export interface RequestInfo {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
  responseTime?: number;
  statusCode?: number;
}

export interface NetworkTiming {
  dns?: number;
  connect?: number;
  request?: number;
  response?: number;
  total?: number;
}

export interface RenderTiming {
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

export interface LoggerConfig {
  // Основные настройки
  level: LogLevel;
  enabled?: boolean;
  name?: string;

  // Дополнительные настройки
  enableColors?: boolean;
  enableTimestamp?: boolean;
  enableStackTrace?: boolean;
  bufferSize?: number;
  flushInterval?: number;
  sanitize?: boolean;
  gdprCompliant?: boolean;
  enableAnalytics?: boolean;

  // Транспорты
  transports?: TransportConfig[];

  // Безопасность
  security?: {
    sanitize: boolean;
    sanitizePatterns: RegExp[];
    encrypt: boolean;
    encryptionKey?: string;
    gdprMode: boolean;
  };

  // Производительность
  performance?: {
    batchSize: number;
    flushInterval: number;
    maxQueueSize: number;
    sampleRate: number;
    compressionThreshold: number;
  };

  // Форматирование
  formatting?: {
    formatter: 'json' | 'pretty' | 'compact' | 'custom';
    customFormatter?: (entry: LogEntry) => string;
    includeStackTrace: boolean;
    maxDepth: number;
  };

  // Метрики и аналитика
  analytics: {
    enabled: boolean;
    trackUserJourney: boolean;
    businessEvents: boolean;
    customDimensions?: Record<string, unknown>;
  };

  // DevTools
  devtools: {
    enabled: boolean;
    showInConsole: boolean;
    persistLogs: boolean;
    maxStoredLogs: number;
  };
}

export interface TransportConfig {
  type: 'console' | 'remote' | 'localStorage' | 'sentry' | 'custom';
  enabled: boolean;
  level?: LogLevel;
  options?: Record<string, unknown>;
}

export interface ILogger {
  trace(message: string, context?: LogContext, tags?: string[]): void;
  debug(message: string, context?: LogContext, tags?: string[]): void;
  info(message: string, context?: LogContext, tags?: string[]): void;
  warn(message: string, context?: LogContext, tags?: string[]): void;
  error(message: string, context?: LogContext, tags?: string[]): void;
  fatal(message: string, context?: LogContext, tags?: string[]): void;
  setLevel(level: LogLevel): void;
  setEnabled(enabled: boolean): void;
  withContext(context: LogContext): ILogger;
  withTags(tags: string[]): ILogger;
  withSource(source: string): ILogger;
}
export interface ITransport {
  send(entries: LogEntry[]): Promise<void>;
  flush?(): Promise<void>;
  destroy?(): void;
}

export interface LoggerOptions {
  level: LogLevel;
  enabled: boolean;
  consoleOutput: boolean;
  remoteOutput: boolean;
  remoteUrl?: string;
  sampleRate?: number;
  formatter?: (entry: LogEntry) => string;
}
