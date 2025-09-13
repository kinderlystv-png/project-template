import type { ProjectMetrics, AccuracyComponents, AccuracyResult } from '../accuracy-interfaces.js';
import { BaseAccuracyProvider } from '../accuracy-interfaces.js';

/**
 * Провайдер точности для структурного анализа
 * Оценивает качество анализа структуры проекта на основе:
 * - Организации файловой структуры
 * - Сложности архитектуры
 * - Соответствия паттернам
 * - Качества метрик
 */
export class StructureAccuracyProvider extends BaseAccuracyProvider {
  analyzerType = 'structure' as const;

  async calculateAccuracy(metrics: ProjectMetrics, _projectPath: string): Promise<AccuracyResult> {
    const components = this.calculateComponents(metrics);
    const weights = this.getMetricWeights();

    // Рассчитываем общую точность на основе компонентов и весов
    const overall = Math.round(
      components.dataQuality.score * weights.dataQuality +
        components.analysisDepth.score * weights.analysisDepth +
        components.algorithmReliability.score * weights.algorithmReliability +
        (components.historicalCorrectness?.score ?? 75) * weights.historicalCorrectness
    );

    // Рассчитываем доверительный интервал
    const uncertainty = this.calculateUncertainty(components);
    const confidenceInterval = this.calculateConfidenceInterval(overall, uncertainty);

    return {
      overall: Math.max(this.minAccuracy, Math.min(this.maxAccuracy, overall)),
      confidenceInterval: {
        lower: confidenceInterval.lower,
        upper: confidenceInterval.upper,
      },
      components,
      explanation: this.generateExplanation(components, overall),
      recommendations: this.generateRecommendations(components),
    };
  }

  async extractSpecificMetrics(
    metrics: ProjectMetrics,
    _projectPath: string
  ): Promise<Record<string, unknown>> {
    return {
      fileStructureScore: this.calculateFileStructureScore(metrics),
      complexityScore: this.calculateComplexityScore(metrics),
      architectureScore: this.calculateArchitectureScore(metrics),
      qualityScore: this.calculateQualityScore(metrics),
    };
  }

  getMetricWeights(): Record<string, number> {
    return {
      dataQuality: 0.3,
      analysisDepth: 0.35,
      algorithmReliability: 0.25,
      historicalCorrectness: 0.1,
    };
  }

  private calculateComponents(metrics: ProjectMetrics): AccuracyComponents {
    return {
      dataQuality: this.calculateDataQuality(metrics),
      analysisDepth: this.calculateAnalysisDepth(metrics),
      algorithmReliability: this.calculateAlgorithmReliability(metrics),
      historicalCorrectness: this.calculateHistoricalCorrectness(metrics),
    };
  }

  /**
   * Качество исходных данных для структурного анализа
   */
  private calculateDataQuality(metrics: ProjectMetrics): {
    score: number;
    confidence: number;
    factors: string[];
  } {
    let score = 0;
    let maxScore = 0;
    const factors: string[] = [];

    // Наличие основных файловых метрик (25 баллов)
    maxScore += 25;
    if (metrics.totalFiles > 0) {
      score += 8;
      factors.push('Количество файлов доступно');
    }
    if (metrics.totalLines > 0) {
      score += 8;
      factors.push('Общее количество строк известно');
    }
    if (metrics.averageFileSize > 0) {
      score += 9;
      factors.push('Средний размер файла рассчитан');
    }

    // Наличие метрик сложности (30 баллов)
    maxScore += 30;
    if (metrics.averageCyclomaticComplexity > 0) {
      score += 15;
      factors.push('Цикломатическая сложность доступна');
    }
    if (metrics.complexityDistribution && Object.keys(metrics.complexityDistribution).length > 0) {
      score += 15;
      factors.push('Распределение сложности проанализировано');
    }

    // Качество архитектурных данных (25 баллов)
    maxScore += 25;
    if (metrics.architecturalPatterns && metrics.architecturalPatterns.length > 0) {
      score += 12;
      factors.push(`Найдено ${metrics.architecturalPatterns.length} архитектурных паттернов`);
    }
    if (metrics.layerCompliance !== undefined) {
      score += 8;
      factors.push('Соответствие слоям оценено');
    }
    if (metrics.separationOfConcerns !== undefined) {
      score += 5;
      factors.push('Разделение ответственности оценено');
    }

    // Наличие зависимостей и качественных метрик (20 баллов)
    maxScore += 20;
    if (metrics.dependencyCount > 0) {
      score += 10;
      factors.push(`Проанализировано ${metrics.dependencyCount} зависимостей`);
    }
    if (metrics.duplicationPercentage !== undefined) {
      score += 10;
      factors.push('Процент дублирования измерен');
    }

    const finalScore = Math.min(100, (score / maxScore) * 100);
    const confidence = maxScore > 0 ? score / maxScore : 0;

    return { score: finalScore, confidence: confidence * 100, factors };
  }

  /**
   * Глубина структурного анализа
   */
  private calculateAnalysisDepth(metrics: ProjectMetrics): {
    score: number;
    coverage: number;
    factors: string[];
  } {
    let score = 0;
    let maxScore = 0;
    const factors: string[] = [];

    // Анализ размера проекта и покрытия (30 баллов)
    maxScore += 30;

    if (metrics.totalFiles >= 5 && metrics.totalFiles <= 1000) {
      score += 10;
      factors.push(`Оптимальное количество файлов (${metrics.totalFiles})`);
    } else if (metrics.totalFiles > 0) {
      score += 5;
      factors.push(`Количество файлов: ${metrics.totalFiles}`);
    }

    if (metrics.totalLines >= 100 && metrics.totalLines <= 100000) {
      score += 10;
      factors.push(`Умеренное количество строк (${metrics.totalLines})`);
    } else if (metrics.totalLines > 0) {
      score += 5;
      factors.push(`Строк кода: ${metrics.totalLines}`);
    }

    if (metrics.averageFileSize >= 50 && metrics.averageFileSize <= 500) {
      score += 10;
      factors.push(`Разумный размер файлов (${Math.round(metrics.averageFileSize)} строк)`);
    } else if (metrics.averageFileSize > 0) {
      score += 5;
      factors.push(`Средний размер файла: ${Math.round(metrics.averageFileSize)} строк`);
    }

    // Глубина анализа сложности (25 баллов)
    maxScore += 25;
    if (metrics.averageCyclomaticComplexity > 0) {
      score += 10;
      if (metrics.averageCyclomaticComplexity > 0 && metrics.averageCyclomaticComplexity < 10) {
        score += 5;
        factors.push(`Низкая сложность (${metrics.averageCyclomaticComplexity.toFixed(1)})`);
      } else {
        factors.push(`Сложность: ${metrics.averageCyclomaticComplexity.toFixed(1)}`);
      }
    }
    if (metrics.complexityDistribution && Object.keys(metrics.complexityDistribution).length > 0) {
      score += 10;
      factors.push('Детальное распределение сложности');
    }

    // Архитектурная детализация (25 баллов)
    maxScore += 25;
    if (metrics.architecturalPatterns) {
      const patternScore = Math.min(15, metrics.architecturalPatterns.length * 3);
      score += patternScore;
      factors.push(`Архитектурные паттерны: ${metrics.architecturalPatterns.join(', ')}`);
    }
    if (metrics.layerCompliance !== undefined) {
      score += 10;
      factors.push(`Соответствие слоям: ${metrics.layerCompliance}%`);
    }

    // Анализ качества кода (20 баллов)
    maxScore += 20;
    if (metrics.duplicationPercentage !== undefined) {
      score += 10;
      factors.push(`Дублирование: ${metrics.duplicationPercentage}%`);
    }
    if (metrics.documentationCoverage !== undefined) {
      score += 10;
      factors.push(`Покрытие документацией: ${metrics.documentationCoverage}%`);
    }

    const finalScore = Math.min(100, (score / maxScore) * 100);
    const coverage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    return { score: finalScore, coverage, factors };
  }

  /**
   * Надежность алгоритма структурного анализа
   */
  private calculateAlgorithmReliability(metrics: ProjectMetrics): {
    score: number;
    stability: number;
    factors: string[];
  } {
    let score = 40; // Базовая надежность
    const factors: string[] = ['Базовая надежность структурного анализа'];

    // Консистентность метрик (30 баллов)
    if (metrics.totalFiles && metrics.totalLines && metrics.averageFileSize) {
      const calculatedAverage = metrics.totalLines / metrics.totalFiles;
      const difference =
        Math.abs(calculatedAverage - metrics.averageFileSize) / metrics.averageFileSize;

      if (difference < 0.1) {
        score += 30;
        factors.push('Высокая консистентность метрик');
      } else if (difference < 0.3) {
        score += 20;
        factors.push('Хорошая консистентность метрик');
      } else if (difference < 0.5) {
        score += 10;
        factors.push('Приемлемая консистентность метрик');
      }
    }

    // Реалистичность метрик сложности (20 баллов)
    if (metrics.averageCyclomaticComplexity >= 1 && metrics.averageCyclomaticComplexity <= 20) {
      score += 15;
      if (metrics.averageCyclomaticComplexity >= 2 && metrics.averageCyclomaticComplexity <= 10) {
        score += 5;
        factors.push('Реалистичная сложность кода');
      } else {
        factors.push('Приемлемая сложность кода');
      }
    }

    // Проверка на аномалии
    if (metrics.duplicationPercentage > 50) {
      score -= 10;
      factors.push('Подозрительно высокое дублирование');
    }

    if (metrics.totalFiles > 10000) {
      score -= 5;
      factors.push('Очень большой проект - сложнее анализировать');
    }

    if (!metrics.averageCyclomaticComplexity || metrics.averageCyclomaticComplexity === 0) {
      score -= 10;
      factors.push('Отсутствуют метрики сложности');
    }

    if (!metrics.architecturalPatterns || metrics.architecturalPatterns.length === 0) {
      score -= 5;
      factors.push('Не обнаружены архитектурные паттерны');
    }

    const finalScore = Math.max(0, Math.min(100, score));
    const stability = finalScore > 80 ? 95 : finalScore > 60 ? 80 : 65;

    return { score: finalScore, stability, factors };
  }

  /**
   * Историческая корректность структурного анализа
   */
  private calculateHistoricalCorrectness(metrics: ProjectMetrics): {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    factors: string[];
  } {
    let score = 75; // Базовая историческая точность
    const factors: string[] = ['Базовая историческая точность'];

    // Корректировка по размеру проекта
    if (metrics.totalFiles >= 10 && metrics.totalFiles <= 500) {
      score += 10;
      factors.push('Оптимальный размер для анализа');
    } else if (metrics.totalFiles < 10) {
      score -= 5;
      factors.push('Маленький проект - меньше данных');
    } else if (metrics.totalFiles > 1000) {
      score -= 10;
      factors.push('Очень большой проект');
    }

    // Корректировка по сложности
    if (metrics.averageCyclomaticComplexity >= 2 && metrics.averageCyclomaticComplexity <= 8) {
      score += 8;
      factors.push('Умеренная сложность');
    } else if (metrics.averageCyclomaticComplexity > 15) {
      score -= 10;
      factors.push('Высокая сложность - больше ошибок');
    }

    // Бонус за хорошую архитектуру
    if (metrics.architecturalPatterns && metrics.architecturalPatterns.length > 0) {
      score += 5;
      factors.push('Хорошая архитектура');
    }

    // Корректировка по качеству кода
    if (metrics.duplicationPercentage < 10) {
      score += 5;
      factors.push('Низкое дублирование');
    } else if (metrics.duplicationPercentage > 30) {
      score -= 8;
      factors.push('Высокое дублирование');
    }

    const finalScore = Math.max(60, Math.min(95, score));

    // Определяем тренд на основе качественных показателей
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (metrics.duplicationPercentage < 15 && metrics.averageCyclomaticComplexity < 10) {
      trend = 'improving';
    } else if (metrics.duplicationPercentage > 25 || metrics.averageCyclomaticComplexity > 15) {
      trend = 'declining';
    }

    return { score: finalScore, trend, factors };
  }

  private calculateUncertainty(components: AccuracyComponents): number {
    // Рассчитываем неопределённость на основе доверия к компонентам
    const avgConfidence =
      (components.dataQuality.confidence +
        components.analysisDepth.coverage +
        components.algorithmReliability.stability +
        (components.historicalCorrectness?.score ?? 75)) /
      4;

    return Math.max(5, 20 - avgConfidence / 5); // 5-15% неопределённости
  }

  private generateExplanation(components: AccuracyComponents, overall: number): string {
    const quality = components.dataQuality.score;
    const depth = components.analysisDepth.score;
    const reliability = components.algorithmReliability.score;

    if (overall >= 85) {
      return `Высокая точность структурного анализа (${overall}%). Качество данных: ${quality.toFixed(0)}%, глубина анализа: ${depth.toFixed(0)}%, надёжность алгоритмов: ${reliability.toFixed(0)}%.`;
    } else if (overall >= 70) {
      return `Хорошая точность структурного анализа (${overall}%). Основные метрики доступны, анализ достаточно глубокий.`;
    } else {
      return `Умеренная точность структурного анализа (${overall}%). Требуется больше данных или более детальный анализ.`;
    }
  }

  private generateRecommendations(components: AccuracyComponents): string[] {
    const recommendations: string[] = [];

    if (components.dataQuality.score < 70) {
      recommendations.push('Добавить больше структурных метрик для повышения качества данных');
    }

    if (components.analysisDepth.score < 70) {
      recommendations.push('Углубить анализ архитектурных паттернов и сложности');
    }

    if (components.algorithmReliability.score < 80) {
      recommendations.push('Проверить консистентность метрик и устранить аномалии');
    }

    if (recommendations.length === 0) {
      recommendations.push('Структурный анализ работает оптимально');
    }

    return recommendations;
  }

  // Вспомогательные методы для extractSpecificMetrics
  private calculateFileStructureScore(metrics: ProjectMetrics): number {
    let score = 0;
    if (metrics.totalFiles > 0 && metrics.totalFiles <= 1000) score += 25;
    if (metrics.directoryDepth > 0 && metrics.directoryDepth <= 10) score += 25;
    if (metrics.fileTypeDistribution && Object.keys(metrics.fileTypeDistribution).length > 0)
      score += 25;
    if (metrics.averageFileSize > 0 && metrics.averageFileSize <= 500) score += 25;
    return score;
  }

  private calculateComplexityScore(metrics: ProjectMetrics): number {
    let score = 0;
    if (metrics.averageCyclomaticComplexity > 0 && metrics.averageCyclomaticComplexity <= 10)
      score += 50;
    if (metrics.maxCyclomaticComplexity > 0 && metrics.maxCyclomaticComplexity <= 20) score += 30;
    if (metrics.complexityDistribution) score += 20;
    return score;
  }

  private calculateArchitectureScore(metrics: ProjectMetrics): number {
    let score = 0;
    if (metrics.architecturalPatterns && metrics.architecturalPatterns.length > 0) score += 40;
    if (metrics.layerCompliance !== undefined && metrics.layerCompliance > 70) score += 30;
    if (metrics.separationOfConcerns !== undefined && metrics.separationOfConcerns > 70)
      score += 30;
    return score;
  }

  private calculateQualityScore(metrics: ProjectMetrics): number {
    let score = 0;
    if (metrics.duplicationPercentage !== undefined && metrics.duplicationPercentage < 20)
      score += 40;
    if (metrics.testCoverageEstimate !== undefined && metrics.testCoverageEstimate > 50)
      score += 30;
    if (metrics.documentationCoverage !== undefined && metrics.documentationCoverage > 30)
      score += 30;
    return score;
  }
}
