"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIEnhancedAnalyzer = void 0;
const analyzer_js_1 = require("../analyzer.js");
const ai_insights_engine_js_1 = require("../modules/ai-insights/ai-insights-engine.js");
class AIEnhancedAnalyzer {
    baseAnalyzer;
    aiEngine;
    constructor() {
        this.baseAnalyzer = new analyzer_js_1.GoldenStandardAnalyzer();
        this.aiEngine = new ai_insights_engine_js_1.AIInsightsEngine();
    }
    async analyzeProject(projectPath, options = {}) {
        console.log(`🧠 Запуск комплексного AI анализа для проекта: ${projectPath}`);
        try {
            const baseResult = await this.baseAnalyzer.analyzeProject(projectPath);
            const structuralAnalysis = await this.baseAnalyzer.performStructuralAnalysis(projectPath);
            const aiResult = await this.aiEngine.analyze(projectPath, options);
            const integratedResult = {
                ...baseResult,
                aiInsights: aiResult,
                structuralAnalysis,
            };
            return integratedResult;
        }
        catch (error) {
            console.error(`❌ Ошибка при комплексном анализе: ${error instanceof Error ? error.message : String(error)}`);
            const baseResult = await this.baseAnalyzer.analyzeProject(projectPath);
            return baseResult;
        }
    }
    generateEnhancedSummary(result) {
        const lines = [];
        lines.push('🤖 === РАСШИРЕННЫЙ ОТЧЕТ EAP + AI ===');
        lines.push('');
        lines.push('📊 БАЗОВАЯ АНАЛИТИКА:');
        lines.push(`   Всего файлов: ${result.fileCount}`);
        lines.push('');
        if (result.aiInsights) {
            lines.push('🧠 AI АНАЛИТИКА:');
            lines.push(`   Общая AI оценка: ${result.aiInsights.summary.overallQuality}/100`);
            lines.push(`   Качество предсказания: ${(result.aiInsights.qualityPrediction.confidence * 100).toFixed(1)}%`);
            lines.push('');
        }
        lines.push('================================');
        return lines.join('\n');
    }
}
exports.AIEnhancedAnalyzer = AIEnhancedAnalyzer;
exports.default = AIEnhancedAnalyzer;
//# sourceMappingURL=index.js.map