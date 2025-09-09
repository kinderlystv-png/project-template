"use strict";
/**
 * Система обработки ошибок (TypeScript версия)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAPError = exports.ErrorType = void 0;
exports.handleFileError = handleFileError;
exports.handleParsingError = handleParsingError;
exports.handleConfigError = handleConfigError;
exports.handleAnalysisError = handleAnalysisError;
exports.safeExecute = safeExecute;
exports.setupGlobalErrorHandlers = setupGlobalErrorHandlers;
var ErrorType;
(function (ErrorType) {
    ErrorType["FILE_ERROR"] = "FILE_ERROR";
    ErrorType["PARSING_ERROR"] = "PARSING_ERROR";
    ErrorType["CONFIG_ERROR"] = "CONFIG_ERROR";
    ErrorType["ANALYSIS_ERROR"] = "ANALYSIS_ERROR";
    ErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
class EAPError extends Error {
    type;
    details;
    originalError;
    constructor(type, message, details = {}, originalError) {
        super(message);
        this.name = 'EAPError';
        this.type = type;
        this.details = {
            timestamp: new Date(),
            ...details,
        };
        this.originalError = originalError;
    }
    formatForConsole() {
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
    getErrorIcon() {
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
    toJSON() {
        return {
            type: this.type,
            message: this.message,
            details: this.details,
            originalError: this.originalError?.message,
            stack: this.stack,
        };
    }
}
exports.EAPError = EAPError;
/**
 * Обработчик ошибок файловых операций
 */
function handleFileError(error, filePath, operation) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    let code = 'UNKNOWN';
    let message = `Ошибка при ${operation} файла`;
    if (originalError.message.includes('ENOENT')) {
        code = 'FILE_NOT_FOUND';
        message = `Файл не найден при ${operation}`;
    }
    else if (originalError.message.includes('EACCES')) {
        code = 'ACCESS_DENIED';
        message = `Нет доступа к файлу при ${operation}`;
    }
    else if (originalError.message.includes('EMFILE')) {
        code = 'TOO_MANY_FILES';
        message = `Слишком много открытых файлов при ${operation}`;
    }
    else if (originalError.message.includes('ENOTDIR')) {
        code = 'NOT_DIRECTORY';
        message = `Путь не является директорией при ${operation}`;
    }
    return new EAPError(ErrorType.FILE_ERROR, message, { code, path: filePath, operation }, originalError);
}
/**
 * Обработчик ошибок парсинга
 */
function handleParsingError(error, filePath, parserType) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    return new EAPError(ErrorType.PARSING_ERROR, `Ошибка парсинга ${parserType}`, {
        path: filePath,
        operation: 'parsing',
        context: { parserType },
    }, originalError);
}
/**
 * Обработчик ошибок конфигурации
 */
function handleConfigError(error, configType) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    return new EAPError(ErrorType.CONFIG_ERROR, `Ошибка конфигурации ${configType}`, {
        operation: 'configuration',
        context: { configType },
    }, originalError);
}
/**
 * Обработчик ошибок анализа
 */
function handleAnalysisError(error, analysisType, context) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    return new EAPError(ErrorType.ANALYSIS_ERROR, `Ошибка анализа ${analysisType}`, {
        operation: 'analysis',
        context: { analysisType, ...context },
    }, originalError);
}
/**
 * Безопасное выполнение функции с обработкой ошибок
 */
async function safeExecute(operation, errorType, context = {}) {
    try {
        return await operation();
    }
    catch (error) {
        const eapError = new EAPError(errorType, `Ошибка выполнения операции`, context, error instanceof Error ? error : new Error(String(error)));
        console.error(eapError.formatForConsole());
        return null;
    }
}
/**
 * Настройка глобальных обработчиков ошибок
 */
function setupGlobalErrorHandlers() {
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
        const eapError = new EAPError(ErrorType.ANALYSIS_ERROR, 'Необработанное исключение', { operation: 'uncaught-exception' }, error);
        console.error(eapError.formatForConsole());
        // Graceful shutdown
        process.exit(1);
    });
}
//# sourceMappingURL=error-handler.js.map