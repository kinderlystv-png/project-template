/**
 * Анализатор package.json для тестовых фреймворков и конфигураций
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Project } from '../../../types/Project';
import { FrameworkInfo } from '../types/TestingTypes';
import { SUPPORTED_FRAMEWORKS } from '../constants';

/**
 * Анализирует package.json на предмет тестовых фреймворков и конфигураций
 */
export class PackageJsonAnalyzer {
  /**
   * Анализирует package.json проекта
   * @param project Проект для анализа
   * @returns Информация о найденных фреймворках и конфигурациях
   */
  async analyzePackageJson(project: Project): Promise<{
    frameworks: FrameworkInfo[];
    testScripts: string[];
    hasTestDependencies: boolean;
  }> {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');

      if (!(await this.fileExists(packageJsonPath))) {
        return {
          frameworks: [],
          testScripts: [],
          hasTestDependencies: false,
        };
      }

      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);

      // Собираем все зависимости
      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };

      // Анализируем фреймворки
      const frameworks = this.detectFrameworks(allDependencies);

      // Анализируем скрипты
      const testScripts = this.extractTestScripts(packageJson.scripts || {});

      // Проверяем наличие тестовых зависимостей
      const hasTestDependencies = frameworks.length > 0;

      return {
        frameworks,
        testScripts,
        hasTestDependencies,
      };
    } catch (error) {
      console.error(
        `Error analyzing package.json: ${error instanceof Error ? error.message : error}`
      );
      return {
        frameworks: [],
        testScripts: [],
        hasTestDependencies: false,
      };
    }
  }

  /**
   * Обнаруживает тестовые фреймворки в зависимостях
   * @param dependencies Объект зависимостей из package.json
   * @returns Массив обнаруженных фреймворков
   */
  private detectFrameworks(dependencies: Record<string, string>): FrameworkInfo[] {
    const frameworks: FrameworkInfo[] = [];
    const dependencyNames = Object.keys(dependencies);

    // Проверяем unit testing фреймворки
    SUPPORTED_FRAMEWORKS.UNIT_TESTING.forEach(frameworkName => {
      if (dependencyNames.includes(frameworkName)) {
        frameworks.push({
          name: frameworkName,
          version: this.extractVersion(dependencies[frameworkName]),
          enabled: true,
          type: 'unit',
        });
      }
    });

    // Проверяем E2E testing фреймворки
    SUPPORTED_FRAMEWORKS.E2E_TESTING.forEach(frameworkName => {
      if (dependencyNames.includes(frameworkName)) {
        frameworks.push({
          name: frameworkName,
          version: this.extractVersion(dependencies[frameworkName]),
          enabled: true,
          type: 'e2e',
        });
      }
    });

    // Проверяем инструменты покрытия
    SUPPORTED_FRAMEWORKS.COVERAGE_TOOLS.forEach(toolName => {
      if (dependencyNames.includes(toolName)) {
        frameworks.push({
          name: toolName,
          version: this.extractVersion(dependencies[toolName]),
          enabled: true,
          type: 'coverage',
        });
      }
    });

    return frameworks;
  }

  /**
   * Извлекает версию из строки зависимости
   * @param versionString Строка версии (может содержать ^, ~, и др.)
   * @returns Чистая версия или undefined
   */
  private extractVersion(versionString: string): string | undefined {
    if (!versionString) return undefined;

    // Удаляем префиксы типа ^, ~, >=, etc.
    const cleanVersion = versionString.replace(/^[\^~>=<]+/, '');

    // Проверяем, что это похоже на версию
    if (/^\d+\.\d+/.test(cleanVersion)) {
      return cleanVersion;
    }

    return undefined;
  }

  /**
   * Извлекает тестовые скрипты из package.json
   * @param scripts Объект скриптов из package.json
   * @returns Массив названий тестовых скриптов
   */
  private extractTestScripts(scripts: Record<string, string>): string[] {
    const testScripts: string[] = [];

    Object.entries(scripts).forEach(([name, command]) => {
      if (this.isTestScript(name, command)) {
        testScripts.push(name);
      }
    });

    return testScripts;
  }

  /**
   * Определяет, является ли скрипт тестовым
   * @param name Название скрипта
   * @param command Команда скрипта
   * @returns true, если скрипт является тестовым
   */
  private isTestScript(name: string, command: string): boolean {
    const testKeywords = [
      'test',
      'spec',
      'jest',
      'vitest',
      'mocha',
      'ava',
      'cypress',
      'playwright',
      'e2e',
      'coverage',
    ];

    const lowerName = name.toLowerCase();
    const lowerCommand = command.toLowerCase();

    // Проверяем название скрипта
    if (testKeywords.some(keyword => lowerName.includes(keyword))) {
      return true;
    }

    // Проверяем команду скрипта
    if (testKeywords.some(keyword => lowerCommand.includes(keyword))) {
      return true;
    }

    return false;
  }

  /**
   * Получает информацию о конфигурации Jest из package.json
   * @param project Проект для анализа
   * @returns Конфигурация Jest или null
   */
  async getJestConfig(project: Project): Promise<any | null> {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');

      if (!(await this.fileExists(packageJsonPath))) {
        return null;
      }

      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);

      return packageJson.jest || null;
    } catch (error) {
      console.error(`Error getting Jest config: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  /**
   * Проверяет, есть ли в проекте скрипты для покрытия кода
   * @param project Проект для анализа
   * @returns true, если есть скрипты для покрытия
   */
  async hasCoverageScripts(project: Project): Promise<boolean> {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');

      if (!(await this.fileExists(packageJsonPath))) {
        return false;
      }

      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);

      if (!packageJson.scripts) {
        return false;
      }

      return Object.values(packageJson.scripts).some(
        (script: any) =>
          typeof script === 'string' &&
          (script.includes('--coverage') ||
            script.includes('coverage') ||
            script.includes('c8') ||
            script.includes('nyc'))
      );
    } catch (error) {
      console.error(
        `Error checking coverage scripts: ${error instanceof Error ? error.message : error}`
      );
      return false;
    }
  }

  /**
   * Получает рекомендованные скрипты для тестирования
   * @param frameworks Найденные фреймворки
   * @returns Объект с рекомендованными скриптами
   */
  getRecommendedScripts(frameworks: FrameworkInfo[]): Record<string, string> {
    const scripts: Record<string, string> = {};

    // Определяем основной фреймворк для unit тестов
    const unitFramework = frameworks.find(f => f.type === 'unit');

    if (unitFramework) {
      switch (unitFramework.name) {
        case 'vitest':
          scripts.test = 'vitest';
          scripts['test:watch'] = 'vitest --watch';
          scripts['test:coverage'] = 'vitest --coverage';
          scripts['test:ui'] = 'vitest --ui';
          break;
        case 'jest':
          scripts.test = 'jest';
          scripts['test:watch'] = 'jest --watch';
          scripts['test:coverage'] = 'jest --coverage';
          scripts['test:ci'] = 'jest --ci --coverage --watchAll=false';
          break;
        default:
          scripts.test = unitFramework.name;
      }
    }

    // Добавляем E2E скрипты
    const e2eFramework = frameworks.find(f => f.type === 'e2e');

    if (e2eFramework) {
      switch (e2eFramework.name) {
        case 'playwright':
        case '@playwright/test':
          scripts['test:e2e'] = 'playwright test';
          scripts['test:e2e:headed'] = 'playwright test --headed';
          scripts['test:e2e:debug'] = 'playwright test --debug';
          break;
        case 'cypress':
          scripts['test:e2e'] = 'cypress run';
          scripts['test:e2e:open'] = 'cypress open';
          break;
      }
    }

    return scripts;
  }

  /**
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
}
