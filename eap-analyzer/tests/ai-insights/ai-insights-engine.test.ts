/**
 * Тесты для AI Insights Engine - центрального движка AI анализа
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIInsightsEngine } from '../../src/modules/ai-insights/ai-insights-engine';

describe('AI Insights Engine', () => {
  let engine: AIInsightsEngine;

  beforeEach(() => {
    engine = new AIInsightsEngine();
  });

  describe('initialization', () => {
    it('должен инициализироваться с конфигурацией по умолчанию', () => {
      const config = engine.getConfig();

      expect(config.enabledAnalyzers.patterns).toBe(true);
      expect(config.enabledAnalyzers.duplication).toBe(true);
      expect(config.enabledAnalyzers.complexity).toBe(true);
      expect(config.thresholds.duplication).toBe(15);
      expect(config.thresholds.complexity).toBe(10);
      expect(config.thresholds.qualityScore).toBe(70);
    });

    it('должен принимать кастомную конфигурацию', () => {
      const customConfig = {
        enabledAnalyzers: {
          patterns: false,
          duplication: true,
          complexity: false,
          performance: true,
        },
        thresholds: {
          duplication: 20,
          complexity: 15,
          qualityScore: 80,
        },
      };

      const customEngine = new AIInsightsEngine(customConfig);
      const config = customEngine.getConfig();

      expect(config.enabledAnalyzers.patterns).toBe(false);
      expect(config.enabledAnalyzers.complexity).toBe(false);
      expect(config.thresholds.duplication).toBe(20);
      expect(config.thresholds.qualityScore).toBe(80);
    });
  });

  describe('cache management', () => {
    it('должен инициализироваться с пустым кешем', () => {
      expect(engine.getCacheSize()).toBe(0);
    });

    it('должен очищать кеш', () => {
      engine.clearCache();
      expect(engine.getCacheSize()).toBe(0);
    });
  });

  describe('configuration management', () => {
    it('должен обновлять конфигурацию', () => {
      const newConfig = {
        thresholds: {
          duplication: 25,
          complexity: 12,
          qualityScore: 85,
        },
      };

      engine.updateConfig(newConfig);
      const config = engine.getConfig();

      expect(config.thresholds.duplication).toBe(25);
      expect(config.thresholds.complexity).toBe(12);
      expect(config.thresholds.qualityScore).toBe(85);
    });

    it('должен возвращать статистику движка', () => {
      const stats = engine.getEngineStats();

      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('modelVersion');
      expect(stats).toHaveProperty('modelAccuracy');
      expect(stats).toHaveProperty('enabledAnalyzers');
      expect(Array.isArray(stats.enabledAnalyzers)).toBe(true);
    });
  });

  describe('project analysis', () => {
    it('должен выполнять анализ проекта', async () => {
      const testProjectPath = '/test/project';

      // Это тест интеграции - в реальности займет время
      const result = await engine.analyzeProject(testProjectPath);

      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('qualityScore');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('analysisMetadata');

      // Проверяем структуру качества
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore.overall).toBeLessThanOrEqual(100);
      expect(result.qualityScore.confidence).toBeGreaterThanOrEqual(30);
      expect(result.qualityScore.confidence).toBeLessThanOrEqual(100);

      // Проверяем метаданные
      expect(result.analysisMetadata.timestamp).toBeInstanceOf(Date);
      expect(result.analysisMetadata.version).toBe('3.2.0');
      expect(result.analysisMetadata.processingTime).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(result.analysisMetadata.confidenceLevel);

      // Проверяем признаки
      expect(result.features.fileCount).toBeGreaterThan(0);
      expect(result.features.linesOfCode).toBeGreaterThan(0);
      expect(result.features.duplicationRatio).toBeGreaterThanOrEqual(0);
      expect(result.features.duplicationRatio).toBeLessThanOrEqual(1);

      // Проверяем рекомендации
      expect(Array.isArray(result.recommendations)).toBe(true);

      // Проверяем инсайты
      expect(Array.isArray(result.insights)).toBe(true);
      if (result.insights.length > 0) {
        expect(['success', 'warning', 'info']).toContain(result.insights[0].type);
        expect(result.insights[0].message).toBeTruthy();
      }
    }, 10000); // увеличиваем timeout для полного анализа

    it('должен использовать кеш при повторном анализе', async () => {
      const testProjectPath = '/test/project';

      // Первый анализ
      const result1 = await engine.analyzeProject(testProjectPath);
      const cacheSize1 = engine.getCacheSize();

      // Второй анализ того же проекта
      const result2 = await engine.analyzeProject(testProjectPath);
      const cacheSize2 = engine.getCacheSize();

      // Кеш должен использоваться, размер не должен измениться
      expect(cacheSize1).toBe(cacheSize2);
      expect(result1.qualityScore.overall).toBe(result2.qualityScore.overall);
    });

    it('должен обходить кеш при соответствующей опции', async () => {
      const testProjectPath = '/test/project';

      // Анализ с обходом кеша
      const result = await engine.analyzeProject(testProjectPath, { bypassCache: true });

      expect(result).toHaveProperty('qualityScore');
      expect(result.analysisMetadata.processingTime).toBeGreaterThan(0);
    });

    it('должен обрабатывать ошибки анализа', async () => {
      const invalidPath = '/invalid/path/that/does/not/exist';

      try {
        await engine.analyzeProject(invalidPath);
        // Если дошли сюда, значит ошибка не была выброшена
        expect.fail('Ожидалась ошибка для несуществующего пути');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('AI анализ не удался');
      }
    });

    it('должен генерировать корректные инсайты', async () => {
      const testProjectPath = '/test/project';
      const result = await engine.analyzeProject(testProjectPath);

      expect(Array.isArray(result.insights)).toBe(true);

      if (result.insights.length > 0) {
        const insight = result.insights[0];
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('message');
        expect(['success', 'warning', 'info']).toContain(insight.type);
        expect(typeof insight.message).toBe('string');
        expect(insight.message.length).toBeGreaterThan(0);
      }
    });

    it('должен определять тренд качества', async () => {
      const testProjectPath = '/test/project';
      const result = await engine.analyzeProject(testProjectPath);

      expect(result.qualityTrend).toBeDefined();
      expect(['improving', 'stable', 'degrading']).toContain(result.qualityTrend);
    });

    it('должен включать информацию об использованных модулях', async () => {
      const testProjectPath = '/test/project';
      const result = await engine.analyzeProject(testProjectPath);

      expect(result.analysisMetadata.coverage.modulesUsed).toBeDefined();
      expect(Array.isArray(result.analysisMetadata.coverage.modulesUsed)).toBe(true);
      expect(result.analysisMetadata.coverage.modulesUsed.length).toBeGreaterThan(0);

      // Проверяем что основные модули включены
      const modules = result.analysisMetadata.coverage.modulesUsed;
      expect(modules).toContain('ai-insights');
      expect(modules).toContain('feature-extractor');
      expect(modules).toContain('quality-predictor');
    });
  });

  describe('analysis options', () => {
    it('должен поддерживать различные уровни verbosity', async () => {
      const testProjectPath = '/test/project';

      const minimalResult = await engine.analyzeProject(testProjectPath, { verbosity: 'minimal' });
      const detailedResult = await engine.analyzeProject(testProjectPath, {
        verbosity: 'detailed',
      });

      // Оба результата должны быть валидными
      expect(minimalResult.qualityScore).toBeDefined();
      expect(detailedResult.qualityScore).toBeDefined();
    });

    it('должен учитывать порог уверенности', async () => {
      const testProjectPath = '/test/project';

      const result = await engine.analyzeProject(testProjectPath, {
        confidenceThreshold: 0.9,
      });

      expect(result.qualityScore.confidence).toBeDefined();
    });

    it('должен поддерживать включение/выключение фрагментов кода', async () => {
      const testProjectPath = '/test/project';

      const withSnippets = await engine.analyzeProject(testProjectPath, {
        includeCodeSnippets: true,
      });
      const withoutSnippets = await engine.analyzeProject(testProjectPath, {
        includeCodeSnippets: false,
      });

      // Оба анализа должны завершиться успешно
      expect(withSnippets.qualityScore).toBeDefined();
      expect(withoutSnippets.qualityScore).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('должен корректно обрабатывать ошибки инициализации', () => {
      expect(() => {
        new AIInsightsEngine({
          // Некорректная конфигурация
          thresholds: {
            duplication: -1, // некорректное значение
            complexity: 10,
            qualityScore: 70,
          },
        });
      }).not.toThrow(); // Движок должен быть устойчив к некорректным данным
    });

    it('должен иметь разумные значения по умолчанию', () => {
      const stats = engine.getEngineStats();

      expect(stats.modelAccuracy).toBeGreaterThan(0);
      expect(stats.modelAccuracy).toBeLessThanOrEqual(1);
      expect(stats.enabledAnalyzers.length).toBeGreaterThan(0);
    });
  });
});
