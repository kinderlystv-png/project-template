/**
 * Тесты для Quality Predictor - предсказателя качества кода
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QualityPredictor } from '../../src/modules/ai-insights/quality-predictor';
import type {
  ExtractedFeatures,
  QualityScore,
  TrainingData,
} from '../../src/modules/ai-insights/types';

// Вспомогательные функции для создания тестовых данных
function createMockFeatures(overrides: Partial<ExtractedFeatures> = {}): ExtractedFeatures {
  return {
    // Метрики дублирования
    duplicationRatio: 0.1,
    duplicateBlockCount: 5,
    avgDuplicateSize: 20,

    // Метрики паттернов
    goodPatternCount: 2,
    antipatternCount: 1,
    securityIssueCount: 0,
    performanceIssueCount: 1,
    patternConfidenceAvg: 75,

    // Метрики сложности
    avgComplexity: 8.5,
    maxComplexity: 15,
    complexityVariance: 2.5,

    // Метрики размера
    fileCount: 10,
    linesOfCode: 1000,
    avgFileSize: 100,

    // Вычисляемые показатели
    codeSmellScore: 25,
    maintainabilityIndex: 75,
    technicalDebtRatio: 0.15,

    ...overrides,
  };
}

function createMockTrainingData(
  features: ExtractedFeatures,
  actualQuality: {
    maintainability: number;
    reliability: number;
    security: number;
    performance: number;
  }
): TrainingData {
  return {
    projectId: 'test-project',
    projectName: 'Test Project',
    features,
    actualQuality,
    context: {
      projectType: 'web',
      teamSize: 5,
      developmentTime: 6,
      linesOfCode: features.linesOfCode,
      technologies: ['typescript', 'node.js'],
    },
    metadata: {
      timestamp: new Date(),
      source: 'automated',
      notes: 'Тестовые данные',
    },
  };
}
describe('QualityPredictor', () => {
  let predictor: QualityPredictor;

  beforeEach(() => {
    predictor = new QualityPredictor();
  });

  describe('predict', () => {
    it('должен предсказывать высокое качество для хорошего кода', () => {
      const features = createMockFeatures({
        duplicationRatio: 0.05, // низкое дублирование
        antipatternCount: 0, // нет антипаттернов
        securityIssueCount: 0, // нет проблем безопасности
        avgComplexity: 6, // низкая сложность
        goodPatternCount: 5, // много хороших паттернов
        codeSmellScore: 10, // низкий уровень запахов кода
      });

      const result = predictor.predict(features);

      expect(result.overall).toBeGreaterThan(80);
      expect(result.maintainability).toBeGreaterThan(75);
      expect(result.reliability).toBeGreaterThan(75);
      expect(result.security).toBeGreaterThan(85);
      expect(result.performance).toBeGreaterThan(70);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('должен предсказывать низкое качество для проблемного кода', () => {
      const features = createMockFeatures({
        duplicationRatio: 0.4, // высокое дублирование
        antipatternCount: 8, // много антипаттернов
        securityIssueCount: 3, // проблемы безопасности
        avgComplexity: 25, // высокая сложность
        performanceIssueCount: 5, // проблемы производительности
        codeSmellScore: 90, // много запахов кода
        technicalDebtRatio: 0.6, // высокий технический долг
      });

      const result = predictor.predict(features);

      expect(result.overall).toBeLessThan(40);
      expect(result.maintainability).toBeLessThan(50);
      expect(result.reliability).toBeLessThan(50);
      expect(result.security).toBeLessThan(30);
      expect(result.performance).toBeLessThan(40);
    });

    it('должен корректно обрабатывать средний уровень качества', () => {
      const features = createMockFeatures({
        duplicationRatio: 0.15, // умеренное дублирование
        antipatternCount: 2, // несколько антипаттернов
        securityIssueCount: 1, // одна проблема безопасности
        avgComplexity: 12, // средняя сложность
        goodPatternCount: 3, // несколько хороших паттернов
        codeSmellScore: 45, // средний уровень запахов
      });

      const result = predictor.predict(features);

      expect(result.overall).toBeGreaterThan(40);
      expect(result.overall).toBeLessThan(80);
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('должен учитывать критические проблемы безопасности', () => {
      const baseFeatures = createMockFeatures({
        duplicationRatio: 0.05,
        antipatternCount: 0,
        avgComplexity: 6,
      });

      const secureFeatures = { ...baseFeatures, securityIssueCount: 0 };
      const insecureFeatures = { ...baseFeatures, securityIssueCount: 5 };

      const secureResult = predictor.predict(secureFeatures);
      const insecureResult = predictor.predict(insecureFeatures);

      expect(secureResult.security).toBeGreaterThan(insecureResult.security + 50);
      expect(secureResult.overall).toBeGreaterThan(insecureResult.overall);
    });

    it('должен возвращать значения в корректном диапазоне', () => {
      const features = createMockFeatures();
      const result = predictor.predict(features);

      // Все оценки должны быть от 0 до 100
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.maintainability).toBeGreaterThanOrEqual(0);
      expect(result.maintainability).toBeLessThanOrEqual(100);
      expect(result.reliability).toBeGreaterThanOrEqual(0);
      expect(result.reliability).toBeLessThanOrEqual(100);
      expect(result.security).toBeGreaterThanOrEqual(0);
      expect(result.security).toBeLessThanOrEqual(100);
      expect(result.performance).toBeGreaterThanOrEqual(0);
      expect(result.performance).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(30);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('generateRecommendations', () => {
    it('должен генерировать критические рекомендации для проблем безопасности', () => {
      const features = createMockFeatures({
        securityIssueCount: 3,
      });
      const qualityScore: QualityScore = {
        overall: 45,
        maintainability: 60,
        reliability: 50,
        security: 20,
        performance: 70,
        confidence: 80,
      };

      const recommendations = predictor.generateRecommendations(features, qualityScore);

      expect(recommendations.length).toBeGreaterThan(0);

      const securityRec = recommendations.find(r => r.id === 'security-critical');
      expect(securityRec).toBeDefined();
      expect(securityRec?.category).toBe('critical');
      expect(securityRec?.priority).toBe(10);
    });

    it('должен генерировать рекомендации по дублированию', () => {
      const features = createMockFeatures({
        duplicationRatio: 0.25, // 25% дублирования
      });
      const qualityScore: QualityScore = {
        overall: 55,
        maintainability: 45,
        reliability: 60,
        security: 80,
        performance: 50,
        confidence: 75,
      };

      const recommendations = predictor.generateRecommendations(features, qualityScore);

      const duplicationRec = recommendations.find(r => r.id === 'reduce-duplication');
      expect(duplicationRec).toBeDefined();
      expect(duplicationRec?.category).toBe('important');
      expect(duplicationRec?.impact).toBe('medium');
    });

    it('должен сортировать рекомендации по приоритету', () => {
      const features = createMockFeatures({
        securityIssueCount: 2, // критическое (приоритет 10)
        duplicationRatio: 0.3, // важное (приоритет 8)
        antipatternCount: 3, // важное (приоритет 7)
        avgComplexity: 15, // предложение (приоритет 6)
      });

      const qualityScore: QualityScore = {
        overall: 35,
        maintainability: 40,
        reliability: 35,
        security: 25,
        performance: 45,
        confidence: 70,
      };

      const recommendations = predictor.generateRecommendations(features, qualityScore);

      expect(recommendations.length).toBeGreaterThan(2);

      // Первая рекомендация должна быть самой приоритетной
      expect(recommendations[0].priority).toBeGreaterThanOrEqual(recommendations[1].priority);
      expect(recommendations[1].priority).toBeGreaterThanOrEqual(recommendations[2].priority);
    });

    it('должен генерировать положительные рекомендации для хороших паттернов', () => {
      const features = createMockFeatures({
        goodPatternCount: 8,
        securityIssueCount: 0,
        duplicationRatio: 0.05,
      });

      const qualityScore: QualityScore = {
        overall: 85,
        maintainability: 80,
        reliability: 85,
        security: 90,
        performance: 80,
        confidence: 90,
      };

      const recommendations = predictor.generateRecommendations(features, qualityScore);

      const positiveRec = recommendations.find(r => r.id === 'maintain-patterns');
      expect(positiveRec).toBeDefined();
      expect(positiveRec?.category).toBe('suggestion');
    });
  });

  describe('model training', () => {
    it('должен добавлять обучающие данные', () => {
      const features = createMockFeatures();
      const trainingData = createMockTrainingData(features, {
        maintainability: 75,
        reliability: 80,
        security: 70,
        performance: 75,
      });

      predictor.addTrainingData(trainingData);

      const modelState = predictor.getModelState();
      expect(modelState.trainingDataCount).toBe(0); // не обучена еще
    });

    it('должен обучать модель с достаточным количеством данных', () => {
      // Добавляем достаточное количество обучающих данных
      for (let i = 0; i < 5; i++) {
        const features = createMockFeatures({
          duplicationRatio: i * 0.1,
          securityIssueCount: i % 3,
          avgComplexity: 5 + i * 2,
        });
        const qualityBase = 80 - i * 10;
        const trainingData = createMockTrainingData(features, {
          maintainability: qualityBase,
          reliability: qualityBase + 5,
          security: qualityBase - 5,
          performance: qualityBase + 3,
        });
        predictor.addTrainingData(trainingData);
      }

      const modelState = predictor.trainModel();

      expect(modelState.trainingDataCount).toBe(5);
      expect(modelState.accuracy).toBeGreaterThan(0);
      expect(modelState.version).toBe('1.0.0');
      expect(modelState.featureImportance).toBeDefined();
    });

    it('должен использовать модель по умолчанию при недостатке данных', () => {
      const modelState = predictor.trainModel();

      expect(modelState.version).toBe('1.0.0-default');
      expect(modelState.trainingDataCount).toBe(0);
      expect(modelState.accuracy).toBe(0.8);
    });

    it('должен корректно рассчитывать важность признаков', () => {
      const modelState = predictor.getModelState();

      expect(modelState.featureImportance).toBeDefined();
      expect(modelState.featureImportance.duplicationRatio).toBeGreaterThan(0);
      expect(modelState.featureImportance.securityIssueCount).toBeGreaterThan(0);
      expect(modelState.featureImportance.avgComplexity).toBeGreaterThan(0);
    });
  });

  describe('prediction summary', () => {
    it('должен создавать понятное описание предсказания', () => {
      const features = createMockFeatures({
        duplicationRatio: 0.12,
        antipatternCount: 2,
        securityIssueCount: 1,
        avgComplexity: 9.5,
      });

      const qualityScore: QualityScore = {
        overall: 65,
        maintainability: 70,
        reliability: 65,
        security: 55,
        performance: 75,
        confidence: 80,
      };

      const summary = predictor.createPredictionSummary(qualityScore, features);

      expect(summary).toContain('65/100');
      expect(summary).toContain('удовлетворительное'); // 65 попадает в диапазон 50-75
      expect(summary).toContain('12.0%'); // дублирование
      expect(summary).toContain('2'); // антипаттерны
      expect(summary).toContain('1'); // проблемы безопасности
      expect(summary).toContain('9.5'); // сложность
    });

    it('должен правильно классифицировать уровни качества', () => {
      const features = createMockFeatures();

      // Тестируем разные уровни качества
      const excellentScore: QualityScore = {
        overall: 95,
        maintainability: 90,
        reliability: 95,
        security: 95,
        performance: 90,
        confidence: 90,
      };
      const goodScore: QualityScore = {
        overall: 80,
        maintainability: 75,
        reliability: 80,
        security: 85,
        performance: 75,
        confidence: 85,
      };
      const fairScore: QualityScore = {
        overall: 60,
        maintainability: 55,
        reliability: 60,
        security: 65,
        performance: 55,
        confidence: 75,
      };
      const poorScore: QualityScore = {
        overall: 35,
        maintainability: 30,
        reliability: 35,
        security: 40,
        performance: 35,
        confidence: 60,
      };
      const criticalScore: QualityScore = {
        overall: 15,
        maintainability: 10,
        reliability: 15,
        security: 20,
        performance: 15,
        confidence: 50,
      };

      expect(predictor.createPredictionSummary(excellentScore, features)).toContain('отличное');
      expect(predictor.createPredictionSummary(goodScore, features)).toContain('хорошее');
      expect(predictor.createPredictionSummary(fairScore, features)).toContain(
        'удовлетворительное'
      );
      expect(predictor.createPredictionSummary(poorScore, features)).toContain('плохое');
      expect(predictor.createPredictionSummary(criticalScore, features)).toContain('критическое');
    });
  });

  describe('custom rules', () => {
    it('должен использовать пользовательские правила', () => {
      const customRules = {
        weights: {
          maintainability: 0.4,
          reliability: 0.3,
          security: 0.2,
          performance: 0.1,
        },
        thresholds: {
          excellent: 95,
          good: 80,
          fair: 60,
          poor: 40,
        },
      };

      const customPredictor = new QualityPredictor(customRules);
      const features = createMockFeatures();

      const result = customPredictor.predict(features);

      expect(result).toBeDefined();
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });
  });
});
