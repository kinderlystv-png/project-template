import { GoldenStandardAnalyzer } from '../analyzer.js';
import {
  AIInsightsEngine,
  AIAnalysisResult,
  ExtractedFeatures,
  QualityPrediction,
  PatternAnalysis,
  DuplicationAnalysis,
  ComplexityAnalysis,
  AISummary,
} from '../modules/ai-insights/ai-insights-engine.js';
import { SimpleAnalysisResult } from '../analyzer.js';

export interface IntegratedAnalysisResult extends SimpleAnalysisResult {
  aiInsights?: AIAnalysisResult;
  structuralAnalysis?: {
    duplication: any;
    complexity: any;
    fileClassification: any;
  };
}

export class AIEnhancedAnalyzer {
  private baseAnalyzer: GoldenStandardAnalyzer;
  private aiEngine: AIInsightsEngine;

  constructor() {
    this.baseAnalyzer = new GoldenStandardAnalyzer();
    this.aiEngine = new AIInsightsEngine();
  }

  async analyzeProject(projectPath: string, options: any = {}): Promise<IntegratedAnalysisResult> {
    console.log(`🧠 Запуск комплексного AI анализа для проекта: ${projectPath}`);

    try {
      const baseResult = await this.baseAnalyzer.analyzeProject(projectPath);
      const structuralAnalysis = await this.baseAnalyzer.performStructuralAnalysis(projectPath);
      const aiResult = await this.aiEngine.analyze(projectPath, options);

      const integratedResult: IntegratedAnalysisResult = {
        ...baseResult,
        aiInsights: aiResult,
        structuralAnalysis,
      };

      return integratedResult;
    } catch (error) {
      console.error(
        `❌ Ошибка при комплексном анализе: ${error instanceof Error ? error.message : String(error)}`
      );
      const baseResult = await this.baseAnalyzer.analyzeProject(projectPath);
      return baseResult;
    }
  }

  generateEnhancedSummary(result: IntegratedAnalysisResult): string {
    const lines: string[] = [];
    lines.push('🤖 === РАСШИРЕННЫЙ ОТЧЕТ EAP + AI ===');
    lines.push('');
    lines.push('📊 БАЗОВАЯ АНАЛИТИКА:');
    lines.push(`   Всего файлов: ${result.fileCount}`);
    lines.push('');

    if (result.aiInsights) {
      lines.push('🧠 AI АНАЛИТИКА:');
      lines.push(`   Общая AI оценка: ${result.aiInsights.summary.overallQuality}/100`);
      lines.push(
        `   Качество предсказания: ${(result.aiInsights.qualityPrediction.confidence * 100).toFixed(1)}%`
      );
      lines.push('');
    }

    lines.push('================================');
    return lines.join('\n');
  }
}

export {
  AIAnalysisResult,
  ExtractedFeatures,
  QualityPrediction,
  PatternAnalysis,
  DuplicationAnalysis,
  ComplexityAnalysis,
  AISummary,
};

export default AIEnhancedAnalyzer;
