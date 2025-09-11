'use strict';
/**
 * Специализированный анализатор для Vitest фреймворка
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
exports.VitestChecker = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const BaseChecker_1 = require('../../../core/base/BaseChecker');
const AnalysisCategory_1 = require('../../../types/AnalysisCategory');
const SeverityLevel_1 = require('../../../types/SeverityLevel');
const TestFileFinder_1 = require('../utils/TestFileFinder');
const ConfigFileAnalyzer_1 = require('../utils/ConfigFileAnalyzer');
const constants_1 = require('../constants');
/**
 * Анализатор для Vitest фреймворка
 */
class VitestChecker extends BaseChecker_1.BaseChecker {
  testFileFinder;
  configAnalyzer;
  constructor() {
    super(
      'vitest-checker',
      AnalysisCategory_1.AnalysisCategory.TESTING,
      'Анализирует конфигурацию и использование Vitest фреймворка',
      'Vitest Testing Framework',
      SeverityLevel_1.SeverityLevel.MEDIUM
    );
    this.testFileFinder = new TestFileFinder_1.TestFileFinder();
    this.configAnalyzer = new ConfigFileAnalyzer_1.ConfigFileAnalyzer();
  }
  /**
   * Выполняет полный анализ Vitest в проекте
   * @param project Проект для анализа
   * @returns Результаты проверки Vitest
   */
  async check(project) {
    const results = [];
    try {
      // 1. Проверяем наличие Vitest в зависимостях
      const hasVitest = await this.hasVitestDependency(project);
      if (!hasVitest) {
        results.push(
          this.createResult(
            'vitest-dependency',
            'Наличие Vitest',
            'Проверка установки Vitest в проекте',
            false,
            constants_1.MESSAGES.NO_VITEST_DEPENDENCY,
            0,
            100,
            SeverityLevel_1.SeverityLevel.MEDIUM,
            {
              checked: 'package.json',
              found: false,
              recommendations: ['Выполните: npm install -D vitest'],
            }
          )
        );
        return results; // Если нет Vitest, дальше проверять нет смысла
      }
      // 2. Анализируем конфигурацию Vitest
      const vitestConfig = await this.configAnalyzer.analyzeVitestConfig(project);
      if (!vitestConfig) {
        results.push(
          this.createResult(
            'vitest-config',
            'Конфигурация Vitest',
            'Проверка наличия конфигурационного файла Vitest',
            false,
            constants_1.MESSAGES.NO_VITEST_CONFIG,
            30,
            100,
            SeverityLevel_1.SeverityLevel.MEDIUM,
            {
              configFiles: [],
              found: false,
              recommendations: ['Создайте vitest.config.ts для настройки тестовой среды'],
            }
          )
        );
      } else {
        results.push(...this.analyzeVitestConfig(vitestConfig));
      }
      // 3. Проверяем настройку покрытия кода
      const coverageResults = await this.analyzeCoverageSetup(project, vitestConfig);
      results.push(...coverageResults);
      // 4. Анализируем тестовые файлы
      const testFiles = await this.testFileFinder.findTestFiles(project, ['vitest']);
      const testFileResults = this.analyzeTestFiles(testFiles);
      results.push(...testFileResults);
      // 5. Проверяем тестовые скрипты в package.json
      const scriptResults = await this.analyzeTestScripts(project);
      results.push(...scriptResults);
      // 6. Проверяем глобальные настройки
      const globalResults = this.analyzeGlobalSettings(vitestConfig);
      results.push(...globalResults);
    } catch (error) {
      results.push(
        this.createResult(
          'vitest-analysis-error',
          'Ошибка анализа Vitest',
          'Произошла ошибка при анализе Vitest',
          false,
          error instanceof Error ? error.message : String(error),
          0,
          100,
          SeverityLevel_1.SeverityLevel.HIGH,
          {
            error: error instanceof Error ? error.message : String(error),
            recommendations: ['Проверьте структуру проекта и конфигурацию Vitest'],
          }
        )
      );
    }
    return results;
  }
  /**
   * Проверяет наличие Vitest в зависимостях
   * @param project Проект для анализа
   * @returns true, если Vitest найден
   */
  async hasVitestDependency(project) {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');
      if (!(await this.fileExists(packageJsonPath))) {
        return false;
      }
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };
      return 'vitest' in allDependencies;
    } catch {
      return false;
    }
  }
  /**
   * Анализирует конфигурацию Vitest
   * @param config Конфигурация Vitest
   * @returns Результаты анализа конфигурации
   */
  analyzeVitestConfig(config) {
    const results = [];
    // Проверяем наличие test конфигурации
    if (!config.hasTestConfig) {
      results.push(
        this.createResult(
          'vitest-config-basic',
          'Базовая конфигурация Vitest',
          'Найден конфигурационный файл, но без детальных настроек тестирования',
          true,
          'Найден конфигурационный файл, но без детальных настроек тестирования',
          60,
          100,
          SeverityLevel_1.SeverityLevel.LOW,
          {
            hasTestConfig: false,
            configType: 'basic',
            recommendations: ['Добавьте секцию test в конфигурацию для детальных настроек'],
          }
        )
      );
    } else {
      results.push(
        this.createResult(
          'vitest-config-detailed',
          'Детальная конфигурация Vitest',
          'Найдена секция конфигурации тестов',
          true,
          'Найдена секция конфигурации тестов',
          90,
          100,
          SeverityLevel_1.SeverityLevel.LOW,
          {
            hasTestConfig: true,
            configType: 'detailed',
          }
        )
      );
    }
    // Проверяем глобальные настройки
    if (config.hasGlobals) {
      results.push(
        this.createResult(
          'vitest-globals-enabled',
          'Глобальные API Vitest',
          'Глобальные API включены (globals: true)',
          true,
          'Глобальные API включены (globals: true)',
          90,
          100,
          SeverityLevel_1.SeverityLevel.LOW,
          {
            globals: true,
            ease_of_use: 'high',
          }
        )
      );
    } else {
      results.push(
        this.createResult(
          'vitest-globals-disabled',
          'Глобальные API Vitest',
          'Глобальные API отключены, требуется импорт функций',
          true,
          'Глобальные API отключены, требуется импорт функций',
          70,
          100,
          SeverityLevel_1.SeverityLevel.LOW,
          {
            globals: false,
            recommendations: ['Рассмотрите включение globals: true для упрощения работы'],
          }
        )
      );
    }
    return results;
  }
  /**
   * Анализирует настройку покрытия кода
   * @param project Проект для анализа
   * @param vitestConfig Конфигурация Vitest
   * @returns Результаты анализа покрытия
   */
  async analyzeCoverageSetup(project, vitestConfig) {
    const results = [];
    // Проверяем настройку покрытия в конфигурации
    if (!vitestConfig?.hasCoverage) {
      results.push(
        this.createResult(
          'vitest-coverage-config',
          'Конфигурация покрытия кода',
          'Конфигурация покрытия кода не найдена',
          false,
          constants_1.MESSAGES.NO_COVERAGE_CONFIG,
          40,
          100,
          SeverityLevel_1.SeverityLevel.MEDIUM,
          {
            hasCoverage: false,
            config: 'not_found',
            recommendations: ['Добавьте секцию coverage в test конфигурацию'],
          }
        )
      );
    } else {
      results.push(
        this.createResult(
          'vitest-coverage-enabled',
          'Покрытие кода настроено',
          'Найдена конфигурация coverage в настройках Vitest',
          true,
          'Найдена конфигурация coverage в настройках Vitest',
          90,
          100,
          SeverityLevel_1.SeverityLevel.LOW,
          {
            hasCoverage: true,
            config: 'found',
          }
        )
      );
      // Проверяем threshold
      if (vitestConfig.coverageThreshold) {
        const threshold = vitestConfig.coverageThreshold;
        const score = threshold >= constants_1.TESTING_THRESHOLDS.COVERAGE_THRESHOLD ? 90 : 60;
        const passed = threshold >= constants_1.TESTING_THRESHOLDS.COVERAGE_THRESHOLD;
        results.push(
          this.createResult(
            'vitest-coverage-threshold',
            'Порог покрытия кода',
            `Порог покрытия установлен на ${threshold}%`,
            passed,
            `Порог покрытия кода: ${threshold}% (минимум: ${constants_1.TESTING_THRESHOLDS.COVERAGE_THRESHOLD}%)`,
            score,
            100,
            passed ? SeverityLevel_1.SeverityLevel.LOW : SeverityLevel_1.SeverityLevel.MEDIUM,
            {
              threshold,
              required: constants_1.TESTING_THRESHOLDS.COVERAGE_THRESHOLD,
              unit: '%',
              isGoodThreshold: passed,
            }
          )
        );
      }
    }
    // Проверяем наличие c8 для покрытия
    const hasC8 = await this.hasCoverageTool(project);
    if (!hasC8 && vitestConfig?.hasCoverage) {
      results.push(
        this.createResult(
          'vitest-coverage-builtin',
          'Встроенное покрытие Vitest',
          'Используется встроенное покрытие кода',
          true,
          'Используется встроенное покрытие кода',
          80,
          100,
          SeverityLevel_1.SeverityLevel.LOW,
          {
            toolType: 'builtin',
            recommendations: [
              'Для более детальных отчетов рассмотрите установку @vitest/coverage-v8',
            ],
          }
        )
      );
    }
    return results;
  }
  /**
   * Анализирует тестовые файлы
   * @param testFiles Найденные тестовые файлы
   * @returns Результаты анализа тестовых файлов
   */
  analyzeTestFiles(testFiles) {
    const results = [];
    const vitestFiles = testFiles.filter(
      file =>
        file.framework === 'vitest' || file.patterns.some(pattern => pattern.includes('vitest'))
    );
    if (vitestFiles.length === 0) {
      results.push(
        this.createResult(
          'vitest-test-files-missing',
          'Тестовые файлы Vitest',
          'Тестовые файлы для Vitest не найдены',
          false,
          constants_1.MESSAGES.NO_TEST_FILES,
          0,
          100,
          SeverityLevel_1.SeverityLevel.HIGH,
          {
            fileCount: 0,
            searchPatterns: ['vitest'],
            recommendations: ['Создайте тестовые файлы с расширением .test.ts или .spec.ts'],
          }
        )
      );
    } else {
      const totalTests = vitestFiles.reduce((sum, file) => sum + file.estimatedTests, 0);
      results.push(
        this.createResult(
          'vitest-test-files-found',
          'Тестовые файлы Vitest найдены',
          `Найдено ${vitestFiles.length} тестовых файлов`,
          true,
          `Найдено ${vitestFiles.length} тестовых файлов`,
          85,
          100,
          SeverityLevel_1.SeverityLevel.LOW,
          {
            fileCount: vitestFiles.length,
            estimatedTests: totalTests,
            files: vitestFiles.map(f => f.relativePath),
          }
        )
      );
      // Проверяем типы тестов
      const unitTests = vitestFiles.filter(f => f.type === 'unit');
      const integrationTests = vitestFiles.filter(f => f.type === 'integration');
      if (unitTests.length === 0) {
        results.push(
          this.createResult(
            'vitest-unit-tests-missing',
            'Unit тесты отсутствуют',
            'Не найдено файлов unit тестирования',
            false,
            'Не найдено файлов unit тестирования',
            30,
            100,
            SeverityLevel_1.SeverityLevel.MEDIUM,
            {
              unitTestCount: 0,
              totalTests: vitestFiles.length,
              recommendations: ['Создайте unit тесты для основных компонентов'],
            }
          )
        );
      }
      if (integrationTests.length === 0) {
        results.push(
          this.createResult(
            'vitest-integration-tests-missing',
            'Интеграционные тесты отсутствуют',
            'Не найдено файлов интеграционного тестирования',
            true,
            'Не найдено файлов интеграционного тестирования',
            70,
            100,
            SeverityLevel_1.SeverityLevel.LOW,
            {
              integrationTestCount: 0,
              recommendations: ['Рассмотрите добавление integration тестов'],
            }
          )
        );
      }
    }
    return results;
  } /**
   * Анализирует тестовые скрипты в package.json
   * @param project Проект для анализа
   * @returns Результаты анализа скриптов
   */
  async analyzeTestScripts(project) {
    const results = [];
    try {
      const packageJsonPath = path.join(project.path, 'package.json');
      if (!(await this.fileExists(packageJsonPath))) {
        return results;
      }
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      if (!packageJson.scripts) {
        results.push(
          this.createResult(
            'vitest-scripts-missing',
            'NPM скрипты отсутствуют',
            'Нет секции scripts в package.json',
            false,
            'Нет секции scripts в package.json',
            20,
            100,
            SeverityLevel_1.SeverityLevel.MEDIUM,
            {
              scriptsSection: false,
              recommendations: ['Добавьте scripts для test, test:watch, test:coverage'],
            }
          )
        );
        return results;
      }
      const scripts = packageJson.scripts;
      // Проверяем основной test скрипт
      if (!scripts.test || !scripts.test.includes('vitest')) {
        results.push(
          this.createResult(
            'vitest-test-script-missing',
            'Test скрипт отсутствует',
            'Отсутствует test скрипт для Vitest',
            false,
            'Отсутствует test скрипт для Vitest',
            40,
            100,
            SeverityLevel_1.SeverityLevel.MEDIUM,
            {
              hasTestScript: false,
              currentScript: scripts.test || null,
              recommendations: ['Добавьте: "test": "vitest"'],
            }
          )
        );
      }
      // Проверяем watch режим
      if (!scripts['test:watch'] && !scripts['test:dev']) {
        results.push(
          this.createResult(
            'vitest-watch-script-missing',
            'Watch скрипт отсутствует',
            'Нет скрипта для запуска тестов в watch режиме',
            true,
            'Нет скрипта для запуска тестов в watch режиме',
            70,
            100,
            SeverityLevel_1.SeverityLevel.LOW,
            {
              hasWatchScript: false,
              recommendations: ['Добавьте: "test:watch": "vitest --watch"'],
            }
          )
        );
      }
      // Проверяем coverage скрипт
      if (!scripts['test:coverage'] && !scripts.coverage) {
        results.push(
          this.createResult(
            'vitest-coverage-script-missing',
            'Coverage скрипт отсутствует',
            'Нет скрипта для измерения покрытия кода',
            true,
            'Нет скрипта для измерения покрытия кода',
            70,
            100,
            SeverityLevel_1.SeverityLevel.LOW,
            {
              hasCoverageScript: false,
              recommendations: ['Добавьте: "test:coverage": "vitest --coverage"'],
            }
          )
        );
      }
    } catch (error) {
      results.push(
        this.createResult(
          'vitest-package-json-error',
          'Ошибка анализа package.json',
          'Не удалось проанализировать package.json',
          false,
          error instanceof Error ? error.message : String(error),
          0,
          100,
          SeverityLevel_1.SeverityLevel.HIGH,
          {
            error: error instanceof Error ? error.message : String(error),
            recommendations: ['Проверьте синтаксис package.json'],
          }
        )
      );
    }
    return results;
  }
  /**
   * Анализирует глобальные настройки Vitest
   * @param config Конфигурация Vitest
   * @returns Результаты анализа глобальных настроек
   */
  analyzeGlobalSettings(config) {
    const results = [];
    if (!config) {
      return results;
    }
    // Проверяем environment настройки
    if (config.testEnvironment && config.testEnvironment !== 'node') {
      results.push(
        this.createResult(
          'vitest-test-environment',
          'Тестовое окружение',
          `Используется тестовое окружение: ${config.testEnvironment}`,
          true,
          `Используется тестовое окружение: ${config.testEnvironment}`,
          80,
          100,
          SeverityLevel_1.SeverityLevel.LOW,
          {
            environment: config.testEnvironment,
            isDefault: false,
          }
        )
      );
    }
    return results;
  }
  /**
   * Проверяет наличие инструмента покрытия кода
   * @param project Проект для анализа
   * @returns true, если найден инструмент покрытия
   */
  async hasCoverageTool(project) {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');
      if (!(await this.fileExists(packageJsonPath))) {
        return false;
      }
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      const coverageTools = [
        'c8',
        '@vitest/coverage-v8',
        '@vitest/coverage-c8',
        '@vitest/coverage-istanbul',
      ];
      return coverageTools.some(tool => tool in allDependencies);
    } catch {
      return false;
    }
  }
  /**
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
}
exports.VitestChecker = VitestChecker;
//# sourceMappingURL=VitestChecker.js.map
