/**
 * Анализатор конфигурационных файлов тестовых фреймворков
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Project } from '../../../types/Project';
import { CoverageConfig } from '../types/TestingTypes';
import { CONFIG_FILES } from '../constants';

/**
 * Анализирует конфигурационные файлы различных тестовых фреймворков
 */
export class ConfigFileAnalyzer {
  /**
   * Анализирует все конфигурационные файлы в проекте
   * @param project Проект для анализа
   * @returns Объект с найденными конфигурациями
   */
  async analyzeConfigs(project: Project): Promise<{
    vitest?: any;
    jest?: any;
    playwright?: any;
    cypress?: any;
    coverage: CoverageConfig;
    foundConfigs: string[];
  }> {
    const result: {
      vitest?: any;
      jest?: any;
      playwright?: any;
      cypress?: any;
      coverage: CoverageConfig;
      foundConfigs: string[];
    } = {
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
  async analyzeVitestConfig(project: Project): Promise<any | null> {
    const configFiles = CONFIG_FILES.vitest;

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
  async analyzeJestConfig(project: Project): Promise<any | null> {
    const configFiles = CONFIG_FILES.jest;

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
  async analyzePlaywrightConfig(project: Project): Promise<any | null> {
    const configFiles = CONFIG_FILES.playwright;

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
  async analyzeCypressConfig(project: Project): Promise<any | null> {
    const configFiles = CONFIG_FILES.cypress;

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
  private extractVitestConfigFromJS(content: string): any {
    const config: any = {
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
  private extractJestConfigFromJS(content: string): any {
    const config: any = {
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
  private extractPlaywrightConfigFromJS(content: string): any {
    const config: any = {
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
  private extractCypressConfigFromJS(content: string): any {
    const config: any = {
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
  private mergeCoverageConfigs(configs: any[]): CoverageConfig {
    const result: CoverageConfig = {
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
          .filter((pattern: string) => pattern.startsWith('!'))
          .map((pattern: string) => pattern.substring(1));

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
  private async fileExists(filePath: string): Promise<boolean> {
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
  async listAllConfigFiles(project: Project): Promise<string[]> {
    const foundFiles: string[] = [];

    // Собираем все возможные конфигурационные файлы
    const allConfigFiles = [
      ...CONFIG_FILES.vitest,
      ...CONFIG_FILES.jest,
      ...CONFIG_FILES.playwright,
      ...CONFIG_FILES.cypress,
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
