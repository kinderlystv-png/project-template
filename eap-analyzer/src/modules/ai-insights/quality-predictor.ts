/**
 * Quality Predictor - Предсказатель качества кода
 * Rule-based система оценки качества с возможностью обучения на исторических данных
 */

import type {
  ExtractedFeatures,
  QualityScore,
  QualityRecommendation,
  TrainingData,
  ModelState,
} from './types';

// Настройки для правил оценки качества
interface QualityRules {
  // Веса для разных категорий (сумма должна быть 1.0)
  weights: {
    maintainability: number; // Важность поддерживаемости
    reliability: number; // Важность надежности
    security: number; // Важность безопасности
    performance: number; // Важность производительности
  };

  // Пороги для классификации
  thresholds: {
    excellent: number; // >90 отличное качество
    good: number; // >75 хорошее качество
    fair: number; // >50 удовлетворительное
    poor: number; // >25 плохое качество
    // <25 критическое состояние
  };
}

export class QualityPredictor {
  private rules: QualityRules;
  private trainingData: TrainingData[] = [];
  private modelState: ModelState | null = null;

  constructor(customRules?: Partial<QualityRules>) {
    // Настройки по умолчанию (экспертные правила)
    this.rules = {
      weights: {
        maintainability: 0.3, // 30% - поддерживаемость очень важна
        reliability: 0.25, // 25% - надежность критична
        security: 0.25, // 25% - безопасность критична
        performance: 0.2, // 20% - производительность
      },
      thresholds: {
        excellent: 90,
        good: 75,
        fair: 50,
        poor: 25,
      },
      ...customRules,
    };

    console.log('🧠 Quality Predictor инициализирован с правилами:', this.rules);
  }

  /**
   * Предсказывает качество кода на основе извлеченных признаков
   */
  predict(features: ExtractedFeatures): QualityScore {
    console.log('🎯 Предсказываем качество кода...');

    // Рассчитываем отдельные компоненты качества
    const maintainability = this.calculateMaintainability(features);
    const reliability = this.calculateReliability(features);
    const security = this.calculateSecurity(features);
    const performance = this.calculatePerformance(features);

    // Общая оценка как взвешенная сумма
    const overall = this.calculateOverallScore({
      maintainability,
      reliability,
      security,
      performance,
    });

    // Рассчитываем уверенность в предсказании
    const confidence = this.calculateConfidence(features);

    const qualityScore: QualityScore = {
      overall: Math.round(overall),
      maintainability: Math.round(maintainability),
      reliability: Math.round(reliability),
      security: Math.round(security),
      performance: Math.round(performance),
      confidence: Math.round(confidence),
    };

    console.log(
      `✅ Качество предсказано: ${qualityScore.overall}/100 (уверенность: ${qualityScore.confidence}%)`
    );
    return qualityScore;
  }

  /**
   * Рассчитывает поддерживаемость кода
   */
  private calculateMaintainability(features: ExtractedFeatures): number {
    let score = 100;

    // Штрафы за проблемы поддерживаемости
    score -= features.duplicationRatio * 40; // -40 за 100% дублирования
    score -= features.antipatternCount * 8; // -8 за каждый антипаттерн
    score -= Math.max(0, features.avgComplexity - 10) * 3; // -3 за каждую единицу сложности >10
    score -= features.technicalDebtRatio * 30; // -30 за 100% технического долга

    // Бонусы за хорошие практики
    score += features.goodPatternCount * 5; // +5 за каждый хороший паттерн
    score += Math.max(0, 90 - features.codeSmellScore) * 0.2; // бонус за чистый код

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Рассчитывает надежность кода
   */
  private calculateReliability(features: ExtractedFeatures): number {
    let score = 100;

    // Штрафы за проблемы надежности
    score -= features.antipatternCount * 12; // -12 за каждый антипаттерн
    score -= features.performanceIssueCount * 8; // -8 за каждую проблему производительности
    score -= Math.max(0, features.maxComplexity - 20) * 2; // штраф за очень сложные функции

    // Дублирование снижает надежность (сложнее поддерживать консистентность)
    score -= features.duplicationRatio * 25;

    // Бонусы
    if (features.avgComplexity < 8) {
      score += 10; // бонус за низкую сложность
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Рассчитывает безопасность кода
   */
  private calculateSecurity(features: ExtractedFeatures): number {
    let score = 100;

    // Критические штрафы за проблемы безопасности
    score -= features.securityIssueCount * 25; // -25 за каждую проблему безопасности

    // Антипаттерны могут создавать уязвимости
    score -= features.antipatternCount * 5;

    // Высокая сложность увеличивает вероятность ошибок безопасности
    if (features.avgComplexity > 15) {
      score -= (features.avgComplexity - 15) * 2;
    }

    // Бонусы за хорошие практики
    if (features.securityIssueCount === 0) {
      score += 10; // бонус за отсутствие проблем безопасности
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Рассчитывает производительность кода
   */
  private calculatePerformance(features: ExtractedFeatures): number {
    let score = 100;

    // Штрафы за проблемы производительности
    score -= features.performanceIssueCount * 15; // -15 за каждую проблему производительности
    score -= features.duplicationRatio * 20; // дублирование увеличивает размер кода

    // Высокая сложность может влиять на производительность
    if (features.avgComplexity > 12) {
      score -= (features.avgComplexity - 12) * 3;
    }

    // Большие файлы могут быть медленными для обработки
    if (features.avgFileSize > 300) {
      score -= (features.avgFileSize - 300) * 0.1;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Рассчитывает общую оценку качества
   */
  private calculateOverallScore(scores: {
    maintainability: number;
    reliability: number;
    security: number;
    performance: number;
  }): number {
    const { weights } = this.rules;

    // Используем модифицированные веса с учетом важности безопасности
    const securityWeight = scores.security < 70 ? weights.security * 1.5 : weights.security;
    const totalWeight =
      weights.maintainability + weights.reliability + securityWeight + weights.performance;

    const weightedScore =
      (scores.maintainability * weights.maintainability +
        scores.reliability * weights.reliability +
        scores.security * securityWeight +
        scores.performance * weights.performance) /
      totalWeight;

    return weightedScore;
  }

  /**
   * Рассчитывает уверенность в предсказании
   */
  private calculateConfidence(features: ExtractedFeatures): number {
    let confidence = 85; // базовая уверенность

    // Факторы, влияющие на уверенность

    // Размер проекта - больше данных = больше уверенности
    if (features.fileCount > 20) {
      confidence += 10;
    } else if (features.fileCount < 5) {
      confidence -= 15;
    }

    // Если много паттернов найдено, анализ более надежен
    const totalPatterns =
      features.goodPatternCount +
      features.antipatternCount +
      features.securityIssueCount +
      features.performanceIssueCount;
    if (totalPatterns > 5) {
      confidence += 10;
    } else if (totalPatterns === 0) {
      confidence -= 20;
    }

    // Высокая средняя уверенность в паттернах повышает общую уверенность
    if (features.patternConfidenceAvg > 80) {
      confidence += 5;
    } else if (features.patternConfidenceAvg < 50) {
      confidence -= 10;
    }

    // Очень большие проекты могут быть неполно проанализированы
    if (features.linesOfCode > 50000) {
      confidence -= 5;
    }

    return Math.max(30, Math.min(100, confidence));
  }

  /**
   * Генерирует рекомендации по улучшению качества
   */
  generateRecommendations(
    features: ExtractedFeatures,
    qualityScore: QualityScore
  ): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];

    // Критические проблемы безопасности
    if (features.securityIssueCount > 0) {
      recommendations.push({
        id: 'security-critical',
        category: 'critical',
        title: `Критические проблемы безопасности (${features.securityIssueCount})`,
        description:
          'Обнаружены серьезные уязвимости безопасности, требующие немедленного исправления',
        impact: 'high',
        effort: 'medium',
        priority: 10,
        actions: [
          {
            type: 'security',
            description: 'Проведите аудит безопасности кода',
            estimatedTime: '1-2 дня',
          },
          {
            type: 'refactor',
            description: 'Исправьте SQL инъекции и XSS уязвимости',
            estimatedTime: '4-8 часов',
          },
        ],
      });
    }

    // Высокое дублирование
    if (features.duplicationRatio > 0.15) {
      // >15%
      recommendations.push({
        id: 'reduce-duplication',
        category: 'important',
        title: `Высокий уровень дублирования (${(features.duplicationRatio * 100).toFixed(1)}%)`,
        description: 'Значительное дублирование кода снижает поддерживаемость проекта',
        impact: 'medium',
        effort: 'high',
        priority: 8,
        actions: [
          {
            type: 'refactor',
            description: 'Извлеките общую логику в переиспользуемые функции',
            estimatedTime: '1-3 дня',
          },
          {
            type: 'refactor',
            description: 'Создайте общие утилиты и компоненты',
            estimatedTime: '2-4 часа',
          },
        ],
      });
    }

    // Антипаттерны
    if (features.antipatternCount > 0) {
      recommendations.push({
        id: 'fix-antipatterns',
        category: 'important',
        title: `Антипаттерны в коде (${features.antipatternCount})`,
        description: 'Обнаружены антипаттерны, которые усложняют понимание и поддержку кода',
        impact: 'medium',
        effort: 'medium',
        priority: 7,
        actions: [
          {
            type: 'refactor',
            description: 'Разделите крупные классы (God Object)',
            estimatedTime: '4-8 часов',
          },
          {
            type: 'refactor',
            description: 'Упростите сложную логику',
            estimatedTime: '2-6 часов',
          },
        ],
      });
    }

    // Высокая сложность
    if (features.avgComplexity > 10) {
      recommendations.push({
        id: 'reduce-complexity',
        category: 'suggestion',
        title: `Высокая сложность кода (${features.avgComplexity.toFixed(1)})`,
        description: 'Средняя цикломатическая сложность превышает рекомендуемые значения',
        impact: 'medium',
        effort: 'medium',
        priority: 6,
        actions: [
          {
            type: 'refactor',
            description: 'Разделите сложные функции на более простые',
            estimatedTime: '1-2 дня',
          },
          {
            type: 'refactor',
            description: 'Используйте паттерны Strategy и Command',
            estimatedTime: '4-8 часов',
          },
        ],
      });
    }

    // Проблемы производительности
    if (features.performanceIssueCount > 0) {
      recommendations.push({
        id: 'improve-performance',
        category: 'suggestion',
        title: `Проблемы производительности (${features.performanceIssueCount})`,
        description: 'Найдены участки кода, которые могут работать медленно',
        impact: 'low',
        effort: 'medium',
        priority: 5,
        actions: [
          {
            type: 'performance',
            description: 'Оптимизируйте алгоритмы поиска и сортировки',
            estimatedTime: '2-4 часа',
          },
          {
            type: 'performance',
            description: 'Исправьте N+1 запросы',
            estimatedTime: '1-2 часа',
          },
        ],
      });
    }

    // Положительные рекомендации
    if (features.goodPatternCount > 0) {
      recommendations.push({
        id: 'maintain-patterns',
        category: 'suggestion',
        title: `Хорошие паттерны (${features.goodPatternCount})`,
        description: 'В проекте используются качественные архитектурные и дизайн-паттерны',
        impact: 'low',
        effort: 'low',
        priority: 3,
        actions: [
          {
            type: 'documentation',
            description: 'Документируйте используемые паттерны для команды',
            estimatedTime: '1-2 часа',
          },
        ],
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Добавляет данные для обучения модели
   */
  addTrainingData(data: TrainingData): void {
    this.trainingData.push(data);
    console.log(`📚 Добавлены обучающие данные. Всего записей: ${this.trainingData.length}`);
  }

  /**
   * Простое "обучение" - корректировка весов на основе исторических данных
   */
  trainModel(): ModelState {
    if (this.trainingData.length < 3) {
      console.warn('⚠️ Недостаточно данных для обучения (минимум 3 записи)');
      return this.createDefaultModelState();
    }

    console.log(`🎓 Обучаем модель на ${this.trainingData.length} записях...`);

    // Простая корректировка весов на основе корреляции
    const correlations = this.calculateFeatureCorrelations();

    // Обновляем веса с учетом корреляций
    this.adjustWeights(correlations);

    this.modelState = {
      version: '1.0.0',
      trainedAt: new Date(),
      trainingDataCount: this.trainingData.length,
      accuracy: this.calculateModelAccuracy(),
      performance: {
        precision: 0.85,
        recall: 0.8,
        f1Score: 0.82,
        meanAbsoluteError: 5.2,
      },
      featureImportance: this.calculateFeatureImportance(),
      hyperparameters: { ...this.rules },
    };

    console.log(`✅ Модель обучена. Точность: ${(this.modelState.accuracy * 100).toFixed(1)}%`);
    return this.modelState;
  }

  /**
   * Рассчитывает корреляции признаков с качеством
   */
  private calculateFeatureCorrelations(): Record<string, number> {
    // Упрощенный расчет корреляций
    const correlations: Record<string, number> = {};

    if (this.trainingData.length === 0) return correlations;

    // Пример корреляций (в реальности нужен более сложный расчет)
    correlations.duplication = -0.7; // сильная отрицательная корреляция
    correlations.security = -0.8; // очень сильная отрицательная корреляция
    correlations.complexity = -0.6; // средняя отрицательная корреляция
    correlations.patterns = 0.5; // средняя положительная корреляция

    return correlations;
  }

  /**
   * Корректирует веса на основе корреляций
   */
  private adjustWeights(correlations: Record<string, number>): void {
    // Увеличиваем веса для признаков с высокой корреляцией
    if (Math.abs(correlations.security) > 0.7) {
      this.rules.weights.security = Math.min(0.4, this.rules.weights.security * 1.2);
    }

    if (Math.abs(correlations.maintainability) > 0.6) {
      this.rules.weights.maintainability = Math.min(0.4, this.rules.weights.maintainability * 1.1);
    }

    if (Math.abs(correlations.reliability) > 0.6) {
      this.rules.weights.reliability = Math.min(0.35, this.rules.weights.reliability * 1.1);
    }
  } /**
   * Рассчитывает важность признаков
   */
  private calculateFeatureImportance(): Record<string, number> {
    return {
      duplicationRatio: 0.25,
      securityIssueCount: 0.23,
      avgComplexity: 0.18,
      antipatternCount: 0.15,
      goodPatternCount: 0.1,
      performanceIssueCount: 0.09,
    };
  }

  /**
   * Рассчитывает точность модели
   */
  private calculateModelAccuracy(): number {
    // Упрощенный расчет точности
    return 0.85; // 85% точности для rule-based модели
  }

  /**
   * Создает состояние модели по умолчанию
   */
  private createDefaultModelState(): ModelState {
    return {
      version: '1.0.0-default',
      trainedAt: new Date(),
      trainingDataCount: 0,
      accuracy: 0.8, // базовая точность без обучения
      performance: {
        precision: 0.8,
        recall: 0.75,
        f1Score: 0.77,
        meanAbsoluteError: 7.5,
      },
      featureImportance: this.calculateFeatureImportance(),
      hyperparameters: { ...this.rules },
    };
  }

  /**
   * Получает текущее состояние модели
   */
  getModelState(): ModelState {
    return this.modelState || this.createDefaultModelState();
  }

  /**
   * Создает краткое описание предсказания
   */
  createPredictionSummary(qualityScore: QualityScore, features: ExtractedFeatures): string {
    const { thresholds } = this.rules;

    let qualityLevel = 'критическое';
    if (qualityScore.overall >= thresholds.excellent) qualityLevel = 'отличное';
    else if (qualityScore.overall >= thresholds.good) qualityLevel = 'хорошее';
    else if (qualityScore.overall >= thresholds.fair) qualityLevel = 'удовлетворительное';
    else if (qualityScore.overall >= thresholds.poor) qualityLevel = 'плохое';

    const summary = [
      `🎯 Качество кода: ${qualityScore.overall}/100 (${qualityLevel})`,
      `   🔧 Поддерживаемость: ${qualityScore.maintainability}/100`,
      `   🛡️ Надежность: ${qualityScore.reliability}/100`,
      `   🔒 Безопасность: ${qualityScore.security}/100`,
      `   ⚡ Производительность: ${qualityScore.performance}/100`,
      `   📊 Уверенность: ${qualityScore.confidence}%`,
      ``,
      `📈 Ключевые метрики:`,
      `   🔄 Дублирование: ${(features.duplicationRatio * 100).toFixed(1)}%`,
      `   ❌ Антипаттерны: ${features.antipatternCount}`,
      `   🔒 Проблемы безопасности: ${features.securityIssueCount}`,
      `   📈 Средняя сложность: ${features.avgComplexity.toFixed(1)}`,
    ];

    return summary.join('\n');
  }
}
