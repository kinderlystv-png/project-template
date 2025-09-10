/**
 * TestingAnalysisAdapter - Адаптер для интеграции UnifiedTestingAnalyzer с основным AnalysisOrchestrator
 *
 * Phase 4.1: Архитектурная подготовка
 *
 * Обеспечивает изолированную интеграцию тестового анализа без конфликта с AI модулями
 */

import * as path from 'path';
import { CheckContext, CheckResult, ComponentResult } from '../types/index.js';
import { ProcessIsolatedAnalyzer } from './ProcessIsolatedAnalyzer.js';
import { safeExecute, handleAnalysisError, ErrorType } from '../utils/error-handler.js';

/**
 * Результат анализа тестовой экосистемы в формате AnalysisOrchestrator
 */
interface TestingAnalysisResult {
  component: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: Array<{ check: { name: string } }>;
  failed: Array<{ check: { name: string }; reason: string }>;

  // Дополнительные метрики для основного анализатора
  testingMetrics: {
    unitTesting: {
      score: number;
      testsCount: number;
      frameworksReady: number;
    };
    e2eTesting: {
      score: number;
      testsCount: number;
      frameworksReady: number;
    };
    codeCoverage: {
      score: number;
      configured: boolean;
    };
    overallReadiness: 'production' | 'development' | 'basic' | 'inadequate';
  };

  recommendations: string[];
  executionTime: number;
}

/**
 * Адаптер для интеграции UnifiedTestingAnalyzer в основной AnalysisOrchestrator EAP v4.0
 */
export class TestingAnalysisAdapter {
  private readonly componentName = 'Testing Infrastructure';
  private readonly maxScore = 100;
  private readonly isolatedAnalyzer: ProcessIsolatedAnalyzer;

  constructor() {
    this.isolatedAnalyzer = new ProcessIsolatedAnalyzer();
  }

  /**
   * Выполняет анализ тестовой инфраструктуры проекта
   */
  async checkComponent(context: CheckContext): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      console.log('🧪 Анализ тестовой инфраструктуры...');

      // Запускаем UnifiedTestingAnalyzer в изолированном процессе
      const isolatedResult = await safeExecute(
        () => this.isolatedAnalyzer.runUnifiedAnalysis(context),
        ErrorType.INTEGRATION_ERROR,
        'Ошибка при запуске изолированного анализа тестирования'
      );

      if (!isolatedResult) {
        return this.createFallbackResult(context, startTime);
      }

      // Преобразуем результат для основного анализатора
      const adaptedResult = this.adaptResultForOrchestrator(isolatedResult, startTime);

      console.log(
        `🧪 Testing Infrastructure: ${adaptedResult.percentage}% (${adaptedResult.score}/${adaptedResult.maxScore})`
      );

      return adaptedResult;
    } catch (error) {
      console.error('❌ Ошибка анализа тестовой инфраструктуры:', error);

      handleAnalysisError(
        error,
        ErrorType.INTEGRATION_ERROR,
        'TestingAnalysisAdapter.checkComponent'
      );

      return this.createFallbackResult(context, startTime);
    }
  }

  /**
   * Преобразует результат UnifiedTestingAnalyzer в формат ComponentResult
   */
  private adaptResultForOrchestrator(unifiedResult: any, startTime: number): ComponentResult {
    const executionTime = Date.now() - startTime;

    // Извлекаем ключевые метрики
    const overallScore = unifiedResult.overallScore || 0;
    const percentage = Math.round(overallScore);

    // Создаем проверки на основе анализа фреймворков
    const passed: Array<{ check: { name: string } }> = [];
    const failed: Array<{ check: { name: string }; reason: string }> = [];

    // Анализируем результаты по фреймворкам
    if (unifiedResult.frameworks) {
      unifiedResult.frameworks.forEach((framework: any) => {
        const checkName = `${framework.name} Framework`;

        if (framework.configured && framework.score >= 70) {
          passed.push({ check: { name: checkName } });
        } else {
          const reason = !framework.installed
            ? 'Framework not installed'
            : !framework.configured
              ? 'Framework not properly configured'
              : `Low score: ${framework.score}/100`;

          failed.push({ check: { name: checkName }, reason });
        }
      });
    }

    // Добавляем проверки категорий
    if (unifiedResult.unitTesting?.score >= 70) {
      passed.push({ check: { name: 'Unit Testing Infrastructure' } });
    } else {
      failed.push({
        check: { name: 'Unit Testing Infrastructure' },
        reason: `Score: ${unifiedResult.unitTesting?.score || 0}/100`,
      });
    }

    if (unifiedResult.e2eTesting?.score >= 50) {
      passed.push({ check: { name: 'E2E Testing Infrastructure' } });
    } else {
      failed.push({
        check: { name: 'E2E Testing Infrastructure' },
        reason: `Score: ${unifiedResult.e2eTesting?.score || 0}/100`,
      });
    }

    if (unifiedResult.codeCoverage?.configured) {
      passed.push({ check: { name: 'Code Coverage Configuration' } });
    } else {
      failed.push({
        check: { name: 'Code Coverage Configuration' },
        reason: 'Code coverage not configured',
      });
    }

    // Создаем адаптированный результат
    const result: ComponentResult = {
      component: this.componentName,
      score: Math.round(overallScore),
      maxScore: this.maxScore,
      percentage,
      passed,
      failed,

      // Дополнительные данные для расширенной аналитики
      details: {
        testingMetrics: {
          unitTesting: {
            score: unifiedResult.unitTesting?.score || 0,
            testsCount: unifiedResult.unitTesting?.testsTotal || 0,
            frameworksReady: unifiedResult.unitTesting?.frameworksReady || 0,
          },
          e2eTesting: {
            score: unifiedResult.e2eTesting?.score || 0,
            testsCount: unifiedResult.e2eTesting?.testsTotal || 0,
            frameworksReady: unifiedResult.e2eTesting?.frameworksReady || 0,
          },
          codeCoverage: {
            score: unifiedResult.codeCoverage?.score || 0,
            configured: unifiedResult.codeCoverage?.configured || false,
          },
          overallReadiness: unifiedResult.readinessLevel || 'inadequate',
        },
        executionTime,
        frameworks: unifiedResult.frameworks || [],
        phase1Score: unifiedResult.phase1Score || 0,
        phase2Score: unifiedResult.phase2Score || 0,
      },
    };

    return result;
  }

  /**
   * Создает результат fallback при ошибках
   */
  private createFallbackResult(context: CheckContext, startTime: number): ComponentResult {
    const executionTime = Date.now() - startTime;

    return {
      component: this.componentName,
      score: 0,
      maxScore: this.maxScore,
      percentage: 0,
      passed: [],
      failed: [
        {
          check: { name: 'Testing Analysis' },
          reason: 'Failed to analyze testing infrastructure - fallback mode',
        },
      ],
      details: {
        testingMetrics: {
          unitTesting: { score: 0, testsCount: 0, frameworksReady: 0 },
          e2eTesting: { score: 0, testsCount: 0, frameworksReady: 0 },
          codeCoverage: { score: 0, configured: false },
          overallReadiness: 'inadequate' as const,
        },
        executionTime,
        error: true,
        fallbackMode: true,
      },
    };
  }

  /**
   * Проверяет доступность тестового анализа
   */
  async isTestingAnalysisAvailable(): Promise<boolean> {
    try {
      return await this.isolatedAnalyzer.checkAvailability();
    } catch (error) {
      console.warn('⚠️ Testing analysis not available:', error);
      return false;
    }
  }

  /**
   * Получает статистику производительности
   */
  getPerformanceStats(): {
    averageExecutionTime: number;
    successRate: number;
    lastExecutionTime: number;
  } {
    return this.isolatedAnalyzer.getPerformanceStats();
  }
}
