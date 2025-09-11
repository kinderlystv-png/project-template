'use strict';
/**
 * JestChecker - специализированный анализатор для Jest фреймворка
 * Проверяет конфигурацию, тесты и настройки Jest
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
exports.JestChecker = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const BaseChecker_1 = require('../../../core/base/BaseChecker');
const SeverityLevel_1 = require('../../../types/SeverityLevel');
const AnalysisCategory_1 = require('../../../types/AnalysisCategory');
const ResultBuilder_1 = require('../utils/ResultBuilder');
const TestFileFinder_1 = require('../utils/TestFileFinder');
const constants_1 = require('../constants');
/**
 * Анализатор Jest фреймворка
 */
class JestChecker extends BaseChecker_1.BaseChecker {
  testFileFinder;
  constructor() {
    super(
      'jest-checker',
      AnalysisCategory_1.AnalysisCategory.TESTING,
      'Анализирует конфигурацию и использование Jest тестового фреймворка',
      'Jest Testing Framework',
      SeverityLevel_1.SeverityLevel.MEDIUM
    );
    this.testFileFinder = new TestFileFinder_1.TestFileFinder();
  }
  /**
   * Выполняет проверку Jest конфигурации и тестов
   * @param project Проект для анализа
   * @returns Массив результатов проверки
   */
  async check(project) {
    const results = [];
    try {
      // Анализируем Jest
      const analysis = await this.analyzeJest(project);
      // Базовая проверка наличия Jest
      results.push(await this.checkJestPresence(project, analysis));
      // Если Jest найден, выполняем детальные проверки
      if (analysis.hasConfig) {
        results.push(await this.checkJestConfiguration(analysis));
        results.push(await this.checkTestFiles(project, analysis));
        results.push(await this.checkCoverageSettings(analysis));
        results.push(await this.checkPerformanceSettings(analysis));
        results.push(await this.checkJestBestPractices(analysis));
      }
      // Общая оценка Jest интеграции
      results.push(await this.createOverallJestAssessment(analysis));
    } catch (error) {
      results.push(
        ResultBuilder_1.ResultBuilder.error('jest-analysis-error', 'Ошибка анализа Jest')
          .message(`Произошла ошибка при анализе Jest: ${error}`)
          .details({ error: String(error) })
          .build()
      );
    }
    return results;
  }
  /**
   * Анализирует Jest в проекте
   * @param project Проект
   * @returns Результат анализа Jest
   */
  async analyzeJest(project) {
    const result = {
      hasConfig: false,
      testFiles: [],
      issues: [],
      recommendations: [],
    };
    // Ищем конфигурацию Jest
    const configResult = await this.findJestConfig(project);
    result.hasConfig = configResult.found;
    result.configPath = configResult.path;
    result.config = configResult.config;
    // Ищем тестовые файлы
    const testFiles = await this.testFileFinder.findTestFiles(project, ['jest']);
    result.testFiles = testFiles.map(f => f.path);
    // Анализируем проблемы
    result.issues = await this.analyzeJestIssues(project, result.config);
    // Генерируем рекомендации
    result.recommendations = this.generateJestRecommendations(result);
    return result;
  }
  /**
   * Ищет конфигурацию Jest в проекте
   * @param project Проект
   * @returns Результат поиска конфигурации
   */
  async findJestConfig(project) {
    const configFiles = [
      'jest.config.js',
      'jest.config.ts',
      'jest.config.json',
      'jest.config.mjs',
      'package.json',
    ];
    for (const configFile of configFiles) {
      const configPath = path.join(project.path, configFile);
      try {
        await fs.access(configPath);
        if (configFile === 'package.json') {
          const packageJson = await fs.readFile(configPath, 'utf-8');
          const pkg = JSON.parse(packageJson);
          if (pkg.jest) {
            return {
              found: true,
              path: configPath,
              config: pkg.jest,
            };
          }
        } else {
          const config = await this.parseJestConfig(configPath);
          return {
            found: true,
            path: configPath,
            config,
          };
        }
      } catch {
        continue;
      }
    }
    return { found: false };
  }
  /**
   * Парсит конфигурацию Jest из файла
   * @param configPath Путь к файлу конфигурации
   * @returns Конфигурация Jest
   */
  async parseJestConfig(configPath) {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      if (configPath.endsWith('.json')) {
        return JSON.parse(content);
      }
      // Для .js/.ts файлов делаем упрощенный парсинг
      const config = {};
      // Ищем основные настройки
      const testEnvironmentMatch = content.match(/testEnvironment:\s*['"`]([^'"`]+)['"`]/);
      if (testEnvironmentMatch) {
        config.testEnvironment = testEnvironmentMatch[1];
      }
      const collectCoverageMatch = content.match(/collectCoverage:\s*(true|false)/);
      if (collectCoverageMatch) {
        config.collectCoverage = collectCoverageMatch[1] === 'true';
      }
      const maxWorkersMatch = content.match(/maxWorkers:\s*['"`]?([^'"`\s,}]+)['"`]?/);
      if (maxWorkersMatch) {
        const workers = maxWorkersMatch[1];
        config.maxWorkers = isNaN(Number(workers)) ? workers : Number(workers);
      }
      return config;
    } catch (error) {
      console.warn(`Ошибка парсинга Jest конфигурации ${configPath}:`, error);
      return undefined;
    }
  }
  /**
   * Анализирует проблемы в Jest конфигурации
   * @param project Проект
   * @param config Конфигурация Jest
   * @returns Массив найденных проблем
   */
  async analyzeJestIssues(project, config) {
    const issues = [];
    if (!config) {
      issues.push({
        type: 'configuration',
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
        message: 'Конфигурация Jest не найдена',
        suggestion: 'Создайте jest.config.js или добавьте секцию "jest" в package.json',
      });
      return issues;
    }
    // Проверяем тестовое окружение
    if (!config.testEnvironment) {
      issues.push({
        type: 'configuration',
        severity: SeverityLevel_1.SeverityLevel.LOW,
        message: 'Не указано тестовое окружение',
        suggestion: 'Добавьте testEnvironment: "node" или "jsdom"',
        configKey: 'testEnvironment',
      });
    }
    // Проверяем настройки покрытия
    if (config.collectCoverage && !config.collectCoverageFrom) {
      issues.push({
        type: 'coverage',
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
        message: 'Включено покрытие, но не указаны файлы для анализа',
        suggestion: 'Добавьте collectCoverageFrom для указания файлов',
        configKey: 'collectCoverageFrom',
      });
    }
    // Проверяем пороги покрытия
    if (config.collectCoverage && !config.coverageThreshold) {
      issues.push({
        type: 'coverage',
        severity: SeverityLevel_1.SeverityLevel.LOW,
        message: 'Не установлены пороги покрытия',
        suggestion: 'Добавьте coverageThreshold для контроля качества',
        configKey: 'coverageThreshold',
      });
    }
    // Проверяем производительность
    if (!config.maxWorkers) {
      issues.push({
        type: 'performance',
        severity: SeverityLevel_1.SeverityLevel.LOW,
        message: 'Не настроена параллелизация тестов',
        suggestion: 'Добавьте maxWorkers для ускорения выполнения',
        configKey: 'maxWorkers',
      });
    }
    // Проверяем setup файлы
    const hasSetupFiles = config.setupFilesAfterEnv && config.setupFilesAfterEnv.length > 0;
    if (!hasSetupFiles) {
      const hasTestUtils = await this.hasTestUtilities(project);
      if (!hasTestUtils) {
        issues.push({
          type: 'configuration',
          severity: SeverityLevel_1.SeverityLevel.LOW,
          message: 'Отсутствуют файлы настройки тестовой среды',
          suggestion: 'Создайте setupTests.js и добавьте в setupFilesAfterEnv',
          configKey: 'setupFilesAfterEnv',
        });
      }
    }
    return issues;
  }
  /**
   * Проверяет наличие Jest в проекте
   */
  async checkJestPresence(project, analysis) {
    const hasJestDependency = await this.hasJestInDependencies(project);
    const hasConfig = analysis.hasConfig;
    const hasTests = analysis.testFiles.length > 0;
    if (hasJestDependency && hasConfig && hasTests) {
      return ResultBuilder_1.ResultBuilder.success('jest-presence', 'Наличие Jest')
        .message('Jest корректно установлен и настроен')
        .details({
          dependency: hasJestDependency,
          config: hasConfig,
          testFiles: hasTests,
          configPath: analysis.configPath,
        })
        .build();
    } else {
      const missing = [];
      if (!hasJestDependency) missing.push('зависимость');
      if (!hasConfig) missing.push('конфигурация');
      if (!hasTests) missing.push('тестовые файлы');
      return ResultBuilder_1.ResultBuilder.warning('jest-presence', 'Наличие Jest')
        .message(`Jest частично настроен. Отсутствует: ${missing.join(', ')}`)
        .details({
          dependency: hasJestDependency,
          config: hasConfig,
          testFiles: hasTests,
          missing,
        })
        .build();
    }
  }
  /**
   * Проверяет конфигурацию Jest
   */
  async checkJestConfiguration(analysis) {
    const config = analysis.config;
    const issues = analysis.issues.filter(i => i.type === 'configuration');
    const configScore = this.calculateConfigurationScore(config, issues);
    const passed = configScore >= 0.7;
    return ResultBuilder_1.ResultBuilder.threshold(
      'jest-configuration',
      'Конфигурация Jest',
      configScore,
      0.7
    )
      .message(
        passed ? 'Конфигурация Jest настроена корректно' : 'Конфигурация Jest требует улучшений'
      )
      .details({
        configPath: analysis.configPath,
        score: Math.round(configScore * 100),
        issues: issues.map(i => ({
          type: i.type,
          severity: i.severity,
          message: i.message,
          suggestion: i.suggestion,
        })),
        configKeys: Object.keys(config),
      })
      .build();
  }
  /**
   * Проверяет тестовые файлы Jest
   */
  async checkTestFiles(project, analysis) {
    const testFilesCount = analysis.testFiles.length;
    const passed = testFilesCount >= constants_1.TESTING_THRESHOLDS.MIN_TEST_FILES;
    // Анализируем структуру тестовых файлов
    const fileAnalysis = await this.analyzeTestFileStructure(analysis.testFiles);
    return ResultBuilder_1.ResultBuilder.threshold(
      'jest-test-files',
      'Тестовые файлы Jest',
      testFilesCount,
      constants_1.TESTING_THRESHOLDS.MIN_TEST_FILES
    )
      .message(`Найдено ${testFilesCount} тестовых файлов Jest`)
      .details({
        totalFiles: testFilesCount,
        threshold: constants_1.TESTING_THRESHOLDS.MIN_TEST_FILES,
        fileAnalysis,
        averageTestsPerFile: fileAnalysis.averageTestsPerFile,
        totalTests: fileAnalysis.totalTests,
      })
      .build();
  }
  /**
   * Проверяет настройки покрытия
   */
  async checkCoverageSettings(analysis) {
    const config = analysis.config;
    const coverageIssues = analysis.issues.filter(i => i.type === 'coverage');
    const hasCoverage = config.collectCoverage === true;
    const hasThresholds = !!config.coverageThreshold;
    const hasSourcePatterns = !!config.collectCoverageFrom;
    const coverageScore = this.calculateCoverageScore(config);
    const passed = coverageScore >= 0.6;
    return ResultBuilder_1.ResultBuilder.threshold(
      'jest-coverage',
      'Настройки покрытия Jest',
      coverageScore,
      0.6
    )
      .message(hasCoverage ? 'Покрытие кода настроено' : 'Покрытие кода не включено')
      .details({
        enabled: hasCoverage,
        hasThresholds,
        hasSourcePatterns,
        score: Math.round(coverageScore * 100),
        issues: coverageIssues.map(i => i.message),
        thresholds: config.coverageThreshold?.global,
      })
      .build();
  }
  /**
   * Проверяет настройки производительности
   */
  async checkPerformanceSettings(analysis) {
    const config = analysis.config;
    const performanceIssues = analysis.issues.filter(i => i.type === 'performance');
    const hasMaxWorkers = !!config.maxWorkers;
    const hasOptimalWorkers = this.hasOptimalWorkerConfiguration(config.maxWorkers);
    const performanceScore = this.calculatePerformanceScore(config);
    const passed = performanceScore >= 0.5;
    return ResultBuilder_1.ResultBuilder.threshold(
      'jest-performance',
      'Настройки производительности Jest',
      performanceScore,
      0.5
    )
      .message(
        hasMaxWorkers ? 'Параллелизация тестов настроена' : 'Параллелизация тестов не настроена'
      )
      .details({
        hasMaxWorkers,
        maxWorkers: config.maxWorkers,
        hasOptimalWorkers,
        score: Math.round(performanceScore * 100),
        issues: performanceIssues.map(i => i.message),
      })
      .build();
  }
  /**
   * Проверяет соблюдение лучших практик Jest
   */
  async checkJestBestPractices(analysis) {
    const config = analysis.config;
    let score = 0;
    const practices = [];
    // Проверяем различные лучшие практики
    if (config.testEnvironment) {
      score += 0.2;
      practices.push('Указано тестовое окружение');
    }
    if (config.setupFilesAfterEnv && config.setupFilesAfterEnv.length > 0) {
      score += 0.2;
      practices.push('Настроены файлы инициализации');
    }
    if (config.collectCoverage && config.coverageThreshold) {
      score += 0.3;
      practices.push('Настроено покрытие с порогами');
    }
    if (config.transform) {
      score += 0.1;
      practices.push('Настроена трансформация файлов');
    }
    if (config.maxWorkers) {
      score += 0.2;
      practices.push('Оптимизирована параллелизация');
    }
    const passed = score >= 0.6;
    return ResultBuilder_1.ResultBuilder.threshold(
      'jest-best-practices',
      'Лучшие практики Jest',
      score,
      0.6
    )
      .message(`Соблюдается ${practices.length} из 5 лучших практик`)
      .details({
        score: Math.round(score * 100),
        practices,
        totalPractices: 5,
        followedPractices: practices.length,
      })
      .build();
  }
  /**
   * Создает общую оценку Jest интеграции
   */
  async createOverallJestAssessment(analysis) {
    if (!analysis.hasConfig) {
      return ResultBuilder_1.ResultBuilder.warning('jest-overall', 'Общая оценка Jest')
        .message('Jest не настроен в проекте')
        .details({
          configured: false,
          recommendation: 'Установите и настройте Jest для тестирования',
        })
        .build();
    }
    const config = analysis.config;
    const overallScore = this.calculateOverallJestScore(analysis);
    const passed = overallScore >= 0.7;
    return ResultBuilder_1.ResultBuilder.threshold(
      'jest-overall',
      'Общая оценка Jest',
      overallScore,
      0.7
    )
      .message(passed ? 'Jest хорошо интегрирован в проект' : 'Jest интеграция требует улучшений')
      .details({
        score: Math.round(overallScore * 100),
        configPath: analysis.configPath,
        testFilesCount: analysis.testFiles.length,
        issuesCount: analysis.issues.length,
        recommendations: analysis.recommendations,
        breakdown: {
          configuration: this.calculateConfigurationScore(config, analysis.issues),
          coverage: this.calculateCoverageScore(config),
          performance: this.calculatePerformanceScore(config),
        },
      })
      .build();
  }
  // Вспомогательные методы для расчетов
  calculateConfigurationScore(config, issues) {
    let score = 0.5; // Базовая оценка за наличие конфигурации
    if (config.testEnvironment) score += 0.2;
    if (config.testMatch || config.testRegex) score += 0.1;
    if (config.setupFilesAfterEnv) score += 0.1;
    if (config.transform) score += 0.1;
    // Снижаем оценку за проблемы
    const configIssues = issues.filter(i => i.type === 'configuration');
    score -= configIssues.length * 0.1;
    return Math.max(0, Math.min(1, score));
  }
  calculateCoverageScore(config) {
    let score = 0;
    if (config.collectCoverage) score += 0.4;
    if (config.collectCoverageFrom) score += 0.3;
    if (config.coverageThreshold) score += 0.3;
    return score;
  }
  calculatePerformanceScore(config) {
    let score = 0.3; // Базовая оценка
    if (config.maxWorkers) {
      score += 0.4;
      if (this.hasOptimalWorkerConfiguration(config.maxWorkers)) {
        score += 0.3;
      }
    }
    return score;
  }
  calculateOverallJestScore(analysis) {
    if (!analysis.hasConfig) return 0;
    const config = analysis.config;
    const configScore = this.calculateConfigurationScore(config, analysis.issues);
    const coverageScore = this.calculateCoverageScore(config);
    const performanceScore = this.calculatePerformanceScore(config);
    const testFilesScore = Math.min(
      1,
      analysis.testFiles.length / constants_1.TESTING_THRESHOLDS.MIN_TEST_FILES
    );
    // Взвешенная оценка
    return configScore * 0.4 + testFilesScore * 0.3 + coverageScore * 0.2 + performanceScore * 0.1;
  }
  hasOptimalWorkerConfiguration(maxWorkers) {
    if (!maxWorkers) return false;
    if (typeof maxWorkers === 'string') {
      return maxWorkers.includes('%') || maxWorkers === 'auto';
    }
    return maxWorkers > 1 && maxWorkers <= 8; // Разумный диапазон
  }
  async analyzeTestFileStructure(testFiles) {
    let totalTests = 0;
    let hasDescribeBlocks = false;
    let hasSetupTeardown = false;
    let filesAnalyzed = 0;
    for (const filePath of testFiles.slice(0, 10)) {
      // Ограничиваем для производительности
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        // Подсчитываем тесты
        const testMatches = content.match(/\b(test|it)\s*\(/g);
        if (testMatches) totalTests += testMatches.length;
        // Проверяем describe блоки
        if (/\bdescribe\s*\(/.test(content)) hasDescribeBlocks = true;
        // Проверяем setup/teardown
        if (/\b(beforeEach|afterEach|beforeAll|afterAll)\s*\(/.test(content)) {
          hasSetupTeardown = true;
        }
        filesAnalyzed++;
      } catch {
        // Игнорируем ошибки чтения файлов
      }
    }
    return {
      totalTests,
      averageTestsPerFile: filesAnalyzed > 0 ? totalTests / filesAnalyzed : 0,
      hasDescribeBlocks,
      hasSetupTeardown,
    };
  }
  async hasJestInDependencies(project) {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      return !!(
        pkg.dependencies?.jest ||
        pkg.devDependencies?.jest ||
        pkg.dependencies?.['@jest/core'] ||
        pkg.devDependencies?.['@jest/core']
      );
    } catch {
      return false;
    }
  }
  async hasTestUtilities(project) {
    const utilityPaths = [
      'src/test-utils',
      'src/testing',
      'tests/utils',
      'test/utils',
      '__tests__/utils',
      'src/setupTests.js',
      'src/setupTests.ts',
    ];
    for (const utilPath of utilityPaths) {
      try {
        await fs.access(path.join(project.path, utilPath));
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }
  generateJestRecommendations(analysis) {
    const recommendations = [];
    if (!analysis.hasConfig) {
      recommendations.push('Создайте конфигурацию Jest (jest.config.js)');
      recommendations.push('Добавьте Jest в devDependencies');
      return recommendations;
    }
    const config = analysis.config;
    if (!config.testEnvironment) {
      recommendations.push('Укажите тестовое окружение (testEnvironment)');
    }
    if (!config.collectCoverage) {
      recommendations.push('Включите сбор покрытия кода (collectCoverage: true)');
    }
    if (config.collectCoverage && !config.coverageThreshold) {
      recommendations.push('Установите пороги покрытия (coverageThreshold)');
    }
    if (!config.maxWorkers) {
      recommendations.push('Настройте параллелизацию тестов (maxWorkers)');
    }
    if (analysis.testFiles.length < constants_1.TESTING_THRESHOLDS.MIN_TEST_FILES) {
      recommendations.push('Добавьте больше тестовых файлов');
    }
    return recommendations;
  }
}
exports.JestChecker = JestChecker;
//# sourceMappingURL=JestChecker.js.map
