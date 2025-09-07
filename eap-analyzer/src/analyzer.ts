/**
 * Эталонный Анализатор Проектов (ЭАП)
 * Главный класс для анализа проектов по золотому стандарту
 */

import * as path from 'path';
import { CICDChecker } from './checkers/ci-cd.js';
import { CodeQualityChecker } from './checkers/code-quality.js';
import { DependenciesChecker } from './checkers/dependencies.js';
import { DockerChecker } from './checkers/docker.js';
import { EMTChecker } from './checkers/emt.js';
import { LoggingChecker } from './checkers/logging.js';
import { SvelteKitChecker } from './checkers/sveltekit.js';
import { VitestChecker } from './checkers/vitest.js';
import { CheckContext, CheckResult, ComponentResult } from './types/index.js';

export interface SimpleAnalysisResult {
  projectPath: string;
  components: ComponentResult[];
  summary: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    passedChecks: number;
    totalChecks: number;
    criticalIssues: number;
  };
  recommendations: string[];
  analyzedAt: Date;
  duration: number;
}

export class GoldenStandardAnalyzer {
  private verbose = true;

  private log(message: string): void {
    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }
  /**
   * Выполняет полный анализ проекта
   */
  async analyzeProject(projectPath: string): Promise<SimpleAnalysisResult> {
    const startTime = Date.now();

    this.log('🔍 Начинаем анализ проекта по Золотому Стандарту...');
    this.log(`📂 Путь: ${projectPath}`);
    this.log('');

    const context: CheckContext = {
      projectPath: path.resolve(projectPath),
      projectInfo: {
        name: path.basename(projectPath),
        version: '1.0.0',
        hasTypeScript: false,
        hasTests: false,
        hasDocker: false,
        hasCICD: false,
        dependencies: {
          production: 0,
          development: 0,
          total: 0,
        },
      },
      options: {
        projectPath: path.resolve(projectPath),
        verbose: true,
      },
    };

    const componentResults: ComponentResult[] = [];
    const availableCheckers = this.getAvailableCheckers();

    // Выполняем проверки для каждого компонента
    for (const checker of availableCheckers) {
      try {
        this.log(`📋 Анализируем: ${checker.name}`);
        const result = await checker.checkComponent(context);
        componentResults.push(result);

        // Показываем промежуточный результат
        this.log(
          `   Результат: ${result.percentage}% - ${result.passed.length}/${result.passed.length + result.failed.length} проверок`
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`❌ Ошибка при анализе ${checker.name}: ${error}`);
      }
    }

    this.log('');

    // Вычисляем общую оценку
    const totalScore = componentResults.reduce((sum, r) => sum + r.score, 0);
    const maxTotalScore = componentResults.reduce((sum, r) => sum + r.maxScore, 0);
    const overallPercentage =
      maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;

    // Собираем рекомендации
    const allRecommendations = componentResults
      .flatMap(r => r.recommendations)
      .filter((rec, index, arr) => arr.indexOf(rec) === index); // убираем дубликаты

    const result: SimpleAnalysisResult = {
      projectPath: context.projectPath,
      components: componentResults,
      summary: {
        totalScore,
        maxScore: maxTotalScore,
        percentage: overallPercentage,
        passedChecks: componentResults.reduce((sum, r) => sum + r.passed.length, 0),
        totalChecks: componentResults.reduce(
          (sum, r) => sum + r.passed.length + r.failed.length,
          0
        ),
        criticalIssues: componentResults.reduce(
          (sum, r) => sum + r.failed.filter(f => f.check.critical).length,
          0
        ),
      },
      recommendations: allRecommendations,
      analyzedAt: new Date(),
      duration: Date.now() - startTime,
    };

    this.printResults(result);
    return result;
  }

  /**
   * Выводит результаты анализа в консоль
   */
  private printResults(result: SimpleAnalysisResult): void {
    const { summary } = result;

    this.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА');
    this.log('━'.repeat(60));

    // Общая оценка
    let grade = 'F';
    if (summary.percentage >= 90) grade = 'A';
    else if (summary.percentage >= 80) grade = 'B';
    else if (summary.percentage >= 70) grade = 'C';
    else if (summary.percentage >= 60) grade = 'D';

    this.log(`🎯 Общая оценка: ${grade} (${summary.percentage}/100)`);
    this.log(`✅ Пройдено проверок: ${summary.passedChecks}/${summary.totalChecks}`);
    this.log(`⚡ Критических проблем: ${summary.criticalIssues}`);
    this.log(`⏱️ Время анализа: ${(result.duration / 1000).toFixed(2)}с`);
    this.log('');

    // Детализация по компонентам
    this.log('📋 ДЕТАЛИЗАЦИЯ ПО КОМПОНЕНТАМ:');
    this.log('');

    result.components.forEach(comp => {
      let compGrade = 'F';
      if (comp.percentage >= 90) compGrade = 'A';
      else if (comp.percentage >= 80) compGrade = 'B';
      else if (comp.percentage >= 70) compGrade = 'C';
      else if (comp.percentage >= 60) compGrade = 'D';

      this.log(`${compGrade} ${comp.component.name}`);
      this.log(`    📈 ${comp.score}/${comp.maxScore} баллов (${comp.percentage}%)`);
      this.log(`    ✅ ${comp.passed.length} пройдено, ❌ ${comp.failed.length} не пройдено`);

      if (comp.failed.length > 0) {
        this.log(`    🔸 Проблемы:`);
        comp.failed.slice(0, 3).forEach(fail => {
          this.log(`      • ${fail.check.name}`);
        });
        if (comp.failed.length > 3) {
          this.log(`      • и еще ${comp.failed.length - 3} проблем...`);
        }
      }
      this.log('');
    });

    // Рекомендации
    if (result.recommendations.length > 0) {
      this.log('💡 РЕКОМЕНДАЦИИ:');
      this.log('');
      result.recommendations.slice(0, 10).forEach((rec, index) => {
        this.log(`${index + 1}. ${rec}`);
      });

      if (result.recommendations.length > 10) {
        this.log(`... и еще ${result.recommendations.length - 10} рекомендаций`);
      }
      this.log('');
    }

    // Итоговое сообщение
    if (summary.percentage >= 90) {
      this.log('🎉 Отличная работа! Проект соответствует Золотому Стандарту!');
    } else if (summary.percentage >= 75) {
      this.log('👍 Хороший проект! Есть несколько областей для улучшения.');
    } else if (summary.percentage >= 50) {
      this.log('⚠️ Проект требует существенных улучшений.');
    } else {
      this.log('🚨 Проект значительно отстает от стандартов. Требуется комплексная доработка.');
    }

    this.log('');
    this.log('━'.repeat(60));
  }

  /**
   * Получает список доступных проверочных модулей
   */
  private getAvailableCheckers() {
    return [
      {
        name: 'ЭМТ (Эталонный Модуль Тестирования)',
        checkComponent: EMTChecker.checkComponent.bind(EMTChecker),
      },
      {
        name: 'Docker Infrastructure',
        checkComponent: DockerChecker.checkComponent.bind(DockerChecker),
      },
      {
        name: 'SvelteKit Framework',
        checkComponent: this.createSvelteKitChecker.bind(this),
      },
      {
        name: 'CI/CD Pipeline',
        checkComponent: this.createCICDChecker.bind(this),
      },
      {
        name: 'Code Quality System',
        checkComponent: this.createCodeQualityChecker.bind(this),
      },
      {
        name: 'Vitest Testing Framework',
        checkComponent: this.createVitestChecker.bind(this),
      },
      {
        name: 'Dependencies Management',
        checkComponent: this.createDependenciesChecker.bind(this),
      },
      {
        name: 'Logging System',
        checkComponent: this.createLoggingChecker.bind(this),
      },
    ];
  }

  /**
   * Создает компонентные проверки для новых чекеров
   */
  private async createSvelteKitChecker(context: CheckContext): Promise<ComponentResult> {
    const checker = new SvelteKitChecker(context);
    const checkResults = await checker.checkAll();
    return this.createComponentResult('SvelteKit Framework', checkResults);
  }

  private async createCICDChecker(context: CheckContext): Promise<ComponentResult> {
    const checker = new CICDChecker(context);
    const checkResults = await checker.checkAll();
    return this.createComponentResult('CI/CD Pipeline', checkResults);
  }

  private async createCodeQualityChecker(context: CheckContext): Promise<ComponentResult> {
    const checker = new CodeQualityChecker(context);
    const checkResults = await checker.checkAll();
    return this.createComponentResult('Code Quality System', checkResults);
  }

  private async createVitestChecker(context: CheckContext): Promise<ComponentResult> {
    const checker = new VitestChecker(context);
    const checkResults = await checker.checkAll();
    return this.createComponentResult('Vitest Testing Framework', checkResults);
  }

  private async createDependenciesChecker(context: CheckContext): Promise<ComponentResult> {
    const checker = new DependenciesChecker(context);
    const checkResults = await checker.checkAll();
    return this.createComponentResult('Dependencies Management', checkResults);
  }

  private async createLoggingChecker(context: CheckContext): Promise<ComponentResult> {
    const checker = new LoggingChecker(context);
    const checkResults = await checker.checkAll();
    return this.createComponentResult('Logging System', checkResults);
  }

  /**
   * Создает результат компонента из результатов проверок
   */
  private createComponentResult(name: string, checkResults: CheckResult[]): ComponentResult {
    const totalScore = checkResults.reduce((sum, r) => sum + r.score, 0);
    const maxScore = checkResults.reduce((sum, r) => sum + r.maxScore, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const passed = checkResults.filter(r => r.passed);
    const failed = checkResults.filter(r => !r.passed);

    const recommendations = failed
      .flatMap(f => f.recommendations || [])
      .filter((rec, index, arr) => arr.indexOf(rec) === index);

    return {
      component: {
        name,
        description: `Анализ компонента ${name}`,
        weight: 8,
        checks: checkResults.map(r => r.check),
      },
      score: totalScore,
      maxScore,
      percentage,
      passed,
      failed,
      warnings: [],
      recommendations,
      duration: 0,
    };
  }

  /**
   * Сохраняет результаты анализа в JSON файл
   */
  async saveResults(result: SimpleAnalysisResult, outputPath: string): Promise<void> {
    const fs = await import('fs/promises');

    const jsonResult = {
      ...result,
      analyzedAt: result.analyzedAt.toISOString(),
    };

    await fs.writeFile(outputPath, JSON.stringify(jsonResult, null, 2), 'utf-8');
    // Результаты сохранены в файл
  }
}

// Экспорт для использования как библиотека
export * from './types/index.js';
export { DockerChecker, EMTChecker };
