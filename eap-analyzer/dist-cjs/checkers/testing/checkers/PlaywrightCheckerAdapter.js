'use strict';
/**
 * Адаптер PlaywrightChecker для интеграции с AnalysisOrchestrator
 * Анализирует конфигурацию и настройки Playwright E2E тестирования
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
exports.PlaywrightCheckerAdapter = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const checker_js_1 = require('../../../core/checker.js');
/**
 * Адаптер для анализа Playwright E2E тестирования, совместимый с AnalysisOrchestrator
 */
class PlaywrightCheckerAdapter extends checker_js_1.BaseChecker {
  name = 'playwright-checker';
  category = 'quality';
  description = 'Анализирует конфигурацию и качество Playwright E2E тестов';
  /**
   * Выполняет проверку Playwright конфигурации и тестов
   */
  async check(context) {
    const projectPath = context.projectPath;
    try {
      // 1. Проверяем наличие Playwright в зависимостях
      const hasPlaywrightDep = await this.hasPlaywrightDependency(projectPath);
      if (!hasPlaywrightDep) {
        return this.createResult(
          false,
          5,
          'Playwright не найден в зависимостях проекта',
          { reason: 'no_dependency' },
          [
            'Установите Playwright: npm install --save-dev @playwright/test',
            'Инициализируйте Playwright: npx playwright install',
          ]
        );
      }
      // 2. Анализируем конфигурацию Playwright
      const config = await this.analyzePlaywrightConfig(projectPath);
      if (!config.configFound) {
        return this.createResult(
          false,
          15,
          'Конфигурационный файл Playwright не найден',
          {
            reason: 'no_config',
            searchedPaths: ['playwright.config.ts', 'playwright.config.js'],
          },
          [
            'Создайте playwright.config.ts',
            'Настройте базовую конфигурацию тестов',
            'Укажите testDir и другие базовые настройки',
          ]
        );
      }
      // 3. Проверяем тестовые файлы
      if (config.testsFound === 0) {
        return this.createResult(
          false,
          30,
          `Playwright конфигурация найдена, но E2E тесты отсутствуют`,
          {
            ...config,
            reason: 'no_tests',
          },
          [
            `Создайте E2E тесты в директории ${config.testDir || 'tests/e2e'}`,
            'Добавьте файлы с расширением .spec.ts или .test.ts',
            'Изучите документацию Playwright для написания первых тестов',
          ]
        );
      }
      // 4. Вычисляем оценку
      let score = 40; // Базовые баллы за наличие конфигурации и тестов
      // Бонусы за качество конфигурации
      if (config.hasReports) score += 15;
      if (config.parallelConfig) score += 10;
      if (config.retryConfig) score += 10;
      if (config.browsers.length >= 2) score += 10;
      if (config.testsFound >= 3) score += 10;
      if (config.testsFound >= 10) score += 5;
      const recommendations = [];
      // Рекомендации по улучшению
      if (!config.hasReports) {
        recommendations.push('Настройте генерацию отчетов (HTML, JUnit)');
      }
      if (!config.parallelConfig) {
        recommendations.push('Включите параллельное выполнение тестов для ускорения');
      }
      if (!config.retryConfig) {
        recommendations.push('Настройте retry механизм для нестабильных тестов');
      }
      if (config.browsers.length < 2) {
        recommendations.push('Добавьте тестирование в нескольких браузерах');
      }
      if (config.testsFound < 5) {
        recommendations.push('Увеличьте покрытие E2E тестами критических сценариев');
      }
      const passed = score >= 70;
      return this.createResult(
        passed,
        Math.min(score, 100),
        `Playwright E2E: найдено ${config.testsFound} тестов, ${config.browsers.length} браузеров`,
        config,
        recommendations
      );
    } catch (error) {
      return this.createResult(
        false,
        0,
        'Ошибка при анализе Playwright конфигурации',
        { error: error instanceof Error ? error.message : String(error) },
        ['Проверьте целостность файлов конфигурации', 'Убедитесь что проект корректно настроен']
      );
    }
  }
  /**
   * Проверяет наличие Playwright в зависимостях
   */
  async hasPlaywrightDependency(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!this.fileExists(packageJsonPath)) return false;
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      return !!(
        packageJson.dependencies?.['@playwright/test'] ||
        packageJson.devDependencies?.['@playwright/test'] ||
        packageJson.dependencies?.['playwright'] ||
        packageJson.devDependencies?.['playwright']
      );
    } catch {
      return false;
    }
  }
  /**
   * Анализирует конфигурацию Playwright
   */
  async analyzePlaywrightConfig(projectPath) {
    const configPaths = ['playwright.config.ts', 'playwright.config.js', 'playwright.config.mjs'];
    for (const configPath of configPaths) {
      const fullPath = path.join(projectPath, configPath);
      if (this.fileExists(fullPath)) {
        try {
          const config = await this.parsePlaywrightConfig(fullPath, projectPath);
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
      hasReports: false,
      browsers: [],
      parallelConfig: false,
      retryConfig: false,
    };
  }
  /**
   * Парсит конфигурационный файл Playwright
   */
  async parsePlaywrightConfig(configPath, projectPath) {
    try {
      const content = await fs.readFile(configPath, 'utf8');
      // Извлекаем testDir
      const testDirMatch = content.match(/testDir:\s*['"`]([^'"`]+)['"`]/);
      const testDir = testDirMatch ? testDirMatch[1] : 'tests';
      // Подсчитываем тесты
      const testsFound = await this.countTestFiles(projectPath, testDir);
      // Проверяем конфигурацию отчетов
      const hasReports =
        content.includes('reporter') && (content.includes('html') || content.includes('junit'));
      // Проверяем браузеры
      const browsers = this.extractBrowsers(content);
      // Проверяем параллельность
      const parallelConfig = content.includes('fullyParallel') || content.includes('workers');
      // Проверяем retry
      const retryConfig = content.includes('retries');
      return {
        testDir,
        testsFound,
        hasReports,
        browsers,
        parallelConfig,
        retryConfig,
      };
    } catch {
      throw new Error('Не удалось проанализировать конфигурацию');
    }
  }
  /**
   * Подсчитывает количество тестовых файлов
   */
  async countTestFiles(projectPath, testDir) {
    try {
      const testDirPath = path.join(projectPath, testDir);
      const files = await this.getAllFiles(testDirPath);
      return files.filter(
        file =>
          file.endsWith('.spec.ts') ||
          file.endsWith('.spec.js') ||
          file.endsWith('.test.ts') ||
          file.endsWith('.test.js') ||
          file.endsWith('.e2e.ts') ||
          file.endsWith('.e2e.js')
      ).length;
    } catch {
      return 0;
    }
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
  /**
   * Извлекает список браузеров из конфигурации
   */
  extractBrowsers(content) {
    const browsers = [];
    // Ищем стандартные браузеры Playwright
    if (content.includes('chromium')) browsers.push('chromium');
    if (content.includes('firefox')) browsers.push('firefox');
    if (content.includes('webkit')) browsers.push('webkit');
    if (content.includes('chrome')) browsers.push('chrome');
    if (content.includes('edge')) browsers.push('edge');
    // Если браузеры явно не указаны, предполагаем chromium по умолчанию
    if (browsers.length === 0 && content.includes('devices')) {
      browsers.push('chromium');
    }
    return browsers;
  }
}
exports.PlaywrightCheckerAdapter = PlaywrightCheckerAdapter;
//# sourceMappingURL=PlaywrightCheckerAdapter.js.map
