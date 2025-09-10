"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEvaluator = void 0;
/**
 * Базовый класс для всех оценщиков
 * Предоставляет общую функциональность и стандартную реализацию
 * @typeParam T - Тип данных для оценки
 * @typeParam R - Тип результата оценки
 */
class BaseEvaluator {
    name;
    category;
    version;
    description;
    config;
    metricName;
    unit;
    /**
     * @param name - Название оценщика
     * @param category - Категория анализа
     * @param description - Описание оценщика
     * @param metricName - Название метрики
     * @param unit - Единица измерения
     * @param version - Версия оценщика
     * @param config - Конфигурация оценщика
     */
    constructor(name, category, description, metricName, unit, version = '1.0.0', config = { thresholds: {} }) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.metricName = metricName;
        this.unit = unit;
        this.version = version;
        this.config = config;
    }
    /**
     * @inheritdoc
     */
    getMetricName() {
        return this.metricName;
    }
    /**
     * @inheritdoc
     */
    getThresholds() {
        return this.config.thresholds;
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
    getUnit() {
        return this.unit;
    }
    /**
     * @inheritdoc
     */
    canEvaluate(data) {
        // Базовая проверка - данные не должны быть null/undefined
        return data != null;
    }
    /**
     * Получить название оценщика
     */
    getName() {
        return this.name;
    }
    /**
     * Получить категорию анализа
     */
    getCategory() {
        return this.category;
    }
    /**
     * Получить версию
     */
    getVersion() {
        return this.version;
    }
    /**
     * Получить конфигурацию оценщика
     */
    getConfig() {
        return this.config;
    }
    /**
     * Логирование для оценщика
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
     * Безопасное выполнение оценки с обработкой ошибок
     * @param data - Данные для оценки
     * @returns Результат оценки или null в случае ошибки
     */
    safeEvaluate(data) {
        try {
            if (!this.canEvaluate(data)) {
                this.log('Оценщик не может работать с данными данными', 'warn');
                return null;
            }
            const startTime = Date.now();
            this.log('Начало оценки', 'info');
            const result = this.evaluate(data);
            const duration = Date.now() - startTime;
            this.log(`Оценка завершена за ${duration}ms`, 'info');
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log(`Ошибка при оценке: ${errorMessage}`, 'error');
            return null;
        }
    }
    /**
     * Нормализация числовых значений в диапазон 0-1
     * @param value - Значение для нормализации
     * @param min - Минимальное значение
     * @param max - Максимальное значение
     * @returns Нормализованное значение от 0 до 1
     */
    normalize(value, min, max) {
        if (max === min)
            return 1;
        return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }
    /**
     * Вычисление весового среднего
     * @param values - Массив значений и их весов
     * @returns Весовое среднее
     */
    weightedAverage(values) {
        if (values.length === 0)
            return 0;
        const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
        if (totalWeight === 0)
            return 0;
        const weightedSum = values.reduce((sum, item) => sum + item.value * item.weight, 0);
        return weightedSum / totalWeight;
    }
    /**
     * Округление до указанного количества знаков после запятой
     * @param value - Значение для округления
     * @param decimals - Количество знаков после запятой
     * @returns Округленное значение
     */
    round(value, decimals = 2) {
        const multiplier = Math.pow(10, decimals);
        return Math.round(value * multiplier) / multiplier;
    }
    /**
     * Получить уровень качества на основе score
     * @param score - Балл от 0 до 100
     * @returns Текстовое описание уровня
     */
    getQualityLevel(score) {
        if (score >= 90)
            return 'excellent';
        if (score >= 75)
            return 'good';
        if (score >= 50)
            return 'fair';
        return 'poor';
    }
    /**
     * Получить весы из конфигурации или значения по умолчанию
     * @param defaultWeights - Веса по умолчанию
     * @returns Веса для использования
     */
    getWeights(defaultWeights) {
        return { ...defaultWeights, ...this.config.weights };
    }
}
exports.BaseEvaluator = BaseEvaluator;
//# sourceMappingURL=BaseEvaluator.js.map