import type {
  ProjectMetrics,
  AccuracyResult,
  AccuracyProvider,
  AccuracyComponents,
} from './accuracy-interfaces.js';
import { StructureAccuracyProvider } from './providers/structure-accuracy-provider.js';
import { ProjectMetricsExtractor } from './project-metrics-extractor.js';

/**
 * Основной калькулятор точности анализа
 * Координирует работу всех специализированных провайдеров точности
 * и предоставляет единый интерфейс для расчета точности
 */
export class AccuracyCalculator {
  private providers: Map<string, AccuracyProvider> = new Map();
  private metricsExtractor: ProjectMetricsExtractor;

  constructor() {
    this.metricsExtractor = new ProjectMetricsExtractor();
    this.initializeProviders();
  }

  /**
   * Инициализация всех провайдеров точности
   */
  private initializeProviders(): void {
    // Пока создаем только структурный провайдер, остальные будут добавлены позже
    const structureProvider = new StructureAccuracyProvider();
    this.providers.set('structure', structureProvider);

    // TODO: Добавить остальные провайдеры:
    // this.providers.set('security', new SecurityAccuracyProvider());
    // this.providers.set('testing', new TestingAccuracyProvider());
    // this.providers.set('performance', new PerformanceAccuracyProvider());
    // this.providers.set('documentation', new DocumentationAccuracyProvider());
    // this.providers.set('ai-insights', new AIInsightsAccuracyProvider());
    // this.providers.set('technical-debt', new TechnicalDebtAccuracyProvider());
  }

  /**
   * Рассчитывает точность для конкретного типа анализатора
   */
  async calculateAccuracyForAnalyzer(
    analyzerType: string,
    projectPath: string
  ): Promise<AccuracyResult> {
    const provider = this.providers.get(analyzerType);
    if (!provider) {
      throw new Error(`Провайдер точности для анализатора '${analyzerType}' не найден`);
    }

    // Извлекаем метрики проекта
    const metrics = await this.metricsExtractor.extractMetrics(projectPath);

    // Рассчитываем точность
    return await provider.calculateAccuracy(metrics, projectPath);
  }

  /**
   * Рассчитывает точность для всех доступных анализаторов
   */
  async calculateAllAccuracies(projectPath: string): Promise<Map<string, AccuracyResult>> {
    const results = new Map<string, AccuracyResult>();

    // Извлекаем метрики один раз для всех провайдеров
    const metrics = await this.metricsExtractor.extractMetrics(projectPath);

    // Рассчитываем точность для каждого провайдера
    for (const [analyzerType, provider] of this.providers) {
      try {
        const result = await provider.calculateAccuracy(metrics, projectPath);
        results.set(analyzerType, result);
      } catch {
        // Логируем ошибку в продакшене через proper error handling
        // console.error(`Ошибка при расчете точности для ${analyzerType}:`, error);

        // Создаем резервный результат с низкой точностью
        results.set(analyzerType, this.createFallbackResult(analyzerType));
      }
    }

    return results;
  }

  /**
   * Получает общую точность системы на основе всех анализаторов
   */
  async calculateOverallAccuracy(projectPath: string): Promise<{
    overall: number;
    byAnalyzer: Map<string, AccuracyResult>;
    aggregatedComponents: AccuracyComponents;
    explanation: string;
  }> {
    const analyzerResults = await this.calculateAllAccuracies(projectPath);

    // Веса для разных типов анализаторов при расчете общей точности
    const analyzerWeights = this.getAnalyzerWeights();

    let weightedSum = 0;
    let totalWeight = 0;

    const aggregatedComponents: AccuracyComponents = {
      dataQuality: { score: 0, confidence: 0, factors: [] },
      analysisDepth: { score: 0, coverage: 0, factors: [] },
      algorithmReliability: { score: 0, stability: 0, factors: [] },
      historicalCorrectness: { score: 0, trend: 'stable', factors: [] },
    };

    let componentCount = 0;

    // Суммируем результаты с весами
    for (const [analyzerType, result] of analyzerResults) {
      const weight = analyzerWeights[analyzerType] || 1;
      weightedSum += result.overall * weight;
      totalWeight += weight;

      // Агрегируем компоненты
      aggregatedComponents.dataQuality.score += result.components.dataQuality.score;
      aggregatedComponents.dataQuality.confidence += result.components.dataQuality.confidence;
      aggregatedComponents.dataQuality.factors.push(
        ...result.components.dataQuality.factors.map(f => `[${analyzerType}] ${f}`)
      );

      aggregatedComponents.analysisDepth.score += result.components.analysisDepth.score;
      aggregatedComponents.analysisDepth.coverage += result.components.analysisDepth.coverage;
      aggregatedComponents.analysisDepth.factors.push(
        ...result.components.analysisDepth.factors.map(f => `[${analyzerType}] ${f}`)
      );

      aggregatedComponents.algorithmReliability.score +=
        result.components.algorithmReliability.score;
      aggregatedComponents.algorithmReliability.stability +=
        result.components.algorithmReliability.stability;
      aggregatedComponents.algorithmReliability.factors.push(
        ...result.components.algorithmReliability.factors.map(f => `[${analyzerType}] ${f}`)
      );

      if (result.components.historicalCorrectness) {
        aggregatedComponents.historicalCorrectness!.score +=
          result.components.historicalCorrectness.score;
        aggregatedComponents.historicalCorrectness!.factors.push(
          ...result.components.historicalCorrectness.factors.map(f => `[${analyzerType}] ${f}`)
        );
      }

      componentCount++;
    }

    // Рассчитываем средние значения
    if (componentCount > 0) {
      aggregatedComponents.dataQuality.score /= componentCount;
      aggregatedComponents.dataQuality.confidence /= componentCount;

      aggregatedComponents.analysisDepth.score /= componentCount;
      aggregatedComponents.analysisDepth.coverage /= componentCount;

      aggregatedComponents.algorithmReliability.score /= componentCount;
      aggregatedComponents.algorithmReliability.stability /= componentCount;

      if (aggregatedComponents.historicalCorrectness) {
        aggregatedComponents.historicalCorrectness.score /= componentCount;
      }
    }

    const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    return {
      overall,
      byAnalyzer: analyzerResults,
      aggregatedComponents,
      explanation: this.generateOverallExplanation(overall, analyzerResults),
    };
  }

  /**
   * Извлекает метрики проекта (публичный метод для внешнего использования)
   */
  async extractProjectMetrics(projectPath: string): Promise<ProjectMetrics> {
    return await this.metricsExtractor.extractMetrics(projectPath);
  }

  /**
   * Получает специфические метрики для конкретного анализатора
   */
  async getAnalyzerSpecificMetrics(
    analyzerType: string,
    projectPath: string
  ): Promise<Record<string, unknown>> {
    const provider = this.providers.get(analyzerType);
    if (!provider) {
      throw new Error(`Провайдер для анализатора '${analyzerType}' не найден`);
    }

    const metrics = await this.metricsExtractor.extractMetrics(projectPath);
    return await provider.extractSpecificMetrics(metrics, projectPath);
  }

  /**
   * Проверяет готовность всех провайдеров
   */
  checkReadiness(): { ready: boolean; issues: string[] } {
    const issues: string[] = [];

    for (const [analyzerType, provider] of this.providers) {
      if (!provider.isReady()) {
        issues.push(`Провайдер ${analyzerType} не готов к работе`);
      }
    }

    return {
      ready: issues.length === 0,
      issues,
    };
  }

  /**
   * Получает список доступных анализаторов
   */
  getAvailableAnalyzers(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Веса для разных типов анализаторов при расчете общей точности
   */
  private getAnalyzerWeights(): Record<string, number> {
    return {
      structure: 1.2, // Структурный анализ - основа
      security: 1.1, // Безопасность - важно
      testing: 1.0, // Тестирование - стандартный вес
      performance: 0.9, // Производительность - меньший вес
      documentation: 0.8, // Документация - меньший вес
      'ai-insights': 0.7, // AI анализ - экспериментальный
      'technical-debt': 0.8, // Технический долг - средний вес
    };
  }

  /**
   * Создает резервный результат при ошибке провайдера
   */
  private createFallbackResult(analyzerType: string): AccuracyResult {
    return {
      overall: 50, // Низкая точность по умолчанию
      confidenceInterval: { lower: 40, upper: 60 },
      components: {
        dataQuality: {
          score: 40,
          confidence: 30,
          factors: [`Ошибка при анализе ${analyzerType}`],
        },
        analysisDepth: {
          score: 40,
          coverage: 30,
          factors: ['Анализ недоступен'],
        },
        algorithmReliability: {
          score: 60,
          stability: 50,
          factors: ['Базовая надежность'],
        },
        historicalCorrectness: {
          score: 50,
          trend: 'stable',
          factors: ['Историческая база недоступна'],
        },
      },
      explanation: `Провайдер точности для ${analyzerType} временно недоступен`,
      recommendations: ['Проверить конфигурацию системы', 'Повторить анализ позже'],
    };
  }

  /**
   * Генерирует объяснение общей точности системы
   */
  private generateOverallExplanation(
    overall: number,
    analyzerResults: Map<string, AccuracyResult>
  ): string {
    const analyzerCount = analyzerResults.size;
    const highAccuracyCount = Array.from(analyzerResults.values()).filter(
      result => result.overall >= 80
    ).length;

    if (overall >= 85) {
      return `Высокая общая точность системы анализа (${overall}%). ${highAccuracyCount} из ${analyzerCount} анализаторов показывают высокую точность.`;
    } else if (overall >= 70) {
      return `Хорошая общая точность системы анализа (${overall}%). Большинство анализаторов работают стабильно.`;
    } else if (overall >= 55) {
      return `Умеренная точность системы анализа (${overall}%). Некоторые анализаторы требуют улучшения.`;
    } else {
      return `Низкая точность системы анализа (${overall}%). Требуется проверка конфигурации и улучшение алгоритмов.`;
    }
  }
}
