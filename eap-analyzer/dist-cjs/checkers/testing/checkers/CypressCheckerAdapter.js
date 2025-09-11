'use strict';
/**
 * Адаптер CypressChecker для интеграции с AnalysisOrchестратором
 * Анализирует конфигурацию и настройки Cypress E2E тестирования
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
exports.CypressCheckerAdapter = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const checker_js_1 = require('../../../core/checker.js');
/**
 * Адаптер для анализа Cypress E2E тестирования, совместимый с AnalysisOrchestrator
 */
class CypressCheckerAdapter extends checker_js_1.BaseChecker {
  name = 'cypress-checker';
  category = 'quality';
  description = 'Анализирует конфигурацию и качество Cypress E2E тестов';
  /**
   * Выполняет проверку Cypress конфигурации и тестов
   */
  async check(context) {
    const projectPath = context.projectPath;
    try {
      // 1. Проверяем наличие Cypress в зависимостях
      const hasCypressDep = await this.hasCypressDependency(projectPath);
      if (!hasCypressDep) {
        return this.createResult(
          false,
          5,
          'Cypress не найден в зависимостях проекта',
          { reason: 'no_dependency' },
          [
            'Установите Cypress: npm install --save-dev cypress',
            'Инициализируйте Cypress: npx cypress open',
          ]
        );
      }
      // 2. Анализируем конфигурацию Cypress
      const config = await this.analyzeCypressConfig(projectPath);
      if (!config.configFound) {
        return this.createResult(
          false,
          15,
          'Конфигурационный файл Cypress не найден',
          {
            reason: 'no_config',
            searchedPaths: ['cypress.config.ts', 'cypress.config.js', 'cypress.json'],
          },
          [
            'Создайте cypress.config.ts',
            'Настройте базовую конфигурацию E2E тестов',
            'Укажите e2e.specPattern и другие настройки',
          ]
        );
      }
      // 3. Проверяем тестовые файлы
      if (config.testsFound === 0) {
        return this.createResult(
          false,
          30,
          `Cypress конфигурация найдена, но E2E тесты отсутствуют`,
          {
            ...config,
            reason: 'no_tests',
          },
          [
            'Создайте E2E тесты в директории cypress/e2e',
            'Добавьте файлы с расширением .cy.ts или .cy.js',
            'Изучите документацию Cypress для написания первых тестов',
          ]
        );
      }
      // 4. Вычисляем оценку
      let score = 40; // Базовые баллы за наличие конфигурации и тестов
      // Бонусы за качество конфигурации
      if (config.hasFixtures) score += 10;
      if (config.hasCustomCommands) score += 10;
      if (config.hasReports) score += 15;
      if (config.hasVideos) score += 5;
      if (config.hasScreenshots) score += 5;
      if (config.hasBaseUrl) score += 10;
      if (config.hasViewports) score += 5;
      if (config.testsFound >= 3) score += 10;
      if (config.testsFound >= 10) score += 5;
      const recommendations = [];
      // Рекомендации по улучшению
      if (!config.hasFixtures) {
        recommendations.push('Создайте fixtures для тестовых данных');
      }
      if (!config.hasCustomCommands) {
        recommendations.push('Добавьте custom commands для переиспользования кода');
      }
      if (!config.hasReports) {
        recommendations.push('Настройте генерацию отчетов (Mochawesome, JUnit)');
      }
      if (!config.hasBaseUrl) {
        recommendations.push('Настройте baseUrl для упрощения тестов');
      }
      if (!config.hasViewports) {
        recommendations.push('Добавьте тестирование различных разрешений экрана');
      }
      if (config.testsFound < 5) {
        recommendations.push('Увеличьте покрытие E2E тестами ключевых пользовательских сценариев');
      }
      const passed = score >= 70;
      return this.createResult(
        passed,
        Math.min(score, 100),
        `Cypress E2E: найдено ${config.testsFound} тестов, конфигурация ${config.configFound ? 'настроена' : 'отсутствует'}`,
        config,
        recommendations
      );
    } catch (error) {
      return this.createResult(
        false,
        0,
        'Ошибка при анализе Cypress конфигурации',
        { error: error instanceof Error ? error.message : String(error) },
        ['Проверьте целостность файлов конфигурации', 'Убедитесь что Cypress корректно установлен']
      );
    }
  }
  /**
   * Проверяет наличие Cypress в зависимостях
   */
  async hasCypressDependency(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!this.fileExists(packageJsonPath)) return false;
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      return !!(packageJson.dependencies?.['cypress'] || packageJson.devDependencies?.['cypress']);
    } catch {
      return false;
    }
  }
  /**
   * Анализирует конфигурацию Cypress
   */
  async analyzeCypressConfig(projectPath) {
    const configPaths = ['cypress.config.ts', 'cypress.config.js', 'cypress.json'];
    for (const configPath of configPaths) {
      const fullPath = path.join(projectPath, configPath);
      if (this.fileExists(fullPath)) {
        try {
          const config = await this.parseCypressConfig(fullPath, projectPath);
          return { ...config, configFound: true, configPath };
        } catch (error) {
          // Ошибка парсинга конфигурации
          continue;
        }
      }
    }
    return {
      configFound: false,
      testsFound: 0,
      hasFixtures: false,
      hasCustomCommands: false,
      hasReports: false,
      hasVideos: false,
      hasScreenshots: false,
      hasBaseUrl: false,
      hasViewports: false,
    };
  }
  /**
   * Парсит конфигурационный файл Cypress
   */
  async parseCypressConfig(configPath, projectPath) {
    try {
      const content = await fs.readFile(configPath, 'utf8');
      // Подсчитываем тесты
      const testsFound = await this.countCypressTests(projectPath);
      // Проверяем fixtures
      const hasFixtures = await this.checkFixtures(projectPath);
      // Проверяем custom commands
      const hasCustomCommands = await this.checkCustomCommands(projectPath);
      // Проверяем конфигурацию
      const hasReports =
        content.includes('reporter') ||
        content.includes('mochawesome') ||
        content.includes('junit');
      const hasVideos = content.includes('video') && !content.includes('video: false');
      const hasScreenshots =
        content.includes('screenshot') && !content.includes('screenshotOnRunFailure: false');
      const hasBaseUrl = content.includes('baseUrl');
      const hasViewports = content.includes('viewportWidth') || content.includes('viewport');
      return {
        testsFound,
        hasFixtures,
        hasCustomCommands,
        hasReports,
        hasVideos,
        hasScreenshots,
        hasBaseUrl,
        hasViewports,
      };
    } catch {
      throw new Error('Не удалось проанализировать конфигурацию Cypress');
    }
  }
  /**
   * Подсчитывает количество Cypress тестов
   */
  async countCypressTests(projectPath) {
    const testDirs = ['cypress/e2e', 'cypress/integration', 'cypress/tests'];
    let totalTests = 0;
    for (const testDir of testDirs) {
      try {
        const testDirPath = path.join(projectPath, testDir);
        const files = await this.getAllFiles(testDirPath);
        const cypressTests = files.filter(
          file =>
            file.endsWith('.cy.ts') ||
            file.endsWith('.cy.js') ||
            file.endsWith('.spec.ts') ||
            file.endsWith('.spec.js') ||
            file.endsWith('.test.ts') ||
            file.endsWith('.test.js')
        );
        totalTests += cypressTests.length;
      } catch {
        // Директория не существует
      }
    }
    return totalTests;
  }
  /**
   * Проверяет наличие fixtures
   */
  async checkFixtures(projectPath) {
    const fixturesPath = path.join(projectPath, 'cypress/fixtures');
    try {
      const files = await fs.readdir(fixturesPath);
      return files.length > 0;
    } catch {
      return false;
    }
  }
  /**
   * Проверяет наличие custom commands
   */
  async checkCustomCommands(projectPath) {
    const commandsPaths = [
      'cypress/support/commands.ts',
      'cypress/support/commands.js',
      'cypress/support/e2e.ts',
      'cypress/support/e2e.js',
    ];
    for (const commandsPath of commandsPaths) {
      const fullPath = path.join(projectPath, commandsPath);
      if (this.fileExists(fullPath)) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          // Проверяем наличие кастомных команд
          if (
            content.includes('Cypress.Commands.add') ||
            content.includes('cy.') ||
            content.length > 200
          ) {
            // Больше чем базовый шаблон
            return true;
          }
        } catch {
          // Ошибка чтения файла
        }
      }
    }
    return false;
  }
  /**
   * Рекурсивно получает все файлы в директории
   */
  async getAllFiles(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
      return files;
    } catch {
      return [];
    }
  }
}
exports.CypressCheckerAdapter = CypressCheckerAdapter;
//# sourceMappingURL=CypressCheckerAdapter.js.map
