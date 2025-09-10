"use strict";
/**
 * Рефакторированный анализатор структуры проекта для ЭАП
 * Модульная архитектура для улучшения поддерживаемости
 *
 * Архитектура:
 * - core/analyzer-core.js - Основной класс и конфигурация
 * - analysis/analysis-manager.js - Управление процессом анализа
 * - recommendations/generator.js - Генерация рекомендаций
 * - metrics/calculator.js - Расчет метрик и оценок
 * - integration/eap-integration.js - Интеграция с ЭАП
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAPIntegration = exports.MetricsCalculator = exports.RecommendationGenerator = exports.AnalysisManager = exports.AnalyzerCore = void 0;
exports.analyzeProjectStructure = analyzeProjectStructure;
exports.quickStructureCheck = quickStructureCheck;
exports.getModuleInfo = getModuleInfo;
exports.exportResults = exportResults;
// Импорт модулей
const analyzer_core_js_1 = require("./core/analyzer-core.js");
Object.defineProperty(exports, "AnalyzerCore", { enumerable: true, get: function () { return analyzer_core_js_1.AnalyzerCore; } });
const analysis_manager_js_1 = require("./analysis/analysis-manager.js");
Object.defineProperty(exports, "AnalysisManager", { enumerable: true, get: function () { return analysis_manager_js_1.AnalysisManager; } });
const generator_js_1 = require("./recommendations/generator.js");
Object.defineProperty(exports, "RecommendationGenerator", { enumerable: true, get: function () { return generator_js_1.RecommendationGenerator; } });
const calculator_js_1 = require("./metrics/calculator.js");
Object.defineProperty(exports, "MetricsCalculator", { enumerable: true, get: function () { return calculator_js_1.MetricsCalculator; } });
const eap_integration_js_1 = require("./integration/eap-integration.js");
Object.defineProperty(exports, "EAPIntegration", { enumerable: true, get: function () { return eap_integration_js_1.EAPIntegration; } });
// Совместимость с существующими импортами
const config_json_1 = __importDefault(require("./config.json"));
/**
 * Основной класс анализатора структуры
 * Координирует работу всех модулей
 */
class StructureAnalyzer {
    constructor(userConfig = {}) {
        // Инициализация основных компонентов
        this.core = new analyzer_core_js_1.AnalyzerCore(userConfig);
        this.analysisManager = new analysis_manager_js_1.AnalysisManager(this.core);
        this.metricsCalculator = new calculator_js_1.MetricsCalculator(this.core);
        this.recommendationGenerator = new generator_js_1.RecommendationGenerator(this.core);
        this.eapIntegration = new eap_integration_js_1.EAPIntegration(this.core, this.metricsCalculator);
        // Обратная совместимость
        this.config = this.core.config;
        this.learningSystem = this.core.learningSystem;
        this.version = this.core.version;
    }
    /**
     * Основная функция анализа структуры проекта
     */
    async analyzeProjectStructure(projectPath, options = {}) {
        console.log('[StructureAnalyzer] Начало полного анализа структуры проекта...');
        const startTime = Date.now();
        try {
            // Выполняем анализ через AnalysisManager
            const analysisResults = await this.analysisManager.performFullAnalysis(projectPath, options);
            // Генерируем рекомендации
            console.log('[StructureAnalyzer] Генерация рекомендаций...');
            const recommendations = this.recommendationGenerator.generateRecommendations(analysisResults.basicResults, analysisResults.advancedResults);
            // Генерируем интеграцию с ЭАП
            console.log('[StructureAnalyzer] Интеграция с ЭАП...');
            const eapIntegration = this.eapIntegration.generateEAPIntegration(analysisResults.basicResults, analysisResults.advancedResults, recommendations);
            // Рассчитываем общий балл
            const score = this.metricsCalculator.calculateStructureScore(analysisResults.basicResults, analysisResults.advancedResults);
            // Генерируем итоговое резюме
            const summary = this.metricsCalculator.generateMetricsSummary(analysisResults.basicResults, analysisResults.advancedResults, recommendations);
            // Формируем итоговый результат
            const result = {
                metadata: {
                    projectPath,
                    analysisTime: new Date().toISOString(),
                    executionTime: Date.now() - startTime,
                    analyzerVersion: this.version,
                    eapIntegration: true,
                    thresholdsUsed: this.core.getAnalysisThresholds(),
                    analysisType: analysisResults.analysisOptions.enableAdvanced ? 'full' : 'basic',
                },
                basic: analysisResults.basicResults,
                advanced: analysisResults.advancedResults,
                recommendations,
                learningStats: this.core.getLearningStats(),
                score,
                summary,
                eap: eapIntegration,
            };
            console.log(`[StructureAnalyzer] Анализ структуры завершен за ${result.metadata.executionTime}ms`);
            return result;
        }
        catch (error) {
            console.error('[StructureAnalyzer] Ошибка при анализе:', error.message);
            throw new Error(`Failed to analyze project structure: ${error.message}`);
        }
    }
    /**
     * Быстрый анализ структуры (только базовые метрики)
     */
    async quickStructureCheck(projectPath) {
        console.log('[StructureAnalyzer] Быстрая проверка структуры...');
        const startTime = Date.now();
        try {
            const analysisResults = await this.analysisManager.performQuickAnalysis(projectPath);
            const score = this.metricsCalculator.calculateStructureScore(analysisResults.basicResults);
            return {
                projectPath,
                score,
                issues: analysisResults.basicResults.issues || [],
                patterns: analysisResults.basicResults.patterns || [],
                recommendation: this.recommendationGenerator.getQuickRecommendation(score),
                timestamp: new Date().toISOString(),
                executionTime: Date.now() - startTime,
            };
        }
        catch (error) {
            console.error('[StructureAnalyzer] Ошибка быстрой проверки:', error.message);
            throw new Error(`Quick structure check failed: ${error.message}`);
        }
    }
    /**
     * Генерирует полный отчет с дорожной картой рефакторинга
     */
    async generateFullReport(projectPath, options = {}) {
        const results = await this.analyzeProjectStructure(projectPath, options);
        return this.eapIntegration.generateFullEAPReport(projectPath, results.basic, results.advanced, results.recommendations, results.metadata.executionTime);
    }
    // === Методы для обратной совместимости ===
    /**
     * Псевдоним для analyzeProjectStructure (обратная совместимость)
     */
    async analyze(projectPath, options = {}) {
        return this.analyzeProjectStructure(projectPath, options);
    }
    /**
     * Проверяет размер проекта для производительности
     */
    async validateProjectSize(projectPath) {
        return this.core.validateProjectSize(projectPath);
    }
    /**
     * Генерирует статические рекомендации
     */
    generateStaticRecommendations(basicResults, advancedResults) {
        return this.recommendationGenerator.generateStaticRecommendations(basicResults, advancedResults);
    }
    /**
     * Генерирует данные для интеграции с ЭАП
     */
    generateEAPIntegration(basicResults, advancedResults, recommendations) {
        return this.eapIntegration.generateEAPIntegration(basicResults, advancedResults, recommendations);
    }
    /**
     * Вычисляет общий балл структуры проекта
     */
    calculateStructureScore(basicResults, advancedResults) {
        return this.metricsCalculator.calculateStructureScore(basicResults, advancedResults);
    }
    /**
     * Оценивает покрытие тестами
     */
    estimateTestCoverage(basicResults) {
        return this.metricsCalculator.estimateTestCoverage(basicResults);
    }
    /**
     * Вычисляет общее качество кода
     */
    calculateCodeQuality(basicResults, advancedResults) {
        return this.metricsCalculator.calculateCodeQuality(basicResults, advancedResults);
    }
    /**
     * Вычисляет структурную сложность
     */
    calculateStructuralComplexity(basicResults, advancedResults) {
        return this.metricsCalculator.calculateStructuralComplexity(basicResults, advancedResults);
    }
    /**
     * Генерирует итоговое резюме анализа
     */
    generateSummary(basicResults, advancedResults, recommendations) {
        return this.metricsCalculator.generateMetricsSummary(basicResults, advancedResults, recommendations);
    }
    /**
     * Получает информацию о модуле
     */
    getModuleInfo() {
        return this.core.getModuleInfo();
    }
    /**
     * Получает статистику обучения
     */
    getLearningStats() {
        return this.core.getLearningStats();
    }
    /**
     * Получает текущие адаптивные пороги
     */
    getCurrentThresholds() {
        return this.core.getAnalysisThresholds();
    }
    /**
     * Экспортирует результаты анализа
     */
    async exportResults(results, outputPath, format = 'json') {
        if (format === 'eap') {
            return this.eapIntegration.exportForEAP(results, outputPath);
        }
        // Реализация других форматов экспорта
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        let content;
        switch (format.toLowerCase()) {
            case 'json':
                content = JSON.stringify(results, null, 2);
                break;
            default:
                throw new Error(`Неподдерживаемый формат: ${format}`);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `structure-analysis-${timestamp}.${format}`;
        const fullPath = path.join(outputPath, filename);
        await fs.promises.mkdir(outputPath, { recursive: true });
        await fs.promises.writeFile(fullPath, content);
        console.log(`[StructureAnalyzer] Результаты сохранены: ${fullPath}`);
        return fullPath;
    }
}
// === Статические методы для прямого использования в ЭАП ===
/**
 * Анализ структуры проекта (статический метод)
 */
async function analyzeProjectStructure(projectPath, options = {}) {
    const analyzer = new StructureAnalyzer(options.config);
    return analyzer.analyzeProjectStructure(projectPath, options);
}
/**
 * Быстрая проверка структуры (статический метод)
 */
async function quickStructureCheck(projectPath) {
    const analyzer = new StructureAnalyzer();
    return analyzer.quickStructureCheck(projectPath);
}
/**
 * Получение информации о модуле (статический метод)
 */
function getModuleInfo() {
    return {
        name: config_json_1.default.module.name,
        version: config_json_1.default.module.version,
        description: config_json_1.default.module.description,
        architecture: 'modular',
        modules: [
            'core/analyzer-core.js',
            'analysis/analysis-manager.js',
            'recommendations/generator.js',
            'metrics/calculator.js',
            'integration/eap-integration.js',
        ],
    };
}
/**
 * Экспорт результатов (статический метод)
 */
async function exportResults(results, outputPath, format = 'json') {
    const analyzer = new StructureAnalyzer();
    return analyzer.exportResults(results, outputPath, format);
}
// Экспорты
exports.default = StructureAnalyzer;
//# sourceMappingURL=index-refactored.js.map