/**
 * Тесты для Feature Extractor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureExtractor } from '../../src/modules/ai-insights/feature-extractor';
import type { CodeMetrics, ExtractedFeatures } from '../../src/modules/ai-insights/types';
import type { PatternAnalysisResult } from '../../src/modules/ai-insights/pattern-recognizer';

describe('FeatureExtractor', () => {
  let extractor: FeatureExtractor;
  let mockMetrics: CodeMetrics;

  beforeEach(() => {
    extractor = new FeatureExtractor();

    // Подготавливаем тестовые данные
    mockMetrics = {
      duplication: {
        percentage: 15.5,
        duplicatedLines: 155,
        totalLines: 1000,
        duplicateBlocks: [
          {
            hash: 'abc123',
            content: 'function test() { return true; }',
            lines: 5,
            startLine: 1,
            endLine: 5,
            files: [
              { path: 'file1.ts', startLine: 1, endLine: 5 },
              { path: 'file2.ts', startLine: 10, endLine: 14 },
            ],
          },
          {
            hash: 'def456',
            content: 'const x = 1; const y = 2;',
            lines: 3,
            startLine: 6,
            endLine: 8,
            files: [
              { path: 'file1.ts', startLine: 6, endLine: 8 },
              { path: 'file3.ts', startLine: 20, endLine: 22 },
            ],
          },
        ],
        uniqueLines: 845,
        analysisMetadata: {
          analyzedFiles: 10,
          skippedFiles: 2,
          generatedFiles: 1,
        },
      },
      patterns: {
        detectedPatterns: [
          {
            id: 'mvc-pattern',
            name: 'MVC Pattern',
            type: 'architectural',
            confidence: 85,
            description: 'MVC архитектурный паттерн',
            impact: 'medium',
            locations: [],
            recommendation: 'Хорошая архитектура',
            examples: [],
          },
          {
            id: 'god-object',
            name: 'God Object',
            type: 'antipattern',
            confidence: 75,
            description: 'Слишком большой класс',
            impact: 'high',
            locations: [],
            recommendation: 'Разделить класс',
            examples: [],
          },
          {
            id: 'sql-injection',
            name: 'SQL Injection Risk',
            type: 'security',
            confidence: 90,
            description: 'Риск SQL инъекций',
            impact: 'critical',
            locations: [],
            recommendation: 'Использовать параметризованные запросы',
            examples: [],
          },
        ],
        architecturalScore: 75,
        designQuality: 80,
        antipatternCount: 1,
        securityConcerns: [
          {
            id: 'sql-injection',
            name: 'SQL Injection Risk',
            type: 'security',
            confidence: 90,
            description: 'Риск SQL инъекций',
            impact: 'critical',
            locations: [],
            recommendation: 'Использовать параметризованные запросы',
            examples: [],
          },
        ],
        performanceIssues: [],
        recommendations: ['Исправить проблемы безопасности'],
        summary: {
          goodPatterns: 1,
          problematicPatterns: 2,
          totalConfidence: 83,
          predominantArchitecture: 'MVC',
        },
      },
      complexity: {
        average: 8.5,
        maximum: 25,
        files: [
          {
            path: 'file1.ts',
            complexity: 12,
            functions: [
              { name: 'func1', complexity: 8, startLine: 1, endLine: 10 },
              { name: 'func2', complexity: 15, startLine: 15, endLine: 30 },
            ],
          },
          {
            path: 'file2.ts',
            complexity: 5,
            functions: [{ name: 'func3', complexity: 5, startLine: 1, endLine: 8 }],
          },
        ],
      },
      fileCount: 10,
      linesOfCode: 1000,
    };
  });

  describe('extractFeatures', () => {
    it('должен извлекать все признаки из метрик', () => {
      const features = extractor.extractFeatures(mockMetrics);

      // Проверяем, что все ключи присутствуют
      expect(features).toHaveProperty('duplicationRatio');
      expect(features).toHaveProperty('duplicateBlockCount');
      expect(features).toHaveProperty('avgDuplicateSize');
      expect(features).toHaveProperty('goodPatternCount');
      expect(features).toHaveProperty('antipatternCount');
      expect(features).toHaveProperty('securityIssueCount');
      expect(features).toHaveProperty('performanceIssueCount');
      expect(features).toHaveProperty('patternConfidenceAvg');
      expect(features).toHaveProperty('avgComplexity');
      expect(features).toHaveProperty('maxComplexity');
      expect(features).toHaveProperty('complexityVariance');
      expect(features).toHaveProperty('fileCount');
      expect(features).toHaveProperty('linesOfCode');
      expect(features).toHaveProperty('avgFileSize');
      expect(features).toHaveProperty('codeSmellScore');
      expect(features).toHaveProperty('maintainabilityIndex');
      expect(features).toHaveProperty('technicalDebtRatio');
    });

    it('должен правильно рассчитывать признаки дублирования', () => {
      const features = extractor.extractFeatures(mockMetrics);

      expect(features.duplicationRatio).toBeCloseTo(0.155); // 15.5%
      expect(features.duplicateBlockCount).toBe(2);
      expect(features.avgDuplicateSize).toBe(4); // (5 + 3) / 2
    });

    it('должен правильно рассчитывать признаки паттернов', () => {
      const features = extractor.extractFeatures(mockMetrics);

      expect(features.goodPatternCount).toBe(1); // MVC
      expect(features.antipatternCount).toBe(1); // God Object
      expect(features.securityIssueCount).toBe(1); // SQL Injection
      expect(features.performanceIssueCount).toBe(0);
      expect(features.patternConfidenceAvg).toBeCloseTo(83.33); // (85 + 75 + 90) / 3
    });

    it('должен правильно рассчитывать признаки сложности', () => {
      const features = extractor.extractFeatures(mockMetrics);

      expect(features.avgComplexity).toBe(8.5);
      expect(features.maxComplexity).toBe(25);
      expect(features.complexityVariance).toBeGreaterThan(0);
    });

    it('должен правильно рассчитывать признаки размера', () => {
      const features = extractor.extractFeatures(mockMetrics);

      expect(features.fileCount).toBe(10);
      expect(features.linesOfCode).toBe(1000);
      expect(features.avgFileSize).toBe(100); // 1000 / 10
    });

    it('должен рассчитывать агрегированные показатели', () => {
      const features = extractor.extractFeatures(mockMetrics);

      expect(features.codeSmellScore).toBeGreaterThan(0);
      expect(features.codeSmellScore).toBeLessThanOrEqual(100);

      expect(features.maintainabilityIndex).toBeGreaterThan(0);
      expect(features.maintainabilityIndex).toBeLessThanOrEqual(100);

      expect(features.technicalDebtRatio).toBeGreaterThanOrEqual(0);
      expect(features.technicalDebtRatio).toBeLessThanOrEqual(1);
    });
  });

  describe('createFeatureSummary', () => {
    it('должен создавать читаемую сводку', () => {
      const features = extractor.extractFeatures(mockMetrics);
      const summary = extractor.createFeatureSummary(features);

      expect(summary).toContain('Признаки проекта');
      expect(summary).toContain('Файлов: 10');
      expect(summary).toContain('Строк кода: 1000');
      expect(summary).toContain('Дублирование: 15.5%');
      expect(summary).toContain('Хорошие паттерны: 1');
      expect(summary).toContain('Антипаттерны: 1');
    });
  });

  describe('normalizeFeatures', () => {
    it('должен нормализовать все признаки в диапазон 0-1', () => {
      const features = extractor.extractFeatures(mockMetrics);
      const normalized = extractor.normalizeFeatures(features);

      // Все значения должны быть от 0 до 1
      Object.values(normalized).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });

      // Проверяем конкретные значения
      expect(normalized.duplicationRatio).toBeCloseTo(0.155);
      expect(normalized.fileCount).toBeCloseTo(0.01); // 10/1000
      expect(normalized.linesOfCode).toBeCloseTo(0.01); // 1000/100000
    });
  });

  describe('обработка отсутствующих данных', () => {
    it('должен корректно обрабатывать отсутствующие метрики сложности', () => {
      const metricsWithoutComplexity = {
        ...mockMetrics,
        complexity: undefined,
      };

      const features = extractor.extractFeatures(metricsWithoutComplexity);

      expect(features.avgComplexity).toBe(0);
      expect(features.maxComplexity).toBe(0);
      expect(features.complexityVariance).toBe(0);
    });

    it('должен корректно обрабатывать пустые массивы', () => {
      const emptyMetrics: CodeMetrics = {
        duplication: {
          percentage: 0,
          duplicatedLines: 0,
          totalLines: 100,
          duplicateBlocks: [],
          uniqueLines: 100,
          analysisMetadata: {
            analyzedFiles: 1,
            skippedFiles: 0,
            generatedFiles: 0,
          },
        },
        patterns: {
          detectedPatterns: [],
          architecturalScore: 100,
          designQuality: 100,
          antipatternCount: 0,
          securityConcerns: [],
          performanceIssues: [],
          recommendations: [],
          summary: {
            goodPatterns: 0,
            problematicPatterns: 0,
            totalConfidence: 0,
            predominantArchitecture: 'Unknown',
          },
        },
        fileCount: 1,
        linesOfCode: 100,
      };

      const features = extractor.extractFeatures(emptyMetrics);

      expect(features.duplicateBlockCount).toBe(0);
      expect(features.goodPatternCount).toBe(0);
      expect(features.antipatternCount).toBe(0);
      expect(features.codeSmellScore).toBeGreaterThan(50); // Должен быть высоким при отсутствии проблем
    });
  });
});
