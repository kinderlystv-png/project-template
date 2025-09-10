/**
 * PlaywrightChecker - анализатор Playwright E2E тестирования
 * Проверяет конфигурацию, тесты и настройки Playwright
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseChecker } from '../../../core/base/BaseChecker';
import { CheckResult } from '../../../types/CheckResult';
import { Project } from '../../../types/Project';
import { SeverityLevel } from '../../../types/SeverityLevel';
import { AnalysisCategory } from '../../../types/AnalysisCategory';
import { ResultBuilder } from '../utils/ResultBuilder';
import { TestFileFinder } from '../utils/TestFileFinder';
import { TESTING_THRESHOLDS } from '../constants';

/**
 * Конфигурация Playwright
 */
export interface PlaywrightConfig {
  /** Директория с тестами */
  testDir?: string;
  /** Паттерн тестовых файлов */
  testMatch?: string | string[];
  /** Базовый URL */
  baseURL?: string;
  /** Настройки браузеров */
  use?: {
    baseURL?: string;
    headless?: boolean;
    viewport?: { width: number; height: number };
    screenshot?: 'off' | 'only-on-failure' | 'on';
    video?: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';
    trace?: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';
  };
  /** Проекты (браузеры) */
  projects?: Array<{
    name: string;
    use?: Record<string, any>;
  }>;
  /** Настройки запуска */
  workers?: number;
  /** Повторы при ошибке */
  retries?: number;
  /** Тайм-ауты */
  timeout?: number;
  /** Выходные форматы */
  reporter?: string | string[] | Array<[string, any]>;
  /** Директория для результатов */
  outputDir?: string;
}

/**
 * Информация о E2E тестовом файле
 */
export interface E2ETestFileInfo {
  /** Путь к файлу */
  path: string;
  /** Тип теста */
  type: 'e2e' | 'integration' | 'api';
  /** Количество тестов */
  testCount: number;
  /** Используемые селекторы */
  selectors: string[];
  /** Используемые страницы */
  pages: string[];
  /** Проблемы в тесте */
  issues: E2ETestIssue[];
  /** Сложность теста */
  complexity: number;
}

/**
 * Проблема в E2E тесте
 */
export interface E2ETestIssue {
  type: 'selector' | 'async' | 'hardcoded' | 'performance' | 'reliability';
  severity: SeverityLevel;
  message: string;
  line?: number;
  suggestion: string;
}

/**
 * Результат анализа Playwright
 */
export interface PlaywrightAnalysisResult {
  /** Найдена ли конфигурация */
  hasConfig: boolean;
  /** Путь к конфигурации */
  configPath?: string;
  /** Конфигурация Playwright */
  config?: PlaywrightConfig;
  /** E2E тестовые файлы */
  testFiles: E2ETestFileInfo[];
  /** Проблемы настройки */
  issues: PlaywrightIssue[];
  /** Рекомендации */
  recommendations: string[];
}

/**
 * Проблема настройки Playwright
 */
export interface PlaywrightIssue {
  type: 'configuration' | 'browsers' | 'performance' | 'reliability' | 'missing';
  severity: SeverityLevel;
  message: string;
  suggestion: string;
  configKey?: string;
}

/**
 * Анализатор Playwright E2E тестов
 */
export class PlaywrightChecker extends BaseChecker {
  private testFileFinder: TestFileFinder;

  constructor() {
    super(
      'playwright-checker',
      AnalysisCategory.TESTING,
      'Анализирует конфигурацию и E2E тесты Playwright',
      'Playwright E2E Testing',
      SeverityLevel.MEDIUM
    );
    this.testFileFinder = new TestFileFinder();
  }

  /**
   * Выполняет проверку Playwright настроек и тестов
   * @param project Проект для анализа
   * @returns Массив результатов проверки
   */
  async check(project: Project): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    try {
      // Анализируем Playwright
      const analysis = await this.analyzePlaywright(project);

      // Базовая проверка наличия Playwright
      results.push(await this.checkPlaywrightPresence(project, analysis));

      // Если Playwright настроен, выполняем детальные проверки
      if (analysis.hasConfig) {
        results.push(await this.checkPlaywrightConfiguration(analysis));
        results.push(await this.checkBrowserSettings(analysis));
        results.push(await this.checkE2ETestFiles(project, analysis));
        results.push(await this.checkPlaywrightReliability(analysis));
        results.push(await this.checkPlaywrightPerformance(analysis));
        results.push(await this.checkPlaywrightBestPractices(analysis));
      }

      // Общая оценка Playwright
      results.push(await this.createPlaywrightSummary(analysis));
    } catch (error) {
      results.push(
        ResultBuilder.error('playwright-analysis-error', 'Ошибка анализа Playwright')
          .message(`Произошла ошибка при анализе Playwright: ${error}`)
          .details({ error: String(error) })
          .build()
      );
    }

    return results;
  }

  /**
   * Анализирует Playwright в проекте
   * @param project Проект
   * @returns Результат анализа Playwright
   */
  private async analyzePlaywright(project: Project): Promise<PlaywrightAnalysisResult> {
    const result: PlaywrightAnalysisResult = {
      hasConfig: false,
      testFiles: [],
      issues: [],
      recommendations: [],
    };

    // Ищем конфигурацию Playwright
    const configResult = await this.findPlaywrightConfig(project);
    result.hasConfig = configResult.found;
    result.configPath = configResult.path;
    result.config = configResult.config;

    // Ищем E2E тестовые файлы
    result.testFiles = await this.findE2ETestFiles(project, result.config);

    // Анализируем проблемы
    result.issues = await this.analyzePlaywrightIssues(project, result.config);

    // Генерируем рекомендации
    result.recommendations = this.generatePlaywrightRecommendations(result);

    return result;
  }

  /**
   * Ищет конфигурацию Playwright
   * @param project Проект
   * @returns Результат поиска конфигурации
   */
  private async findPlaywrightConfig(project: Project): Promise<{
    found: boolean;
    path?: string;
    config?: PlaywrightConfig;
  }> {
    const configFiles = [
      'playwright.config.ts',
      'playwright.config.js',
      'playwright.config.mjs',
      'e2e.config.ts',
      'e2e.config.js',
    ];

    for (const configFile of configFiles) {
      const configPath = path.join(project.path, configFile);

      try {
        await fs.access(configPath);
        const config = await this.parsePlaywrightConfig(configPath);

        return {
          found: true,
          path: configPath,
          config,
        };
      } catch {
        continue;
      }
    }

    return { found: false };
  }

  /**
   * Парсит конфигурацию Playwright
   * @param configPath Путь к конфигурации
   * @returns Конфигурация Playwright
   */
  private async parsePlaywrightConfig(configPath: string): Promise<PlaywrightConfig | undefined> {
    try {
      const content = await fs.readFile(configPath, 'utf-8');

      // Упрощенный парсинг конфигурации
      const config: Partial<PlaywrightConfig> = {};

      // Ищем базовые настройки
      const testDirMatch = content.match(/testDir:\s*['"`]([^'"`]+)['"`]/);
      if (testDirMatch) {
        config.testDir = testDirMatch[1];
      }

      const baseURLMatch = content.match(/baseURL:\s*['"`]([^'"`]+)['"`]/);
      if (baseURLMatch) {
        config.baseURL = baseURLMatch[1];
      }

      const workersMatch = content.match(/workers:\s*(\d+)/);
      if (workersMatch) {
        config.workers = parseInt(workersMatch[1]);
      }

      const retriesMatch = content.match(/retries:\s*(\d+)/);
      if (retriesMatch) {
        config.retries = parseInt(retriesMatch[1]);
      }

      // Проверяем наличие основных секций
      const hasUseBlock = content.includes('use:');
      const hasProjects = content.includes('projects:');
      const hasReporter = content.includes('reporter:');

      if (hasUseBlock || hasProjects || hasReporter) {
        config.use = {}; // Placeholder для определения наличия настроек
      }

      if (hasProjects) {
        config.projects = []; // Placeholder
      }

      return config;
    } catch (error) {
      console.warn(`Ошибка парсинга Playwright конфигурации ${configPath}:`, error);
      return undefined;
    }
  }

  /**
   * Находит E2E тестовые файлы
   * @param project Проект
   * @param config Конфигурация Playwright
   * @returns Массив E2E тестовых файлов
   */
  private async findE2ETestFiles(
    project: Project,
    config?: PlaywrightConfig
  ): Promise<E2ETestFileInfo[]> {
    const e2eFiles: E2ETestFileInfo[] = [];

    // Определяем директории для поиска E2E тестов
    const searchDirs = [
      config?.testDir || 'tests',
      'e2e',
      'tests/e2e',
      'test/e2e',
      '__tests__/e2e',
      'playwright',
      'tests/playwright',
    ];

    for (const searchDir of searchDirs) {
      const dirPath = path.join(project.path, searchDir);

      try {
        await fs.access(dirPath);
        const files = await this.scanForE2EFiles(dirPath);
        e2eFiles.push(...files);
      } catch {
        continue;
      }
    }

    return e2eFiles;
  }

  /**
   * Сканирует директорию для поиска E2E файлов
   * @param dirPath Путь к директории
   * @returns Массив E2E файлов
   */
  private async scanForE2EFiles(dirPath: string): Promise<E2ETestFileInfo[]> {
    const e2eFiles: E2ETestFileInfo[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const subFiles = await this.scanForE2EFiles(fullPath);
          e2eFiles.push(...subFiles);
        } else if (entry.isFile() && this.isE2ETestFile(entry.name)) {
          const fileInfo = await this.analyzeE2ETestFile(fullPath);
          if (fileInfo) {
            e2eFiles.push(fileInfo);
          }
        }
      }
    } catch {
      // Игнорируем ошибки доступа
    }

    return e2eFiles;
  }

  /**
   * Проверяет, является ли файл E2E тестом
   * @param fileName Имя файла
   * @returns true, если это E2E тест
   */
  private isE2ETestFile(fileName: string): boolean {
    const e2ePatterns = [
      /\.e2e\.(ts|js)$/,
      /\.spec\.(ts|js)$/,
      /\.test\.(ts|js)$/,
      /playwright.*\.(ts|js)$/,
      /integration.*\.(ts|js)$/,
    ];

    return e2ePatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Анализирует E2E тестовый файл
   * @param filePath Путь к файлу
   * @returns Информация о E2E тестовом файле
   */
  private async analyzeE2ETestFile(filePath: string): Promise<E2ETestFileInfo | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      return {
        path: filePath,
        type: this.determineTestType(content),
        testCount: this.countE2ETests(content),
        selectors: this.extractSelectors(content),
        pages: this.extractPages(content),
        issues: await this.findE2ETestIssues(content),
        complexity: this.calculateE2EComplexity(content),
      };
    } catch {
      return null;
    }
  }

  /**
   * Определяет тип E2E теста
   * @param content Содержимое файла
   * @returns Тип теста
   */
  private determineTestType(content: string): 'e2e' | 'integration' | 'api' {
    if (content.includes('request') || content.includes('api') || content.includes('endpoint')) {
      return 'api';
    }

    if (
      content.includes('page.goto') ||
      content.includes('browser') ||
      content.includes('playwright')
    ) {
      return 'e2e';
    }

    return 'integration';
  }

  /**
   * Подсчитывает E2E тесты в файле
   * @param content Содержимое файла
   * @returns Количество тестов
   */
  private countE2ETests(content: string): number {
    const testPatterns = [/\btest\s*\(/g, /\bit\s*\(/g, /\btest\.step\s*\(/g];

    let count = 0;
    testPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }

  /**
   * Извлекает селекторы из E2E теста
   * @param content Содержимое файла
   * @returns Массив селекторов
   */
  private extractSelectors(content: string): string[] {
    const selectors: string[] = [];

    // Ищем различные типы селекторов
    const selectorPatterns = [
      /getByRole\(['"`]([^'"`]+)['"`]/g,
      /getByText\(['"`]([^'"`]+)['"`]/g,
      /getByLabel\(['"`]([^'"`]+)['"`]/g,
      /getByTestId\(['"`]([^'"`]+)['"`]/g,
      /locator\(['"`]([^'"`]+)['"`]/g,
      /click\(['"`]([^'"`]+)['"`]/g,
      /fill\(['"`]([^'"`]+)['"`]/g,
    ];

    selectorPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        selectors.push(match[1]);
      }
    });

    return [...new Set(selectors)]; // Удаляем дубликаты
  }

  /**
   * Извлекает используемые страницы
   * @param content Содержимое файла
   * @returns Массив страниц
   */
  private extractPages(content: string): string[] {
    const pages: string[] = [];

    const pagePatterns = [
      /page\.goto\(['"`]([^'"`]+)['"`]/g,
      /navigate\(['"`]([^'"`]+)['"`]/g,
      /visit\(['"`]([^'"`]+)['"`]/g,
    ];

    pagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        pages.push(match[1]);
      }
    });

    return [...new Set(pages)];
  }

  /**
   * Вычисляет сложность E2E теста
   * @param content Содержимое файла
   * @returns Уровень сложности
   */
  private calculateE2EComplexity(content: string): number {
    let complexity = 1;

    // Увеличиваем сложность за различные действия
    const complexityFactors = [
      { pattern: /page\.goto/g, weight: 1 },
      { pattern: /page\.click/g, weight: 1 },
      { pattern: /page\.fill/g, weight: 1 },
      { pattern: /page\.waitFor/g, weight: 2 },
      { pattern: /expect\(/g, weight: 1 },
      { pattern: /if\s*\(/g, weight: 2 },
      { pattern: /for\s*\(/g, weight: 3 },
      { pattern: /while\s*\(/g, weight: 3 },
      { pattern: /try\s*\{/g, weight: 2 },
    ];

    complexityFactors.forEach(factor => {
      const matches = content.match(factor.pattern);
      if (matches) {
        complexity += matches.length * factor.weight;
      }
    });

    return complexity;
  }

  /**
   * Находит проблемы в E2E тестовом файле
   * @param content Содержимое файла
   * @returns Массив проблем
   */
  private async findE2ETestIssues(content: string): Promise<E2ETestIssue[]> {
    const issues: E2ETestIssue[] = [];

    // Проверяем хардкод значений
    const hardcodedValues = content.match(/(localhost|127\.0\.0\.1|192\.168\.|10\.0\.)/g);
    if (hardcodedValues) {
      issues.push({
        type: 'hardcoded',
        severity: SeverityLevel.MEDIUM,
        message: 'Обнаружены хардкод URL в тестах',
        suggestion: 'Используйте baseURL из конфигурации',
      });
    }

    // Проверяем отсутствие ожиданий
    const hasWaits = /page\.waitFor|waitForSelector|waitForLoadState/.test(content);
    const hasClicks = /page\.click|click\(/.test(content);

    if (hasClicks && !hasWaits) {
      issues.push({
        type: 'reliability',
        severity: SeverityLevel.MEDIUM,
        message: 'Отсутствуют явные ожидания элементов',
        suggestion: 'Добавьте waitForSelector или waitForLoadState',
      });
    }

    // Проверяем длинные тесты
    const testBlocks = content.match(/test\s*\([^}]+\}/g);
    if (testBlocks) {
      const longTests = testBlocks.filter(block => block.length > 2000);
      if (longTests.length > 0) {
        issues.push({
          type: 'performance',
          severity: SeverityLevel.LOW,
          message: 'Обнаружены длинные тестовые функции',
          suggestion: 'Разбейте длинные тесты на более мелкие шаги',
        });
      }
    }

    // Проверяем использование async/await
    const hasAsync = /async\s+\(/g.test(content);
    const hasAwait = /await\s+/g.test(content);

    if (hasAsync && !hasAwait) {
      issues.push({
        type: 'async',
        severity: SeverityLevel.HIGH,
        message: 'Async функции без await вызовов',
        suggestion: 'Добавьте await для асинхронных операций',
      });
    }

    return issues;
  }

  // Методы проверок

  private async checkPlaywrightPresence(
    project: Project,
    analysis: PlaywrightAnalysisResult
  ): Promise<CheckResult> {
    const hasPlaywrightDependency = await this.hasPlaywrightInDependencies(project);
    const hasConfig = analysis.hasConfig;
    const hasTests = analysis.testFiles.length > 0;

    if (hasPlaywrightDependency && hasConfig && hasTests) {
      return ResultBuilder.success('playwright-presence', 'Наличие Playwright')
        .message('Playwright корректно установлен и настроен')
        .details({
          dependency: hasPlaywrightDependency,
          config: hasConfig,
          testFiles: hasTests,
          configPath: analysis.configPath,
        })
        .build();
    } else {
      const missing = [];
      if (!hasPlaywrightDependency) missing.push('зависимость @playwright/test');
      if (!hasConfig) missing.push('конфигурация playwright.config.ts');
      if (!hasTests) missing.push('E2E тестовые файлы');

      return ResultBuilder.warning('playwright-presence', 'Наличие Playwright')
        .message(`Playwright частично настроен. Отсутствует: ${missing.join(', ')}`)
        .details({
          dependency: hasPlaywrightDependency,
          config: hasConfig,
          testFiles: hasTests,
          missing,
        })
        .build();
    }
  }

  private async checkPlaywrightConfiguration(
    analysis: PlaywrightAnalysisResult
  ): Promise<CheckResult> {
    const config = analysis.config!;
    const configIssues = analysis.issues.filter(i => i.type === 'configuration');

    const configScore = this.calculateConfigurationScore(config, configIssues);
    const passed = configScore >= 0.7;

    return ResultBuilder.threshold(
      'playwright-configuration',
      'Конфигурация Playwright',
      configScore,
      0.7
    )
      .message(
        passed
          ? 'Конфигурация Playwright настроена корректно'
          : 'Конфигурация Playwright требует улучшений'
      )
      .details({
        configPath: analysis.configPath,
        score: Math.round(configScore * 100),
        hasTestDir: !!config.testDir,
        hasBaseURL: !!config.baseURL,
        hasWorkers: !!config.workers,
        hasRetries: !!config.retries,
        issues: configIssues.map(i => i.message),
      })
      .build();
  }

  private async checkBrowserSettings(analysis: PlaywrightAnalysisResult): Promise<CheckResult> {
    const config = analysis.config!;
    const browserIssues = analysis.issues.filter(i => i.type === 'browsers');

    const hasProjects = config.projects && config.projects.length > 0;
    const hasMultipleBrowsers = hasProjects && (config.projects?.length || 0) > 1;
    const browserScore = this.calculateBrowserScore(config);

    return ResultBuilder.threshold('playwright-browsers', 'Настройки браузеров', browserScore, 0.5)
      .message(
        hasMultipleBrowsers
          ? 'Настроено тестирование в нескольких браузерах'
          : 'Настроено тестирование в одном браузере'
      )
      .details({
        score: Math.round(browserScore * 100),
        hasProjects,
        projectCount: config.projects?.length || 0,
        hasMultipleBrowsers,
        issues: browserIssues.map(i => i.message),
      })
      .build();
  }

  private async checkE2ETestFiles(
    project: Project,
    analysis: PlaywrightAnalysisResult
  ): Promise<CheckResult> {
    const testFilesCount = analysis.testFiles.length;
    const passed = testFilesCount >= TESTING_THRESHOLDS.MIN_E2E_TESTS;

    // Анализируем качество E2E тестов
    const totalTests = analysis.testFiles.reduce((sum, file) => sum + file.testCount, 0);
    const averageComplexity =
      analysis.testFiles.length > 0
        ? analysis.testFiles.reduce((sum, file) => sum + file.complexity, 0) /
          analysis.testFiles.length
        : 0;

    return ResultBuilder.threshold(
      'playwright-test-files',
      'E2E тестовые файлы',
      testFilesCount,
      TESTING_THRESHOLDS.MIN_E2E_TESTS
    )
      .message(`Найдено ${testFilesCount} E2E тестовых файлов с ${totalTests} тестами`)
      .details({
        totalFiles: testFilesCount,
        totalTests,
        threshold: TESTING_THRESHOLDS.MIN_E2E_TESTS,
        averageComplexity: Math.round(averageComplexity * 100) / 100,
        fileTypes: this.getTestFileTypes(analysis.testFiles),
      })
      .build();
  }

  private async checkPlaywrightReliability(
    analysis: PlaywrightAnalysisResult
  ): Promise<CheckResult> {
    const config = analysis.config!;
    const reliabilityIssues = analysis.issues.filter(i => i.type === 'reliability');

    let reliabilityScore = 0.5; // Базовая оценка

    // Проверяем retry настройки
    if (config.retries && config.retries > 0) reliabilityScore += 0.2;

    // Проверяем тайм-ауты
    if (config.timeout) reliabilityScore += 0.1;

    // Проверяем настройки записи (screenshot, video, trace)
    if (config.use?.screenshot !== 'off') reliabilityScore += 0.1;
    if (config.use?.video !== 'off') reliabilityScore += 0.1;
    if (config.use?.trace !== 'off') reliabilityScore += 0.1;

    const passed = reliabilityScore >= 0.6;

    return ResultBuilder.threshold(
      'playwright-reliability',
      'Надежность Playwright тестов',
      reliabilityScore,
      0.6
    )
      .message(
        passed
          ? 'Настройки надежности Playwright корректны'
          : 'Настройки надежности требуют улучшения'
      )
      .details({
        score: Math.round(reliabilityScore * 100),
        hasRetries: !!(config.retries && config.retries > 0),
        hasTimeout: !!config.timeout,
        hasScreenshots: config.use?.screenshot !== 'off',
        hasVideo: config.use?.video !== 'off',
        hasTrace: config.use?.trace !== 'off',
        issues: reliabilityIssues.map(i => i.message),
      })
      .build();
  }

  private async checkPlaywrightPerformance(
    analysis: PlaywrightAnalysisResult
  ): Promise<CheckResult> {
    const config = analysis.config!;
    const performanceIssues = analysis.issues.filter(i => i.type === 'performance');

    let performanceScore = 0.3; // Базовая оценка

    // Проверяем параллелизацию
    if (config.workers && config.workers > 1) performanceScore += 0.3;

    // Проверяем headless режим
    if (config.use?.headless !== false) performanceScore += 0.2;

    // Проверяем оптимизацию записи
    if (config.use?.video === 'retain-on-failure') performanceScore += 0.1;
    if (config.use?.trace === 'retain-on-failure') performanceScore += 0.1;

    const passed = performanceScore >= 0.6;

    return ResultBuilder.threshold(
      'playwright-performance',
      'Производительность Playwright',
      performanceScore,
      0.6
    )
      .message(
        passed
          ? 'Настройки производительности оптимизированы'
          : 'Производительность может быть улучшена'
      )
      .details({
        score: Math.round(performanceScore * 100),
        workers: config.workers,
        headless: config.use?.headless !== false,
        optimizedRecording: config.use?.video === 'retain-on-failure',
        issues: performanceIssues.map(i => i.message),
      })
      .build();
  }

  private async checkPlaywrightBestPractices(
    analysis: PlaywrightAnalysisResult
  ): Promise<CheckResult> {
    const config = analysis.config!;
    let score = 0;
    const practices: string[] = [];

    // Проверяем лучшие практики
    if (config.baseURL) {
      score += 0.2;
      practices.push('Настроен базовый URL');
    }

    if (config.use?.screenshot) {
      score += 0.1;
      practices.push('Настроена запись скриншотов');
    }

    if (config.retries && config.retries > 0) {
      score += 0.2;
      practices.push('Настроены повторы при ошибках');
    }

    if (config.projects && config.projects.length > 1) {
      score += 0.2;
      practices.push('Настроено тестирование в нескольких браузерах');
    }

    if (config.reporter) {
      score += 0.1;
      practices.push('Настроены отчеты о тестировании');
    }

    if (config.outputDir) {
      score += 0.1;
      practices.push('Настроена директория для результатов');
    }

    if (config.use?.trace) {
      score += 0.1;
      practices.push('Настроена запись трейсов');
    }

    const passed = score >= 0.6;

    return ResultBuilder.threshold(
      'playwright-best-practices',
      'Лучшие практики Playwright',
      score,
      0.6
    )
      .message(`Соблюдается ${practices.length} лучших практик`)
      .details({
        score: Math.round(score * 100),
        practices,
        practicesCount: practices.length,
      })
      .build();
  }

  private async createPlaywrightSummary(analysis: PlaywrightAnalysisResult): Promise<CheckResult> {
    if (!analysis.hasConfig) {
      return ResultBuilder.warning('playwright-summary', 'Сводка Playwright')
        .message('Playwright не настроен в проекте')
        .details({
          configured: false,
          recommendation: 'Установите и настройте Playwright для E2E тестирования',
        })
        .build();
    }

    const overallScore = this.calculateOverallPlaywrightScore(analysis);
    const passed = overallScore >= 0.7;

    return ResultBuilder.threshold(
      'playwright-summary',
      'Общая оценка Playwright',
      overallScore,
      0.7
    )
      .message(
        passed
          ? 'Playwright хорошо интегрирован в проект'
          : 'Playwright интеграция требует улучшений'
      )
      .details({
        score: Math.round(overallScore * 100),
        configPath: analysis.configPath,
        testFilesCount: analysis.testFiles.length,
        totalTests: analysis.testFiles.reduce((sum, file) => sum + file.testCount, 0),
        issuesCount: analysis.issues.length,
        recommendations: analysis.recommendations,
        breakdown: {
          configuration: this.calculateConfigurationScore(analysis.config!, analysis.issues),
          browsers: this.calculateBrowserScore(analysis.config!),
          testFiles: Math.min(1, analysis.testFiles.length / TESTING_THRESHOLDS.MIN_E2E_TESTS),
        },
      })
      .build();
  }

  // Вспомогательные методы

  private async analyzePlaywrightIssues(
    project: Project,
    config?: PlaywrightConfig
  ): Promise<PlaywrightIssue[]> {
    const issues: PlaywrightIssue[] = [];

    if (!config) {
      issues.push({
        type: 'missing',
        severity: SeverityLevel.MEDIUM,
        message: 'Конфигурация Playwright не найдена',
        suggestion: 'Создайте playwright.config.ts для настройки E2E тестов',
      });
      return issues;
    }

    // Проверяем базовые настройки
    if (!config.baseURL) {
      issues.push({
        type: 'configuration',
        severity: SeverityLevel.LOW,
        message: 'Не указан базовый URL',
        suggestion: 'Добавьте baseURL в конфигурацию',
        configKey: 'baseURL',
      });
    }

    if (!config.retries) {
      issues.push({
        type: 'reliability',
        severity: SeverityLevel.LOW,
        message: 'Не настроены повторы при ошибках',
        suggestion: 'Добавьте retries для повышения надежности',
        configKey: 'retries',
      });
    }

    if (!config.workers || config.workers <= 1) {
      issues.push({
        type: 'performance',
        severity: SeverityLevel.LOW,
        message: 'Не настроена параллелизация тестов',
        suggestion: 'Увеличьте количество workers',
        configKey: 'workers',
      });
    }

    return issues;
  }

  private calculateConfigurationScore(config: PlaywrightConfig, issues: PlaywrightIssue[]): number {
    let score = 0.5; // Базовая оценка

    if (config.testDir) score += 0.1;
    if (config.baseURL) score += 0.2;
    if (config.workers) score += 0.1;
    if (config.retries) score += 0.1;
    if (config.use) score += 0.1;

    // Снижаем за проблемы
    const configIssues = issues.filter(i => i.type === 'configuration');
    score -= configIssues.length * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private calculateBrowserScore(config: PlaywrightConfig): number {
    let score = 0.3; // Базовая оценка

    if (config.projects) {
      score += 0.4;
      if (config.projects.length > 1) score += 0.3; // Бонус за мульти-браузерность
    }

    return score;
  }

  private calculateOverallPlaywrightScore(analysis: PlaywrightAnalysisResult): number {
    if (!analysis.hasConfig) return 0;

    const config = analysis.config!;

    const configScore = this.calculateConfigurationScore(config, analysis.issues);
    const browserScore = this.calculateBrowserScore(config);
    const testFilesScore = Math.min(
      1,
      analysis.testFiles.length / TESTING_THRESHOLDS.MIN_E2E_TESTS
    );
    const issuesScore = Math.max(0, 1 - analysis.issues.length * 0.1);

    return configScore * 0.4 + testFilesScore * 0.3 + browserScore * 0.2 + issuesScore * 0.1;
  }

  private async hasPlaywrightInDependencies(project: Project): Promise<boolean> {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);

      return !!(
        pkg.dependencies?.['@playwright/test'] ||
        pkg.devDependencies?.['@playwright/test'] ||
        pkg.dependencies?.playwright ||
        pkg.devDependencies?.playwright
      );
    } catch {
      return false;
    }
  }

  private getTestFileTypes(testFiles: E2ETestFileInfo[]): Record<string, number> {
    const types: Record<string, number> = {};

    testFiles.forEach(file => {
      types[file.type] = (types[file.type] || 0) + 1;
    });

    return types;
  }

  private generatePlaywrightRecommendations(analysis: PlaywrightAnalysisResult): string[] {
    const recommendations: string[] = [];

    if (!analysis.hasConfig) {
      recommendations.push('Установите @playwright/test и создайте playwright.config.ts');
      recommendations.push('Создайте первые E2E тесты в директории tests/');
      return recommendations;
    }

    const config = analysis.config!;

    if (!config.baseURL) {
      recommendations.push('Добавьте baseURL в конфигурацию для удобства тестирования');
    }

    if (!config.retries) {
      recommendations.push('Настройте retries для повышения надежности тестов');
    }

    if (!config.workers || config.workers <= 1) {
      recommendations.push('Увеличьте количество workers для ускорения тестов');
    }

    if (!config.projects || config.projects.length <= 1) {
      recommendations.push('Настройте тестирование в нескольких браузерах');
    }

    if (analysis.testFiles.length < TESTING_THRESHOLDS.MIN_E2E_TESTS) {
      recommendations.push('Добавьте больше E2E тестов для критических пользовательских сценариев');
    }

    return recommendations;
  }
}
