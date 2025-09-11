'use strict';
/**
 * PlaywrightChecker - анализатор Playwright E2E тестирования
 * Проверяет конфигурацию, тесты и настройки Playwright
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.PlaywrightChecker = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const BaseChecker_1 = require('../../../core/base/BaseChecker');
const SeverityLevel_1 = require('../../../types/SeverityLevel');
const AnalysisCategory_1 = require('../../../types/AnalysisCategory');
const ResultBuilder_1 = require('../utils/ResultBuilder');
const TestFileFinder_1 = require('../utils/TestFileFinder');
const constants_1 = require('../constants');
/**
 * Анализатор Playwright E2E тестов
 */
class PlaywrightChecker extends BaseChecker_1.BaseChecker {
  testFileFinder;
  constructor() {
    super(
      'playwright-checker',
      AnalysisCategory_1.AnalysisCategory.TESTING,
      'Анализирует конфигурацию и E2E тесты Playwright',
      'Playwright E2E Testing',
      SeverityLevel_1.SeverityLevel.MEDIUM
    );
    this.testFileFinder = new TestFileFinder_1.TestFileFinder();
  }
  /**
   * Выполняет проверку Playwright настроек и тестов
   * @param project Проект для анализа
   * @returns Массив результатов проверки
   */
  async check(project) {
    const results = [];
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
        ResultBuilder_1.ResultBuilder.error(
          'playwright-analysis-error',
          'Ошибка анализа Playwright'
        )
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
  async analyzePlaywright(project) {
    const result = {
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
  async findPlaywrightConfig(project) {
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
  async parsePlaywrightConfig(configPath) {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      // Упрощенный парсинг конфигурации
      const config = {};
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
  async findE2ETestFiles(project, config) {
    const e2eFiles = [];
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
  async scanForE2EFiles(dirPath) {
    const e2eFiles = [];
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
  isE2ETestFile(fileName) {
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
  async analyzeE2ETestFile(filePath) {
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
  determineTestType(content) {
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
  countE2ETests(content) {
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
  extractSelectors(content) {
    const selectors = [];
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
  extractPages(content) {
    const pages = [];
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
  calculateE2EComplexity(content) {
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
  async findE2ETestIssues(content) {
    const issues = [];
    // Проверяем хардкод значений
    const hardcodedValues = content.match(/(localhost|127\.0\.0\.1|192\.168\.|10\.0\.)/g);
    if (hardcodedValues) {
      issues.push({
        type: 'hardcoded',
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
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
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
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
          severity: SeverityLevel_1.SeverityLevel.LOW,
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
        severity: SeverityLevel_1.SeverityLevel.HIGH,
        message: 'Async функции без await вызовов',
        suggestion: 'Добавьте await для асинхронных операций',
      });
    }
    return issues;
  }
  // Методы проверок
  async checkPlaywrightPresence(project, analysis) {
    const hasPlaywrightDependency = await this.hasPlaywrightInDependencies(project);
    const hasConfig = analysis.hasConfig;
    const hasTests = analysis.testFiles.length > 0;
    if (hasPlaywrightDependency && hasConfig && hasTests) {
      return ResultBuilder_1.ResultBuilder.success('playwright-presence', 'Наличие Playwright')
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
      return ResultBuilder_1.ResultBuilder.warning('playwright-presence', 'Наличие Playwright')
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
  async checkPlaywrightConfiguration(analysis) {
    const config = analysis.config;
    const configIssues = analysis.issues.filter(i => i.type === 'configuration');
    const configScore = this.calculateConfigurationScore(config, configIssues);
    const passed = configScore >= 0.7;
    return ResultBuilder_1.ResultBuilder.threshold(
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
  async checkBrowserSettings(analysis) {
    const config = analysis.config;
    const browserIssues = analysis.issues.filter(i => i.type === 'browsers');
    const hasProjects = config.projects && config.projects.length > 0;
    const hasMultipleBrowsers = hasProjects && (config.projects?.length || 0) > 1;
    const browserScore = this.calculateBrowserScore(config);
    return ResultBuilder_1.ResultBuilder.threshold(
      'playwright-browsers',
      'Настройки браузеров',
      browserScore,
      0.5
    )
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
  async checkE2ETestFiles(project, analysis) {
    const testFilesCount = analysis.testFiles.length;
    const passed = testFilesCount >= constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS;
    // Анализируем качество E2E тестов
    const totalTests = analysis.testFiles.reduce((sum, file) => sum + file.testCount, 0);
    const averageComplexity =
      analysis.testFiles.length > 0
        ? analysis.testFiles.reduce((sum, file) => sum + file.complexity, 0) /
          analysis.testFiles.length
        : 0;
    return ResultBuilder_1.ResultBuilder.threshold(
      'playwright-test-files',
      'E2E тестовые файлы',
      testFilesCount,
      constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS
    )
      .message(`Найдено ${testFilesCount} E2E тестовых файлов с ${totalTests} тестами`)
      .details({
        totalFiles: testFilesCount,
        totalTests,
        threshold: constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS,
        averageComplexity: Math.round(averageComplexity * 100) / 100,
        fileTypes: this.getTestFileTypes(analysis.testFiles),
      })
      .build();
  }
  async checkPlaywrightReliability(analysis) {
    const config = analysis.config;
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
    return ResultBuilder_1.ResultBuilder.threshold(
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
  async checkPlaywrightPerformance(analysis) {
    const config = analysis.config;
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
    return ResultBuilder_1.ResultBuilder.threshold(
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
  async checkPlaywrightBestPractices(analysis) {
    const config = analysis.config;
    let score = 0;
    const practices = [];
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
    return ResultBuilder_1.ResultBuilder.threshold(
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
  async createPlaywrightSummary(analysis) {
    if (!analysis.hasConfig) {
      return ResultBuilder_1.ResultBuilder.warning('playwright-summary', 'Сводка Playwright')
        .message('Playwright не настроен в проекте')
        .details({
          configured: false,
          recommendation: 'Установите и настройте Playwright для E2E тестирования',
        })
        .build();
    }
    const overallScore = this.calculateOverallPlaywrightScore(analysis);
    const passed = overallScore >= 0.7;
    return ResultBuilder_1.ResultBuilder.threshold(
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
          configuration: this.calculateConfigurationScore(analysis.config, analysis.issues),
          browsers: this.calculateBrowserScore(analysis.config),
          testFiles: Math.min(
            1,
            analysis.testFiles.length / constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS
          ),
        },
      })
      .build();
  }
  // Вспомогательные методы
  async analyzePlaywrightIssues(project, config) {
    const issues = [];
    if (!config) {
      issues.push({
        type: 'missing',
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
        message: 'Конфигурация Playwright не найдена',
        suggestion: 'Создайте playwright.config.ts для настройки E2E тестов',
      });
      return issues;
    }
    // Проверяем базовые настройки
    if (!config.baseURL) {
      issues.push({
        type: 'configuration',
        severity: SeverityLevel_1.SeverityLevel.LOW,
        message: 'Не указан базовый URL',
        suggestion: 'Добавьте baseURL в конфигурацию',
        configKey: 'baseURL',
      });
    }
    if (!config.retries) {
      issues.push({
        type: 'reliability',
        severity: SeverityLevel_1.SeverityLevel.LOW,
        message: 'Не настроены повторы при ошибках',
        suggestion: 'Добавьте retries для повышения надежности',
        configKey: 'retries',
      });
    }
    if (!config.workers || config.workers <= 1) {
      issues.push({
        type: 'performance',
        severity: SeverityLevel_1.SeverityLevel.LOW,
        message: 'Не настроена параллелизация тестов',
        suggestion: 'Увеличьте количество workers',
        configKey: 'workers',
      });
    }
    return issues;
  }
  calculateConfigurationScore(config, issues) {
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
  calculateBrowserScore(config) {
    let score = 0.3; // Базовая оценка
    if (config.projects) {
      score += 0.4;
      if (config.projects.length > 1) score += 0.3; // Бонус за мульти-браузерность
    }
    return score;
  }
  calculateOverallPlaywrightScore(analysis) {
    if (!analysis.hasConfig) return 0;
    const config = analysis.config;
    const configScore = this.calculateConfigurationScore(config, analysis.issues);
    const browserScore = this.calculateBrowserScore(config);
    const testFilesScore = Math.min(
      1,
      analysis.testFiles.length / constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS
    );
    const issuesScore = Math.max(0, 1 - analysis.issues.length * 0.1);
    return configScore * 0.4 + testFilesScore * 0.3 + browserScore * 0.2 + issuesScore * 0.1;
  }
  async hasPlaywrightInDependencies(project) {
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
  getTestFileTypes(testFiles) {
    const types = {};
    testFiles.forEach(file => {
      types[file.type] = (types[file.type] || 0) + 1;
    });
    return types;
  }
  generatePlaywrightRecommendations(analysis) {
    const recommendations = [];
    if (!analysis.hasConfig) {
      recommendations.push('Установите @playwright/test и создайте playwright.config.ts');
      recommendations.push('Создайте первые E2E тесты в директории tests/');
      return recommendations;
    }
    const config = analysis.config;
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
    if (analysis.testFiles.length < constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS) {
      recommendations.push('Добавьте больше E2E тестов для критических пользовательских сценариев');
    }
    return recommendations;
  }
}
exports.PlaywrightChecker = PlaywrightChecker;
//# sourceMappingURL=PlaywrightChecker.js.map
