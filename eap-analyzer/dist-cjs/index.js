"use strict";
/**
 * Эталонный Анализатор Проектов (ЭАП) v3.0
 * Современная архитектура с модульной системой
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODULE_INFO = exports.VERSION = exports.EAPAnalyzer = exports.testAnalyzer = exports.EMTChecker = exports.DockerChecker = exports.AIInsightsEngine = exports.QualityPredictor = exports.FeatureExtractor = exports.AIReportGenerator = exports.AIEnhancedAnalyzer = exports.GoldenStandardAnalyzer = exports.ALL_MODULE_CHECKERS = exports.ALL_ANALYZERS = exports.ALL_MODULES = exports.DockerOptimizationChecker = exports.DockerSecurityChecker = exports.DockerModule = exports.DockerAnalyzer = exports.EMTDependenciesChecker = exports.EMTConfigChecker = exports.EMTRoutesChecker = exports.EMTModule = exports.EMTAnalyzer = exports.UNIVERSAL_CHECKERS = exports.TestingChecker = exports.CodeQualityChecker = exports.PerformanceChecker = exports.SecurityChecker = exports.AnalysisOrchestrator = exports.BaseAnalyzer = exports.BaseChecker = void 0;
exports.createEAPAnalyzer = createEAPAnalyzer;
// === НОВАЯ АРХИТЕКТУРА v3.0 ===
// Основные классы архитектуры
var index_js_1 = require("./core/index.js");
Object.defineProperty(exports, "BaseChecker", { enumerable: true, get: function () { return index_js_1.BaseChecker; } });
Object.defineProperty(exports, "BaseAnalyzer", { enumerable: true, get: function () { return index_js_1.BaseAnalyzer; } });
Object.defineProperty(exports, "AnalysisOrchestrator", { enumerable: true, get: function () { return index_js_1.AnalysisOrchestrator; } });
// Универсальные чекеры
var index_js_2 = require("./checkers/index.js");
Object.defineProperty(exports, "SecurityChecker", { enumerable: true, get: function () { return index_js_2.SecurityChecker; } });
Object.defineProperty(exports, "PerformanceChecker", { enumerable: true, get: function () { return index_js_2.PerformanceChecker; } });
Object.defineProperty(exports, "CodeQualityChecker", { enumerable: true, get: function () { return index_js_2.CodeQualityChecker; } });
Object.defineProperty(exports, "TestingChecker", { enumerable: true, get: function () { return index_js_2.TestingChecker; } });
Object.defineProperty(exports, "UNIVERSAL_CHECKERS", { enumerable: true, get: function () { return index_js_2.UNIVERSAL_CHECKERS; } });
// Модули анализа
var index_js_3 = require("./modules/index.js");
// EMT Module
Object.defineProperty(exports, "EMTAnalyzer", { enumerable: true, get: function () { return index_js_3.EMTAnalyzer; } });
Object.defineProperty(exports, "EMTModule", { enumerable: true, get: function () { return index_js_3.EMTModule; } });
Object.defineProperty(exports, "EMTRoutesChecker", { enumerable: true, get: function () { return index_js_3.EMTRoutesChecker; } });
Object.defineProperty(exports, "EMTConfigChecker", { enumerable: true, get: function () { return index_js_3.EMTConfigChecker; } });
Object.defineProperty(exports, "EMTDependenciesChecker", { enumerable: true, get: function () { return index_js_3.EMTDependenciesChecker; } });
// Docker Module
Object.defineProperty(exports, "DockerAnalyzer", { enumerable: true, get: function () { return index_js_3.DockerAnalyzer; } });
Object.defineProperty(exports, "DockerModule", { enumerable: true, get: function () { return index_js_3.DockerModule; } });
Object.defineProperty(exports, "DockerSecurityChecker", { enumerable: true, get: function () { return index_js_3.DockerSecurityChecker; } });
Object.defineProperty(exports, "DockerOptimizationChecker", { enumerable: true, get: function () { return index_js_3.DockerOptimizationChecker; } });
// Коллекции
Object.defineProperty(exports, "ALL_MODULES", { enumerable: true, get: function () { return index_js_3.ALL_MODULES; } });
Object.defineProperty(exports, "ALL_ANALYZERS", { enumerable: true, get: function () { return index_js_3.ALL_ANALYZERS; } });
Object.defineProperty(exports, "ALL_MODULE_CHECKERS", { enumerable: true, get: function () { return index_js_3.ALL_MODULE_CHECKERS; } });
// === LEGACY СОВМЕСТИМОСТЬ ===
// Основные классы (legacy)
var analyzer_js_1 = require("./analyzer.js");
Object.defineProperty(exports, "GoldenStandardAnalyzer", { enumerable: true, get: function () { return analyzer_js_1.GoldenStandardAnalyzer; } });
// AI Enhanced модули (legacy)
var index_js_4 = require("./ai-integration/index.js");
Object.defineProperty(exports, "AIEnhancedAnalyzer", { enumerable: true, get: function () { return index_js_4.AIEnhancedAnalyzer; } });
var report_generator_js_1 = require("./ai-integration/report-generator.js");
Object.defineProperty(exports, "AIReportGenerator", { enumerable: true, get: function () { return report_generator_js_1.AIReportGenerator; } });
// AI модули (legacy)
var feature_extractor_js_1 = require("./modules/ai-insights/feature-extractor.js");
Object.defineProperty(exports, "FeatureExtractor", { enumerable: true, get: function () { return feature_extractor_js_1.FeatureExtractor; } });
var quality_predictor_js_1 = require("./modules/ai-insights/quality-predictor.js");
Object.defineProperty(exports, "QualityPredictor", { enumerable: true, get: function () { return quality_predictor_js_1.QualityPredictor; } });
var ai_insights_engine_js_1 = require("./modules/ai-insights/ai-insights-engine.js");
Object.defineProperty(exports, "AIInsightsEngine", { enumerable: true, get: function () { return ai_insights_engine_js_1.AIInsightsEngine; } });
// Legacy чекеры
var docker_js_1 = require("./checkers/docker.js");
Object.defineProperty(exports, "DockerChecker", { enumerable: true, get: function () { return docker_js_1.DockerChecker; } });
var emt_js_1 = require("./checkers/emt.js");
Object.defineProperty(exports, "EMTChecker", { enumerable: true, get: function () { return emt_js_1.EMTChecker; } });
// Утилиты
__exportStar(require("./utils/index.js"), exports);
// Legacy типы
__exportStar(require("./types/index.js"), exports);
__exportStar(require("./modules/ai-insights/types.js"), exports);
// Тестовая функция
var test_js_1 = require("./test.js");
Object.defineProperty(exports, "testAnalyzer", { enumerable: true, get: function () { return test_js_1.testAnalyzer; } });
// === ГЛАВНЫЕ ЭКСПОРТЫ v3.0 ===
// Основной анализатор новой архитектуры
const orchestrator_js_1 = require("./core/orchestrator.js");
const index_js_5 = require("./checkers/index.js");
const index_js_6 = require("./modules/index.js");
/**
 * Создает готовый к использованию анализатор с полной конфигурацией
 */
function createEAPAnalyzer() {
    const orchestrator = new orchestrator_js_1.AnalysisOrchestrator();
    // Регистрируем универсальные чекеры
    index_js_5.UNIVERSAL_CHECKERS.forEach(CheckerClass => {
        const checker = new CheckerClass();
        orchestrator.registerChecker(checker.getName?.() || checker.constructor.name, checker);
    });
    // Регистрируем модульные чекеры
    index_js_6.ALL_MODULE_CHECKERS.forEach(CheckerClass => {
        const checker = new CheckerClass();
        orchestrator.registerChecker(checker.getName?.() || checker.constructor.name, checker);
    });
    return orchestrator;
}
/**
 * Готовый к использованию анализатор с полной конфигурацией
 */
exports.EAPAnalyzer = createEAPAnalyzer();
/**
 * Версия API
 */
exports.VERSION = '3.0.0';
/**
 * Информация о модуле
 */
exports.MODULE_INFO = {
    name: 'EAP Analyzer',
    version: exports.VERSION,
    description: 'Эталонный Анализатор Проектов с модульной архитектурой',
    architecture: 'v3.0 - Modular',
    features: [
        'Unified module system',
        'Universal checkers',
        'Orchestrator coordination',
        'Type-safe architecture',
        'Legacy compatibility',
    ],
};
//# sourceMappingURL=index.js.map