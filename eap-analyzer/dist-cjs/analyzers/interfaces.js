"use strict";
/**
 * Base Analyzer Interface
 * Базовый интерфейс для всех анализаторов
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAnalyzer = void 0;
/**
 * Базовый абстрактный класс для анализаторов
 */
class BaseAnalyzer {
    name;
    description;
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }
    getName() {
        return this.name;
    }
    getDescription() {
        return this.description;
    }
    async isApplicable(project) {
        // По умолчанию анализатор применим ко всем проектам
        return true;
    }
    /**
     * Безопасное чтение файла с обработкой ошибок
     */
    async safeReadFile(project, filePath) {
        try {
            if (await project.exists(filePath)) {
                return await project.readFile(filePath);
            }
            return null;
        }
        catch (error) {
            console.warn(`Failed to read file ${filePath}:`, error);
            return null;
        }
    }
    /**
     * Безопасный парсинг JSON с обработкой ошибок
     */
    safeParseJSON(content) {
        try {
            return JSON.parse(content);
        }
        catch (error) {
            console.warn('Failed to parse JSON:', error);
            return null;
        }
    }
    /**
     * Получить список файлов с безопасной обработкой ошибок
     */
    async safeGetFileList(project, pattern) {
        try {
            return await project.getFileList(pattern);
        }
        catch (error) {
            console.warn(`Failed to get file list with pattern ${pattern}:`, error);
            return [];
        }
    }
    /**
     * Безопасное получение статистики файла
     */
    async safeGetFileStats(project, filePath) {
        try {
            if (await project.exists(filePath)) {
                return await project.getFileStats(filePath);
            }
            return null;
        }
        catch (error) {
            console.warn(`Failed to get file stats for ${filePath}:`, error);
            return null;
        }
    }
    /**
     * Вычислить размер файла в байтах
     */
    getFileSize(content) {
        return Buffer.byteLength(content, 'utf8');
    }
    /**
     * Проверить, является ли файл исходным кодом
     */
    isSourceCodeFile(filePath) {
        const sourceExtensions = [
            '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
            '.py', '.java', '.c', '.cpp', '.cs', '.php',
            '.rb', '.go', '.rs', '.kt', '.scala', '.swift'
        ];
        return sourceExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
    }
    /**
     * Проверить, является ли файл конфигурационным
     */
    isConfigFile(filePath) {
        const configPatterns = [
            /package\.json$/,
            /tsconfig.*\.json$/,
            /\.eslintrc/,
            /\.prettierrc/,
            /webpack\.config/,
            /vite\.config/,
            /next\.config/,
            /\.env/,
            /Dockerfile/,
            /docker-compose/,
            /\.yml$/,
            /\.yaml$/
        ];
        return configPatterns.some(pattern => pattern.test(filePath));
    }
    /**
     * Проверить, является ли директория node_modules или подобной
     */
    isIgnoredDirectory(dirPath) {
        const ignoredDirs = [
            'node_modules',
            'dist',
            'build',
            '.git',
            '.svn',
            'coverage',
            '.nyc_output',
            'tmp',
            'temp'
        ];
        return ignoredDirs.some(dir => dirPath.includes(dir));
    }
}
exports.BaseAnalyzer = BaseAnalyzer;
//# sourceMappingURL=interfaces.js.map