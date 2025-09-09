/**
 * Система обработки ошибок (TypeScript версия)
 */

export enum ErrorType {
  FILE_ERROR = 'FILE_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface ErrorDetails {
  code?: string;
  path?: string;
  operation?: string;
  context?: Record<string, any>;
  timestamp: Date;
}

export class EAPError extends Error {
  public readonly type: ErrorType;
  public readonly details: ErrorDetails;
  public readonly originalError?: Error;

  constructor(
    type: ErrorType,
    message: string,
    details: Partial<ErrorDetails> = {},
    originalError?: Error
  ) {
    super(message);
    this.name = 'EAPError';
    this.type = type;
    this.details = {
      timestamp: new Date(),
      ...details,
    };
    this.originalError = originalError;
  }

  formatForConsole(): string {
    const icon = this.getErrorIcon();
    const timestamp = this.details.timestamp.toLocaleTimeString();

    let output = `${icon} [${timestamp}] ${this.type}: ${this.message}`;

    if (this.details.path) {
      output += `\n   📁 Файл: ${this.details.path}`;
    }

    if (this.details.operation) {
      output += `\n   🔧 Операция: ${this.details.operation}`;
    }

    if (this.details.code) {
      output += `\n   🔢 Код: ${this.details.code}`;
    }

    if (this.originalError) {
      output += `\n   🐛 Исходная ошибка: ${this.originalError.message}`;
    }

    return output;
  }

  private getErrorIcon(): string {
    switch (this.type) {
      case ErrorType.FILE_ERROR:
        return '📄';
      case ErrorType.PARSING_ERROR:
        return '🔍';
      case ErrorType.CONFIG_ERROR:
        return '⚙️';
      case ErrorType.ANALYSIS_ERROR:
        return '🔬';
      case ErrorType.NETWORK_ERROR:
        return '🌐';
      case ErrorType.VALIDATION_ERROR:
        return '✅';
      default:
        return '❌';
    }
  }

  toJSON(): Record<string, any> {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      originalError: this.originalError?.message,
      stack: this.stack,
    };
  }
}

/**
 * Обработчик ошибок файловых операций
 */
export function handleFileError(error: unknown, filePath: string, operation: string): EAPError {
  const originalError = error instanceof Error ? error : new Error(String(error));

  let code = 'UNKNOWN';
  let message = `Ошибка при ${operation} файла`;

  if (originalError.message.includes('ENOENT')) {
    code = 'FILE_NOT_FOUND';
    message = `Файл не найден при ${operation}`;
  } else if (originalError.message.includes('EACCES')) {
    code = 'ACCESS_DENIED';
    message = `Нет доступа к файлу при ${operation}`;
  } else if (originalError.message.includes('EMFILE')) {
    code = 'TOO_MANY_FILES';
    message = `Слишком много открытых файлов при ${operation}`;
  } else if (originalError.message.includes('ENOTDIR')) {
    code = 'NOT_DIRECTORY';
    message = `Путь не является директорией при ${operation}`;
  }

  return new EAPError(
    ErrorType.FILE_ERROR,
    message,
    { code, path: filePath, operation },
    originalError
  );
}

/**
 * Обработчик ошибок парсинга
 */
export function handleParsingError(error: unknown, filePath: string, parserType: string): EAPError {
  const originalError = error instanceof Error ? error : new Error(String(error));

  return new EAPError(
    ErrorType.PARSING_ERROR,
    `Ошибка парсинга ${parserType}`,
    {
      path: filePath,
      operation: 'parsing',
      context: { parserType },
    },
    originalError
  );
}

/**
 * Обработчик ошибок конфигурации
 */
export function handleConfigError(error: unknown, configType: string): EAPError {
  const originalError = error instanceof Error ? error : new Error(String(error));

  return new EAPError(
    ErrorType.CONFIG_ERROR,
    `Ошибка конфигурации ${configType}`,
    {
      operation: 'configuration',
      context: { configType },
    },
    originalError
  );
}

/**
 * Обработчик ошибок анализа
 */
export function handleAnalysisError(
  error: unknown,
  analysisType: string,
  context?: Record<string, any>
): EAPError {
  const originalError = error instanceof Error ? error : new Error(String(error));

  return new EAPError(
    ErrorType.ANALYSIS_ERROR,
    `Ошибка анализа ${analysisType}`,
    {
      operation: 'analysis',
      context: { analysisType, ...context },
    },
    originalError
  );
}

/**
 * Безопасное выполнение функции с обработкой ошибок
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  errorType: ErrorType,
  context: Partial<ErrorDetails> = {}
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const eapError = new EAPError(
      errorType,
      `Ошибка выполнения операции`,
      context,
      error instanceof Error ? error : new Error(String(error))
    );

    console.error(eapError.formatForConsole());
    return null;
  }
}

/**
 * Настройка глобальных обработчиков ошибок
 */
export function setupGlobalErrorHandlers(): void {
  // Обработчик необработанных промисов
  process.on('unhandledRejection', (reason, promise) => {
    const error = new EAPError(ErrorType.ANALYSIS_ERROR, 'Необработанное отклонение промиса', {
      operation: 'promise-rejection',
      context: { reason: String(reason) },
    });

    console.error(error.formatForConsole());
    console.error('Promise:', promise);
  });

  // Обработчик необработанных исключений
  process.on('uncaughtException', error => {
    const eapError = new EAPError(
      ErrorType.ANALYSIS_ERROR,
      'Необработанное исключение',
      { operation: 'uncaught-exception' },
      error
    );

    console.error(eapError.formatForConsole());

    // Graceful shutdown
    process.exit(1);
  });
}
