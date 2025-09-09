/**
 * Feature Extractor для AI Quality Predictor
 * Извлекает признаки из результатов анализа всех модулей
 */

import type { CodeMetrics, ExtractedFeatures, DuplicationResult, ComplexityResult } from './types';
import type { CodePattern, PatternAnalysisResult } from './pattern-recognizer';

export class FeatureExtractor {
  /**
   * Извлекает признаки из результатов всех анализаторов
   */
  extractFeatures(metrics: CodeMetrics): ExtractedFeatures {
    console.log('🔍 Извлекаем признаки для ML анализа...');

    const duplicationFeatures = this.extractDuplicationFeatures(metrics.duplication);
    const patternFeatures = {
      goodPatternCount: metrics.patterns.summary.goodPatterns,
      antipatternCount: metrics.patterns.antipatternCount,
      securityIssueCount: metrics.patterns.securityConcerns.length,
      performanceIssueCount: metrics.patterns.performanceIssues.length,
      patternConfidenceAvg: this.calculatePatternConfidenceAvg(metrics.patterns),
    };
    const complexityFeatures = this.extractComplexityFeatures(metrics.complexity);
    const sizeFeatures = this.extractSizeFeatures(metrics);

    // Объединяем все признаки с значениями по умолчанию
    const baseFeatures = {
      // Дублирование
      duplicationRatio: duplicationFeatures.duplicationRatio || 0,
      duplicateBlockCount: duplicationFeatures.duplicateBlockCount || 0,
      avgDuplicateSize: duplicationFeatures.avgDuplicateSize || 0,

      // Паттерны
      goodPatternCount: patternFeatures.goodPatternCount || 0,
      antipatternCount: patternFeatures.antipatternCount || 0,
      securityIssueCount: patternFeatures.securityIssueCount || 0,
      performanceIssueCount: patternFeatures.performanceIssueCount || 0,
      patternConfidenceAvg: patternFeatures.patternConfidenceAvg || 0,

      // Сложность
      avgComplexity: complexityFeatures.avgComplexity || 0,
      maxComplexity: complexityFeatures.maxComplexity || 0,
      complexityVariance: complexityFeatures.complexityVariance || 0,

      // Размер
      fileCount: sizeFeatures.fileCount || 0,
      linesOfCode: sizeFeatures.linesOfCode || 0,
      avgFileSize: sizeFeatures.avgFileSize || 0,
    };

    // Вычисляемые агрегированные показатели
    const computedFeatures = this.computeAggregatedFeatures(baseFeatures);

    const features: ExtractedFeatures = {
      ...baseFeatures,
      codeSmellScore: computedFeatures.codeSmellScore || 0,
      maintainabilityIndex: computedFeatures.maintainabilityIndex || 0,
      technicalDebtRatio: computedFeatures.technicalDebtRatio || 0,
    };

    console.log(`✅ Извлечено ${Object.keys(features).length} признаков`);
    return features;
  } /**
   * Извлекает признаки дублирования кода
   */
  private extractDuplicationFeatures(duplication: DuplicationResult): Partial<ExtractedFeatures> {
    const avgDuplicateSize =
      duplication.duplicateBlocks.length > 0
        ? duplication.duplicateBlocks.reduce((sum: number, block: any) => sum + block.lines, 0) /
          duplication.duplicateBlocks.length
        : 0;

    return {
      duplicationRatio: duplication.percentage / 100,
      duplicateBlockCount: duplication.duplicateBlocks.length,
      avgDuplicateSize,
    };
  }

  /**
   * Извлекает признаки из анализа паттернов
   */
  private extractPatternFeatures(patterns: PatternAnalysisResult): Partial<ExtractedFeatures> {
    const allPatterns = patterns.detectedPatterns;

    const goodPatterns = allPatterns.filter((p: CodePattern) =>
      ['architectural', 'design'].includes(p.type)
    );

    const antipatterns = allPatterns.filter((p: CodePattern) => p.type === 'antipattern');
    const securityIssues = allPatterns.filter((p: CodePattern) => p.type === 'security');
    const performanceIssues = allPatterns.filter((p: CodePattern) => p.type === 'performance');

    const avgConfidence =
      allPatterns.length > 0
        ? allPatterns.reduce((sum: number, p: CodePattern) => sum + p.confidence, 0) /
          allPatterns.length
        : 0;

    return {
      goodPatternCount: goodPatterns.length,
      antipatternCount: antipatterns.length,
      securityIssueCount: securityIssues.length,
      performanceIssueCount: performanceIssues.length,
      patternConfidenceAvg: avgConfidence,
    };
  } /**
   * Извлекает признаки сложности кода
   */
  private extractComplexityFeatures(complexity?: ComplexityResult): Partial<ExtractedFeatures> {
    if (!complexity) {
      return {
        avgComplexity: 0,
        maxComplexity: 0,
        complexityVariance: 0,
      };
    }

    // Собираем все значения сложности
    const allComplexities: number[] = [];
    complexity.files.forEach(file => {
      file.functions.forEach(func => {
        allComplexities.push(func.complexity);
      });
    });

    const variance = allComplexities.length > 1 ? this.calculateVariance(allComplexities) : 0;

    return {
      avgComplexity: complexity.average,
      maxComplexity: complexity.maximum,
      complexityVariance: variance,
    };
  }

  /**
   * Извлекает признаки размера проекта
   */
  private extractSizeFeatures(metrics: CodeMetrics): Partial<ExtractedFeatures> {
    const avgFileSize = metrics.fileCount > 0 ? metrics.linesOfCode / metrics.fileCount : 0;

    return {
      fileCount: metrics.fileCount,
      linesOfCode: metrics.linesOfCode,
      avgFileSize,
    };
  }

  /**
   * Вычисляет агрегированные показатели качества
   */
  private computeAggregatedFeatures(
    baseFeatures: Partial<ExtractedFeatures>
  ): Partial<ExtractedFeatures> {
    // Показатель "запаха" кода (0-100, где 0 = очень плохо)
    const codeSmellScore = this.calculateCodeSmellScore(baseFeatures);

    // Индекс поддерживаемости (формула Microsoft)
    const maintainabilityIndex = this.calculateMaintainabilityIndex(baseFeatures);

    // Отношение технического долга
    const technicalDebtRatio = this.calculateTechnicalDebtRatio(baseFeatures);

    return {
      codeSmellScore,
      maintainabilityIndex,
      technicalDebtRatio,
    };
  } /**
   * Рассчитывает показатель "запаха" кода
   */
  private calculateCodeSmellScore(features: Partial<ExtractedFeatures>): number {
    let score = 100; // Начинаем с идеального счета

    // Штрафы за проблемы
    if (features.duplicationRatio) {
      score -= features.duplicationRatio * 30; // до -30 за дублирование
    }

    if (features.antipatternCount) {
      score -= features.antipatternCount * 5; // -5 за каждый антипаттерн
    }

    if (features.securityIssueCount) {
      score -= features.securityIssueCount * 15; // -15 за каждую проблему безопасности
    }

    if (features.performanceIssueCount) {
      score -= features.performanceIssueCount * 8; // -8 за каждую проблему производительности
    }

    if (features.avgComplexity && features.avgComplexity > 10) {
      score -= (features.avgComplexity - 10) * 2; // штраф за высокую сложность
    }

    // Бонусы за хорошие паттерны
    if (features.goodPatternCount) {
      score += features.goodPatternCount * 3; // +3 за каждый хороший паттерн
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Рассчитывает индекс поддерживаемости (адаптированная формула Microsoft)
   */
  private calculateMaintainabilityIndex(features: Partial<ExtractedFeatures>): number {
    const avgComplexity = features.avgComplexity || 1;
    const linesOfCode = features.linesOfCode || 1;
    const duplications = features.duplicationRatio || 0;

    // Упрощенная формула индекса поддерживаемости
    let index =
      171 -
      5.2 * Math.log(avgComplexity) -
      0.23 * Math.log(linesOfCode) -
      16.2 * Math.log(avgComplexity);

    // Корректировка на дублирование
    index -= duplications * 20;

    // Корректировка на антипаттерны
    if (features.antipatternCount) {
      index -= features.antipatternCount * 5;
    }

    return Math.max(0, Math.min(100, index));
  }

  /**
   * Рассчитывает отношение технического долга
   */
  private calculateTechnicalDebtRatio(features: Partial<ExtractedFeatures>): number {
    let debtPoints = 0;
    let totalPoints = 100;

    // Технический долг от дублирования
    if (features.duplicationRatio) {
      debtPoints += features.duplicationRatio * 25;
    }

    // Технический долг от антипаттернов
    if (features.antipatternCount) {
      debtPoints += features.antipatternCount * 3;
    }

    // Технический долг от проблем безопасности
    if (features.securityIssueCount) {
      debtPoints += features.securityIssueCount * 8;
    }

    // Технический долг от сложности
    if (features.avgComplexity && features.avgComplexity > 10) {
      debtPoints += (features.avgComplexity - 10) * 1.5;
    }

    return Math.min(1, debtPoints / totalPoints);
  }

  /**
   * Вычисляет дисперсию массива чисел
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;

    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));

    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  /**
   * Создает краткое описание извлеченных признаков
   */
  createFeatureSummary(features: ExtractedFeatures): string {
    const summary = [
      `📊 Признаки проекта:`,
      `   📁 Файлов: ${features.fileCount}`,
      `   📏 Строк кода: ${features.linesOfCode}`,
      `   🔄 Дублирование: ${(features.duplicationRatio * 100).toFixed(1)}%`,
      `   📈 Средняя сложность: ${features.avgComplexity.toFixed(1)}`,
      `   ✅ Хорошие паттерны: ${features.goodPatternCount}`,
      `   ❌ Антипаттерны: ${features.antipatternCount}`,
      `   🔒 Проблемы безопасности: ${features.securityIssueCount}`,
      `   ⚡ Проблемы производительности: ${features.performanceIssueCount}`,
      ``,
      `📈 Агрегированные показатели:`,
      `   🧼 Чистота кода: ${features.codeSmellScore.toFixed(1)}/100`,
      `   🔧 Поддерживаемость: ${features.maintainabilityIndex.toFixed(1)}/100`,
      `   💸 Технический долг: ${(features.technicalDebtRatio * 100).toFixed(1)}%`,
    ];

    return summary.join('\n');
  }

  /**
   * Нормализует признаки для ML модели (все значения 0-1)
   */
  normalizeFeatures(features: ExtractedFeatures): Record<string, number> {
    return {
      duplicationRatio: features.duplicationRatio, // уже 0-1
      duplicateBlockCount: Math.min(1, features.duplicateBlockCount / 50), // нормализуем до 50 блоков
      avgDuplicateSize: Math.min(1, features.avgDuplicateSize / 100), // нормализуем до 100 строк

      goodPatternCount: Math.min(1, features.goodPatternCount / 10), // до 10 паттернов
      antipatternCount: Math.min(1, features.antipatternCount / 10),
      securityIssueCount: Math.min(1, features.securityIssueCount / 5), // до 5 проблем
      performanceIssueCount: Math.min(1, features.performanceIssueCount / 10),
      patternConfidenceAvg: features.patternConfidenceAvg / 100, // уже процент

      avgComplexity: Math.min(1, features.avgComplexity / 50), // до 50 сложности
      maxComplexity: Math.min(1, features.maxComplexity / 100),
      complexityVariance: Math.min(1, features.complexityVariance / 100),

      fileCount: Math.min(1, features.fileCount / 1000), // до 1000 файлов
      linesOfCode: Math.min(1, features.linesOfCode / 100000), // до 100k строк
      avgFileSize: Math.min(1, features.avgFileSize / 500), // до 500 строк на файл

      codeSmellScore: features.codeSmellScore / 100, // уже 0-100
      maintainabilityIndex: features.maintainabilityIndex / 100,
      technicalDebtRatio: features.technicalDebtRatio, // уже 0-1
    };
  }

  /**
   * Рассчитывает среднее значение уверенности паттернов
   */
  private calculatePatternConfidenceAvg(patterns: any): number {
    if (!patterns || !patterns.detectedPatterns || patterns.detectedPatterns.length === 0) {
      return 0;
    }

    const totalConfidence = patterns.detectedPatterns.reduce((sum: number, pattern: any) => {
      return sum + (pattern.confidence || 0);
    }, 0);

    return totalConfidence / patterns.detectedPatterns.length;
  }
}
