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

// Импорт модулей
import { AnalyzerCore } from './core/analyzer-core.js';
import { AnalysisManager } from './analysis/analysis-manager.js';
import { RecommendationGenerator } from './recommendations/generator.js';
import { MetricsCalculator } from './metrics/calculator.js';
import { EAPIntegration } from './integration/eap-integration.js';

// Типы
interface AnalysisOptions {
  config?: any;
  deepAnalysis?: boolean;
  eapIntegration?: boolean;
}

interface AnalysisResults {
  basicResults: {
    totalFiles: number;
    totalLines: number;
    largeFiles: number;
    complexFiles: number;
    criticalIssues: number;
    filesByType: Record<string, any>;
    directoryStats: Record<string, any>;
    potentialRefactorFiles: any[];
    circularDependencies: any[];
    dependencyGraph: Record<string, any>;
    technicalDebt: number;
    filesNeedingRefactoring: number;
    refactoringPercentage: number;
    issues?: any[];
    patterns?: any[];
  };
  advancedResults?: any;
}

// Совместимость с существующими импортами
import { createRequire } from 'module';
const config = require('./config.json');

/**
 * Основной класс анализатора структуры
 * Координирует работу всех модулей
 */
class StructureAnalyzer {
  core: AnalyzerCore;
  analysisManager: AnalysisManager;
  metricsCalculator: MetricsCalculator;
  recommendationGenerator: RecommendationGenerator;
  eapIntegration: EAPIntegration;
  config: any;
  learningSystem: any;
  version: string;

  constructor(userConfig: any = {}) {
    // Инициализация основных компонентов
    this.core = new AnalyzerCore(userConfig);
    this.analysisManager = new AnalysisManager(this.core);
    this.metricsCalculator = new MetricsCalculator(this.core);
    this.recommendationGenerator = new RecommendationGenerator(this.core);
    this.eapIntegration = new EAPIntegration(this.core, this.metricsCalculator);

    // Обратная совместимость
    this.config = this.core.config;
    this.learningSystem = this.core.learningSystem;
    this.version = this.core.version;
  }

  /**
   * Основная функция анализа структуры проекта
   */
  async analyzeProjectStructure(projectPath: string, options: any = {}): Promise<any> {
    console.log('[StructureAnalyzer] Начало полного анализа структуры проекта...');

    const startTime = Date.now();

    try {
      // Выполняем анализ через AnalysisManager
      const analysisResults = await this.analysisManager.performFullAnalysis(projectPath, options);

      // Генерируем рекомендации
      console.log('[StructureAnalyzer] Генерация рекомендаций...');
      const recommendations = this.recommendationGenerator.generateRecommendations(
        analysisResults.basicResults,
        analysisResults.advancedResults
      );

      // Генерируем интеграцию с ЭАП
      console.log('[StructureAnalyzer] Интеграция с ЭАП...');
      const eapIntegration = this.eapIntegration.generateEAPIntegration(
        analysisResults.basicResults,
        analysisResults.advancedResults,
        recommendations
      );

      // Рассчитываем общий балл
      const score = this.metricsCalculator.calculateStructureScore(
        analysisResults.basicResults,
        analysisResults.advancedResults
      );

      // Генерируем итоговое резюме
      const summary = this.metricsCalculator.generateMetricsSummary(
        analysisResults.basicResults,
        analysisResults.advancedResults,
        recommendations
      );

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

      console.log(
        `[StructureAnalyzer] Анализ структуры завершен за ${result.metadata.executionTime}ms`
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[StructureAnalyzer] Ошибка при анализе:', errorMessage);
      throw new Error(`Failed to analyze project structure: ${errorMessage}`);
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
    } catch (error) {
      console.error('[StructureAnalyzer] Ошибка быстрой проверки:', error.message);
      throw new Error(`Quick structure check failed: ${error.message}`);
    }
  }

  /**
   * Генерирует полный отчет с дорожной картой рефакторинга
   */
  async generateFullReport(projectPath, options = {}) {
    const results = await this.analyzeProjectStructure(projectPath, options);

    return this.eapIntegration.generateFullEAPReport(
      projectPath,
      results.basic,
      results.advanced,
      results.recommendations,
      results.metadata.executionTime
    );
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
    return this.recommendationGenerator.generateStaticRecommendations(
      basicResults,
      advancedResults
    );
  }

  /**
   * Генерирует данные для интеграции с ЭАП
   */
  generateEAPIntegration(basicResults, advancedResults, recommendations) {
    return this.eapIntegration.generateEAPIntegration(
      basicResults,
      advancedResults,
      recommendations
    );
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
    return this.metricsCalculator.generateMetricsSummary(
      basicResults,
      advancedResults,
      recommendations
    );
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
    const fs = await import('fs');
    const path = await import('path');

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
    name: config.module.name,
    version: config.module.version,
    description: config.module.description,
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
export default StructureAnalyzer;
export {
  analyzeProjectStructure,
  quickStructureCheck,
  getModuleInfo,
  exportResults,
  // Экспорт модулей для продвинутого использования
  AnalyzerCore,
  AnalysisManager,
  RecommendationGenerator,
  MetricsCalculator,
  EAPIntegration,
};
