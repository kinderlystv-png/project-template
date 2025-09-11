'use strict';
/**
 * CypressChecker - анализатор Cypress E2E тестирования
 * Проверяет конфигурацию, тесты и настройки Cypress
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
exports.CypressChecker = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const BaseChecker_1 = require('../../../core/base/BaseChecker');
const SeverityLevel_1 = require('../../../types/SeverityLevel');
const AnalysisCategory_1 = require('../../../types/AnalysisCategory');
const ResultBuilder_1 = require('../utils/ResultBuilder');
const TestFileFinder_1 = require('../utils/TestFileFinder');
const constants_1 = require('../constants');
/**
 * Анализатор Cypress E2E тестов
 */
class CypressChecker extends BaseChecker_1.BaseChecker {
  testFileFinder;
  constructor() {
    super(
      'cypress-checker',
      AnalysisCategory_1.AnalysisCategory.TESTING,
      'Анализирует конфигурацию и E2E тесты Cypress',
      'Cypress E2E Testing',
      SeverityLevel_1.SeverityLevel.MEDIUM
    );
    this.testFileFinder = new TestFileFinder_1.TestFileFinder();
  }
  /**
   * Выполняет проверку Cypress настроек и тестов
   * @param project Проект для анализа
   * @returns Массив результатов проверки
   */
  async check(project) {
    const results = [];
    try {
      // Анализируем Cypress
      const analysis = await this.analyzeCypress(project);
      // Базовая проверка наличия Cypress
      results.push(await this.checkCypressPresence(project, analysis));
      // Если Cypress настроен, выполняем детальные проверки
      if (analysis.hasConfig) {
        results.push(await this.checkCypressConfiguration(analysis));
        results.push(await this.checkCypressTestFiles(project, analysis));
        results.push(await this.checkCypressSupportFiles(analysis));
        results.push(await this.checkCypressReliability(analysis));
        results.push(await this.checkCypressPerformance(analysis));
        results.push(await this.checkCypressBestPractices(analysis));
      }
      // Общая оценка Cypress
      results.push(await this.createCypressSummary(analysis));
    } catch (error) {
      results.push(
        ResultBuilder_1.ResultBuilder.error('cypress-analysis-error', 'Ошибка анализа Cypress')
          .message(`Произошла ошибка при анализе Cypress: ${error}`)
          .details({ error: String(error) })
          .build()
      );
    }
    return results;
  }
  /**
   * Анализирует Cypress в проекте
   * @param project Проект
   * @returns Результат анализа Cypress
   */
  async analyzeCypress(project) {
    const result = {
      hasConfig: false,
      testFiles: [],
      supportFiles: {},
      issues: [],
      recommendations: [],
    };
    // Ищем конфигурацию Cypress
    const configResult = await this.findCypressConfig(project);
    result.hasConfig = configResult.found;
    result.configPath = configResult.path;
    result.config = configResult.config;
    // Ищем тестовые файлы Cypress
    result.testFiles = await this.findCypressTestFiles(project, result.config);
    // Ищем поддерживающие файлы
    result.supportFiles = await this.findCypressSupportFiles(project);
    // Анализируем проблемы
    result.issues = await this.analyzeCypressIssues(project, result.config);
    // Генерируем рекомендации
    result.recommendations = this.generateCypressRecommendations(result);
    return result;
  }
  /**
   * Ищет конфигурацию Cypress
   * @param project Проект
   * @returns Результат поиска конфигурации
   */
  async findCypressConfig(project) {
    const configFiles = [
      'cypress.config.ts',
      'cypress.config.js',
      'cypress.json',
      'cypress.env.json',
    ];
    for (const configFile of configFiles) {
      const configPath = path.join(project.path, configFile);
      try {
        await fs.access(configPath);
        const config = await this.parseCypressConfig(configPath);
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
   * Парсит конфигурацию Cypress
   * @param configPath Путь к конфигурации
   * @returns Конфигурация Cypress
   */
  async parseCypressConfig(configPath) {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const fileName = path.basename(configPath);
      if (fileName.endsWith('.json')) {
        // Парсим JSON конфигурацию
        return JSON.parse(content);
      } else {
        // Парсим TypeScript/JavaScript конфигурацию
        const config = {};
        // Ищем базовые настройки
        const baseUrlMatch = content.match(/baseUrl:\s*['"`]([^'"`]+)['"`]/);
        if (baseUrlMatch) {
          config.baseUrl = baseUrlMatch[1];
        }
        const integrationFolderMatch = content.match(/integrationFolder:\s*['"`]([^'"`]+)['"`]/);
        if (integrationFolderMatch) {
          config.integrationFolder = integrationFolderMatch[1];
        }
        const supportFileMatch = content.match(/supportFile:\s*['"`]([^'"`]+)['"`]/);
        if (supportFileMatch) {
          config.supportFile = supportFileMatch[1];
        }
        const viewportWidthMatch = content.match(/viewportWidth:\s*(\d+)/);
        if (viewportWidthMatch) {
          config.viewportWidth = parseInt(viewportWidthMatch[1]);
        }
        const viewportHeightMatch = content.match(/viewportHeight:\s*(\d+)/);
        if (viewportHeightMatch) {
          config.viewportHeight = parseInt(viewportHeightMatch[1]);
        }
        const videoMatch = content.match(/video:\s*(true|false)/);
        if (videoMatch) {
          config.video = videoMatch[1] === 'true';
        }
        return config;
      }
    } catch (error) {
      console.warn(`Ошибка парсинга Cypress конфигурации ${configPath}:`, error);
      return undefined;
    }
  }
  /**
   * Находит тестовые файлы Cypress
   * @param project Проект
   * @param config Конфигурация Cypress
   * @returns Массив Cypress тестовых файлов
   */
  async findCypressTestFiles(project, config) {
    const cypressFiles = [];
    // Определяем директории для поиска Cypress тестов
    const searchDirs = [
      config?.integrationFolder || 'cypress/integration',
      'cypress/e2e',
      'cypress/tests',
      'tests/cypress',
      'e2e/cypress',
    ];
    for (const searchDir of searchDirs) {
      const dirPath = path.join(project.path, searchDir);
      try {
        await fs.access(dirPath);
        const files = await this.scanForCypressFiles(dirPath);
        cypressFiles.push(...files);
      } catch {
        continue;
      }
    }
    return cypressFiles;
  }
  /**
   * Сканирует директорию для поиска Cypress файлов
   * @param dirPath Путь к директории
   * @returns Массив Cypress файлов
   */
  async scanForCypressFiles(dirPath) {
    const cypressFiles = [];
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const subFiles = await this.scanForCypressFiles(fullPath);
          cypressFiles.push(...subFiles);
        } else if (entry.isFile() && this.isCypressTestFile(entry.name)) {
          const fileInfo = await this.analyzeCypressTestFile(fullPath);
          if (fileInfo) {
            cypressFiles.push(fileInfo);
          }
        }
      }
    } catch {
      // Игнорируем ошибки доступа
    }
    return cypressFiles;
  }
  /**
   * Проверяет, является ли файл Cypress тестом
   * @param fileName Имя файла
   * @returns true, если это Cypress тест
   */
  isCypressTestFile(fileName) {
    const cypressPatterns = [
      /\.cy\.(ts|js)$/,
      /\.spec\.(ts|js)$/,
      /\.test\.(ts|js)$/,
      /cypress.*\.(ts|js)$/,
      /integration.*\.(ts|js)$/,
    ];
    return cypressPatterns.some(pattern => pattern.test(fileName));
  }
  /**
   * Анализирует Cypress тестовый файл
   * @param filePath Путь к файлу
   * @returns Информация о Cypress тестовом файле
   */
  async analyzeCypressTestFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        path: filePath,
        type: this.determineCypressTestType(content),
        testCount: this.countCypressTests(content),
        commands: this.extractCypressCommands(content),
        issues: await this.findCypressTestIssues(content),
        complexity: this.calculateCypressComplexity(content),
        usesPageObject: this.detectPageObjectUsage(content),
        usesCustomCommands: this.detectCustomCommandsUsage(content),
      };
    } catch {
      return null;
    }
  }
  /**
   * Определяет тип Cypress теста
   * @param content Содержимое файла
   * @returns Тип теста
   */
  determineCypressTestType(content) {
    if (content.includes('cy.request') || content.includes('cy.api')) {
      return 'api';
    }
    if (content.includes('cy.mount') || content.includes('component')) {
      return 'component';
    }
    if (content.includes('cy.visit') || content.includes('cy.get')) {
      return 'e2e';
    }
    return 'integration';
  }
  /**
   * Подсчитывает Cypress тесты в файле
   * @param content Содержимое файла
   * @returns Количество тестов
   */
  countCypressTests(content) {
    const testPatterns = [/\bit\s*\(/g, /\btest\s*\(/g, /\bspecify\s*\(/g];
    let count = 0;
    testPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    });
    return count;
  }
  /**
   * Извлекает Cypress команды из теста
   * @param content Содержимое файла
   * @returns Массив команд
   */
  extractCypressCommands(content) {
    const commands = [];
    // Ищем различные Cypress команды
    const commandPatterns = [/cy\.([a-zA-Z]+)\(/g];
    commandPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        commands.push(match[1]);
      }
    });
    return [...new Set(commands)]; // Удаляем дубликаты
  }
  /**
   * Вычисляет сложность Cypress теста
   * @param content Содержимое файла
   * @returns Уровень сложности
   */
  calculateCypressComplexity(content) {
    let complexity = 1;
    // Увеличиваем сложность за различные действия
    const complexityFactors = [
      { pattern: /cy\.visit/g, weight: 1 },
      { pattern: /cy\.get/g, weight: 1 },
      { pattern: /cy\.click/g, weight: 1 },
      { pattern: /cy\.type/g, weight: 1 },
      { pattern: /cy\.wait/g, weight: 2 },
      { pattern: /cy\.should/g, weight: 1 },
      { pattern: /cy\.then/g, weight: 2 },
      { pattern: /if\s*\(/g, weight: 2 },
      { pattern: /for\s*\(/g, weight: 3 },
      { pattern: /while\s*\(/g, weight: 3 },
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
   * Определяет использование Page Object паттерна
   * @param content Содержимое файла
   * @returns true, если используется Page Object
   */
  detectPageObjectUsage(content) {
    const pageObjectPatterns = [
      /import.*Page.*from/i,
      /new.*Page\(/,
      /\.page\./,
      /PageObject/i,
      /class.*Page/,
    ];
    return pageObjectPatterns.some(pattern => pattern.test(content));
  }
  /**
   * Определяет использование пользовательских команд
   * @param content Содержимое файла
   * @returns true, если используются пользовательские команды
   */
  detectCustomCommandsUsage(content) {
    const customCommandPatterns = [/cy\.([a-zA-Z][a-zA-Z0-9]*)\(/g];
    const standardCommands = new Set([
      'visit',
      'get',
      'click',
      'type',
      'should',
      'wait',
      'then',
      'and',
      'contains',
      'find',
      'first',
      'last',
      'eq',
      'filter',
      'not',
      'parent',
      'children',
      'siblings',
      'next',
      'prev',
      'closest',
      'window',
      'document',
      'title',
      'url',
      'location',
      'hash',
      'reload',
      'go',
      'request',
      'intercept',
      'fixture',
      'readFile',
      'writeFile',
      'task',
      'exec',
      'log',
      'debug',
      'pause',
      'screenshot',
      'viewport',
      'scrollTo',
      'scrollIntoView',
      'focus',
      'blur',
      'check',
      'uncheck',
      'select',
      'clear',
      'submit',
      'trigger',
    ]);
    for (const pattern of customCommandPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const command = match[1];
        if (!standardCommands.has(command)) {
          return true;
        }
      }
    }
    return false;
  }
  /**
   * Находит проблемы в Cypress тестовом файле
   * @param content Содержимое файла
   * @returns Массив проблем
   */
  async findCypressTestIssues(content) {
    const issues = [];
    // Проверяем хардкод значений
    const hardcodedUrls = content.match(/(localhost|127\.0\.0\.1|192\.168\.|10\.0\.)/g);
    if (hardcodedUrls) {
      issues.push({
        type: 'hardcoded',
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
        message: 'Обнаружены хардкод URL в тестах',
        suggestion: 'Используйте baseUrl из конфигурации Cypress',
      });
    }
    // Проверяем использование cy.wait с фиксированным временем
    const fixedWaits = content.match(/cy\.wait\(\d+\)/g);
    if (fixedWaits) {
      issues.push({
        type: 'waiting',
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
        message: 'Использование фиксированных задержек cy.wait()',
        suggestion: 'Используйте cy.wait() с алиасами или условными ожиданиями',
      });
    }
    // Проверяем длинные цепочки команд
    const longChains = content.match(/cy\.[^;]+\.[^;]+\.[^;]+\.[^;]+/g);
    if (longChains) {
      issues.push({
        type: 'best-practice',
        severity: SeverityLevel_1.SeverityLevel.LOW,
        message: 'Обнаружены длинные цепочки команд',
        suggestion: 'Разбейте длинные цепочки для лучшей читаемости',
      });
    }
    // Проверяем отсутствие assertions
    const hasActions = /cy\.(click|type|select|check)/g.test(content);
    const hasAssertions = /should\(|expect\(/g.test(content);
    if (hasActions && !hasAssertions) {
      issues.push({
        type: 'best-practice',
        severity: SeverityLevel_1.SeverityLevel.HIGH,
        message: 'Отсутствуют проверки (assertions) в тесте',
        suggestion: 'Добавьте .should() или expect() для проверки результатов',
      });
    }
    return issues;
  }
  /**
   * Находит поддерживающие файлы Cypress
   * @param project Проект
   * @returns Поддерживающие файлы
   */
  async findCypressSupportFiles(project) {
    const supportFiles = {};
    const supportPaths = [
      { type: 'commands', paths: ['cypress/support/commands.ts', 'cypress/support/commands.js'] },
      {
        type: 'index',
        paths: ['cypress/support/index.ts', 'cypress/support/index.js', 'cypress/support/e2e.ts'],
      },
      { type: 'plugins', paths: ['cypress/plugins/index.ts', 'cypress/plugins/index.js'] },
    ];
    for (const { type, paths } of supportPaths) {
      for (const supportPath of paths) {
        const fullPath = path.join(project.path, supportPath);
        try {
          await fs.access(fullPath);
          supportFiles[type] = fullPath;
          break;
        } catch {
          continue;
        }
      }
    }
    return supportFiles;
  }
  // Методы проверок
  async checkCypressPresence(project, analysis) {
    const hasCypressDependency = await this.hasCypressInDependencies(project);
    const hasConfig = analysis.hasConfig;
    const hasTests = analysis.testFiles.length > 0;
    if (hasCypressDependency && hasConfig && hasTests) {
      return ResultBuilder_1.ResultBuilder.success('cypress-presence', 'Наличие Cypress')
        .message('Cypress корректно установлен и настроен')
        .details({
          dependency: hasCypressDependency,
          config: hasConfig,
          testFiles: hasTests,
          configPath: analysis.configPath,
        })
        .build();
    } else {
      const missing = [];
      if (!hasCypressDependency) missing.push('зависимость cypress');
      if (!hasConfig) missing.push('конфигурация cypress.config.ts');
      if (!hasTests) missing.push('тестовые файлы');
      return ResultBuilder_1.ResultBuilder.warning('cypress-presence', 'Наличие Cypress')
        .message(`Cypress частично настроен. Отсутствует: ${missing.join(', ')}`)
        .details({
          dependency: hasCypressDependency,
          config: hasConfig,
          testFiles: hasTests,
          missing,
        })
        .build();
    }
  }
  async checkCypressConfiguration(analysis) {
    const config = analysis.config;
    const configIssues = analysis.issues.filter(i => i.type === 'configuration');
    const configScore = this.calculateCypressConfigurationScore(config, configIssues);
    const passed = configScore >= 0.7;
    return ResultBuilder_1.ResultBuilder.threshold(
      'cypress-configuration',
      'Конфигурация Cypress',
      configScore,
      0.7
    )
      .message(
        passed
          ? 'Конфигурация Cypress настроена корректно'
          : 'Конфигурация Cypress требует улучшений'
      )
      .details({
        configPath: analysis.configPath,
        score: Math.round(configScore * 100),
        hasBaseUrl: !!config.baseUrl,
        hasIntegrationFolder: !!config.integrationFolder,
        hasSupportFile: !!config.supportFile,
        hasViewport: !!(config.viewportWidth && config.viewportHeight),
        issues: configIssues.map(i => i.message),
      })
      .build();
  }
  async checkCypressTestFiles(project, analysis) {
    const testFilesCount = analysis.testFiles.length;
    const passed = testFilesCount >= constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS;
    // Анализируем качество Cypress тестов
    const totalTests = analysis.testFiles.reduce((sum, file) => sum + file.testCount, 0);
    const averageComplexity =
      analysis.testFiles.length > 0
        ? analysis.testFiles.reduce((sum, file) => sum + file.complexity, 0) /
          analysis.testFiles.length
        : 0;
    const pageObjectUsage = analysis.testFiles.filter(f => f.usesPageObject).length;
    const customCommandsUsage = analysis.testFiles.filter(f => f.usesCustomCommands).length;
    return ResultBuilder_1.ResultBuilder.threshold(
      'cypress-test-files',
      'Cypress тестовые файлы',
      testFilesCount,
      constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS
    )
      .message(`Найдено ${testFilesCount} Cypress тестовых файлов с ${totalTests} тестами`)
      .details({
        totalFiles: testFilesCount,
        totalTests,
        threshold: constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS,
        averageComplexity: Math.round(averageComplexity * 100) / 100,
        pageObjectUsage,
        customCommandsUsage,
        fileTypes: this.getCypressTestFileTypes(analysis.testFiles),
      })
      .build();
  }
  async checkCypressSupportFiles(analysis) {
    const { commands, index, plugins } = analysis.supportFiles;
    let supportScore = 0.3; // Базовая оценка
    const supportFeatures = [];
    if (commands) {
      supportScore += 0.4;
      supportFeatures.push('Пользовательские команды');
    }
    if (index) {
      supportScore += 0.2;
      supportFeatures.push('Файл поддержки');
    }
    if (plugins) {
      supportScore += 0.1;
      supportFeatures.push('Плагины');
    }
    const passed = supportScore >= 0.5;
    return ResultBuilder_1.ResultBuilder.threshold(
      'cypress-support-files',
      'Поддерживающие файлы Cypress',
      supportScore,
      0.5
    )
      .message(`Настроено ${supportFeatures.length} поддерживающих компонентов`)
      .details({
        score: Math.round(supportScore * 100),
        hasCommands: !!commands,
        hasIndex: !!index,
        hasPlugins: !!plugins,
        supportFeatures,
      })
      .build();
  }
  async checkCypressReliability(analysis) {
    const config = analysis.config;
    const reliabilityIssues = analysis.issues.filter(i => i.type === 'reliability');
    let reliabilityScore = 0.4; // Базовая оценка
    // Проверяем настройки тайм-аутов
    if (config.defaultCommandTimeout) reliabilityScore += 0.1;
    if (config.pageLoadTimeout) reliabilityScore += 0.1;
    if (config.requestTimeout) reliabilityScore += 0.1;
    // Проверяем настройки записи
    if (config.video !== false) reliabilityScore += 0.15;
    if (config.screenshotOnRunFailure !== false) reliabilityScore += 0.15;
    const passed = reliabilityScore >= 0.6;
    return ResultBuilder_1.ResultBuilder.threshold(
      'cypress-reliability',
      'Надежность Cypress тестов',
      reliabilityScore,
      0.6
    )
      .message(
        passed ? 'Настройки надежности Cypress корректны' : 'Настройки надежности требуют улучшения'
      )
      .details({
        score: Math.round(reliabilityScore * 100),
        hasCommandTimeout: !!config.defaultCommandTimeout,
        hasPageLoadTimeout: !!config.pageLoadTimeout,
        hasRequestTimeout: !!config.requestTimeout,
        hasVideo: config.video !== false,
        hasScreenshots: config.screenshotOnRunFailure !== false,
        issues: reliabilityIssues.map(i => i.message),
      })
      .build();
  }
  async checkCypressPerformance(analysis) {
    const config = analysis.config;
    const performanceIssues = analysis.issues.filter(i => i.type === 'performance');
    let performanceScore = 0.4; // Базовая оценка
    // Проверяем headless режим
    if (config.headless !== false) performanceScore += 0.2;
    // Проверяем настройки видео (влияет на производительность)
    if (config.video === false) performanceScore += 0.2;
    // Проверяем разумные тайм-ауты
    if (config.defaultCommandTimeout && config.defaultCommandTimeout <= 10000)
      performanceScore += 0.1;
    if (config.pageLoadTimeout && config.pageLoadTimeout <= 30000) performanceScore += 0.1;
    const passed = performanceScore >= 0.6;
    return ResultBuilder_1.ResultBuilder.threshold(
      'cypress-performance',
      'Производительность Cypress',
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
        headless: config.headless !== false,
        videoDisabled: config.video === false,
        reasonableTimeouts: !!(
          config.defaultCommandTimeout &&
          config.defaultCommandTimeout <= 10000 &&
          config.pageLoadTimeout &&
          config.pageLoadTimeout <= 30000
        ),
        issues: performanceIssues.map(i => i.message),
      })
      .build();
  }
  async checkCypressBestPractices(analysis) {
    const config = analysis.config;
    let score = 0;
    const practices = [];
    // Проверяем лучшие практики
    if (config.baseUrl) {
      score += 0.25;
      practices.push('Настроен базовый URL');
    }
    if (config.supportFile) {
      score += 0.15;
      practices.push('Настроен файл поддержки');
    }
    if (analysis.supportFiles.commands) {
      score += 0.2;
      practices.push('Используются пользовательские команды');
    }
    const pageObjectFiles = analysis.testFiles.filter(f => f.usesPageObject).length;
    if (pageObjectFiles > 0) {
      score += 0.2;
      practices.push('Используется Page Object паттерн');
    }
    if (config.env) {
      score += 0.1;
      practices.push('Настроены переменные окружения');
    }
    if (config.video !== undefined) {
      score += 0.1;
      practices.push('Настроена запись видео');
    }
    const passed = score >= 0.6;
    return ResultBuilder_1.ResultBuilder.threshold(
      'cypress-best-practices',
      'Лучшие практики Cypress',
      score,
      0.6
    )
      .message(`Соблюдается ${practices.length} лучших практик`)
      .details({
        score: Math.round(score * 100),
        practices,
        practicesCount: practices.length,
        pageObjectUsage: pageObjectFiles,
      })
      .build();
  }
  async createCypressSummary(analysis) {
    if (!analysis.hasConfig) {
      return ResultBuilder_1.ResultBuilder.warning('cypress-summary', 'Сводка Cypress')
        .message('Cypress не настроен в проекте')
        .details({
          configured: false,
          recommendation: 'Установите и настройте Cypress для E2E тестирования',
        })
        .build();
    }
    const overallScore = this.calculateOverallCypressScore(analysis);
    const passed = overallScore >= 0.7;
    return ResultBuilder_1.ResultBuilder.threshold(
      'cypress-summary',
      'Общая оценка Cypress',
      overallScore,
      0.7
    )
      .message(
        passed ? 'Cypress хорошо интегрирован в проект' : 'Cypress интеграция требует улучшений'
      )
      .details({
        score: Math.round(overallScore * 100),
        configPath: analysis.configPath,
        testFilesCount: analysis.testFiles.length,
        totalTests: analysis.testFiles.reduce((sum, file) => sum + file.testCount, 0),
        issuesCount: analysis.issues.length,
        recommendations: analysis.recommendations,
        breakdown: {
          configuration: this.calculateCypressConfigurationScore(analysis.config, analysis.issues),
          testFiles: Math.min(
            1,
            analysis.testFiles.length / constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS
          ),
          supportFiles: this.calculateSupportFilesScore(analysis.supportFiles),
        },
      })
      .build();
  }
  // Вспомогательные методы
  async analyzeCypressIssues(project, config) {
    const issues = [];
    if (!config) {
      issues.push({
        type: 'missing',
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
        message: 'Конфигурация Cypress не найдена',
        suggestion: 'Создайте cypress.config.ts для настройки E2E тестов',
      });
      return issues;
    }
    // Проверяем базовые настройки
    if (!config.baseUrl) {
      issues.push({
        type: 'configuration',
        severity: SeverityLevel_1.SeverityLevel.LOW,
        message: 'Не указан базовый URL',
        suggestion: 'Добавьте baseUrl в конфигурацию',
        configKey: 'baseUrl',
      });
    }
    if (!config.supportFile) {
      issues.push({
        type: 'configuration',
        severity: SeverityLevel_1.SeverityLevel.LOW,
        message: 'Не настроен файл поддержки',
        suggestion: 'Добавьте supportFile для пользовательских команд',
        configKey: 'supportFile',
      });
    }
    if (!config.defaultCommandTimeout) {
      issues.push({
        type: 'reliability',
        severity: SeverityLevel_1.SeverityLevel.LOW,
        message: 'Не настроен тайм-аут команд по умолчанию',
        suggestion: 'Добавьте defaultCommandTimeout',
        configKey: 'defaultCommandTimeout',
      });
    }
    return issues;
  }
  calculateCypressConfigurationScore(config, issues) {
    let score = 0.4; // Базовая оценка
    if (config.baseUrl) score += 0.2;
    if (config.integrationFolder) score += 0.1;
    if (config.supportFile) score += 0.1;
    if (config.viewportWidth && config.viewportHeight) score += 0.1;
    if (config.defaultCommandTimeout) score += 0.1;
    // Снижаем за проблемы
    const configIssues = issues.filter(i => i.type === 'configuration');
    score -= configIssues.length * 0.05;
    return Math.max(0, Math.min(1, score));
  }
  calculateSupportFilesScore(supportFiles) {
    let score = 0.2; // Базовая оценка
    if (supportFiles.commands) score += 0.4;
    if (supportFiles.index) score += 0.3;
    if (supportFiles.plugins) score += 0.1;
    return score;
  }
  calculateOverallCypressScore(analysis) {
    if (!analysis.hasConfig) return 0;
    const config = analysis.config;
    const configScore = this.calculateCypressConfigurationScore(config, analysis.issues);
    const testFilesScore = Math.min(
      1,
      analysis.testFiles.length / constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS
    );
    const supportFilesScore = this.calculateSupportFilesScore(analysis.supportFiles);
    const issuesScore = Math.max(0, 1 - analysis.issues.length * 0.1);
    return configScore * 0.4 + testFilesScore * 0.3 + supportFilesScore * 0.2 + issuesScore * 0.1;
  }
  async hasCypressInDependencies(project) {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      return !!(pkg.dependencies?.cypress || pkg.devDependencies?.cypress);
    } catch {
      return false;
    }
  }
  getCypressTestFileTypes(testFiles) {
    const types = {};
    testFiles.forEach(file => {
      types[file.type] = (types[file.type] || 0) + 1;
    });
    return types;
  }
  generateCypressRecommendations(analysis) {
    const recommendations = [];
    if (!analysis.hasConfig) {
      recommendations.push('Установите Cypress и создайте cypress.config.ts');
      recommendations.push('Создайте первые E2E тесты в cypress/e2e/');
      return recommendations;
    }
    const config = analysis.config;
    if (!config.baseUrl) {
      recommendations.push('Добавьте baseUrl в конфигурацию для удобства тестирования');
    }
    if (!config.supportFile) {
      recommendations.push('Создайте cypress/support/commands.ts для пользовательских команд');
    }
    if (!analysis.supportFiles.commands) {
      recommendations.push('Создайте пользовательские команды для повторяющихся действий');
    }
    const pageObjectUsage = analysis.testFiles.filter(f => f.usesPageObject).length;
    if (pageObjectUsage === 0 && analysis.testFiles.length > 0) {
      recommendations.push('Используйте Page Object паттерн для лучшей организации тестов');
    }
    if (analysis.testFiles.length < constants_1.TESTING_THRESHOLDS.MIN_E2E_TESTS) {
      recommendations.push('Добавьте больше E2E тестов для критических пользовательских сценариев');
    }
    return recommendations;
  }
}
exports.CypressChecker = CypressChecker;
//# sourceMappingURL=CypressChecker.js.map
