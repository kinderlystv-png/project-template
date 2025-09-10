/**
 * Адаптер VitestChecker для интеграции с AnalysisOrchestrator
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseChecker } from '../../../core/checker.js';
import { CheckContext, CheckResult } from '../../../core/types.js';

/**
 * Адаптер для Vitest анализа, совместимый с AnalysisOrchestrator
 */
export class VitestCheckerAdapter extends BaseChecker {
  readonly name = 'vitest-checker';
  readonly category = 'quality' as const;
  readonly description = 'Анализирует конфигурацию и использование Vitest фреймворка';

  /**
   * Выполняет проверку Vitest конфигурации
   */
  async check(context: CheckContext): Promise<CheckResult> {
    const projectPath = context.projectPath;

    try {
      // 1. Проверяем наличие Vitest в зависимостях
      const hasVitest = await this.hasVitestDependency(projectPath);
      if (!hasVitest) {
        return this.createResult(
          false,
          0,
          'Vitest не найден в зависимостях проекта',
          { checked: 'package.json', found: false },
          ['Выполните: npm install -D vitest']
        );
      }

      // 2. Проверяем конфигурацию Vitest
      const hasConfig = await this.hasVitestConfig(projectPath);
      if (!hasConfig) {
        return this.createResult(
          false,
          30,
          'Конфигурация Vitest не найдена',
          { configFiles: [], found: false },
          ['Создайте vitest.config.ts для настройки тестовой среды']
        );
      }

      // 3. Проверяем тестовые файлы
      const testFiles = await this.findTestFiles(projectPath);
      if (testFiles.length === 0) {
        return this.createResult(
          false,
          40,
          'Тестовые файлы для Vitest не найдены',
          { fileCount: 0, searchPatterns: ['*.test.ts', '*.spec.ts'] },
          ['Создайте тестовые файлы с расширением .test.ts или .spec.ts']
        );
      }

      // 4. Проверяем скрипты в package.json
      const hasTestScript = await this.hasTestScript(projectPath);
      let score = 70;
      const details: any = {
        hasVitest: true,
        hasConfig: true,
        testFileCount: testFiles.length,
        hasTestScript,
        testFiles: testFiles.slice(0, 5), // Первые 5 файлов
      };

      if (hasTestScript) {
        score = 90;
      }

      return this.createResult(
        true,
        score,
        `Vitest настроен (найдено ${testFiles.length} тестовых файлов)`,
        details,
        hasTestScript ? [] : ['Добавьте test скрипт в package.json: "test": "vitest"']
      );
    } catch (error) {
      return this.createResult(
        false,
        0,
        'Ошибка при анализе Vitest',
        { error: error instanceof Error ? error.message : String(error) },
        ['Проверьте структуру проекта и конфигурацию Vitest']
      );
    }
  }

  /**
   * Проверяет наличие Vitest в зависимостях
   */
  private async hasVitestDependency(projectPath: string): Promise<boolean> {
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

      return 'vitest' in allDependencies;
    } catch {
      return false;
    }
  }

  /**
   * Проверяет наличие конфигурации Vitest
   */
  private async hasVitestConfig(projectPath: string): Promise<boolean> {
    const configFiles = [
      'vitest.config.ts',
      'vitest.config.js',
      'vitest.config.mts',
      'vitest.config.mjs',
      'vite.config.ts',
      'vite.config.js',
    ];

    for (const configFile of configFiles) {
      if (this.fileExists(path.join(projectPath, configFile))) {
        return true;
      }
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
            '.test.ts',
            '.spec.ts',
            '.test.js',
            '.spec.js',
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

      return !!(packageJson.scripts?.test && packageJson.scripts.test.includes('vitest'));
    } catch {
      return false;
    }
  }
}
