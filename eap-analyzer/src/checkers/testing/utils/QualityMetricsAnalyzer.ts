/**
 * QualityMetricsAnalyzer - анализатор качества и метрик тестирования
 * Предоставляет комплексный анализ качества тестового кода
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Project } from '../../../types/Project';
import { CheckResult } from '../../../types/CheckResult';
import { SeverityLevel } from '../../../types/SeverityLevel';
import { TestFileFinder, ExtendedTestFileInfo, TestFileStats } from './TestFileFinder';
import { ResultBuilder } from './ResultBuilder';
import { TESTING_THRESHOLDS } from '../constants';
import { FrameworkInfo } from '../types/TestingTypes';

/**
 * Метрики качества тестов
 */
export interface TestQualityMetrics {
  /** Оценка покрытия (0-1) */
  coverageScore: number;
  /** Оценка структуры (0-1) */
  structureScore: number;
  /** Оценка производительности (0-1) */
  performanceScore: number;
  /** Оценка поддерживаемости (0-1) */
  maintainabilityScore: number;
  /** Общая оценка качества (0-1) */
  overallScore: number;
  /** Детализированные метрики */
  details: QualityMetricsDetails;
}

/**
 * Детализированные метрики качества
 */
export interface QualityMetricsDetails {
  /** Покрытие кода */
  coverage: {
    linesCovered: number;
    totalLines: number;
    percentage: number;
    branchCoverage?: number;
    functionCoverage?: number;
  };
  /** Структура тестов */
  structure: {
    totalTestFiles: number;
    totalTests: number;
    averageTestsPerFile: number;
    testDepth: number;
    organizationScore: number;
  };
  /** Производительность тестов */
  performance: {
    averageExecutionTime: number;
    slowTestsCount: number;
    parallelizationLevel: number;
    optimizationScore: number;
  };
  /** Поддерживаемость */
  maintainability: {
    duplicatedTestCode: number;
    testComplexity: number;
    documentationLevel: number;
    refactoringNeeded: number;
  };
  /** Статистика по фреймворкам */
  frameworks: Record<string, FrameworkMetrics>;
}

/**
 * Метрики для конкретного фреймворка
 */
export interface FrameworkMetrics {
  name: string;
  testCount: number;
  fileCount: number;
  configurationScore: number;
  utilizationScore: number;
  bestPracticesScore: number;
}

/**
 * Результат анализа тестового файла
 */
export interface TestFileAnalysis {
  path: string;
  framework: string;
  qualityScore: number;
  issues: TestIssue[];
  metrics: {
    testCount: number;
    complexity: number;
    duplication: number;
    coverage: number;
  };
}

/**
 * Проблема в тестовом файле
 */
export interface TestIssue {
  type: 'complexity' | 'duplication' | 'performance' | 'structure' | 'documentation';
  severity: SeverityLevel;
  message: string;
  line?: number;
  suggestion: string;
}

/**
 * Класс для анализа качества и метрик тестирования
 */
export class QualityMetricsAnalyzer {
  private testFileFinder: TestFileFinder;

  constructor() {
    this.testFileFinder = new TestFileFinder();
  }

  /**
   * Выполняет комплексный анализ качества тестов
   * @param project Проект для анализа
   * @param frameworks Информация о тестовых фреймворках
   * @returns Метрики качества тестов
   */
  async analyzeTestQuality(
    project: Project,
    frameworks: FrameworkInfo[] = []
  ): Promise<TestQualityMetrics> {
    const testFiles = await this.testFileFinder.findExtendedTestFiles(project, frameworks);
    const testStats = await this.testFileFinder.getTestFileStats(project, frameworks);

    // Анализируем каждый компонент качества
    const coverageScore = await this.analyzeCoverage(project, testFiles);
    const structureScore = await this.analyzeStructure(project, testStats);
    const performanceScore = await this.analyzePerformance(project, testFiles);
    const maintainabilityScore = await this.analyzeMaintainability(project, testFiles);

    // Вычисляем общую оценку
    const overallScore = this.calculateOverallScore({
      coverage: coverageScore,
      structure: structureScore,
      performance: performanceScore,
      maintainability: maintainabilityScore,
    });

    // Собираем детализированные метрики
    const details = await this.collectDetailedMetrics(project, testFiles, testStats, frameworks);

    return {
      coverageScore,
      structureScore,
      performanceScore,
      maintainabilityScore,
      overallScore,
      details,
    };
  }

  /**
   * Создает CheckResult с общей оценкой качества тестов
   * @param project Проект для анализа
   * @param frameworks Информация о тестовых фреймворках
   * @returns CheckResult с результатом анализа качества
   */
  async createQualityReport(
    project: Project,
    frameworks: FrameworkInfo[] = []
  ): Promise<CheckResult> {
    const metrics = await this.analyzeTestQuality(project, frameworks);

    const passed = metrics.overallScore >= 0.7; // Пороговое значение качества
    const scorePercentage = Math.round(metrics.overallScore * 100);

    return ResultBuilder.threshold(
      'test-quality-overall',
      'Общее качество тестов',
      metrics.overallScore,
      0.7 // Пороговое значение качества
    )
      .message(`Общая оценка качества тестов: ${scorePercentage}%`)
      .details({
        qualityMetrics: metrics,
        breakdown: {
          coverage: `${Math.round(metrics.coverageScore * 100)}%`,
          structure: `${Math.round(metrics.structureScore * 100)}%`,
          performance: `${Math.round(metrics.performanceScore * 100)}%`,
          maintainability: `${Math.round(metrics.maintainabilityScore * 100)}%`,
        },
      })
      .recommendations(this.generateQualityRecommendations(metrics))
      .build();
  }

  /**
   * Анализирует отдельный тестовый файл
   * @param filePath Путь к тестовому файлу
   * @param framework Используемый фреймворк
   * @returns Результат анализа файла
   */
  async analyzeTestFile(filePath: string, framework: string): Promise<TestFileAnalysis> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const issues = await this.findTestFileIssues(content, framework);

      return {
        path: filePath,
        framework,
        qualityScore: this.calculateFileQualityScore(content, issues),
        issues,
        metrics: {
          testCount: this.countTests(content),
          complexity: this.calculateComplexity(content),
          duplication: this.calculateDuplication(content),
          coverage: 0, // Требует интеграции с инструментами покрытия
        },
      };
    } catch (error) {
      return {
        path: filePath,
        framework,
        qualityScore: 0,
        issues: [
          {
            type: 'structure',
            severity: SeverityLevel.HIGH,
            message: `Ошибка анализа файла: ${error}`,
            suggestion: 'Проверьте доступность и синтаксис файла',
          },
        ],
        metrics: {
          testCount: 0,
          complexity: 0,
          duplication: 0,
          coverage: 0,
        },
      };
    }
  }

  /**
   * Анализирует покрытие кода тестами
   * @param project Проект
   * @param testFiles Тестовые файлы
   * @returns Оценка покрытия (0-1)
   */
  private async analyzeCoverage(
    project: Project,
    testFiles: ExtendedTestFileInfo[]
  ): Promise<number> {
    // Базовая оценка на основе количества тестовых файлов
    let coverageScore = 0;

    // Проверяем наличие конфигурации покрытия
    const hasCoverageConfig = await this.hasCoverageConfiguration(project);
    if (hasCoverageConfig) coverageScore += 0.3;

    // Оценка на основе соотношения тестовых файлов к исходным
    const sourceFileCount = await this.countSourceFiles(project);
    const testFileRatio = sourceFileCount > 0 ? testFiles.length / sourceFileCount : 0;
    coverageScore += Math.min(0.4, testFileRatio);

    // Оценка на основе количества тестов
    const totalTests = testFiles.reduce((sum, file) => sum + file.testCount, 0);
    const testDensity = Math.min(1, totalTests / TESTING_THRESHOLDS.MIN_UNIT_TESTS);
    coverageScore += testDensity * 0.3;

    return Math.min(1, coverageScore);
  }

  /**
   * Анализирует структуру тестов
   * @param project Проект
   * @param testStats Статистика тестов
   * @returns Оценка структуры (0-1)
   */
  private async analyzeStructure(project: Project, testStats: TestFileStats): Promise<number> {
    let structureScore = 0;

    // Оценка организации файлов
    const hasTestDirectories = Object.keys(testStats.byDirectory).some(
      dir => dir.includes('test') || dir.includes('__tests__')
    );
    if (hasTestDirectories) structureScore += 0.3;

    // Оценка распределения тестов
    const averageTestsPerFile = testStats.averageTestsPerFile;
    if (averageTestsPerFile >= 2 && averageTestsPerFile <= 20) {
      structureScore += 0.3;
    } else if (averageTestsPerFile > 0) {
      structureScore += 0.1;
    }

    // Оценка использования фреймворков
    const frameworkCount = Object.keys(testStats.byFramework).length;
    if (frameworkCount > 0) {
      structureScore += 0.2;
      if (frameworkCount === 1) structureScore += 0.1; // Бонус за консистентность
    }

    // Оценка общего количества тестов
    if (testStats.totalTests >= TESTING_THRESHOLDS.MIN_UNIT_TESTS) {
      structureScore += 0.1;
    }

    return Math.min(1, structureScore);
  }

  /**
   * Анализирует производительность тестов
   * @param project Проект
   * @param testFiles Тестовые файлы
   * @returns Оценка производительности (0-1)
   */
  private async analyzePerformance(
    project: Project,
    testFiles: ExtendedTestFileInfo[]
  ): Promise<number> {
    let performanceScore = 0.5; // Базовая оценка

    // Проверяем конфигурацию параллелизации
    const hasParallelConfig = await this.hasParallelTestConfiguration(project);
    if (hasParallelConfig) performanceScore += 0.2;

    // Оценка размера тестовых файлов (меньше - лучше)
    const averageFileSize =
      testFiles.length > 0
        ? testFiles.reduce((sum, file) => sum + file.size, 0) / testFiles.length
        : 0;

    if (averageFileSize < 10000) {
      // Менее 10KB
      performanceScore += 0.2;
    } else if (averageFileSize < 50000) {
      // Менее 50KB
      performanceScore += 0.1;
    }

    // Проверка оптимизаций
    const hasOptimizations = await this.hasPerformanceOptimizations(project);
    if (hasOptimizations) performanceScore += 0.1;

    return Math.min(1, performanceScore);
  }

  /**
   * Анализирует поддерживаемость тестов
   * @param project Проект
   * @param testFiles Тестовые файлы
   * @returns Оценка поддерживаемости (0-1)
   */
  private async analyzeMaintainability(
    project: Project,
    testFiles: ExtendedTestFileInfo[]
  ): Promise<number> {
    let maintainabilityScore = 0;

    // Анализируем каждый тестовый файл
    let totalComplexity = 0;
    let totalDuplication = 0;
    let filesAnalyzed = 0;

    for (const file of testFiles.slice(0, 10)) {
      // Ограничиваем для производительности
      try {
        const content = await fs.readFile(file.path, 'utf-8');
        totalComplexity += this.calculateComplexity(content);
        totalDuplication += this.calculateDuplication(content);
        filesAnalyzed++;
      } catch {
        // Игнорируем ошибки чтения файлов
      }
    }

    // Оценка сложности
    const averageComplexity = filesAnalyzed > 0 ? totalComplexity / filesAnalyzed : 0;
    if (averageComplexity <= 5) {
      maintainabilityScore += 0.3;
    } else if (averageComplexity <= 10) {
      maintainabilityScore += 0.2;
    } else {
      maintainabilityScore += 0.1;
    }

    // Оценка дублирования
    const averageDuplication = filesAnalyzed > 0 ? totalDuplication / filesAnalyzed : 0;
    if (averageDuplication <= 0.1) {
      maintainabilityScore += 0.3;
    } else if (averageDuplication <= 0.3) {
      maintainabilityScore += 0.2;
    }

    // Проверка наличия утилит и хелперов
    const hasTestUtilities = await this.hasTestUtilities(project);
    if (hasTestUtilities) maintainabilityScore += 0.2;

    // Проверка документации
    const hasTestDocumentation = await this.hasTestDocumentation(project);
    if (hasTestDocumentation) maintainabilityScore += 0.2;

    return Math.min(1, maintainabilityScore);
  }

  /**
   * Вычисляет общую оценку качества
   * @param scores Оценки по компонентам
   * @returns Общая оценка (0-1)
   */
  private calculateOverallScore(scores: {
    coverage: number;
    structure: number;
    performance: number;
    maintainability: number;
  }): number {
    // Взвешенная оценка с приоритетом на покрытии и структуре
    return (
      scores.coverage * 0.35 +
      scores.structure * 0.35 +
      scores.performance * 0.15 +
      scores.maintainability * 0.15
    );
  }

  /**
   * Собирает детализированные метрики
   * @param project Проект
   * @param testFiles Тестовые файлы
   * @param testStats Статистика тестов
   * @param frameworks Фреймворки
   * @returns Детализированные метрики
   */
  private async collectDetailedMetrics(
    project: Project,
    testFiles: ExtendedTestFileInfo[],
    testStats: TestFileStats,
    frameworks: FrameworkInfo[]
  ): Promise<QualityMetricsDetails> {
    const sourceFileCount = await this.countSourceFiles(project);

    return {
      coverage: {
        linesCovered: 0, // Требует интеграции с инструментами покрытия
        totalLines: 0,
        percentage: sourceFileCount > 0 ? (testFiles.length / sourceFileCount) * 100 : 0,
        branchCoverage: 0,
        functionCoverage: 0,
      },
      structure: {
        totalTestFiles: testStats.totalFiles,
        totalTests: testStats.totalTests,
        averageTestsPerFile: testStats.averageTestsPerFile,
        testDepth: this.calculateTestDepth(testFiles),
        organizationScore: this.calculateOrganizationScore(testStats),
      },
      performance: {
        averageExecutionTime: 0, // Требует интеграции с результатами выполнения
        slowTestsCount: 0,
        parallelizationLevel: await this.getParallelizationLevel(project),
        optimizationScore: 0.5,
      },
      maintainability: {
        duplicatedTestCode: 0,
        testComplexity: 0,
        documentationLevel: await this.getDocumentationLevel(project),
        refactoringNeeded: 0,
      },
      frameworks: await this.analyzeFrameworkMetrics(project, frameworks, testStats),
    };
  }

  /**
   * Подсчитывает количество тестов в содержимом файла
   * @param content Содержимое файла
   * @returns Количество тестов
   */
  private countTests(content: string): number {
    const testPatterns = [/\b(test|it)\s*\(/g, /\b(describe|suite)\s*\(/g];

    let count = 0;
    testPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }

  /**
   * Вычисляет сложность тестового кода
   * @param content Содержимое файла
   * @returns Оценка сложности
   */
  private calculateComplexity(content: string): number {
    // Упрощенная метрика цикломатической сложности
    const complexityPatterns = [
      /\bif\s*\(/g,
      /\belse\b/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\btry\s*\{/g,
      /\bcatch\s*\(/g,
    ];

    let complexity = 1; // Базовая сложность
    complexityPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  /**
   * Вычисляет уровень дублирования кода
   * @param content Содержимое файла
   * @returns Уровень дублирования (0-1)
   */
  private calculateDuplication(content: string): number {
    // Упрощенный анализ дублирования на основе повторяющихся строк
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 5);
    const uniqueLines = new Set(lines);

    if (lines.length === 0) return 0;
    return 1 - uniqueLines.size / lines.length;
  }

  // Вспомогательные методы для анализа конфигурации

  private async hasCoverageConfiguration(project: Project): Promise<boolean> {
    const configFiles = [
      'jest.config.js',
      'jest.config.ts',
      'vitest.config.ts',
      'vitest.config.js',
      '.nycrc',
      '.nycrc.json',
    ];

    for (const configFile of configFiles) {
      try {
        await fs.access(path.join(project.path, configFile));
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  private async hasParallelTestConfiguration(project: Project): Promise<boolean> {
    // Проверяем конфигурацию параллельного выполнения тестов
    try {
      const packageJson = await fs.readFile(path.join(project.path, 'package.json'), 'utf-8');
      const pkg = JSON.parse(packageJson);

      return !!(pkg.jest?.maxWorkers || pkg.vitest?.threads || pkg.scripts?.['test:parallel']);
    } catch {
      return false;
    }
  }

  private async hasPerformanceOptimizations(project: Project): Promise<boolean> {
    // Проверяем наличие оптимизаций производительности
    const optimizationIndicators = [
      'test-results-processor',
      'setupFilesAfterEnv',
      'testEnvironment',
      'clearMocks',
    ];

    try {
      const packageJson = await fs.readFile(path.join(project.path, 'package.json'), 'utf-8');
      const content = packageJson.toLowerCase();

      return optimizationIndicators.some(indicator => content.includes(indicator));
    } catch {
      return false;
    }
  }

  private async hasTestUtilities(project: Project): Promise<boolean> {
    const utilityPaths = [
      'src/test-utils',
      'src/testing',
      'tests/utils',
      'test/utils',
      '__tests__/utils',
    ];

    for (const utilPath of utilityPaths) {
      try {
        const fullPath = path.join(project.path, utilPath);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  private async hasTestDocumentation(project: Project): Promise<boolean> {
    const docFiles = ['TESTING.md', 'TEST.md', 'docs/testing.md', 'docs/test.md'];

    for (const docFile of docFiles) {
      try {
        await fs.access(path.join(project.path, docFile));
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  private async countSourceFiles(project: Project): Promise<number> {
    try {
      const srcPath = path.join(project.path, 'src');
      const files = await this.countFilesRecursively(srcPath, ['.ts', '.js', '.tsx', '.jsx']);
      return files;
    } catch {
      return 0;
    }
  }

  private async countFilesRecursively(dirPath: string, extensions: string[]): Promise<number> {
    let count = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          count += await this.countFilesRecursively(fullPath, extensions);
        } else if (entry.isFile()) {
          const hasValidExtension = extensions.some(ext => entry.name.endsWith(ext));
          const isNotTestFile = !entry.name.includes('.test.') && !entry.name.includes('.spec.');

          if (hasValidExtension && isNotTestFile) {
            count++;
          }
        }
      }
    } catch {
      // Игнорируем ошибки доступа
    }

    return count;
  }

  private calculateTestDepth(testFiles: ExtendedTestFileInfo[]): number {
    // Вычисляем среднюю глубину вложенности тестов
    return Math.max(1, Math.ceil(testFiles.length / 10));
  }

  private calculateOrganizationScore(testStats: TestFileStats): number {
    const dirCount = Object.keys(testStats.byDirectory).length;
    const frameworkCount = Object.keys(testStats.byFramework).length;

    let score = 0;
    if (dirCount > 1) score += 0.5; // Тесты организованы по директориям
    if (frameworkCount === 1) score += 0.3; // Консистентное использование фреймворка
    if (testStats.averageTestsPerFile >= 2 && testStats.averageTestsPerFile <= 15) score += 0.2;

    return Math.min(1, score);
  }

  private async getParallelizationLevel(project: Project): Promise<number> {
    // Возвращает уровень параллелизации тестов (0-1)
    const hasParallel = await this.hasParallelTestConfiguration(project);
    return hasParallel ? 0.8 : 0.2;
  }

  private async getDocumentationLevel(project: Project): Promise<number> {
    // Возвращает уровень документированности тестов (0-1)
    const hasDoc = await this.hasTestDocumentation(project);
    return hasDoc ? 0.8 : 0.3;
  }

  private async analyzeFrameworkMetrics(
    project: Project,
    frameworks: FrameworkInfo[],
    testStats: TestFileStats
  ): Promise<Record<string, FrameworkMetrics>> {
    const metrics: Record<string, FrameworkMetrics> = {};

    for (const [frameworkName, fileCount] of Object.entries(testStats.byFramework)) {
      const framework = frameworks.find(f => f.name === frameworkName);

      metrics[frameworkName] = {
        name: frameworkName,
        testCount: fileCount,
        fileCount,
        configurationScore: framework?.configPath ? 1 : 0,
        utilizationScore: fileCount > 0 ? Math.min(1, fileCount / 5) : 0,
        bestPracticesScore: await this.analyzeFrameworkBestPractices(project, frameworkName),
      };
    }

    return metrics;
  }

  private async analyzeFrameworkBestPractices(
    project: Project,
    frameworkName: string
  ): Promise<number> {
    // Анализирует соблюдение лучших практик для конкретного фреймворка
    let score = 0.5; // Базовая оценка

    try {
      const packageJson = await fs.readFile(path.join(project.path, 'package.json'), 'utf-8');
      const pkg = JSON.parse(packageJson);

      // Проверяем наличие подходящих зависимостей
      const devDeps = pkg.devDependencies || {};

      if (frameworkName === 'jest') {
        if (devDeps['@types/jest']) score += 0.2;
        if (devDeps['jest-environment-jsdom'] || devDeps['jest-environment-node']) score += 0.2;
        if (pkg.jest) score += 0.1;
      } else if (frameworkName === 'vitest') {
        if (devDeps['@vitest/ui']) score += 0.2;
        if (devDeps['jsdom'] || devDeps['happy-dom']) score += 0.2;
        if (await this.hasVitestConfig(project)) score += 0.1;
      }
    } catch {
      // Игнорируем ошибки чтения package.json
    }

    return Math.min(1, score);
  }

  private async hasVitestConfig(project: Project): Promise<boolean> {
    const configFiles = ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts'];

    for (const configFile of configFiles) {
      try {
        await fs.access(path.join(project.path, configFile));
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  private calculateFileQualityScore(content: string, issues: TestIssue[]): number {
    let score = 1.0;

    // Снижаем оценку за каждую проблему
    issues.forEach(issue => {
      switch (issue.severity) {
        case SeverityLevel.CRITICAL:
          score -= 0.3;
          break;
        case SeverityLevel.HIGH:
          score -= 0.2;
          break;
        case SeverityLevel.MEDIUM:
          score -= 0.1;
          break;
        case SeverityLevel.LOW:
          score -= 0.05;
          break;
      }
    });

    return Math.max(0, score);
  }

  private async findTestFileIssues(content: string, framework: string): Promise<TestIssue[]> {
    const issues: TestIssue[] = [];

    // Проверяем сложность
    const complexity = this.calculateComplexity(content);
    if (complexity > 15) {
      issues.push({
        type: 'complexity',
        severity: SeverityLevel.MEDIUM,
        message: `Высокая сложность файла (${complexity})`,
        suggestion: 'Разделите тестовый файл на более мелкие или упростите логику',
      });
    }

    // Проверяем дублирование
    const duplication = this.calculateDuplication(content);
    if (duplication > 0.3) {
      issues.push({
        type: 'duplication',
        severity: SeverityLevel.MEDIUM,
        message: `Высокий уровень дублирования (${Math.round(duplication * 100)}%)`,
        suggestion: 'Выделите общую логику в утилиты или хелперы',
      });
    }

    // Проверяем размер файла
    if (content.length > 50000) {
      issues.push({
        type: 'structure',
        severity: SeverityLevel.LOW,
        message: 'Большой размер тестового файла',
        suggestion: 'Рассмотрите разделение на несколько файлов',
      });
    }

    // Проверяем наличие описаний тестов
    const hasDescriptions = /describe\s*\(\s*["'`]/.test(content);
    if (!hasDescriptions) {
      issues.push({
        type: 'documentation',
        severity: SeverityLevel.LOW,
        message: 'Отсутствуют описания тестовых групп',
        suggestion: 'Добавьте describe блоки для группировки тестов',
      });
    }

    return issues;
  }

  private generateQualityRecommendations(metrics: TestQualityMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.coverageScore < 0.7) {
      recommendations.push('Увеличьте покрытие кода тестами - добавьте больше тестовых файлов');
    }

    if (metrics.structureScore < 0.7) {
      recommendations.push('Улучшите структуру тестов - организуйте файлы по модулям');
    }

    if (metrics.performanceScore < 0.7) {
      recommendations.push(
        'Оптимизируйте производительность тестов - настройте параллельное выполнение'
      );
    }

    if (metrics.maintainabilityScore < 0.7) {
      recommendations.push('Повысьте поддерживаемость - уменьшите дублирование и сложность');
    }

    if (metrics.overallScore < 0.8) {
      recommendations.push('Рассмотрите внедрение практик Test-Driven Development (TDD)');
    }

    return recommendations;
  }
}
