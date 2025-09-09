"use strict";
/**
 * Базовый класс для всех анализаторов системы
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAnalyzer = void 0;
class BaseAnalyzer {
    /**
     * Проверяет, поддерживается ли данный проект
     */
    isSupported(projectPath) {
        return true; // По умолчанию поддерживается везде
    }
    /**
     * Возвращает список файлов для анализа
     */
    async getFilesToAnalyze(projectPath) {
        const fs = require('fs').promises;
        const path = require('path');
        const files = [];
        try {
            const entries = await fs.readdir(projectPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(projectPath, entry.name);
                if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
                    const subFiles = await this.getFilesToAnalyze(fullPath);
                    files.push(...subFiles);
                }
                else if (entry.isFile() && this.shouldAnalyzeFile(entry.name)) {
                    files.push(fullPath);
                }
            }
        }
        catch (error) {
            console.warn(`Не удалось прочитать директорию ${projectPath}:`, error);
        }
        return files;
    }
    /**
     * Определяет, нужно ли пропустить директорию
     */
    shouldSkipDirectory(dirName) {
        const skipDirs = [
            'node_modules',
            '.git',
            'dist',
            'build',
            'coverage',
            '.nyc_output',
            'logs',
            'tmp',
        ];
        return skipDirs.includes(dirName) || dirName.startsWith('.');
    }
    /**
     * Определяет, нужно ли анализировать файл
     */
    shouldAnalyzeFile(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return this.metadata.supportedFileTypes.includes(ext || '');
    }
    /**
     * Создает базовый результат анализа
     */
    createResult(success, data, errors, warnings, filesAnalyzed = 0) {
        return {
            success,
            data,
            errors,
            warnings,
            metadata: {
                analyzer: this.metadata.name,
                timestamp: new Date(),
                duration: 0, // Будет установлено оркестратором
                filesAnalyzed,
            },
        };
    }
}
exports.BaseAnalyzer = BaseAnalyzer;
//# sourceMappingURL=analyzer.js.map