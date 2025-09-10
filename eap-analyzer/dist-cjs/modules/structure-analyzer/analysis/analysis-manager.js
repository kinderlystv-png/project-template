"use strict";
/**
 * Модуль управления анализом проекта
 * Координирует базовый и расширенный анализ
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisManager = void 0;
const basic_analyzer_js_1 = __importDefault(require("../basic-analyzer.js"));
const advanced_analyzer_js_1 = __importDefault(require("../advanced-analyzer.js"));
/**
 * Управляет процессом анализа проекта
 */
class AnalysisManager {
    constructor(core) {
        this.core = core;
    }
    /**
     * Выполняет полный анализ структуры проекта
     */
    async performFullAnalysis(projectPath, options = {}) {
        console.log('[AnalysisManager] Начало полного анализа структуры проекта...');
        const startTime = Date.now();
        const analysisOptions = {
            enableAdvanced: options.enableAdvanced !== false && this.core.config.enableAdvancedAnalysis,
            enableLearning: options.enableLearning !== false && this.core.config.enableLearning,
            outputFormat: options.outputFormat || this.core.config.outputFormat,
            timeout: options.timeout || this.core.config.analysisTimeout,
            ...options,
        };
        // Проверяем ограничения производительности
        await this.core.validateProjectSize(projectPath);
        // Получаем адаптивные пороги
        const thresholds = this.core.getAnalysisThresholds();
        // Базовый анализ
        console.log('[AnalysisManager] Выполнение базового анализа...');
        const basicResults = await this.performBasicAnalysis(projectPath, thresholds.basic || thresholds);
        // Расширенный анализ (если включен)
        let advancedResults = null;
        if (analysisOptions.enableAdvanced) {
            console.log('[AnalysisManager] Выполнение расширенного анализа...');
            advancedResults = await this.performAdvancedAnalysis(projectPath, thresholds.basic || thresholds);
        }
        // Обновление системы обучения
        this.core.updateLearningSystem(projectPath, basicResults, advancedResults);
        return {
            basicResults,
            advancedResults,
            executionTime: Date.now() - startTime,
            analysisOptions,
        };
    }
    /**
     * Выполняет быстрый анализ (только базовые метрики)
     */
    async performQuickAnalysis(projectPath) {
        console.log('[AnalysisManager] Быстрая проверка структуры...');
        const startTime = Date.now();
        const thresholds = this.core.getAnalysisThresholds();
        const basicResults = await this.performBasicAnalysis(projectPath, thresholds.basic || thresholds);
        return {
            basicResults,
            executionTime: Date.now() - startTime,
            analysisType: 'quick',
        };
    }
    /**
     * Выполняет базовый анализ структуры
     */
    async performBasicAnalysis(projectPath, thresholds) {
        try {
            const results = await basic_analyzer_js_1.default.analyze(projectPath, thresholds);
            // Дополнительная обработка результатов
            this.enrichBasicResults(results);
            return results;
        }
        catch (error) {
            console.error('[AnalysisManager] Ошибка базового анализа:', error.message);
            throw new Error(`Basic analysis failed: ${error.message}`);
        }
    }
    /**
     * Выполняет расширенный анализ структуры
     */
    async performAdvancedAnalysis(projectPath, thresholds) {
        try {
            const results = await advanced_analyzer_js_1.default.analyze(projectPath, thresholds);
            // Дополнительная обработка результатов
            this.enrichAdvancedResults(results);
            return results;
        }
        catch (error) {
            console.error('[AnalysisManager] Ошибка расширенного анализа:', error.message);
            // Не прерываем анализ, если расширенный анализ не удался
            return null;
        }
    }
    /**
     * Обогащает результаты базового анализа
     */
    enrichBasicResults(results) {
        // Добавляем метки времени
        results.timestamp = new Date().toISOString();
        // Нормализуем структуру данных
        if (!results.patterns)
            results.patterns = [];
        if (!results.issues)
            results.issues = [];
        if (!results.metrics)
            results.metrics = {};
        // Добавляем дополнительную категоризацию
        results.categorizedIssues = this.categorizeIssues(results.issues);
    }
    /**
     * Обогащает результаты расширенного анализа
     */
    enrichAdvancedResults(results) {
        if (!results)
            return;
        // Добавляем метки времени
        results.timestamp = new Date().toISOString();
        // Нормализуем структуру данных
        if (!results.hotspots)
            results.hotspots = [];
        if (!results.dependencies)
            results.dependencies = [];
        if (!results.metrics)
            results.metrics = {};
        // Добавляем приоритизацию hotspots
        results.prioritizedHotspots = this.prioritizeHotspots(results.hotspots);
    }
    /**
     * Категоризирует проблемы по типам
     */
    categorizeIssues(issues) {
        const categories = {
            structure: [],
            quality: [],
            performance: [],
            security: [],
            maintainability: [],
        };
        issues.forEach(issue => {
            const category = this.getIssueCategory(issue.type);
            if (categories[category]) {
                categories[category].push(issue);
            }
        });
        return categories;
    }
    /**
     * Определяет категорию проблемы
     */
    getIssueCategory(issueType) {
        const typeMap = {
            'large-file': 'maintainability',
            'deep-nesting': 'structure',
            'complex-function': 'quality',
            'missing-tests': 'quality',
            'unused-code': 'maintainability',
            'duplicate-code': 'maintainability',
            'security-issue': 'security',
            'performance-issue': 'performance',
        };
        return typeMap[issueType] || 'quality';
    }
    /**
     * Приоритизирует hotspots по важности
     */
    prioritizeHotspots(hotspots) {
        return hotspots
            .map(hotspot => ({
            ...hotspot,
            priority: this.calculateHotspotPriority(hotspot),
        }))
            .sort((a, b) => b.priority - a.priority);
    }
    /**
     * Вычисляет приоритет hotspot
     */
    calculateHotspotPriority(hotspot) {
        let priority = 0;
        // Сложность кода
        if (hotspot.complexity > 20)
            priority += 30;
        else if (hotspot.complexity > 10)
            priority += 20;
        else if (hotspot.complexity > 5)
            priority += 10;
        // Размер файла
        if (hotspot.lines > 1000)
            priority += 25;
        else if (hotspot.lines > 500)
            priority += 15;
        else if (hotspot.lines > 200)
            priority += 5;
        // Количество изменений (если доступно)
        if (hotspot.changeFrequency > 0.8)
            priority += 20;
        else if (hotspot.changeFrequency > 0.5)
            priority += 10;
        return priority;
    }
}
exports.AnalysisManager = AnalysisManager;
exports.default = AnalysisManager;
//# sourceMappingURL=analysis-manager.js.map