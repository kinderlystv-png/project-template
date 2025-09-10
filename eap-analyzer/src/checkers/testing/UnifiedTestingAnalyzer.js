/**
 * UnifiedTestingAnalyzer - Упрощенная версия для тестирования с SimpleOrchestrator
 * Phase 3: Unified Testing Analyzer
 *
 * Координирует работу всех тестовых анализаторов через SimpleOrchestrator
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Импорт SimpleOrchestrator и анализаторов
import { SimpleOrchestrator } from '../SimpleOrchestrator.js';
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
  executionTime: number;
}

/**
 * Общий результат анализа тестовой экосистемы
 */
interface TestingEcosystemAnalysis {
  overallScore: number;
  overallStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  readinessLevel: 'production' | 'development' | 'basic' | 'inadequate';

  // Статистика по фазам
  phase1Score: number; // Unit Testing + Coverage
  phase2Score: number; // E2E Testing

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
  };

  // Детальные результаты
  frameworks: FrameworkAnalysis[];

  // Рекомендации и статистика
  criticalIssues: string[];
  improvements: string[];
  nextSteps: string[];
  totalExecutionTime: number;
}

/**
 * Унифицированный анализатор тестовой экосистемы
 */
export class UnifiedTestingAnalyzer {
  private orchestrator: SimpleOrchestrator;

  constructor() {
    this.orchestrator = new SimpleOrchestrator();

    // Регистрируем все анализаторы
    this.orchestrator.register(new VitestCheckerAdapter());
    this.orchestrator.register(new JestCheckerAdapter());
    this.orchestrator.register(new CoverageAnalyzerAdapter());
    this.orchestrator.register(new PlaywrightCheckerAdapter());
    this.orchestrator.register(new CypressCheckerAdapter());
  }

  /**
   * Выполняет комплексный анализ тестовой экосистемы
   */
  async analyze(projectPath: string): Promise<TestingEcosystemAnalysis> {
    const startTime = Date.now();

    console.log('🔍 Начинаю комплексный анализ тестовой экосистемы...');
    console.log(`📁 Проект: ${projectPath}`);

    try {
      // Запускаем анализ через SimpleOrchestrator
      const results = await this.orchestrator.analyze({ projectPath });

      // Преобразуем результаты в единый формат
      const frameworkAnalyses = this.convertResults(results);

      // Создаем общий анализ экосистемы
      const ecosystemAnalysis = this.buildEcosystemAnalysis(frameworkAnalyses);

      // Добавляем время выполнения
      ecosystemAnalysis.totalExecutionTime = Date.now() - startTime;

      console.log(`✅ Анализ завершен за ${ecosystemAnalysis.totalExecutionTime}ms`);
      console.log(`📊 Общая оценка: ${ecosystemAnalysis.overallScore}/100 (${ecosystemAnalysis.overallStatus})`);

      return ecosystemAnalysis;

    } catch (error) {
      console.error('❌ Ошибка при анализе тестовой экосистемы:', error);
      throw error;
    }
  }

  /**
   * Преобразует результаты SimpleOrchestrator в унифицированный формат
   */
  private convertResults(results: any): FrameworkAnalysis[] {
    const analyses: FrameworkAnalysis[] = [];

    results.forEach((result: any) => {
      const analysis: FrameworkAnalysis = {
        name: result.checker || 'unknown',
        category: this.getCategoryByName(result.checker),
        installed: result.score > 10,
        configured: result.score > 50,
        testsCount: this.extractTestsCount(result.details),
        score: result.score || 0,
        status: this.getFrameworkStatus(result.score || 0),
        recommendations: result.recommendations || [],
        executionTime: result.executionTime || 0
      };

      analyses.push(analysis);
    });

    return analyses;
  }

  /**
   * Определяет категорию по имени анализатора
   */
  private getCategoryByName(name: string): 'unit' | 'e2e' | 'coverage' {
    if (name.includes('vitest') || name.includes('jest')) {
      return 'unit';
    }
    if (name.includes('playwright') || name.includes('cypress')) {
      return 'e2e';
    }
    if (name.includes('coverage')) {
      return 'coverage';
    }
    return 'unit'; // по умолчанию
  }

  /**
   * Извлекает количество тестов из результатов
   */
  private extractTestsCount(details: any): number {
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
      testsTotal: unitFrameworks.reduce((sum, f) => sum + f.testsCount, 0)
    };

    // Расчет статистики E2E Testing
    const e2eTesting = {
      score: this.calculateCategoryScore(e2eFrameworks),
      frameworksReady: e2eFrameworks.filter(f => f.configured).length,
      frameworksTotal: e2eFrameworks.length,
      testsTotal: e2eFrameworks.reduce((sum, f) => sum + f.testsCount, 0)
    };

    // Расчет статистики Code Coverage
    const codeCoverage = {
      score: this.calculateCategoryScore(coverageFrameworks),
      configured: coverageFrameworks.some(f => f.configured)
    };

    // Расчет фазовых счетов
    const phase1Score = Math.round((unitTesting.score + codeCoverage.score) / 2);
    const phase2Score = e2eTesting.score;

    // Общий счет (взвешенный)
    const overallScore = Math.round(
      (unitTesting.score * 0.4) +   // Unit тесты - 40%
      (e2eTesting.score * 0.35) +   // E2E тесты - 35%
      (codeCoverage.score * 0.25)   // Coverage - 25%
    );

    return {
      overallScore,
      overallStatus: this.getOverallStatus(overallScore),
      readinessLevel: this.getReadinessLevel(overallScore, unitTesting, e2eTesting),
      phase1Score,
      phase2Score,
      unitTesting,
      e2eTesting,
      codeCoverage,
      frameworks,
      criticalIssues: this.identifyCriticalIssues(frameworks),
      improvements: this.identifyImprovements(frameworks),
      nextSteps: this.identifyNextSteps(overallScore, unitTesting, e2eTesting),
      totalExecutionTime: 0 // будет установлено позже
    };
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
        improvements.push(`📝 ${framework.name}: добавить больше тестов (сейчас ${framework.testsCount})`);
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
   * Генерирует детальный отчет
   */
  generateReport(analysis: TestingEcosystemAnalysis): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('📊 UNIFIED TESTING ANALYZER - КОМПЛЕКСНЫЙ ОТЧЕТ');
    lines.push('='.repeat(80));
    lines.push('');

    // Общая информация
    lines.push(`🎯 ОБЩАЯ ОЦЕНКА: ${analysis.overallScore}/100 (${analysis.overallStatus.toUpperCase()})`);
    lines.push(`🚀 ГОТОВНОСТЬ: ${analysis.readinessLevel.toUpperCase()}`);
    lines.push(`⏱️  ВРЕМЯ АНАЛИЗА: ${analysis.totalExecutionTime}ms`);
    lines.push('');

    // Статистика по фазам
    lines.push('📈 СТАТИСТИКА ПО ФАЗАМ:');
    lines.push(`   Phase 1 (Unit + Coverage): ${analysis.phase1Score}/100`);
    lines.push(`   Phase 2 (E2E Testing):     ${analysis.phase2Score}/100`);
    lines.push('');

    // Детальная статистика
    lines.push('🔍 ДЕТАЛЬНАЯ СТАТИСТИКА:');
    lines.push(`   Unit Testing:  ${analysis.unitTesting.score}/100 (${analysis.unitTesting.frameworksReady}/${analysis.unitTesting.frameworksTotal} готовы, ${analysis.unitTesting.testsTotal} тестов)`);
    lines.push(`   E2E Testing:   ${analysis.e2eTesting.score}/100 (${analysis.e2eTesting.frameworksReady}/${analysis.e2eTesting.frameworksTotal} готовы, ${analysis.e2eTesting.testsTotal} тестов)`);
    lines.push(`   Code Coverage: ${analysis.codeCoverage.score}/100 (${analysis.codeCoverage.configured ? 'настроен' : 'не настроен'})`);
    lines.push('');

    // Результаты по фреймворкам
    lines.push('🛠️  АНАЛИЗ ФРЕЙМВОРКОВ:');
    analysis.frameworks.forEach(framework => {
      const statusIcon = this.getStatusIcon(framework.status);
      lines.push(`   ${statusIcon} ${framework.name}: ${framework.score}/100 (${framework.status}, ${framework.testsCount} тестов, ${framework.executionTime}ms)`);
    });
    lines.push('');

    // Критические проблемы
    if (analysis.criticalIssues.length > 0) {
      lines.push('🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ:');
      analysis.criticalIssues.forEach(issue => lines.push(`   ${issue}`));
      lines.push('');
    }

    // Улучшения
    if (analysis.improvements.length > 0) {
      lines.push('💡 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ:');
      analysis.improvements.forEach(improvement => lines.push(`   ${improvement}`));
      lines.push('');
    }

    // Следующие шаги
    if (analysis.nextSteps.length > 0) {
      lines.push('👣 СЛЕДУЮЩИЕ ШАГИ:');
      analysis.nextSteps.forEach(step => lines.push(`   ${step}`));
      lines.push('');
    }

    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  /**
   * Получает иконку для статуса
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'fair': return '🟡';
      case 'poor': return '🟠';
      case 'missing': return '🔴';
      default: return '⚪';
    }
  }
}
