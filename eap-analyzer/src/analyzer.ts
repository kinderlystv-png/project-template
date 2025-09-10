/**
 * Эталонный Анализатор Проектов (ЭАП)
 * Главный класс для анализа проектов по золотому стандарту
 * Включает улучшенную обработку ошибок, поддержку кодировок и адаптивные пороги
 */

import * as path from 'path';
import { CICDChecker } from './checkers/ci-cd.js';
import { CodeQualityChecker } from './checkers/code-quality.js';
import { DependenciesChecker } from './checkers/dependencies.js';
import { DockerChecker } from './checkers/docker.js';
import { EMTChecker } from './checkers/emt.js';
import { LoggingChecker } from './checkers/logging.js';
import { SvelteKitChecker } from './checkers/sveltekit.js';
import { TestingChecker } from './checkers/unified-testing.js';
import { SecurityChecker } from './checkers/security/SecurityChecker.js';
import { VitestChecker } from './checkers/vitest.js';
import { CheckContext, CheckResult, ComponentResult } from './types/index.js';
import {
  setupGlobalErrorHandlers,
  handleAnalysisError,
  safeExecute,
  ErrorType,
} from './utils/error-handler.js';
import { readFileWithEncoding } from './utils/file-utils.js';
import {
  getProjectThresholds,
  loadPreviousReport,
  saveThresholds,
  loadSavedThresholds,
  ProjectThresholds,
} from './utils/adaptive-thresholds.js';

// Импорт новых улучшенных модулей
import { ImprovedDuplicationDetector } from './modules/structure-analyzer/duplication-detector.js';
import {
  SmartFileClassifier,
  FileCategory,
  Framework,
} from './modules/structure-analyzer/file-classifier.js';
import { ImprovedComplexityCalculator } from './modules/structure-analyzer/complexity-calculator.js';

// Импорт модулей валидации
import { BugFixValidator } from './validation/bug-fix-validator.js';
import { MetricsValidator } from './validation/metrics-validator.js';
import { ValidationReporter } from './validation/validation-reporter.js';

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
  thresholds?: ProjectThresholds;
  projectType?: string;
  fileCount?: number;
}

export class GoldenStandardAnalyzer {
  private verbose = true;
  private projectThresholds: ProjectThresholds | null = null;

  // Новые улучшенные модули
  private duplicationDetector: ImprovedDuplicationDetector;
  private fileClassifier: SmartFileClassifier;
  private complexityCalculator: ImprovedComplexityCalculator;

  // Модули валидации
  private bugFixValidator: BugFixValidator;
  private metricsValidator: MetricsValidator;
  private validationReporter: ValidationReporter;

  constructor() {
    // Настраиваем глобальные обработчики ошибок
    setupGlobalErrorHandlers();

    // Инициализируем новые модули
    this.duplicationDetector = new ImprovedDuplicationDetector();
    this.fileClassifier = new SmartFileClassifier();
    this.complexityCalculator = new ImprovedComplexityCalculator();

    // Инициализируем модули валидации
    this.bugFixValidator = new BugFixValidator();
    this.metricsValidator = new MetricsValidator();
    this.validationReporter = new ValidationReporter();
  }
  private log(message: string): void {
    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }

  /**
   * Инициализирует адаптивные пороги для проекта
   */
  private async initializeThresholds(projectPath: string): Promise<void> {
    const operation = async () => {
      // Пытаемся загрузить сохраненные пороги
      this.projectThresholds = loadSavedThresholds(projectPath);

      if (!this.projectThresholds) {
        // Загружаем предыдущий отчет для адаптации
        const previousReport = loadPreviousReport(projectPath);

        // Подсчитываем количество файлов для определения размера проекта
        const fileCount = await this.countProjectFiles(projectPath);

        // Получаем оптимальные пороги
        this.projectThresholds = getProjectThresholds(projectPath, previousReport, fileCount);

        // Сохраняем пороги для будущего использования
        saveThresholds(this.projectThresholds, projectPath);
      }
    };

    await safeExecute(operation, ErrorType.CONFIG_ERROR, {
      operation: 'threshold-initialization',
      path: projectPath,
    });
  }

  /**
   * Выполняет структурный анализ проекта с использованием улучшенных модулей
   */
  async performStructuralAnalysis(projectPath: string): Promise<{
    duplication: any;
    complexity: any;
    fileClassification: any;
  }> {
    this.log('🔬 Выполняем структурный анализ с улучшенными модулями...');

    // Получаем список файлов для анализа
    const files = await this.getProjectFiles(projectPath);
    this.log(`📂 Найдено ${files.length} файлов для анализа`);

    // Классификация файлов
    this.log('📁 Классифицируем файлы...');
    const classification = await this.fileClassifier.classifyFiles(files.map(f => f.path));

    // Фильтруем только исходные файлы для анализа дупликации
    const sourceFiles = files.filter(file => {
      const fileClassification = classification.get(file.path);
      return (
        fileClassification?.category === FileCategory.SOURCE ||
        fileClassification?.category === FileCategory.TEST
      );
    });

    this.log(`📋 Отфильтровано ${sourceFiles.length} исходных файлов`);

    // Подготовка данных для анализа дупликации
    const filesWithContent = await Promise.all(
      sourceFiles.slice(0, 20).map(async file => {
        // Ограничиваем для демо
        try {
          const content = await readFileWithEncoding(file.path);
          const lines = content.split('\n').length;
          return { path: file.path, content, lines };
        } catch (error) {
          this.log(`⚠️ Ошибка чтения файла ${file.path}: ${error}`);
          return null;
        }
      })
    );

    const validFiles = filesWithContent.filter(f => f !== null) as Array<{
      path: string;
      content: string;
      lines: number;
    }>;

    // Анализ дупликации
    this.log('🔄 Анализируем дупликацию...');
    const duplication = await this.duplicationDetector.calculateDuplication(validFiles);

    // Анализ сложности для каждого исходного файла
    this.log('📊 Анализируем сложность...');
    const complexityResults = [];

    for (const file of validFiles.slice(0, 10)) {
      // Ограничиваем для демо
      try {
        const fileClassification = classification.get(file.path);
        const category = fileClassification?.category || FileCategory.SOURCE;
        const framework = fileClassification?.framework;

        const complexity = await this.complexityCalculator.calculateComplexity(
          file.path,
          file.content,
          category,
          framework
        );

        complexityResults.push({
          file: file.path,
          ...complexity,
        });
      } catch (error) {
        this.log(`⚠️ Ошибка анализа сложности для ${file.path}: ${error}`);
      }
    }

    return {
      duplication: {
        ...duplication,
        analyzedFiles: validFiles.length,
      },
      complexity: {
        files: complexityResults,
        summary: this.summarizeComplexity(complexityResults),
      },
      fileClassification: {
        total: files.length,
        classified: classification.size,
        categories: this.summarizeClassification(classification),
      },
    };
  }

  /**
   * Получает список файлов проекта
   */
  private async getProjectFiles(
    projectPath: string
  ): Promise<Array<{ path: string; name: string }>> {
    const fs = await import('fs');
    const glob = await import('glob');

    const pattern = path.join(projectPath, '**/*.{js,ts,jsx,tsx,vue,svelte,css,scss,json}');
    const filePaths = await glob.glob(pattern, {
      ignore: ['**/node_modules/**', '**/.git/**'],
    });

    return filePaths.map(filePath => ({
      path: filePath,
      name: path.basename(filePath),
    }));
  }

  /**
   * Создает сводку по классификации файлов
   */
  private summarizeClassification(classification: Map<string, any>): any {
    const categories = new Map<string, number>();
    const frameworks = new Map<string, number>();

    for (const [, result] of classification) {
      const category = result.category || 'unknown';
      categories.set(category, (categories.get(category) || 0) + 1);

      if (result.framework) {
        frameworks.set(result.framework, (frameworks.get(result.framework) || 0) + 1);
      }
    }

    return {
      byCategory: Object.fromEntries(categories),
      byFramework: Object.fromEntries(frameworks),
    };
  }

  /**
   * Выполняет полную валидацию результатов структурного анализа
   */
  async validateAnalysisResults(
    analysisResults: any,
    projectPath: string,
    options: {
      generateReport?: boolean;
      reportFormat?: 'console' | 'json' | 'html' | 'markdown';
      outputPath?: string;
    } = {}
  ): Promise<{
    isValid: boolean;
    confidence: number;
    criticalIssues: number;
    reportPath?: string;
  }> {
    this.log('🔍 Запуск валидации результатов анализа...');

    // Валидация исправлений багов
    const bugFixReport = await this.bugFixValidator.validateAnalysisResults(
      analysisResults,
      projectPath
    );

    // Валидация метрик
    const metricsReport = await this.metricsValidator.validateMetrics(analysisResults, projectPath);

    // Создание объединенного отчета
    const combinedReport = await this.validationReporter.generateCombinedReport(
      bugFixReport,
      metricsReport
    );

    // Вывод в консоль
    await this.validationReporter.printConsoleReport(combinedReport, {
      includeDetails: true,
      includeRecommendations: true,
      includeTimestamp: false,
    });

    let reportPath: string | undefined;

    // Генерация файлового отчета
    if (options.generateReport) {
      try {
        reportPath = await this.validationReporter.saveReport(combinedReport, {
          format: options.reportFormat || 'markdown',
          outputPath: options.outputPath || './reports',
          includeDetails: true,
          includeRecommendations: true,
          includeTimestamp: true,
        });
      } catch (error) {
        this.log(`⚠️ Ошибка при сохранении отчета: ${error}`);
      }
    }

    return {
      isValid: combinedReport.overall.isValid,
      confidence: combinedReport.overall.confidence,
      criticalIssues: combinedReport.overall.criticalIssuesCount,
      reportPath,
    };
  }

  /**
   * Создает сводку по сложности
   */
  private summarizeComplexity(results: any[]): any {
    const validResults = results.filter(r => r.shouldAnalyze && r.metrics.cyclomatic > 0);

    if (validResults.length === 0) {
      return { avgCyclomatic: 0, avgCognitive: 0, totalFiles: 0 };
    }

    const totalCyclomatic = validResults.reduce((sum, r) => sum + r.metrics.cyclomatic, 0);
    const totalCognitive = validResults.reduce((sum, r) => sum + r.metrics.cognitive, 0);

    return {
      avgCyclomatic: Math.round((totalCyclomatic / validResults.length) * 10) / 10,
      avgCognitive: Math.round((totalCognitive / validResults.length) * 10) / 10,
      totalFiles: validResults.length,
      maxCyclomatic: Math.max(...validResults.map(r => r.metrics.cyclomatic)),
      maxCognitive: Math.max(...validResults.map(r => r.metrics.cognitive)),
    };
  } /**
   * Подсчитывает количество файлов в проекте
   */
  private async countProjectFiles(projectPath: string): Promise<number> {
    const operation = async () => {
      const fs = await import('fs');
      const glob = await import('glob');

      const pattern = path.join(projectPath, '**/*.{js,ts,jsx,tsx,vue,svelte}');
      const files = await glob.glob(pattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      });

      return files.length;
    };

    const result = await safeExecute(operation, ErrorType.FILE_ERROR, {
      operation: 'file-counting',
      path: projectPath,
    });

    return result || 0;
  }
  /**
   * Выполняет полный анализ проекта
   */
  async analyzeProject(projectPath: string): Promise<SimpleAnalysisResult> {
    const startTime = Date.now();

    this.log('🔍 Начинаем анализ проекта по Золотому Стандарту...');
    this.log(`📂 Путь: ${projectPath}`);
    this.log('');

    // Инициализируем адаптивные пороги
    await this.initializeThresholds(projectPath);

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
        thresholds: this.projectThresholds || undefined,
      },
    };

    const componentResults: ComponentResult[] = [];
    const availableCheckers = this.getAvailableCheckers();

    // Выполняем проверки для каждого компонента
    for (const checker of availableCheckers) {
      const result = await safeExecute(
        async () => {
          this.log(`📋 Анализируем: ${checker.name}`);
          const checkResult = await checker.checkComponent(context);

          // Показываем промежуточный результат
          this.log(
            `   Результат: ${checkResult.percentage}% - ${checkResult.passed.length}/${checkResult.passed.length + checkResult.failed.length} проверок`
          );

          return checkResult;
        },
        ErrorType.ANALYSIS_ERROR,
        {
          operation: 'component-check',
          context: { checkerName: checker.name },
        }
      );

      if (result) {
        componentResults.push(result);
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
      thresholds: this.projectThresholds || undefined,
      projectType: this.projectThresholds ? context.projectInfo.name : undefined,
      fileCount: await this.countProjectFiles(projectPath),
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
        name: 'Unified Testing Analysis',
        checkComponent: TestingChecker.checkComponent.bind(TestingChecker),
      },
      {
        name: 'Security Analysis',
        checkComponent: SecurityChecker.checkComponent.bind(SecurityChecker),
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
