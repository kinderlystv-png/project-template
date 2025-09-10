/**
 * Адаптер JestChecker для интеграции с AnalysisOrchestrator
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseChecker } from '../../../core/checker.js';
import { CheckContext, CheckResult } from '../../../core/types.js';

/**
 * Адаптер для Jest анализа, совместимый с AnalysisOrchestrator
 */
export class JestCheckerAdapter extends BaseChecker {
  readonly name = 'jest-checker';
  readonly category = 'quality' as const;
  readonly description = 'Анализирует конфигурацию и использование Jest фреймворка';

  /**
   * Выполняет проверку Jest конфигурации
   */
  async check(context: CheckContext): Promise<CheckResult> {
    const projectPath = context.projectPath;

    try {
      // 1. Проверяем наличие Jest в зависимостях
      const hasJest = await this.hasJestDependency(projectPath);
      if (!hasJest) {
        return this.createResult(
          false,
          0,
          'Jest не найден в зависимостях проекта',
          { checked: 'package.json', found: false },
          ['Выполните: npm install -D jest', 'Для TypeScript: npm install -D @types/jest']
        );
      }

      // 2. Проверяем конфигурацию Jest
      const hasConfig = await this.hasJestConfig(projectPath);
      if (!hasConfig) {
        return this.createResult(
          false,
          30,
          'Конфигурация Jest не найдена',
          { configFiles: [], found: false },
          ['Создайте jest.config.js или добавьте секцию jest в package.json']
        );
      }

      // 3. Проверяем тестовые файлы
      const testFiles = await this.findTestFiles(projectPath);
      if (testFiles.length === 0) {
        return this.createResult(
          false,
          40,
          'Тестовые файлы для Jest не найдены',
          { fileCount: 0, searchPatterns: ['*.test.js', '*.spec.js', '*.test.ts', '*.spec.ts'] },
          ['Создайте тестовые файлы с расширением .test.js, .spec.js или их TypeScript аналоги']
        );
      }

      // 4. Проверяем скрипты в package.json
      const hasTestScript = await this.hasTestScript(projectPath);

      // 5. Проверяем покрытие кода
      const hasCoverage = await this.hasCoverageConfig(projectPath);

      // 6. Вычисляем итоговую оценку
      let score = 70; // Базовая оценка за наличие Jest, конфигурации и тестов
      const details: any = {
        hasJest: true,
        hasConfig: true,
        testFileCount: testFiles.length,
        hasTestScript,
        hasCoverage,
        testFiles: testFiles.slice(0, 5), // Первые 5 файлов
      };

      const recommendations: string[] = [];

      if (hasTestScript) {
        score += 10;
      } else {
        recommendations.push('Добавьте test скрипт в package.json: "test": "jest"');
      }

      if (hasCoverage) {
        score += 10;
      } else {
        recommendations.push('Настройте coverage в Jest для отслеживания покрытия кода');
      }

      // Бонус за количество тестов
      if (testFiles.length >= 5) {
        score += 5;
      }

      if (testFiles.length >= 10) {
        score += 5;
      }

      return this.createResult(
        true,
        Math.min(score, 100),
        `Jest настроен (найдено ${testFiles.length} тестовых файлов)`,
        details,
        recommendations
      );
    } catch (error) {
      return this.createResult(
        false,
        0,
        'Ошибка при анализе Jest',
        { error: error instanceof Error ? error.message : String(error) },
        ['Проверьте структуру проекта и конфигурацию Jest']
      );
    }
  }

  /**
   * Проверяет наличие Jest в зависимостях
   */
  private async hasJestDependency(projectPath: string): Promise<boolean> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');

      if (!this.fileExists(packageJsonPath)) {
        return false;
      }

      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);

      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };

      return 'jest' in allDependencies;
    } catch {
      return false;
    }
  }

  /**
   * Проверяет наличие конфигурации Jest
   */
  private async hasJestConfig(projectPath: string): Promise<boolean> {
    const configFiles = ['jest.config.js', 'jest.config.ts', 'jest.config.mjs', 'jest.config.json'];

    // Проверяем отдельные конфигурационные файлы
    for (const configFile of configFiles) {
      if (this.fileExists(path.join(projectPath, configFile))) {
        return true;
      }
    }

    // Проверяем секцию jest в package.json
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (this.fileExists(packageJsonPath)) {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        if (packageJson.jest) {
          return true;
        }
      }
    } catch {
      // Игнорируем ошибки
    }

    return false;
  }

  /**
   * Находит тестовые файлы
   */
  private async findTestFiles(projectPath: string): Promise<string[]> {
    const testFiles: string[] = [];

    try {
      const searchDirs = ['src', 'test', 'tests', '__tests__', '.'];

      for (const dir of searchDirs) {
        const fullPath = path.join(projectPath, dir);
        if (this.fileExists(fullPath)) {
          const files = await this.findFilesRecursive(fullPath, [
            '.test.js',
            '.spec.js',
            '.test.ts',
            '.spec.ts',
            '.test.jsx',
            '.spec.jsx',
            '.test.tsx',
            '.spec.tsx',
          ]);
          testFiles.push(...files);
        }
      }

      return [...new Set(testFiles)]; // Убираем дубликаты
    } catch {
      return [];
    }
  }

  /**
   * Рекурсивно ищет файлы по расширениям
   */
  private async findFilesRecursive(dir: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.findFilesRecursive(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const hasExtension = extensions.some(ext => entry.name.endsWith(ext));
          if (hasExtension) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Игнорируем ошибки доступа к папкам
    }

    return files;
  }

  /**
   * Проверяет наличие test скрипта
   */
  private async hasTestScript(projectPath: string): Promise<boolean> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');

      if (!this.fileExists(packageJsonPath)) {
        return false;
      }

      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);

      return !!(packageJson.scripts?.test && packageJson.scripts.test.includes('jest'));
    } catch {
      return false;
    }
  }

  /**
   * Проверяет настройку покрытия кода
   */
  private async hasCoverageConfig(projectPath: string): Promise<boolean> {
    try {
      // Проверяем отдельные конфигурационные файлы
      const configFiles = ['jest.config.js', 'jest.config.ts'];
      for (const configFile of configFiles) {
        const configPath = path.join(projectPath, configFile);
        if (this.fileExists(configPath)) {
          try {
            const content = await fs.readFile(configPath, 'utf8');
            if (content.includes('collectCoverage') || content.includes('coverageThreshold')) {
              return true;
            }
          } catch {
            // Игнорируем ошибки чтения
          }
        }
      }

      // Проверяем package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (this.fileExists(packageJsonPath)) {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);

        if (packageJson.jest?.collectCoverage || packageJson.jest?.coverageThreshold) {
          return true;
        }

        // Проверяем скрипты на coverage
        if (
          packageJson.scripts?.['test:coverage'] ||
          packageJson.scripts?.coverage ||
          (packageJson.scripts?.test && packageJson.scripts.test.includes('--coverage'))
        ) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }
}
