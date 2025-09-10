/**
 * UnifiedTestingAnalyzer - Центральный анализатор тестовой экосистемы
 * Объединяет все Unit Testing (Phase 1) и E2E Testing (Phase 2) анализаторы
 *
 * Phase 3: Unified Testing Analyzer
 *
 * Координирует работу:
 * - VitestCheckerAdapter (Unit Testing)
 * - JestCheckerAdapter (Unit Testing)
 * - CoverageAnalyzerAdapter (Code Coverage)
 * - PlaywrightCheckerAdapter (E2E Testing)
 * - CypressCheckerAdapter (E2E Testing)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseChecker } from '../../../core/checker.js';
import { CheckContext, CheckResult } from '../../../core/types.js';

// Импорт всех анализаторов
import { VitestCheckerAdapter } from './checkers/VitestCheckerAdapter.js';
import { JestCheckerAdapter } from './checkers/JestCheckerAdapter.js';
import { CoverageAnalyzerAdapter } from './checkers/CoverageAnalyzerAdapter.js';
import { PlaywrightCheckerAdapter } from './checkers/PlaywrightCheckerAdapter.js';
import { CypressCheckerAdapter } from './checkers/CypressCheckerAdapter.js';

/**
 * Результат анализа отдельного тестового фреймворка
 */
interface FrameworkAnalysis {
  name: string;
  category: 'unit' | 'e2e' | 'coverage';
  installed: boolean;
  configured: boolean;
  testsCount: number;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
  recommendations: string[];
  details: any;
}

/**
 * Общий результат анализа тестовой экосистемы
 */
interface TestingEcosystemAnalysis {
  overallScore: number;
  overallStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  readinessLevel: 'production' | 'development' | 'basic' | 'inadequate';

  // Статистика по категориям
  unitTesting: {
    score: number;
    frameworksReady: number;
    frameworksTotal: number;
    testsTotal: number;
  };

  e2eTesting: {
    score: number;
    frameworksReady: number;
    frameworksTotal: number;
    testsTotal: number;
  };

  codeCoverage: {
    score: number;
    configured: boolean;
    coverageReports: boolean;
  };

  // Детальные результаты
  frameworks: FrameworkAnalysis[];

  // Рекомендации
  criticalIssues: string[];
  improvements: string[];
  nextSteps: string[];
}

/**
 * Унифицированный анализатор тестовой экосистемы проекта
 */
export class UnifiedTestingAnalyzer extends BaseChecker {
  readonly name = 'unified-testing-analyzer';
  readonly category = 'quality' as const;
  readonly description =
    'Комплексный анализ всей тестовой экосистемы проекта (Unit + E2E + Coverage)';

  // Инициализация всех анализаторов
  private vitestAnalyzer = new VitestCheckerAdapter();
  private jestAnalyzer = new JestCheckerAdapter();
  private coverageAnalyzer = new CoverageAnalyzerAdapter();
  private playwrightAnalyzer = new PlaywrightCheckerAdapter();
  private cypressAnalyzer = new CypressCheckerAdapter();

  /**
   * Выполняет комплексный анализ тестовой экосистемы
   */
  async check(context: CheckContext): Promise<CheckResult> {
    const projectPath = context.projectPath;

    try {
      console.log('🔍 Начинаю комплексный анализ тестовой экосистемы...');

      // Запускаем анализ всех фреймворков параллельно
      const analysisPromises = [
        this.analyzeFramework(this.vitestAnalyzer, 'unit', context),
        this.analyzeFramework(this.jestAnalyzer, 'unit', context),
        this.analyzeFramework(this.coverageAnalyzer, 'coverage', context),
        this.analyzeFramework(this.playwrightAnalyzer, 'e2e', context),
        this.analyzeFramework(this.cypressAnalyzer, 'e2e', context),
      ];

      const frameworkResults = await Promise.all(analysisPromises);

      // Создаем общий анализ экосистемы
      const ecosystemAnalysis = this.buildEcosystemAnalysis(frameworkResults);

      // Генерируем финальные рекомендации
      const recommendations = this.generateRecommendations(ecosystemAnalysis);

      // Определяем общий статус
      const isSuccess = ecosystemAnalysis.overallScore >= 60;
      const severity = this.getIssueSeverity(ecosystemAnalysis.overallScore);

      console.log(`✅ Анализ завершен. Общая оценка: ${ecosystemAnalysis.overallScore}/100`);

      return this.createResult(
        isSuccess,
        ecosystemAnalysis.overallScore,
        this.generateSummaryMessage(ecosystemAnalysis),
        {
          ecosystem: ecosystemAnalysis,
          frameworks: frameworkResults,
          recommendations,
          phase1Score:
            this.calculatePhaseScore(frameworkResults, 'unit') +
            this.calculatePhaseScore(frameworkResults, 'coverage'),
          phase2Score: this.calculatePhaseScore(frameworkResults, 'e2e'),
          readinessLevel: ecosystemAnalysis.readinessLevel,
        },
        recommendations,
        severity
      );
    } catch (error) {
      console.error('❌ Ошибка при анализе тестовой экосистемы:', error);

      return this.createResult(
        false,
        0,
        'Критическая ошибка при анализе тестовой экосистемы',
        { error: error instanceof Error ? error.message : String(error) },
        ['Проверьте логи и структуру проекта'],
        'error'
      );
    }
  }

  /**
   * Анализирует отдельный тестовый фреймворк
   */
  private async analyzeFramework(
    analyzer: BaseChecker,
    category: 'unit' | 'e2e' | 'coverage',
    context: CheckContext
  ): Promise<FrameworkAnalysis> {
    try {
      console.log(`🔍 Анализирую ${analyzer.name}...`);

      const result = await analyzer.check(context);

      // Извлекаем информацию из результата
      const details = result.details || {};
      const testsCount = this.extractTestsCount(details, analyzer.name);
      const status = this.getFrameworkStatus(result.score);
      const installed = result.score > 10; // Если больше 10, значит хотя бы что-то найдено
      const configured = result.score > 50; // Если больше 50, значит прилично настроен

      return {
        name: analyzer.name,
        category,
        installed,
        configured,
        testsCount,
        score: result.score,
        status,
        recommendations: result.recommendations || [],
        details,
      };
    } catch (error) {
      console.error(`❌ Ошибка анализа ${analyzer.name}:`, error);

      return {
        name: analyzer.name,
        category,
        installed: false,
        configured: false,
        testsCount: 0,
        score: 0,
        status: 'missing',
        recommendations: [
          `Ошибка анализа: ${error instanceof Error ? error.message : String(error)}`,
        ],
        details: { error: true },
      };
    }
  }

  /**
   * Создает общий анализ тестовой экосистемы
   */
  private buildEcosystemAnalysis(frameworks: FrameworkAnalysis[]): TestingEcosystemAnalysis {
    // Разделяем фреймворки по категориям
    const unitFrameworks = frameworks.filter(f => f.category === 'unit');
    const e2eFrameworks = frameworks.filter(f => f.category === 'e2e');
    const coverageFrameworks = frameworks.filter(f => f.category === 'coverage');

    // Расчет статистики Unit Testing
    const unitTesting = {
      score: this.calculateCategoryScore(unitFrameworks),
      frameworksReady: unitFrameworks.filter(f => f.configured).length,
      frameworksTotal: unitFrameworks.length,
      testsTotal: unitFrameworks.reduce((sum, f) => sum + f.testsCount, 0),
    };

    // Расчет статистики E2E Testing
    const e2eTesting = {
      score: this.calculateCategoryScore(e2eFrameworks),
      frameworksReady: e2eFrameworks.filter(f => f.configured).length,
      frameworksTotal: e2eFrameworks.length,
      testsTotal: e2eFrameworks.reduce((sum, f) => sum + f.testsCount, 0),
    };

    // Расчет статистики Code Coverage
    const codeCoverage = {
      score: this.calculateCategoryScore(coverageFrameworks),
      configured: coverageFrameworks.some(f => f.configured),
      coverageReports: coverageFrameworks.some(f => f.score > 70),
    };

    // Общий счет (взвешенный)
    const overallScore = Math.round(
      unitTesting.score * 0.4 + // Unit тесты - 40%
        e2eTesting.score * 0.35 + // E2E тесты - 35%
        codeCoverage.score * 0.25 // Coverage - 25%
    );

    return {
      overallScore,
      overallStatus: this.getOverallStatus(overallScore),
      readinessLevel: this.getReadinessLevel(overallScore, unitTesting, e2eTesting),
      unitTesting,
      e2eTesting,
      codeCoverage,
      frameworks,
      criticalIssues: this.identifyCriticalIssues(frameworks),
      improvements: this.identifyImprovements(frameworks),
      nextSteps: this.identifyNextSteps(overallScore, unitTesting, e2eTesting),
    };
  }

  /**
   * Извлекает количество тестов из деталей анализа
   */
  private extractTestsCount(details: any, analyzerName: string): number {
    if (!details) return 0;

    // Различные способы извлечения количества тестов
    if (details.testsFound !== undefined) return details.testsFound;
    if (details.testFiles !== undefined) return details.testFiles;
    if (details.testCount !== undefined) return details.testCount;
    if (details.e2eTests !== undefined) return details.e2eTests;
    if (details.unitTests !== undefined) return details.unitTests;

    return 0;
  }

  /**
   * Определяет статус фреймворка по счету
   */
  private getFrameworkStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'missing' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 20) return 'poor';
    return 'missing';
  }

  /**
   * Рассчитывает средний счет для категории фреймворков
   */
  private calculateCategoryScore(frameworks: FrameworkAnalysis[]): number {
    if (frameworks.length === 0) return 0;

    const totalScore = frameworks.reduce((sum, f) => sum + f.score, 0);
    return Math.round(totalScore / frameworks.length);
  }

  /**
   * Рассчитывает счет для определенной фазы
   */
  private calculatePhaseScore(frameworks: FrameworkAnalysis[], category: string): number {
    const phaseFrameworks = frameworks.filter(f => f.category === category);
    return this.calculateCategoryScore(phaseFrameworks);
  }

  /**
   * Определяет общий статус экосистемы
   */
  private getOverallStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 30) return 'poor';
    return 'critical';
  }

  /**
   * Определяет уровень готовности к продакшену
   */
  private getReadinessLevel(
    overallScore: number,
    unitTesting: any,
    e2eTesting: any
  ): 'production' | 'development' | 'basic' | 'inadequate' {
    if (overallScore >= 80 && unitTesting.testsTotal >= 10 && e2eTesting.testsTotal >= 3) {
      return 'production';
    }
    if (overallScore >= 60 && unitTesting.testsTotal >= 5) {
      return 'development';
    }
    if (overallScore >= 40) {
      return 'basic';
    }
    return 'inadequate';
  }

  /**
   * Выявляет критические проблемы
   */
  private identifyCriticalIssues(frameworks: FrameworkAnalysis[]): string[] {
    const issues: string[] = [];

    const unitFrameworks = frameworks.filter(f => f.category === 'unit');
    const e2eFrameworks = frameworks.filter(f => f.category === 'e2e');
    const coverageFrameworks = frameworks.filter(f => f.category === 'coverage');

    // Проверяем критические проблемы
    if (unitFrameworks.every(f => !f.configured)) {
      issues.push('❌ Ни один Unit Testing фреймворк не настроен');
    }

    if (e2eFrameworks.every(f => !f.configured)) {
      issues.push('❌ Ни один E2E Testing фреймворк не настроен');
    }

    if (coverageFrameworks.every(f => !f.configured)) {
      issues.push('❌ Code Coverage не настроен');
    }

    const totalTests = frameworks.reduce((sum, f) => sum + f.testsCount, 0);
    if (totalTests === 0) {
      issues.push('❌ В проекте отсутствуют тесты');
    }

    return issues;
  }

  /**
   * Выявляет возможности для улучшения
   */
  private identifyImprovements(frameworks: FrameworkAnalysis[]): string[] {
    const improvements: string[] = [];

    frameworks.forEach(framework => {
      if (framework.status === 'poor' && framework.installed) {
        improvements.push(`⚠️ ${framework.name}: улучшить конфигурацию (${framework.score}/100)`);
      }

      if (framework.status === 'fair' && framework.testsCount < 5) {
        improvements.push(
          `📝 ${framework.name}: добавить больше тестов (сейчас ${framework.testsCount})`
        );
      }
    });

    return improvements;
  }

  /**
   * Определяет следующие шаги
   */
  private identifyNextSteps(overallScore: number, unitTesting: any, e2eTesting: any): string[] {
    const steps: string[] = [];

    if (overallScore < 50) {
      steps.push('🔧 Настроить базовую тестовую инфраструктуру');
    }

    if (unitTesting.testsTotal < 10) {
      steps.push('📝 Создать больше Unit тестов');
    }

    if (e2eTesting.frameworksReady === 0) {
      steps.push('🎭 Настроить E2E тестирование');
    }

    if (overallScore >= 70) {
      steps.push('🚀 Готов к интеграции с AnalysisOrchestrator');
    }

    return steps;
  }

  /**
   * Генерирует рекомендации по улучшению
   */
  private generateRecommendations(analysis: TestingEcosystemAnalysis): string[] {
    const recommendations: string[] = [];

    // Добавляем критические проблемы
    recommendations.push(...analysis.criticalIssues);

    // Добавляем улучшения
    recommendations.push(...analysis.improvements);

    // Добавляем следующие шаги
    recommendations.push(...analysis.nextSteps);

    return recommendations;
  }

  /**
   * Генерирует сводное сообщение
   */
  private generateSummaryMessage(analysis: TestingEcosystemAnalysis): string {
    const { overallScore, overallStatus, readinessLevel } = analysis;
    const { unitTesting, e2eTesting, codeCoverage } = analysis;

    return (
      `Тестовая экосистема: ${overallScore}/100 (${overallStatus}). ` +
      `Unit Testing: ${unitTesting.score}/100 (${unitTesting.frameworksReady}/${unitTesting.frameworksTotal} готовы). ` +
      `E2E Testing: ${e2eTesting.score}/100 (${e2eTesting.frameworksReady}/${e2eTesting.frameworksTotal} готовы). ` +
      `Code Coverage: ${codeCoverage.score}/100. ` +
      `Готовность: ${readinessLevel}`
    );
  }

  /**
   * Определяет серьезность проблем
   */
  private getIssueSeverity(score: number): 'error' | 'warning' | 'info' {
    if (score < 30) return 'error';
    if (score < 70) return 'warning';
    return 'info';
  }
}
