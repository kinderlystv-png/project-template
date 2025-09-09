"use strict";
/**
 * Базовый класс для всех чекеров системы
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleChecker = exports.BaseChecker = void 0;
class BaseChecker {
    /**
     * Проверяет, поддерживается ли данный тип проекта
     */
    isApplicable(context) {
        return true; // По умолчанию применимо везде
    }
    /**
     * Приоритет выполнения чекера (1 = высший)
     */
    get priority() {
        return 10;
    }
    /**
     * Создает результат проверки
     */
    createResult(passed, score, message, details, recommendations) {
        return {
            checker: this.name,
            category: this.category,
            passed,
            score: Math.max(0, Math.min(100, score)), // Нормализация 0-100
            message,
            details,
            recommendations,
            timestamp: new Date(),
        };
    }
    /**
     * Создает результат об ошибке
     */
    createErrorResult(error) {
        return this.createResult(false, 0, `Ошибка при выполнении проверки: ${error.message}`, {
            error: error.stack,
        });
    }
    /**
     * Проверяет существование файла
     */
    fileExists(filePath) {
        try {
            const fs = require('fs');
            return fs.existsSync(filePath);
        }
        catch {
            return false;
        }
    }
    /**
     * Читает содержимое файла
     */
    readFile(filePath) {
        try {
            const fs = require('fs');
            return fs.readFileSync(filePath, 'utf-8');
        }
        catch {
            return null;
        }
    }
}
exports.BaseChecker = BaseChecker;
/**
 * Интерфейс для модульных чекеров (специфичных для определенного модуля)
 */
class ModuleChecker extends BaseChecker {
    /**
     * Проверяет, поддерживается ли модуль в данном проекте
     */
    isApplicable(context) {
        // Проверяем, есть ли результаты от нужного модуля
        return context.moduleResults?.[this.moduleName] !== undefined;
    }
}
exports.ModuleChecker = ModuleChecker;
//# sourceMappingURL=checker.js.map