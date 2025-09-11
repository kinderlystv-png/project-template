'use strict';
/**
 * Анализатор конфигурационных файлов тестовых фреймворков
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
exports.ConfigFileAnalyzer = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const constants_1 = require('../constants');
/**
 * Анализирует конфигурационные файлы различных тестовых фреймворков
 */
class ConfigFileAnalyzer {
  /**
   * Анализирует все конфигурационные файлы в проекте
   * @param project Проект для анализа
   * @returns Объект с найденными конфигурациями
   */
  async analyzeConfigs(project) {
    const result = {
      coverage: {
        enabled: false,
        thresholds: {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0,
        },
        exclude: [],
      },
      foundConfigs: [],
    };
    // Анализируем каждый тип конфигурации
    const vitestConfig = await this.analyzeVitestConfig(project);
    if (vitestConfig) {
      result.vitest = vitestConfig;
      result.foundConfigs.push('vitest');
    }
    const jestConfig = await this.analyzeJestConfig(project);
    if (jestConfig) {
      result.jest = jestConfig;
      result.foundConfigs.push('jest');
    }
    const playwrightConfig = await this.analyzePlaywrightConfig(project);
    if (playwrightConfig) {
      result.playwright = playwrightConfig;
      result.foundConfigs.push('playwright');
    }
    const cypressConfig = await this.analyzeCypressConfig(project);
    if (cypressConfig) {
      result.cypress = cypressConfig;
      result.foundConfigs.push('cypress');
    }
    // Объединяем настройки покрытия
    result.coverage = this.mergeCoverageConfigs([
      vitestConfig?.test?.coverage,
      jestConfig?.coverageThreshold,
      vitestConfig?.coverage,
    ]);
    return result;
  }
  /**
   * Анализирует конфигурацию Vitest
   * @param project Проект для анализа
   * @returns Конфигурация Vitest или null
   */
  async analyzeVitestConfig(project) {
    const configFiles = constants_1.CONFIG_FILES.vitest;
    for (const configFile of configFiles) {
      const configPath = path.join(project.path, configFile);
      if (await this.fileExists(configPath)) {
        try {
          const content = await fs.readFile(configPath, 'utf8');
          // Пытаемся извлечь конфигурацию
          if (configFile.endsWith('.json')) {
            return JSON.parse(content);
          } else {
            // Для TypeScript/JavaScript файлов извлекаем основную информацию
            return this.extractVitestConfigFromJS(content);
          }
        } catch (error) {
          console.warn(`Error reading Vitest config ${configFile}: ${error}`);
        }
      }
    }
    return null;
  }
  /**
   * Анализирует конфигурацию Jest
   * @param project Проект для анализа
   * @returns Конфигурация Jest или null
   */
  async analyzeJestConfig(project) {
    const configFiles = constants_1.CONFIG_FILES.jest;
    for (const configFile of configFiles) {
      const configPath = path.join(project.path, configFile);
      if (await this.fileExists(configPath)) {
        try {
          const content = await fs.readFile(configPath, 'utf8');
          if (configFile.endsWith('.json')) {
            return JSON.parse(content);
          } else {
            return this.extractJestConfigFromJS(content);
          }
        } catch (error) {
          console.warn(`Error reading Jest config ${configFile}: ${error}`);
        }
      }
    }
    return null;
  }
  /**
   * Анализирует конфигурацию Playwright
   * @param project Проект для анализа
   * @returns Конфигурация Playwright или null
   */
  async analyzePlaywrightConfig(project) {
    const configFiles = constants_1.CONFIG_FILES.playwright;
    for (const configFile of configFiles) {
      const configPath = path.join(project.path, configFile);
      if (await this.fileExists(configPath)) {
        try {
          const content = await fs.readFile(configPath, 'utf8');
          return this.extractPlaywrightConfigFromJS(content);
        } catch (error) {
          console.warn(`Error reading Playwright config ${configFile}: ${error}`);
        }
      }
    }
    return null;
  }
  /**
   * Анализирует конфигурацию Cypress
   * @param project Проект для анализа
   * @returns Конфигурация Cypress или null
   */
  async analyzeCypressConfig(project) {
    const configFiles = constants_1.CONFIG_FILES.cypress;
    for (const configFile of configFiles) {
      const configPath = path.join(project.path, configFile);
      if (await this.fileExists(configPath)) {
        try {
          const content = await fs.readFile(configPath, 'utf8');
          if (configFile.endsWith('.json')) {
            return JSON.parse(content);
          } else {
            return this.extractCypressConfigFromJS(content);
          }
        } catch (error) {
          console.warn(`Error reading Cypress config ${configFile}: ${error}`);
        }
      }
    }
    return null;
  }
  /**
   * Извлекает конфигурацию Vitest из JavaScript/TypeScript файла
   * @param content Содержимое файла
   * @returns Упрощенная конфигурация
   */
  extractVitestConfigFromJS(content) {
    const config = {
      detected: true,
      hasTestConfig: false,
      hasCoverage: false,
    };
    // Ищем настройки тестов
    if (content.includes('test:') || content.includes('test ')) {
      config.hasTestConfig = true;
    }
    // Ищем настройки покрытия
    if (content.includes('coverage') || content.includes('c8')) {
      config.hasCoverage = true;
      // Пытаемся найти threshold
      const thresholdMatch = content.match(/threshold[:\s]*{[^}]*global[^}]*(\d+)/);
      if (thresholdMatch) {
        config.coverageThreshold = parseInt(thresholdMatch[1]);
      }
    }
    // Ищем глобальные настройки
    if (content.includes('globals: true')) {
      config.hasGlobals = true;
    }
    return config;
  }
  /**
   * Извлекает конфигурацию Jest из JavaScript файла
   * @param content Содержимое файла
   * @returns Упрощенная конфигурация
   */
  extractJestConfigFromJS(content) {
    const config = {
      detected: true,
      hasCoverage: false,
    };
    // Ищем настройки покрытия
    if (content.includes('collectCoverage') || content.includes('coverageThreshold')) {
      config.hasCoverage = true;
      // Пытаемся найти threshold
      const thresholdMatch = content.match(/global[^}]*branches[:\s]*(\d+)/);
      if (thresholdMatch) {
        config.coverageThreshold = parseInt(thresholdMatch[1]);
      }
    }
    // Ищем testEnvironment
    const envMatch = content.match(/testEnvironment[:\s]*['"]([^'"]+)['"]/);
    if (envMatch) {
      config.testEnvironment = envMatch[1];
    }
    return config;
  }
  /**
   * Извлекает конфигурацию Playwright из файла
   * @param content Содержимое файла
   * @returns Упрощенная конфигурация
   */
  extractPlaywrightConfigFromJS(content) {
    const config = {
      detected: true,
      hasProjects: false,
      browsers: [],
    };
    // Ищем проекты
    if (content.includes('projects:') || content.includes('projects ')) {
      config.hasProjects = true;
    }
    // Ищем браузеры
    const browsers = ['chromium', 'firefox', 'webkit', 'chrome', 'edge'];
    browsers.forEach(browser => {
      if (content.includes(browser)) {
        config.browsers.push(browser);
      }
    });
    // Ищем параллельные воркеры
    const workersMatch = content.match(/workers[:\s]*(\d+)/);
    if (workersMatch) {
      config.workers = parseInt(workersMatch[1]);
    }
    return config;
  }
  /**
   * Извлекает конфигурацию Cypress из файла
   * @param content Содержимое файла
   * @returns Упрощенная конфигурация
   */
  extractCypressConfigFromJS(content) {
    const config = {
      detected: true,
      hasE2E: false,
      hasComponent: false,
    };
    // Ищем E2E настройки
    if (content.includes('e2e:') || content.includes('e2e ')) {
      config.hasE2E = true;
    }
    // Ищем компонентные тесты
    if (content.includes('component:') || content.includes('component ')) {
      config.hasComponent = true;
    }
    // Ищем baseUrl
    const baseUrlMatch = content.match(/baseUrl[:\s]*['"]([^'"]+)['"]/);
    if (baseUrlMatch) {
      config.baseUrl = baseUrlMatch[1];
    }
    return config;
  }
  /**
   * Объединяет настройки покрытия из разных источников
   * @param configs Массив конфигураций покрытия
   * @returns Объединенная конфигурация покрытия
   */
  mergeCoverageConfigs(configs) {
    const result = {
      enabled: false,
      thresholds: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
      exclude: [],
    };
    for (const config of configs) {
      if (!config) continue;
      // Проверяем наличие покрытия
      if (config.enabled !== undefined || config.collectCoverage || config.coverage) {
        result.enabled = true;
      }
      // Извлекаем threshold
      if (config.threshold && result.thresholds) {
        const threshold = config.threshold;
        result.thresholds.statements = Math.max(result.thresholds.statements || 0, threshold);
        result.thresholds.branches = Math.max(result.thresholds.branches || 0, threshold);
        result.thresholds.functions = Math.max(result.thresholds.functions || 0, threshold);
        result.thresholds.lines = Math.max(result.thresholds.lines || 0, threshold);
      }
      if (config.coverageThreshold && result.thresholds) {
        const threshold = config.coverageThreshold;
        result.thresholds.statements = Math.max(result.thresholds.statements || 0, threshold);
        result.thresholds.branches = Math.max(result.thresholds.branches || 0, threshold);
        result.thresholds.functions = Math.max(result.thresholds.functions || 0, threshold);
        result.thresholds.lines = Math.max(result.thresholds.lines || 0, threshold);
      }
      if (config.global?.branches && result.thresholds) {
        result.thresholds.branches = Math.max(
          result.thresholds.branches || 0,
          config.global.branches
        );
      }
      // Собираем исключения
      if (config.exclude && Array.isArray(config.exclude) && result.exclude) {
        result.exclude.push(...config.exclude);
      }
      if (
        config.collectCoverageFrom &&
        Array.isArray(config.collectCoverageFrom) &&
        result.exclude
      ) {
        // Jest использует отрицательные паттерны для исключений
        const excludePatterns = config.collectCoverageFrom
          .filter(pattern => pattern.startsWith('!'))
          .map(pattern => pattern.substring(1));
        result.exclude.push(...excludePatterns);
      }
    }
    // Удаляем дубликаты
    if (result.exclude) {
      result.exclude = [...new Set(result.exclude)];
    }
    return result;
  } /**
   * Проверяет существование файла
   * @param filePath Путь к файлу
   * @returns true, если файл существует
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Получает список всех конфигурационных файлов в проекте
   * @param project Проект для анализа
   * @returns Массив путей к найденным конфигурационным файлам
   */
  async listAllConfigFiles(project) {
    const foundFiles = [];
    // Собираем все возможные конфигурационные файлы
    const allConfigFiles = [
      ...constants_1.CONFIG_FILES.vitest,
      ...constants_1.CONFIG_FILES.jest,
      ...constants_1.CONFIG_FILES.playwright,
      ...constants_1.CONFIG_FILES.cypress,
    ];
    for (const configFile of allConfigFiles) {
      const configPath = path.join(project.path, configFile);
      if (await this.fileExists(configPath)) {
        foundFiles.push(configFile);
      }
    }
    return foundFiles;
  }
}
exports.ConfigFileAnalyzer = ConfigFileAnalyzer;
//# sourceMappingURL=ConfigFileAnalyzer.js.map
