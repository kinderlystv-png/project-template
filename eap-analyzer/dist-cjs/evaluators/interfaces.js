"use strict";
/**
 * Base Evaluator Interface
 * Базовый интерфейс для всех оценщиков
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEvaluator = void 0;
/**
 * Базовый абстрактный класс для оценщиков
 */
class BaseEvaluator {
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
        // По умолчанию оценщик применим ко всем проектам
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
     * Нормализует значение в диапазон 0-100
     */
    normalizeScore(value, min, max) {
        if (max === min)
            return 100;
        const normalized = ((value - min) / (max - min)) * 100;
        return Math.max(0, Math.min(100, normalized));
    }
    /**
     * Вычисляет взвешенную оценку
     */
    calculateWeightedScore(scores, weights) {
        let totalScore = 0;
        let totalWeight = 0;
        for (const [category, score] of Object.entries(scores)) {
            const weight = weights[category] || 1;
            totalScore += score * weight;
            totalWeight += weight;
        }
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
    /**
     * Категоризирует значение по уровням
     */
    categorizeLevel(value, thresholds) {
        if (value >= thresholds.excellent)
            return 'excellent';
        if (value >= thresholds.good)
            return 'good';
        if (value >= thresholds.fair)
            return 'fair';
        return 'poor';
    }
    /**
     * Генерирует рекомендации на основе оценки
     */
    generateRecommendations(scores, thresholds) {
        const recommendations = [];
        for (const [category, score] of Object.entries(scores)) {
            const threshold = thresholds[category] || 70;
            if (score < threshold) {
                const gap = threshold - score;
                const priority = gap > 40 ? 'high' : gap > 20 ? 'medium' : 'low';
                recommendations.push({
                    category,
                    priority,
                    currentScore: score,
                    targetScore: threshold,
                    actions: this.getActionsForCategory(category, gap),
                    estimatedEffort: this.estimateEffort(gap),
                    expectedImpact: gap
                });
            }
        }
        return recommendations.sort((a, b) => b.expectedImpact - a.expectedImpact);
    }
    /**
     * Получает действия для улучшения категории
     */
    getActionsForCategory(category, gap) {
        const actionMap = {
            codeQuality: [
                'Рефакторинг сложных функций',
                'Устранение дублирования кода',
                'Добавление типизации',
                'Улучшение именования переменных'
            ],
            testCoverage: [
                'Написание unit-тестов',
                'Добавление интеграционных тестов',
                'Настройка автоматического тестирования',
                'Покрытие критических путей'
            ],
            documentation: [
                'Написание README',
                'Документирование API',
                'Добавление комментариев к сложным функциям',
                'Создание примеров использования'
            ],
            performance: [
                'Оптимизация алгоритмов',
                'Кэширование данных',
                'Уменьшение размера бандла',
                'Ленивая загрузка компонентов'
            ],
            security: [
                'Обновление зависимостей',
                'Аудит безопасности',
                'Использование HTTPS',
                'Валидация входных данных'
            ]
        };
        return actionMap[category] || ['Общие улучшения'];
    }
    /**
     * Оценивает усилия для устранения проблем
     */
    estimateEffort(gap) {
        // Базовая формула: gap * 0.5 часа
        return Math.ceil(gap * 0.5);
    }
}
exports.BaseEvaluator = BaseEvaluator;
//# sourceMappingURL=interfaces.js.map