/**
 * Проверки для Эталонного Модуля Тестирования (ЭМТ)
 */

import * as path from 'path';
import {
  Check,
  CheckContext,
  CheckResult,
  ComponentResult,
  StandardComponent,
} from '../types/index.js';
import { FileSystemUtils } from '../utils/index.js';

export class EMTChecker {
  static async checkComponent(context: CheckContext): Promise<ComponentResult> {
    const component: StandardComponent = {
      name: 'EMT (Эталонный Модуль Тестирования)',
      description: 'Комплексная система тестирования проекта',
      weight: 10,
      checks: this.getChecks(),
      critical: true,
    };

    const startTime = Date.now();
    const checkResults: CheckResult[] = [];

    for (const check of component.checks) {
      const result = await this.executeCheck(check, context);
      checkResults.push(result);
    }

    const passed = checkResults.filter(r => r.passed);
    const failed = checkResults.filter(r => !r.passed);
    const score = passed.reduce((sum, r) => sum + r.score, 0);
    const maxScore = checkResults.reduce((sum, r) => sum + r.maxScore, 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return {
      component,
      score,
      maxScore,
      percentage,
      passed,
      failed,
      warnings: [],
      recommendations: this.generateRecommendations(failed),
      duration: Date.now() - startTime,
    };
  }

  private static getChecks(): Check[] {
    return [
      {
        id: 'emt.vitest.installed',
        name: 'Vitest установлен',
        description: 'Проверка наличия современного тестового фреймворка Vitest',
        category: 'testing',
        score: 15,
        critical: true,
        level: 'critical',
        tags: ['vitest', 'testing', 'framework'],
      },
      {
        id: 'emt.vitest.config',
        name: 'Конфигурация Vitest',
        description: 'Наличие файла конфигурации vitest.config.ts',
        category: 'testing',
        score: 10,
        level: 'high',
        tags: ['vitest', 'config'],
      },
      {
        id: 'emt.unit.tests',
        name: 'Unit тесты',
        description: 'Наличие unit тестов в проекте',
        category: 'testing',
        score: 15,
        critical: true,
        level: 'critical',
        tags: ['unit-tests', 'testing'],
      },
      {
        id: 'emt.integration.tests',
        name: 'Integration тесты',
        description: 'Наличие integration тестов',
        category: 'testing',
        score: 15,
        level: 'high',
        tags: ['integration-tests', 'testing'],
      },
      {
        id: 'emt.e2e.tests',
        name: 'E2E тесты',
        description: 'Наличие end-to-end тестов',
        category: 'testing',
        score: 15,
        level: 'high',
        tags: ['e2e-tests', 'playwright'],
      },
      {
        id: 'emt.playwright.installed',
        name: 'Playwright установлен',
        description: 'Наличие Playwright для E2E тестирования',
        category: 'testing',
        score: 10,
        level: 'medium',
        tags: ['playwright', 'e2e'],
      },
      {
        id: 'emt.coverage.config',
        name: 'Настройки покрытия',
        description: 'Конфигурация code coverage',
        category: 'testing',
        score: 10,
        level: 'high',
        tags: ['coverage', 'quality'],
      },
      {
        id: 'emt.coverage.threshold',
        name: 'Пороги покрытия',
        description: 'Установлены пороги покрытия кода (>=75%)',
        category: 'testing',
        score: 10,
        level: 'high',
        tags: ['coverage', 'threshold'],
      },
      {
        id: 'emt.test.scripts',
        name: 'NPM скрипты для тестов',
        description: 'Наличие скриптов test, test:coverage, test:watch',
        category: 'testing',
        score: 5,
        level: 'medium',
        tags: ['npm-scripts', 'automation'],
      },
      {
        id: 'emt.performance.tests',
        name: 'Performance тесты',
        description: 'Наличие тестов производительности',
        category: 'testing',
        score: 5,
        level: 'optional',
        tags: ['performance', 'benchmarks'],
      },
    ];
  }

  private static async executeCheck(check: Check, context: CheckContext): Promise<CheckResult> {
    const startTime = Date.now();
    let passed = false;
    let details = '';
    const recommendations: string[] = [];

    try {
      switch (check.id) {
        case 'emt.vitest.installed':
          passed = await this.checkVitestInstalled(context);
          break;

        case 'emt.vitest.config':
          passed = await this.checkVitestConfig(context);
          break;

        case 'emt.unit.tests': {
          const unitResult = await this.checkUnitTests(context);
          passed = unitResult.passed;
          details = unitResult.details;
          break;
        }

        case 'emt.integration.tests': {
          const integrationResult = await this.checkIntegrationTests(context);
          passed = integrationResult.passed;
          details = integrationResult.details;
          break;
        }

        case 'emt.e2e.tests': {
          const e2eResult = await this.checkE2ETests(context);
          passed = e2eResult.passed;
          details = e2eResult.details;
          break;
        }

        case 'emt.playwright.installed':
          passed = await this.checkPlaywrightInstalled(context);
          break;

        case 'emt.coverage.config': {
          const coverageResult = await this.checkCoverageConfig(context);
          passed = coverageResult.passed;
          details = coverageResult.details;
          break;
        }

        case 'emt.coverage.threshold': {
          const thresholdResult = await this.checkCoverageThreshold(context);
          passed = thresholdResult.passed;
          details = thresholdResult.details;
          break;
        }

        case 'emt.test.scripts': {
          const scriptsResult = await this.checkTestScripts(context);
          passed = scriptsResult.passed;
          details = scriptsResult.details;
          break;
        }

        case 'emt.performance.tests': {
          const perfResult = await this.checkPerformanceTests(context);
          passed = perfResult.passed;
          details = perfResult.details;
          break;
        }

        default:
          passed = false;
          details = 'Unknown check';
      }

      if (!passed) {
        recommendations.push(...this.getCheckRecommendations(check.id));
      }
    } catch (error) {
      passed = false;
      details = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return {
      check,
      passed,
      score: passed ? check.score : 0,
      maxScore: check.score,
      details,
      recommendations,
      duration: Date.now() - startTime,
    };
  }

  // Проверки компонентов

  private static async checkVitestInstalled(context: CheckContext): Promise<boolean> {
    const packageJsonPath = path.join(context.projectPath, 'package.json');
    const packageJson = await FileSystemUtils.readJsonFile(packageJsonPath);

    if (!packageJson) return false;

    const allDeps: Record<string, string> = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    return !!allDeps.vitest;
  }

  private static async checkVitestConfig(context: CheckContext): Promise<boolean> {
    const configFiles = [
      'vitest.config.ts',
      'vitest.config.js',
      'vite.config.ts',
      'vite.config.js',
    ];

    for (const file of configFiles) {
      const filePath = path.join(context.projectPath, file);
      if (await FileSystemUtils.fileExists(filePath)) {
        // Проверим, что в файле есть конфигурация для vitest
        const content = await FileSystemUtils.readTextFile(filePath);
        if (content && (content.includes('vitest') || content.includes('test:'))) {
          return true;
        }
      }
    }

    return false;
  }

  private static async checkUnitTests(
    context: CheckContext
  ): Promise<{ passed: boolean; details: string }> {
    const testDirs = ['tests/unit', 'test/unit', 'src/__tests__', '__tests__'];
    let foundTests = 0;

    for (const dir of testDirs) {
      const dirPath = path.join(context.projectPath, dir);
      if (await FileSystemUtils.dirExists(dirPath)) {
        const files = await FileSystemUtils.findFiles('**/*.{test,spec}.{js,ts,jsx,tsx}', dirPath);
        foundTests += files.length;
      }
    }

    // Также ищем unit тесты в src
    const srcTests = await FileSystemUtils.findFiles(
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      context.projectPath
    );
    foundTests += srcTests.length;

    const passed = foundTests > 0;
    const details = `Found ${foundTests} unit test files`;

    return { passed, details };
  }

  private static async checkIntegrationTests(
    context: CheckContext
  ): Promise<{ passed: boolean; details: string }> {
    const testDirs = ['tests/integration', 'test/integration'];
    let foundTests = 0;

    for (const dir of testDirs) {
      const dirPath = path.join(context.projectPath, dir);
      if (await FileSystemUtils.dirExists(dirPath)) {
        const files = await FileSystemUtils.findFiles('**/*.{test,spec}.{js,ts,jsx,tsx}', dirPath);
        foundTests += files.length;
      }
    }

    const passed = foundTests > 0;
    const details = `Found ${foundTests} integration test files`;

    return { passed, details };
  }

  private static async checkE2ETests(
    context: CheckContext
  ): Promise<{ passed: boolean; details: string }> {
    const testDirs = ['tests/e2e', 'test/e2e', 'e2e'];
    let foundTests = 0;

    for (const dir of testDirs) {
      const dirPath = path.join(context.projectPath, dir);
      if (await FileSystemUtils.dirExists(dirPath)) {
        const files = await FileSystemUtils.findFiles('**/*.{test,spec}.{js,ts,jsx,tsx}', dirPath);
        foundTests += files.length;
      }
    }

    const passed = foundTests > 0;
    const details = `Found ${foundTests} E2E test files`;

    return { passed, details };
  }

  private static async checkPlaywrightInstalled(context: CheckContext): Promise<boolean> {
    const packageJsonPath = path.join(context.projectPath, 'package.json');
    const packageJson = await FileSystemUtils.readJsonFile(packageJsonPath);

    if (!packageJson) return false;

    const allDeps: Record<string, string> = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    return !!allDeps['@playwright/test'];
  }

  private static async checkCoverageConfig(
    context: CheckContext
  ): Promise<{ passed: boolean; details: string }> {
    const configFiles = ['vitest.config.ts', 'vitest.config.js'];

    for (const file of configFiles) {
      const filePath = path.join(context.projectPath, file);
      if (await FileSystemUtils.fileExists(filePath)) {
        const content = await FileSystemUtils.readTextFile(filePath);
        if (content && content.includes('coverage')) {
          return { passed: true, details: `Coverage configured in ${file}` };
        }
      }
    }

    return { passed: false, details: 'Coverage configuration not found' };
  }

  private static async checkCoverageThreshold(
    context: CheckContext
  ): Promise<{ passed: boolean; details: string }> {
    const configFiles = ['vitest.config.ts', 'vitest.config.js'];

    for (const file of configFiles) {
      const filePath = path.join(context.projectPath, file);
      if (await FileSystemUtils.fileExists(filePath)) {
        const content = await FileSystemUtils.readTextFile(filePath);
        if (content && content.includes('thresholds')) {
          // Проверяем, что пороги >= 75%
          const hasGoodThresholds =
            content.includes('75') || content.includes('80') || content.includes('90');
          if (hasGoodThresholds) {
            return { passed: true, details: `Coverage thresholds found in ${file}` };
          }
        }
      }
    }

    return { passed: false, details: 'Coverage thresholds not configured or too low' };
  }

  private static async checkTestScripts(
    context: CheckContext
  ): Promise<{ passed: boolean; details: string }> {
    const packageJsonPath = path.join(context.projectPath, 'package.json');
    const packageJson = await FileSystemUtils.readJsonFile(packageJsonPath);

    if (!packageJson) {
      return { passed: false, details: 'package.json not found' };
    }

    const scripts: Record<string, string> = (packageJson.scripts as Record<string, string>) || {};
    const requiredScripts = ['test'];
    const optionalScripts = ['test:coverage', 'test:watch', 'test:run'];

    let foundRequired = 0;
    let foundOptional = 0;

    requiredScripts.forEach(script => {
      if (scripts[script]) foundRequired++;
    });

    optionalScripts.forEach(script => {
      if (scripts[script]) foundOptional++;
    });

    const passed = foundRequired === requiredScripts.length;
    const details = `Required: ${foundRequired}/${requiredScripts.length}, Optional: ${foundOptional}/${optionalScripts.length}`;

    return { passed, details };
  }

  private static async checkPerformanceTests(
    context: CheckContext
  ): Promise<{ passed: boolean; details: string }> {
    const testDirs = ['tests/performance', 'test/performance', 'benchmarks'];
    let foundTests = 0;

    for (const dir of testDirs) {
      const dirPath = path.join(context.projectPath, dir);
      if (await FileSystemUtils.dirExists(dirPath)) {
        const files = await FileSystemUtils.findFiles(
          '**/*.{test,spec,bench}.{js,ts,jsx,tsx}',
          dirPath
        );
        foundTests += files.length;
      }
    }

    const passed = foundTests > 0;
    const details = `Found ${foundTests} performance test files`;

    return { passed, details };
  }

  private static getCheckRecommendations(checkId: string): string[] {
    const recommendations: Record<string, string[]> = {
      'emt.vitest.installed': [
        'Установите Vitest: npm install --save-dev vitest',
        'Vitest - современная и быстрая альтернатива Jest',
      ],
      'emt.vitest.config': [
        'Создайте файл vitest.config.ts в корне проекта',
        'Настройте environment: jsdom для тестирования DOM',
      ],
      'emt.unit.tests': [
        'Создайте папку tests/unit для unit тестов',
        'Добавьте тесты для основных функций и компонентов',
      ],
      'emt.integration.tests': [
        'Создайте папку tests/integration для integration тестов',
        'Тестируйте взаимодействие между модулями',
      ],
      'emt.e2e.tests': [
        'Создайте папку tests/e2e для E2E тестов',
        'Используйте Playwright для браузерного тестирования',
      ],
      'emt.playwright.installed': [
        'Установите Playwright: npm install --save-dev @playwright/test',
        'Настройте playwright.config.ts',
      ],
      'emt.coverage.config': [
        'Настройте coverage в vitest.config.ts',
        'Включите reporter: html, lcov для отчетов',
      ],
      'emt.coverage.threshold': [
        'Установите пороги покрытия: lines: 75%, functions: 75%',
        'Это обеспечит высокое качество кода',
      ],
      'emt.test.scripts': [
        'Добавьте скрипты: "test", "test:coverage", "test:watch"',
        'Автоматизируйте запуск тестов',
      ],
      'emt.performance.tests': [
        'Добавьте benchmarks для критичных функций',
        'Используйте Vitest bench для измерения производительности',
      ],
    };

    return recommendations[checkId] || [];
  }

  private static generateRecommendations(failedChecks: CheckResult[]): string[] {
    const recommendations: string[] = [];

    const criticalFailed = failedChecks.filter(c => c.check.critical);
    const highPriorityFailed = failedChecks.filter(c => c.check.level === 'high');

    if (criticalFailed.length > 0) {
      recommendations.push('🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ: Отсутствуют базовые компоненты тестирования');
      recommendations.push('Приоритет 1: Установите Vitest и создайте базовые unit тесты');
    }

    if (highPriorityFailed.length > 0) {
      recommendations.push('⚠️ Важные улучшения: Расширьте тестовое покрытие');
      recommendations.push('Приоритет 2: Добавьте integration и E2E тесты');
    }

    if (failedChecks.length > 0) {
      recommendations.push(
        '📚 Рекомендуется изучить: SHINOMONTAGKA Golden Standard для тестирования'
      );
    }

    return recommendations;
  }
}
