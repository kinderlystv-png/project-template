/**
 * Система обработки ошибок для ЭАП
 */
const fs = require('fs');
const path = require('path');

/**
 * Типы ошибок
 */
const ErrorTypes = {
  FILE_ACCESS: 'FILE_ACCESS',
  PARSING: 'PARSING',
  CONFIG: 'CONFIG',
  ANALYSIS: 'ANALYSIS',
  SYSTEM: 'SYSTEM',
  NETWORK: 'NETWORK',
  ENCODING: 'ENCODING',
  MODULE: 'MODULE',
};

/**
 * Класс для ошибок ЭАП с расширенной информацией
 */
class EAPError extends Error {
  constructor(message, type, details = {}, originalError = null) {
    super(message);
    this.name = 'EAPError';
    this.type = type;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date();

    // Сохраняем стек вызовов для отладки
    if (originalError && originalError.stack) {
      this.stack = `${this.stack}\nОригинальная ошибка: ${originalError.stack}`;
    }
  }

  /**
   * Форматирует ошибку для консольного вывода
   */
  formatForConsole() {
    let output = `\n🔴 Ошибка ЭАП: ${this.message}\n`;
    output += `📋 Тип: ${this.type}\n`;
    output += `⏰ Время: ${this.timestamp.toLocaleString('ru-RU')}\n`;

    if (Object.keys(this.details).length > 0) {
      output += '📄 Детали:\n';
      for (const [key, value] of Object.entries(this.details)) {
        output += `   ${key}: ${value}\n`;
      }
    }

    if (this.details.filePath) {
      output += `📂 Файл: ${this.details.filePath}\n`;
    }

    if (this.details.suggestion) {
      output += `💡 Рекомендация: ${this.details.suggestion}\n`;
    }

    return output;
  }

  /**
   * Форматирует ошибку для логирования
   */
  formatForLog() {
    return {
      timestamp: this.timestamp.toISOString(),
      name: this.name,
      message: this.message,
      type: this.type,
      details: this.details,
      stack: this.stack,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : null,
    };
  }

  /**
   * Получает код восстановления для данного типа ошибки
   */
  getRecoveryAction() {
    switch (this.type) {
      case ErrorTypes.FILE_ACCESS:
        return 'Проверьте права доступа к файлу и попробуйте снова';
      case ErrorTypes.PARSING:
        return 'Проверьте синтаксис файла или исключите его из анализа';
      case ErrorTypes.CONFIG:
        return 'Проверьте конфигурационные файлы и исправьте синтаксис';
      case ErrorTypes.ENCODING:
        return 'Попробуйте изменить кодировку файла на UTF-8';
      case ErrorTypes.MODULE:
        return 'Проверьте установленные зависимости: npm install';
      default:
        return 'Обратитесь к документации или создайте issue';
    }
  }
}

/**
 * Обрабатывает ошибки файловой системы
 */
function handleFileError(error, filePath, operation) {
  let suggestion = '';

  switch (error.code) {
    case 'ENOENT':
      suggestion = 'Файл не найден. Проверьте путь к файлу.';
      break;
    case 'EACCES':
      suggestion = 'Нет прав доступа. Проверьте права доступа к файлу.';
      break;
    case 'EMFILE':
      suggestion = 'Слишком много открытых файлов. Закройте другие приложения.';
      break;
    case 'ENOSPC':
      suggestion = 'Недостаточно места на диске.';
      break;
    default:
      suggestion = 'Попробуйте выполнить операцию повторно.';
  }

  return new EAPError(
    `Ошибка при ${operation} файла: ${error.message}`,
    ErrorTypes.FILE_ACCESS,
    { filePath, operation, code: error.code, suggestion },
    error
  );
}

/**
 * Обрабатывает ошибки парсинга
 */
function handleParsingError(error, filePath, format) {
  let suggestion = '';

  if (format === 'json') {
    suggestion = 'Проверьте синтаксис JSON файла с помощью валидатора.';
  } else if (format === 'js' || format === 'ts') {
    suggestion = 'Проверьте синтаксис JavaScript/TypeScript кода.';
  } else {
    suggestion = 'Проверьте корректность формата файла.';
  }

  return new EAPError(
    `Ошибка при парсинге ${format}: ${error.message}`,
    ErrorTypes.PARSING,
    { filePath, format, suggestion },
    error
  );
}

/**
 * Обрабатывает ошибки конфигурации
 */
function handleConfigError(error, configName, configPath = null) {
  return new EAPError(
    `Ошибка в конфигурации ${configName}: ${error.message}`,
    ErrorTypes.CONFIG,
    {
      configName,
      configPath,
      suggestion:
        'Проверьте синтаксис конфигурационного файла или восстановите настройки по умолчанию.',
    },
    error
  );
}

/**
 * Обрабатывает ошибки анализа
 */
function handleAnalysisError(error, moduleName, details = {}) {
  return new EAPError(
    `Ошибка при анализе в модуле ${moduleName}: ${error.message}`,
    ErrorTypes.ANALYSIS,
    {
      moduleName,
      suggestion: 'Попробуйте исключить проблемные файлы из анализа или обновите анализатор.',
      ...details,
    },
    error
  );
}

/**
 * Обрабатывает ошибки кодировки
 */
function handleEncodingError(error, filePath) {
  return new EAPError(
    `Ошибка кодировки при чтении файла: ${error.message}`,
    ErrorTypes.ENCODING,
    {
      filePath,
      suggestion: 'Попробуйте конвертировать файл в UTF-8 или указать правильную кодировку.',
    },
    error
  );
}

/**
 * Обрабатывает ошибки модулей
 */
function handleModuleError(error, moduleName) {
  return new EAPError(
    `Ошибка при загрузке модуля ${moduleName}: ${error.message}`,
    ErrorTypes.MODULE,
    {
      moduleName,
      suggestion: 'Выполните "npm install" для установки зависимостей.',
    },
    error
  );
}

/**
 * Записывает ошибку в лог файл
 */
function logError(error, logFilePath = null) {
  if (!logFilePath) {
    logFilePath = path.join(process.cwd(), 'eap-errors.log');
  }

  try {
    const logEntry = JSON.stringify(error.formatForLog()) + '\n';

    // Создаем директорию логов, если не существует
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFilePath, logEntry, 'utf8');
  } catch (logError) {
    // В случае ошибки при записи лога просто выводим в консоль
    console.error('❌ Не удалось записать ошибку в лог:', logError.message);
  }
}

/**
 * Глобальный обработчик исключений для процесса
 */
function setupGlobalErrorHandlers(options = {}) {
  const { logFile = 'eap-errors.log', exitOnUncaught = false, showStackTrace = false } = options;

  // Перехватываем необработанные исключения
  process.on('uncaughtException', error => {
    const eapError = new EAPError(
      `Необработанное исключение: ${error.message}`,
      ErrorTypes.SYSTEM,
      { suggestion: 'Перезапустите анализатор. Если проблема повторится, создайте issue.' },
      error
    );

    console.error(eapError.formatForConsole());

    if (showStackTrace) {
      console.error('Стек вызовов:', error.stack);
    }

    // Логируем ошибку
    logError(eapError, logFile);

    if (exitOnUncaught) {
      console.log('🔄 Завершение работы...');
      process.exit(1);
    }
  });

  // Перехватываем необработанные отказы промисов
  process.on('unhandledRejection', (reason, promise) => {
    const eapError = new EAPError(
      `Необработанный отказ промиса: ${reason}`,
      ErrorTypes.SYSTEM,
      {
        promise: String(promise),
        suggestion: 'Проверьте асинхронные операции в коде.',
      },
      reason instanceof Error ? reason : new Error(String(reason))
    );

    console.error(eapError.formatForConsole());
    logError(eapError, logFile);
  });

  // Перехватываем предупреждения
  process.on('warning', warning => {
    console.warn(`⚠️ Предупреждение: ${warning.message}`);
    if (warning.stack && showStackTrace) {
      console.warn(warning.stack);
    }
  });
}

/**
 * Безопасное выполнение операции с обработкой ошибок
 */
async function safeExecute(operation, errorHandler, context = {}) {
  try {
    return await operation();
  } catch (error) {
    const eapError = errorHandler(error, context);
    console.error(eapError.formatForConsole());
    logError(eapError);

    // Возвращаем null для продолжения работы
    return null;
  }
}

/**
 * Создает обертку для функции с автоматической обработкой ошибок
 */
function withErrorHandling(fn, errorHandler) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const eapError = errorHandler(error, { args });
      console.error(eapError.formatForConsole());
      logError(eapError);
      throw eapError;
    }
  };
}

module.exports = {
  ErrorTypes,
  EAPError,
  handleFileError,
  handleParsingError,
  handleConfigError,
  handleAnalysisError,
  handleEncodingError,
  handleModuleError,
  logError,
  setupGlobalErrorHandlers,
  safeExecute,
  withErrorHandling,
};
