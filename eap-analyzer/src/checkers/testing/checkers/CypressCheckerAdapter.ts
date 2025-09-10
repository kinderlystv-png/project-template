/**
 * Адаптер CypressChecker для интеграции с AnalysisOrchестратором
 * Анализирует конфигурацию и настройки Cypress E2E тестирования
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseChecker } from '../../../core/checker.js';
import { CheckContext, CheckResult } from '../../../core/types.js';

/**
 * Информация о конфигурации Cypress
 */
interface CypressConfig {
  configFound: boolean;
  configPath?: string;
  testsFound: number;
  hasFixtures: boolean;
  hasCustomCommands: boolean;
  hasReports: boolean;
  hasVideos: boolean;
  hasScreenshots: boolean;
  hasBaseUrl: boolean;
  hasViewports: boolean;
}

/**
 * Адаптер для анализа Cypress E2E тестирования, совместимый с AnalysisOrchestrator
 */
export class CypressCheckerAdapter extends BaseChecker {
  readonly name = 'cypress-checker';
  readonly category = 'quality' as const;
  readonly description = 'Анализирует конфигурацию и качество Cypress E2E тестов';

  /**
   * Выполняет проверку Cypress конфигурации и тестов
   */
  async check(context: CheckContext): Promise<CheckResult> {
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

      const recommendations: string[] = [];

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
  private async hasCypressDependency(projectPath: string): Promise<boolean> {
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
  private async analyzeCypressConfig(projectPath: string): Promise<CypressConfig> {
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
  private async parseCypressConfig(
    configPath: string,
    projectPath: string
  ): Promise<Omit<CypressConfig, 'configFound' | 'configPath'>> {
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
  private async countCypressTests(projectPath: string): Promise<number> {
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
  private async checkFixtures(projectPath: string): Promise<boolean> {
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
  private async checkCustomCommands(projectPath: string): Promise<boolean> {
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
  private async getAllFiles(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: string[] = [];

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
