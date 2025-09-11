'use strict';
/**
 * E2ETestingChecker - универсальный анализатор E2E тестирования
 * Координирует анализ различных E2E фреймворков и общих практик
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
exports.E2ETestingChecker = exports.E2EFramework = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const BaseChecker_1 = require('../../../core/base/BaseChecker');
const SeverityLevel_1 = require('../../../types/SeverityLevel');
const AnalysisCategory_1 = require('../../../types/AnalysisCategory');
const ResultBuilder_1 = require('../utils/ResultBuilder');
const TestFileFinder_1 = require('../utils/TestFileFinder');
const PlaywrightChecker_1 = require('./PlaywrightChecker');
const CypressChecker_1 = require('./CypressChecker');
const constants_1 = require('../constants');
/**
 * Поддерживаемые E2E фреймворки
 */
var E2EFramework;
(function (E2EFramework) {
  E2EFramework['PLAYWRIGHT'] = 'playwright';
  E2EFramework['CYPRESS'] = 'cypress';
  E2EFramework['SELENIUM'] = 'selenium';
  E2EFramework['WEBDRIVER_IO'] = 'webdriverio';
  E2EFramework['TESTCAFE'] = 'testcafe';
  E2EFramework['PUPPETEER'] = 'puppeteer';
})(E2EFramework || (exports.E2EFramework = E2EFramework = {}));
/**
 * Универсальный анализатор E2E тестирования
 */
class E2ETestingChecker extends BaseChecker_1.BaseChecker {
  testFileFinder;
  playwrightChecker;
  cypressChecker;
  constructor() {
    super(
      'e2e-testing-checker',
      AnalysisCategory_1.AnalysisCategory.TESTING,
      'Анализирует E2E тестирование и координирует различные фреймворки',
      'E2E Testing Coordination',
      SeverityLevel_1.SeverityLevel.MEDIUM
    );
    this.testFileFinder = new TestFileFinder_1.TestFileFinder();
    this.playwrightChecker = new PlaywrightChecker_1.PlaywrightChecker();
    this.cypressChecker = new CypressChecker_1.CypressChecker();
  }
  /**
   * Выполняет проверку E2E тестирования
   * @param project Проект для анализа
   * @returns Массив результатов проверки
   */
  async check(project) {
    const results = [];
    try {
      // Анализируем E2E тестирование
      const analysis = await this.analyzeE2ETesting(project);
      // Базовая проверка наличия E2E тестирования
      results.push(await this.checkE2ETestingPresence(project, analysis));
      // Если E2E настроено, выполняем детальные проверки
      if (analysis.frameworks.some(f => f.installed)) {
        results.push(await this.checkE2EFrameworkSelection(analysis));
        results.push(await this.checkE2ETestCoverage(project, analysis));
        results.push(await this.checkE2ETestQuality(analysis));
        results.push(await this.checkE2EPerformance(analysis));
        results.push(await this.checkE2EMaintainability(analysis));
        results.push(await this.checkE2EBestPractices(analysis));
      }
      // Сравнительный анализ фреймворков
      if (analysis.frameworks.filter(f => f.installed).length > 1) {
        results.push(await this.checkMultipleFrameworks(analysis));
      }
      // Общая оценка E2E тестирования
      results.push(await this.createE2ETestingSummary(analysis));
    } catch (error) {
      results.push(
        ResultBuilder_1.ResultBuilder.error(
          'e2e-testing-analysis-error',
          'Ошибка анализа E2E тестирования'
        )
          .message(`Произошла ошибка при анализе E2E тестирования: ${error}`)
          .details({ error: String(error) })
          .build()
      );
    }
    return results;
  }
  /**
   * Анализирует E2E тестирование в проекте
   * @param project Проект
   * @returns Результат анализа E2E тестирования
   */
  async analyzeE2ETesting(project) {
    const result = {
      frameworks: [],
      stats: {
        totalTests: 0,
        totalFiles: 0,
        criticalPathsCoverage: 0,
        averageComplexity: 0,
        bestPracticesScore: 0,
      },
      issues: [],
      recommendations: [],
    };
    // Обнаруживаем E2E фреймворки
    result.frameworks = await this.detectE2EFrameworks(project);
    // Определяем основной фреймворк
    result.primaryFramework = this.determinePrimaryFramework(result.frameworks);
    // Собираем статистику
    result.stats = await this.calculateE2EStats(project, result.frameworks);
    // Анализируем проблемы
    result.issues = await this.analyzeE2EIssues(project, result.frameworks);
    // Генерируем рекомендации
    result.recommendations = this.generateE2ERecommendations(result);
    return result;
  }
  /**
   * Обнаруживает E2E фреймворки в проекте
   * @param project Проект
   * @returns Массив информации о фреймворках
   */
  async detectE2EFrameworks(project) {
    const frameworks = [];
    // Проверяем каждый фреймворк
    for (const framework of Object.values(E2EFramework)) {
      const info = await this.analyzeFramework(project, framework);
      frameworks.push(info);
    }
    return frameworks;
  }
  /**
   * Анализирует конкретный E2E фреймворк
   * @param project Проект
   * @param framework Фреймворк
   * @returns Информация о фреймворке
   */
  async analyzeFramework(project, framework) {
    const info = {
      name: framework,
      installed: false,
      configured: false,
      testCount: 0,
      score: 0,
    };
    try {
      // Проверяем установку в package.json
      info.installed = await this.isFrameworkInstalled(project, framework);
      info.version = await this.getFrameworkVersion(project, framework);
      if (info.installed) {
        // Проверяем конфигурацию
        const configResult = await this.findFrameworkConfig(project, framework);
        info.configured = configResult.found;
        info.configPath = configResult.path;
        // Подсчитываем тесты
        info.testCount = await this.countFrameworkTests(project, framework);
        // Вычисляем оценку
        info.score = await this.calculateFrameworkScore(project, framework);
      }
    } catch (error) {
      console.warn(`Ошибка анализа фреймворка ${framework}:`, error);
    }
    return info;
  }
  /**
   * Проверяет, установлен ли фреймворк
   * @param project Проект
   * @param framework Фреймворк
   * @returns true, если установлен
   */
  async isFrameworkInstalled(project, framework) {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      switch (framework) {
        case E2EFramework.PLAYWRIGHT:
          return !!dependencies['@playwright/test'] || !!dependencies['playwright'];
        case E2EFramework.CYPRESS:
          return !!dependencies['cypress'];
        case E2EFramework.SELENIUM:
          return (
            !!dependencies['selenium-webdriver'] ||
            !!dependencies['@wdio/selenium-standalone-service']
          );
        case E2EFramework.WEBDRIVER_IO:
          return !!dependencies['@wdio/cli'] || !!dependencies['webdriverio'];
        case E2EFramework.TESTCAFE:
          return !!dependencies['testcafe'];
        case E2EFramework.PUPPETEER:
          return !!dependencies['puppeteer'] || !!dependencies['puppeteer-core'];
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
  /**
   * Получает версию фреймворка
   * @param project Проект
   * @param framework Фреймворк
   * @returns Версия фреймворка
   */
  async getFrameworkVersion(project, framework) {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      switch (framework) {
        case E2EFramework.PLAYWRIGHT:
          return dependencies['@playwright/test'] || dependencies['playwright'];
        case E2EFramework.CYPRESS:
          return dependencies['cypress'];
        case E2EFramework.SELENIUM:
          return dependencies['selenium-webdriver'];
        case E2EFramework.WEBDRIVER_IO:
          return dependencies['@wdio/cli'] || dependencies['webdriverio'];
        case E2EFramework.TESTCAFE:
          return dependencies['testcafe'];
        case E2EFramework.PUPPETEER:
          return dependencies['puppeteer'] || dependencies['puppeteer-core'];
        default:
          return undefined;
      }
    } catch {
      return undefined;
    }
  }
  /**
   * Находит конфигурацию фреймворка
   * @param project Проект
   * @param framework Фреймворк
   * @returns Результат поиска конфигурации
   */
  async findFrameworkConfig(project, framework) {
    const configFiles = {
      [E2EFramework.PLAYWRIGHT]: ['playwright.config.ts', 'playwright.config.js'],
      [E2EFramework.CYPRESS]: ['cypress.config.ts', 'cypress.config.js', 'cypress.json'],
      [E2EFramework.SELENIUM]: ['selenium.config.js', 'wdio.conf.js', 'wdio.conf.ts'],
      [E2EFramework.WEBDRIVER_IO]: ['wdio.conf.js', 'wdio.conf.ts'],
      [E2EFramework.TESTCAFE]: ['.testcaferc.json', 'testcafe.config.js'],
      [E2EFramework.PUPPETEER]: ['puppeteer.config.js', 'jest-puppeteer.config.js'],
    };
    const files = configFiles[framework] || [];
    for (const configFile of files) {
      const configPath = path.join(project.path, configFile);
      try {
        await fs.access(configPath);
        return { found: true, path: configPath };
      } catch {
        continue;
      }
    }
    return { found: false };
  }
  /**
   * Подсчитывает тесты фреймворка
   * @param project Проект
   * @param framework Фреймворк
   * @returns Количество тестов
   */
  async countFrameworkTests(project, framework) {
    try {
      const testDirs = {
        [E2EFramework.PLAYWRIGHT]: ['tests', 'e2e', 'tests/e2e', 'playwright'],
        [E2EFramework.CYPRESS]: ['cypress/integration', 'cypress/e2e', 'cypress/tests'],
        [E2EFramework.SELENIUM]: ['tests/selenium', 'e2e/selenium'],
        [E2EFramework.WEBDRIVER_IO]: ['tests/specs', 'test/specs', 'e2e'],
        [E2EFramework.TESTCAFE]: ['tests', 'e2e', 'testcafe'],
        [E2EFramework.PUPPETEER]: ['tests/puppeteer', 'e2e/puppeteer'],
      };
      const patterns = {
        [E2EFramework.PLAYWRIGHT]: [/\.(spec|test)\.(ts|js)$/, /\.e2e\.(ts|js)$/],
        [E2EFramework.CYPRESS]: [/\.cy\.(ts|js)$/, /\.(spec|test)\.(ts|js)$/],
        [E2EFramework.SELENIUM]: [/\.selenium\.(ts|js)$/, /\.(spec|test)\.(ts|js)$/],
        [E2EFramework.WEBDRIVER_IO]: [/\.e2e\.(ts|js)$/, /\.(spec|test)\.(ts|js)$/],
        [E2EFramework.TESTCAFE]: [/\.testcafe\.(ts|js)$/, /\.(spec|test)\.(ts|js)$/],
        [E2EFramework.PUPPETEER]: [/\.puppeteer\.(ts|js)$/, /\.(spec|test)\.(ts|js)$/],
      };
      let totalTests = 0;
      const dirs = testDirs[framework] || [];
      const filePatterns = patterns[framework] || [];
      for (const dir of dirs) {
        const dirPath = path.join(project.path, dir);
        try {
          await fs.access(dirPath);
          const count = await this.countTestsInDirectory(dirPath, filePatterns);
          totalTests += count;
        } catch {
          continue;
        }
      }
      return totalTests;
    } catch {
      return 0;
    }
  }
  /**
   * Подсчитывает тесты в директории
   * @param dirPath Путь к директории
   * @param patterns Паттерны файлов
   * @returns Количество тестов
   */
  async countTestsInDirectory(dirPath, patterns) {
    let count = 0;
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          count += await this.countTestsInDirectory(fullPath, patterns);
        } else if (entry.isFile() && patterns.some(p => p.test(entry.name))) {
          // Подсчитываем тесты в файле
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const testMatches = content.match(/\b(test|it|describe|suite)\s*\(/g);
            if (testMatches) {
              count += testMatches.length;
            }
          } catch {
            count += 1; // Считаем файл как минимум одним тестом
          }
        }
      }
    } catch {
      // Игнорируем ошибки доступа
    }
    return count;
  }
  /**
   * Вычисляет оценку фреймворка
   * @param project Проект
   * @param framework Фреймворк
   * @returns Оценка фреймворка
   */
  async calculateFrameworkScore(project, framework) {
    let score = 0;
    // Базовая оценка за установку
    if (await this.isFrameworkInstalled(project, framework)) {
      score += 0.3;
    }
    // Оценка за конфигурацию
    const configResult = await this.findFrameworkConfig(project, framework);
    if (configResult.found) {
      score += 0.3;
    }
    // Оценка за количество тестов
    const testCount = await this.countFrameworkTests(project, framework);
    if (testCount >= constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS) {
      score += 0.4;
    } else if (testCount > 0) {
      score += 0.2;
    }
    return Math.min(1, score);
  }
  /**
   * Определяет основной фреймворк
   * @param frameworks Список фреймворков
   * @returns Основной фреймворк
   */
  determinePrimaryFramework(frameworks) {
    const installedFrameworks = frameworks.filter(f => f.installed);
    if (installedFrameworks.length === 0) return undefined;
    if (installedFrameworks.length === 1) return installedFrameworks[0].name;
    // Выбираем фреймворк с наибольшим количеством тестов
    return installedFrameworks.reduce((prev, curr) =>
      curr.testCount > prev.testCount ? curr : prev
    ).name;
  }
  /**
   * Вычисляет статистику E2E тестирования
   * @param project Проект
   * @param frameworks Фреймворки
   * @returns Статистика
   */
  async calculateE2EStats(project, frameworks) {
    const stats = {
      totalTests: 0,
      totalFiles: 0,
      criticalPathsCoverage: 0,
      averageComplexity: 0,
      bestPracticesScore: 0,
    };
    // Суммируем тесты по всем фреймворкам
    stats.totalTests = frameworks.reduce((sum, f) => sum + f.testCount, 0);
    // Подсчитываем файлы
    stats.totalFiles = await this.countE2ETestFiles(project);
    // Оцениваем покрытие критических путей
    stats.criticalPathsCoverage = await this.estimateCriticalPathsCoverage(project);
    // Вычисляем среднюю сложность
    stats.averageComplexity = await this.calculateAverageTestComplexity(project);
    // Оцениваем соблюдение лучших практик
    stats.bestPracticesScore = this.calculateBestPracticesScore(frameworks);
    return stats;
  }
  // Методы проверок
  async checkE2ETestingPresence(project, analysis) {
    const installedFrameworks = analysis.frameworks.filter(f => f.installed);
    const hasE2ETesting = installedFrameworks.length > 0;
    const totalTests = analysis.stats.totalTests;
    if (hasE2ETesting && totalTests > 0) {
      return ResultBuilder_1.ResultBuilder.success(
        'e2e-testing-presence',
        'Наличие E2E тестирования'
      )
        .message(`E2E тестирование настроено с ${installedFrameworks.length} фреймворком(ами)`)
        .details({
          frameworks: installedFrameworks.map(f => ({
            name: f.name,
            version: f.version,
            testCount: f.testCount,
          })),
          totalTests,
          primaryFramework: analysis.primaryFramework,
        })
        .build();
    } else if (hasE2ETesting) {
      return ResultBuilder_1.ResultBuilder.warning(
        'e2e-testing-presence',
        'Наличие E2E тестирования'
      )
        .message('E2E фреймворки установлены, но тесты не найдены')
        .details({
          frameworks: installedFrameworks.map(f => f.name),
          recommendation: 'Создайте E2E тесты для критических пользовательских сценариев',
        })
        .build();
    } else {
      return ResultBuilder_1.ResultBuilder.warning(
        'e2e-testing-presence',
        'Наличие E2E тестирования'
      )
        .message('E2E тестирование не настроено')
        .details({
          recommendation: 'Установите и настройте E2E фреймворк (Playwright или Cypress)',
        })
        .build();
    }
  }
  async checkE2EFrameworkSelection(analysis) {
    const installedFrameworks = analysis.frameworks.filter(f => f.installed);
    const configuredFrameworks = installedFrameworks.filter(f => f.configured);
    if (installedFrameworks.length === 1) {
      const framework = installedFrameworks[0];
      return ResultBuilder_1.ResultBuilder.success(
        'e2e-framework-selection',
        'Выбор E2E фреймворка'
      )
        .message(`Использется ${framework.name} для E2E тестирования`)
        .details({
          framework: framework.name,
          version: framework.version,
          configured: framework.configured,
          testCount: framework.testCount,
          score: Math.round(framework.score * 100),
        })
        .build();
    } else if (installedFrameworks.length > 1) {
      return ResultBuilder_1.ResultBuilder.warning(
        'e2e-framework-selection',
        'Выбор E2E фреймворка'
      )
        .message(`Установлено ${installedFrameworks.length} E2E фреймворков`)
        .details({
          frameworks: installedFrameworks.map(f => ({
            name: f.name,
            testCount: f.testCount,
            score: f.score,
          })),
          primaryFramework: analysis.primaryFramework,
          recommendation: 'Рекомендуется использовать один основной фреймворк',
        })
        .build();
    } else {
      return ResultBuilder_1.ResultBuilder.error('e2e-framework-selection', 'Выбор E2E фреймворка')
        .message('E2E фреймворки не установлены')
        .details({
          recommendation: 'Установите Playwright или Cypress для E2E тестирования',
        })
        .build();
    }
  }
  async checkE2ETestCoverage(project, analysis) {
    const totalTests = analysis.stats.totalTests;
    const criticalPathsCoverage = analysis.stats.criticalPathsCoverage;
    const passed =
      totalTests >= constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS && criticalPathsCoverage >= 0.6;
    return ResultBuilder_1.ResultBuilder.threshold(
      'e2e-test-coverage',
      'Покрытие E2E тестами',
      totalTests,
      constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS
    )
      .message(
        `E2E тесты: ${totalTests}, покрытие критических путей: ${Math.round(criticalPathsCoverage * 100)}%`
      )
      .details({
        totalTests,
        threshold: constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS,
        criticalPathsCoverage: Math.round(criticalPathsCoverage * 100),
        totalFiles: analysis.stats.totalFiles,
        recommendation: passed
          ? 'Хорошее покрытие E2E тестами'
          : 'Увеличьте количество E2E тестов для критических сценариев',
      })
      .build();
  }
  async checkE2ETestQuality(analysis) {
    const bestPracticesScore = analysis.stats.bestPracticesScore;
    const averageComplexity = analysis.stats.averageComplexity;
    const qualityIssues = analysis.issues.filter(i => i.type === 'quality');
    const passed = bestPracticesScore >= 0.7 && qualityIssues.length <= 3;
    return ResultBuilder_1.ResultBuilder.threshold(
      'e2e-test-quality',
      'Качество E2E тестов',
      bestPracticesScore,
      0.7
    )
      .message(
        passed
          ? 'E2E тесты соответствуют стандартам качества'
          : 'Качество E2E тестов требует улучшения'
      )
      .details({
        bestPracticesScore: Math.round(bestPracticesScore * 100),
        averageComplexity: Math.round(averageComplexity * 100) / 100,
        qualityIssuesCount: qualityIssues.length,
        issues: qualityIssues.map(i => i.message),
      })
      .build();
  }
  async checkE2EPerformance(analysis) {
    const performanceIssues = analysis.issues.filter(i => i.type === 'performance');
    const frameworks = analysis.frameworks.filter(f => f.installed);
    // Оцениваем производительность на основе конфигураций фреймворков
    let performanceScore = 0.5;
    // Проверяем настройки производительности в основном фреймворке
    if (analysis.primaryFramework) {
      const primaryFrameworkInfo = frameworks.find(f => f.name === analysis.primaryFramework);
      if (primaryFrameworkInfo && primaryFrameworkInfo.configured) {
        performanceScore += 0.3;
      }
    }
    // Снижаем за проблемы производительности
    performanceScore -= performanceIssues.length * 0.1;
    performanceScore = Math.max(0, Math.min(1, performanceScore));
    const passed = performanceScore >= 0.6;
    return ResultBuilder_1.ResultBuilder.threshold(
      'e2e-performance',
      'Производительность E2E тестов',
      performanceScore,
      0.6
    )
      .message(
        passed
          ? 'E2E тесты оптимизированы для производительности'
          : 'Производительность E2E тестов может быть улучшена'
      )
      .details({
        score: Math.round(performanceScore * 100),
        performanceIssuesCount: performanceIssues.length,
        issues: performanceIssues.map(i => i.message),
        recommendation:
          performanceIssues.length > 0
            ? 'Оптимизируйте настройки E2E фреймворков'
            : 'Производительность в норме',
      })
      .build();
  }
  async checkE2EMaintainability(analysis) {
    const maintenanceIssues = analysis.issues.filter(i => i.type === 'maintenance');
    const multipleFrameworks = analysis.frameworks.filter(f => f.installed).length > 1;
    let maintainabilityScore = 0.6; // Базовая оценка
    // Снижаем за множественные фреймворки
    if (multipleFrameworks) {
      maintainabilityScore -= 0.2;
    }
    // Снижаем за проблемы сопровождения
    maintainabilityScore -= maintenanceIssues.length * 0.1;
    maintainabilityScore = Math.max(0, Math.min(1, maintainabilityScore));
    const passed = maintainabilityScore >= 0.6;
    return ResultBuilder_1.ResultBuilder.threshold(
      'e2e-maintainability',
      'Сопровождение E2E тестов',
      maintainabilityScore,
      0.6
    )
      .message(
        passed ? 'E2E тесты легко сопровождать' : 'Сопровождение E2E тестов может быть затруднено'
      )
      .details({
        score: Math.round(maintainabilityScore * 100),
        multipleFrameworks,
        maintenanceIssuesCount: maintenanceIssues.length,
        issues: maintenanceIssues.map(i => i.message),
      })
      .build();
  }
  async checkE2EBestPractices(analysis) {
    const bestPracticesScore = analysis.stats.bestPracticesScore;
    const installedFrameworks = analysis.frameworks.filter(f => f.installed);
    const practices = [];
    // Проверяем лучшие практики
    if (installedFrameworks.some(f => f.configured)) {
      practices.push('Настроена конфигурация фреймворка');
    }
    if (analysis.stats.totalTests >= constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS) {
      practices.push('Достаточное количество E2E тестов');
    }
    if (analysis.stats.criticalPathsCoverage >= 0.6) {
      practices.push('Покрытие критических пользовательских путей');
    }
    if (installedFrameworks.length === 1) {
      practices.push('Использование единого E2E фреймворка');
    }
    const passed = bestPracticesScore >= 0.7;
    return ResultBuilder_1.ResultBuilder.threshold(
      'e2e-best-practices',
      'Лучшие практики E2E',
      bestPracticesScore,
      0.7
    )
      .message(`Соблюдается ${practices.length} лучших практик E2E тестирования`)
      .details({
        score: Math.round(bestPracticesScore * 100),
        practices,
        practicesCount: practices.length,
      })
      .build();
  }
  async checkMultipleFrameworks(analysis) {
    const installedFrameworks = analysis.frameworks.filter(f => f.installed);
    return ResultBuilder_1.ResultBuilder.warning(
      'e2e-multiple-frameworks',
      'Множественные E2E фреймворки'
    )
      .message(`Установлено ${installedFrameworks.length} E2E фреймворков`)
      .details({
        frameworks: installedFrameworks.map(f => ({
          name: f.name,
          testCount: f.testCount,
          configured: f.configured,
        })),
        primaryFramework: analysis.primaryFramework,
        recommendation: 'Рекомендуется консолидировать E2E тестирование в одном фреймворке',
        impact: 'Множественные фреймворки усложняют сопровождение и увеличивают время сборки',
      })
      .build();
  }
  async createE2ETestingSummary(analysis) {
    const installedFrameworks = analysis.frameworks.filter(f => f.installed);
    if (installedFrameworks.length === 0) {
      return ResultBuilder_1.ResultBuilder.warning('e2e-testing-summary', 'Сводка E2E тестирования')
        .message('E2E тестирование не настроено')
        .details({
          configured: false,
          recommendation: 'Настройте E2E тестирование для повышения качества продукта',
        })
        .build();
    }
    const overallScore = this.calculateOverallE2EScore(analysis);
    const passed = overallScore >= 0.7;
    return ResultBuilder_1.ResultBuilder.threshold(
      'e2e-testing-summary',
      'Общая оценка E2E тестирования',
      overallScore,
      0.7
    )
      .message(
        passed ? 'E2E тестирование хорошо организовано' : 'E2E тестирование требует улучшений'
      )
      .details({
        score: Math.round(overallScore * 100),
        frameworksCount: installedFrameworks.length,
        primaryFramework: analysis.primaryFramework,
        totalTests: analysis.stats.totalTests,
        totalFiles: analysis.stats.totalFiles,
        criticalPathsCoverage: Math.round(analysis.stats.criticalPathsCoverage * 100),
        issuesCount: analysis.issues.length,
        recommendations: analysis.recommendations,
        breakdown: {
          frameworks:
            installedFrameworks.reduce((sum, f) => sum + f.score, 0) / installedFrameworks.length,
          coverage: Math.min(
            1,
            analysis.stats.totalTests / constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS
          ),
          quality: analysis.stats.bestPracticesScore,
        },
      })
      .build();
  }
  // Вспомогательные методы
  async analyzeE2EIssues(project, frameworks) {
    const issues = [];
    const installedFrameworks = frameworks.filter(f => f.installed);
    // Проблема: нет E2E тестирования
    if (installedFrameworks.length === 0) {
      issues.push({
        type: 'framework',
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
        message: 'E2E фреймворки не установлены',
        suggestion: 'Установите Playwright или Cypress для E2E тестирования',
      });
    }
    // Проблема: множественные фреймворки
    if (installedFrameworks.length > 1) {
      issues.push({
        type: 'maintenance',
        severity: SeverityLevel_1.SeverityLevel.LOW,
        message: 'Установлено несколько E2E фреймворков',
        suggestion: 'Консолидируйте E2E тестирование в одном фреймворке',
      });
    }
    // Проблема: фреймворк не настроен
    installedFrameworks.forEach(framework => {
      if (!framework.configured) {
        issues.push({
          type: 'framework',
          severity: SeverityLevel_1.SeverityLevel.MEDIUM,
          framework: framework.name,
          message: `${framework.name} установлен, но не настроен`,
          suggestion: `Создайте конфигурацию для ${framework.name}`,
        });
      }
    });
    return issues;
  }
  calculateOverallE2EScore(analysis) {
    const installedFrameworks = analysis.frameworks.filter(f => f.installed);
    if (installedFrameworks.length === 0) return 0;
    const frameworksScore =
      installedFrameworks.reduce((sum, f) => sum + f.score, 0) / installedFrameworks.length;
    const coverageScore = Math.min(
      1,
      analysis.stats.totalTests / constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS
    );
    const qualityScore = analysis.stats.bestPracticesScore;
    const issuesScore = Math.max(0, 1 - analysis.issues.length * 0.1);
    return frameworksScore * 0.3 + coverageScore * 0.3 + qualityScore * 0.3 + issuesScore * 0.1;
  }
  async countE2ETestFiles(project) {
    // Используем TestFileFinder для подсчета E2E файлов
    try {
      const extendedInfo = await this.testFileFinder.findExtendedTestFiles(project);
      return extendedInfo.filter(
        f =>
          f.path.includes('e2e') ||
          f.path.includes('integration') ||
          f.path.includes('playwright') ||
          f.path.includes('cypress')
      ).length;
    } catch {
      return 0;
    }
  }
  async estimateCriticalPathsCoverage(project) {
    // Простая оценка покрытия критических путей
    // В реальности требует анализа конкретных тест-кейсов
    const totalTests = await this.countE2ETestFiles(project);
    if (totalTests === 0) return 0;
    if (totalTests >= 20) return 0.9;
    if (totalTests >= 10) return 0.7;
    if (totalTests >= 5) return 0.5;
    return 0.3;
  }
  async calculateAverageTestComplexity(project) {
    // Упрощенная оценка сложности тестов
    // В реальности требует анализа содержимого тестовых файлов
    const totalTests = await this.countE2ETestFiles(project);
    if (totalTests === 0) return 0;
    // Базовая сложность от 1 до 5
    return 2.5 + totalTests * 0.1; // Увеличиваем сложность с количеством тестов
  }
  calculateBestPracticesScore(frameworks) {
    const installedFrameworks = frameworks.filter(f => f.installed);
    if (installedFrameworks.length === 0) return 0;
    let score = 0.2; // Базовая оценка
    // Бонус за установку и настройку
    const configuredFrameworks = installedFrameworks.filter(f => f.configured);
    score += (configuredFrameworks.length / installedFrameworks.length) * 0.4;
    // Бонус за наличие тестов
    const frameworksWithTests = installedFrameworks.filter(f => f.testCount > 0);
    score += (frameworksWithTests.length / installedFrameworks.length) * 0.3;
    // Штраф за множественные фреймворки
    if (installedFrameworks.length > 1) {
      score -= 0.1;
    }
    return Math.max(0, Math.min(1, score));
  }
  generateE2ERecommendations(analysis) {
    const recommendations = [];
    const installedFrameworks = analysis.frameworks.filter(f => f.installed);
    if (installedFrameworks.length === 0) {
      recommendations.push('Установите современный E2E фреймворк (Playwright рекомендуется)');
      recommendations.push('Создайте E2E тесты для критических пользовательских сценариев');
      return recommendations;
    }
    if (installedFrameworks.length > 1) {
      recommendations.push('Консолидируйте E2E тестирование в одном фреймворке');
    }
    const unconfiguredFrameworks = installedFrameworks.filter(f => !f.configured);
    if (unconfiguredFrameworks.length > 0) {
      recommendations.push(
        `Настройте конфигурацию для: ${unconfiguredFrameworks.map(f => f.name).join(', ')}`
      );
    }
    if (analysis.stats.totalTests < constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS) {
      recommendations.push('Увеличьте покрытие E2E тестами критических функций');
    }
    if (analysis.stats.criticalPathsCoverage < 0.6) {
      recommendations.push('Добавьте E2E тесты для основных пользовательских сценариев');
    }
    if (analysis.stats.bestPracticesScore < 0.7) {
      recommendations.push('Улучшите качество E2E тестов согласно лучшим практикам');
    }
    return recommendations;
  }
}
exports.E2ETestingChecker = E2ETestingChecker;
//# sourceMappingURL=E2ETestingChecker.js.map
