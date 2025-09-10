"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAnalyzer = void 0;
/**
 * Базовый класс для всех анализаторов
 * Предоставляет общую функциональность и стандартную реализацию
 * @typeParam T - Тип данных, возвращаемый анализатором
 */
class BaseAnalyzer {
    name;
    category;
    version;
    description;
    config;
    /**
     * @param name - Название анализатора
     * @param category - Категория анализа
     * @param description - Описание анализатора
     * @param version - Версия анализатора
     * @param config - Конфигурация анализатора
     */
    constructor(name, category, description, version = '1.0.0', config = { enabled: true }) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.version = version;
        this.config = config;
    }
    /**
     * @inheritdoc
     */
    getName() {
        return this.name;
    }
    /**
     * @inheritdoc
     */
    getCategory() {
        return this.category;
    }
    /**
     * @inheritdoc
     */
    getVersion() {
        return this.version;
    }
    /**
     * @inheritdoc
     */
    getDescription() {
        return this.description;
    }
    /**
     * @inheritdoc
     */
    async canAnalyze(project) {
        // Базовая проверка - проект должен существовать
        return await project.exists('.');
    }
    /**
     * Получить конфигурацию анализатора
     */
    getConfig() {
        return this.config;
    }
    /**
     * Логирование для анализатора
     * @param message - Сообщение для логирования
     * @param level - Уровень логирования
     */
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${this.name}]`;
        switch (level) {
            case 'warn':
                console.warn(`${prefix} WARN: ${message}`);
                break;
            case 'error':
                console.error(`${prefix} ERROR: ${message}`);
                break;
            default:
                console.log(`${prefix} INFO: ${message}`);
        }
    }
    /**
     * Безопасное выполнение анализа с обработкой ошибок
     * @param project - Проект для анализа
     * @returns Результат анализа или null в случае ошибки
     */
    async safeAnalyze(project) {
        try {
            if (!this.config.enabled) {
                this.log('Анализатор отключен в конфигурации', 'info');
                return null;
            }
            if (!(await this.canAnalyze(project))) {
                this.log('Анализатор не может работать с данным проектом', 'warn');
                return null;
            }
            const startTime = Date.now();
            this.log('Начало анализа', 'info');
            const result = await this.analyze(project);
            const duration = Date.now() - startTime;
            this.log(`Анализ завершен за ${duration}ms`, 'info');
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log(`Ошибка при анализе: ${errorMessage}`, 'error');
            return null;
        }
    }
}
exports.BaseAnalyzer = BaseAnalyzer;
//# sourceMappingURL=BaseAnalyzer.js.map