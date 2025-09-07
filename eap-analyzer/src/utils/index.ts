/**
 * Утилиты для работы с файловой системой и анализа проектов
 */

import { execSync } from 'child_process';
import glob from 'fast-glob';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ProjectInfo } from '../types/index.js';

interface PackageJsonType {
  name?: string;
  version?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

export class FileSystemUtils {
  /**
   * Проверяет существование файла
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Проверяет существование директории
   */
  static async dirExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Читает и парсит JSON файл
   */
  static async readJsonFile<T = Record<string, unknown>>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Читает текстовый файл
   */
  static async readTextFile(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Поиск файлов по glob паттерну
   */
  static async findFiles(pattern: string, cwd: string): Promise<string[]> {
    try {
      return await glob(pattern, { cwd, absolute: true });
    } catch {
      return [];
    }
  }

  /**
   * Получает список файлов в директории
   */
  static async listDirectory(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch {
      return [];
    }
  }

  /**
   * Получает размер файла
   */
  static async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * Подсчитывает строки кода в файле
   */
  static async countLinesInFile(filePath: string): Promise<number> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.split('\n').length;
    } catch {
      return 0;
    }
  }
}

export class ProjectAnalyzer {
  /**
   * Анализирует основную информацию о проекте
   */
  static async analyzeProject(projectPath: string): Promise<ProjectInfo> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = await FileSystemUtils.readJsonFile<PackageJsonType>(packageJsonPath);

    if (!packageJson) {
      throw new Error(`No package.json found in ${projectPath}`);
    }

    const framework = this.detectFramework(packageJson);
    const packageManager = await this.detectPackageManager(projectPath);
    const hasTypeScript = await this.hasTypeScript(projectPath);
    const hasTests = await this.hasTests(projectPath);
    const hasDocker = await this.hasDocker(projectPath);
    const hasCICD = await this.hasCICD(projectPath);
    const dependencies = this.analyzeDependencies(packageJson);
    const linesOfCode = await this.countLinesOfCode(projectPath);

    return {
      name: packageJson.name || path.basename(projectPath),
      version: packageJson.version || '0.0.0',
      description: packageJson.description,
      framework,
      packageManager,
      hasTypeScript,
      hasTests,
      hasDocker,
      hasCICD,
      linesOfCode,
      dependencies,
    };
  }

  /**
   * Определяет используемый фреймворк
   */
  private static detectFramework(packageJson: PackageJsonType): string | undefined {
    const frameworks = {
      '@sveltejs/kit': 'SvelteKit',
      svelte: 'Svelte',
      next: 'Next.js',
      nuxt: 'Nuxt.js',
      react: 'React',
      vue: 'Vue.js',
      '@angular/core': 'Angular',
      express: 'Express.js',
      fastify: 'Fastify',
      nest: 'NestJS',
    };

    const allDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    for (const [dep, name] of Object.entries(frameworks)) {
      if (allDeps[dep]) {
        return name;
      }
    }

    return undefined;
  }

  /**
   * Определяет используемый пакетный менеджер
   */
  private static async detectPackageManager(projectPath: string): Promise<'npm' | 'pnpm' | 'yarn'> {
    if (await FileSystemUtils.fileExists(path.join(projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (await FileSystemUtils.fileExists(path.join(projectPath, 'yarn.lock'))) {
      return 'yarn';
    }
    return 'npm';
  }

  /**
   * Проверяет наличие TypeScript
   */
  private static async hasTypeScript(projectPath: string): Promise<boolean> {
    return await FileSystemUtils.fileExists(path.join(projectPath, 'tsconfig.json'));
  }

  /**
   * Проверяет наличие тестов
   */
  private static async hasTests(projectPath: string): Promise<boolean> {
    const testDirs = ['tests', 'test', '__tests__', 'spec'];
    for (const dir of testDirs) {
      if (await FileSystemUtils.dirExists(path.join(projectPath, dir))) {
        return true;
      }
    }

    // Проверяем наличие тестовых файлов
    const testFiles = await FileSystemUtils.findFiles(
      '**/*.{test,spec}.{js,ts,jsx,tsx}',
      projectPath
    );
    return testFiles.length > 0;
  }

  /**
   * Проверяет наличие Docker
   */
  private static async hasDocker(projectPath: string): Promise<boolean> {
    return await FileSystemUtils.fileExists(path.join(projectPath, 'Dockerfile'));
  }

  /**
   * Проверяет наличие CI/CD
   */
  private static async hasCICD(projectPath: string): Promise<boolean> {
    const ciPaths = [
      '.github/workflows',
      '.gitlab-ci.yml',
      '.travis.yml',
      'circle.yml',
      '.circleci/config.yml',
    ];

    for (const ciPath of ciPaths) {
      const fullPath = path.join(projectPath, ciPath);
      if (
        (await FileSystemUtils.fileExists(fullPath)) ||
        (await FileSystemUtils.dirExists(fullPath))
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Анализирует зависимости
   */
  private static analyzeDependencies(packageJson: PackageJsonType): ProjectInfo['dependencies'] {
    const production = Object.keys(packageJson.dependencies || {}).length;
    const development = Object.keys(packageJson.devDependencies || {}).length;

    return {
      production,
      development,
      total: production + development,
    };
  }

  /**
   * Подсчитывает строки кода
   */
  private static async countLinesOfCode(projectPath: string): Promise<number> {
    try {
      const patterns = [
        'src/**/*.{js,ts,jsx,tsx,vue,svelte}',
        'lib/**/*.{js,ts,jsx,tsx,vue,svelte}',
        'components/**/*.{js,ts,jsx,tsx,vue,svelte}',
        '*.{js,ts,jsx,tsx,vue,svelte}',
      ];

      let totalLines = 0;

      for (const pattern of patterns) {
        const files = await FileSystemUtils.findFiles(pattern, projectPath);
        for (const file of files) {
          totalLines += await FileSystemUtils.countLinesInFile(file);
        }
      }

      return totalLines;
    } catch {
      return 0;
    }
  }
}

export class ExecutionUtils {
  /**
   * Выполняет команду и возвращает результат
   */
  static async executeCommand(
    command: string,
    cwd: string,
    timeout = 30000
  ): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      const output = execSync(command, {
        cwd,
        encoding: 'utf-8',
        timeout,
        stdio: 'pipe',
      });

      return {
        success: true,
        output: output.toString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Проверяет доступность команды
   */
  static async isCommandAvailable(command: string): Promise<boolean> {
    try {
      const cmd = process.platform === 'win32' ? 'where' : 'which';
      execSync(`${cmd} ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Получает версию пакета npm
   */
  static async getNpmPackageVersion(packageName: string, cwd: string): Promise<string | null> {
    try {
      const result = await this.executeCommand(`npm list ${packageName} --depth=0 --json`, cwd);

      if (result.success) {
        const parsed = JSON.parse(result.output);
        return parsed.dependencies?.[packageName]?.version || null;
      }
    } catch {
      // Fallback to package.json
      const packageJsonPath = path.join(cwd, 'package.json');
      const packageJson = await FileSystemUtils.readJsonFile<PackageJsonType>(packageJsonPath);

      if (packageJson) {
        const allDeps = {
          ...(packageJson.dependencies || {}),
          ...(packageJson.devDependencies || {}),
        };
        return allDeps[packageName] || null;
      }
    }

    return null;
  }
}

export class ColorUtils {
  static readonly colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
  };

  static colorize(text: string, color: keyof typeof ColorUtils.colors): string {
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }

  static success(text: string): string {
    return this.colorize(text, 'green');
  }

  static error(text: string): string {
    return this.colorize(text, 'red');
  }

  static warning(text: string): string {
    return this.colorize(text, 'yellow');
  }

  static info(text: string): string {
    return this.colorize(text, 'blue');
  }

  static highlight(text: string): string {
    return this.colorize(text, 'cyan');
  }

  static dim(text: string): string {
    return this.colorize(text, 'gray');
  }

  static bold(text: string): string {
    return this.colorize(text, 'bright');
  }
}

export class GradeUtils {
  /**
   * Вычисляет оценку на основе процента
   */
  static calculateGrade(percentage: number): string {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 55) return 'C-';
    if (percentage >= 50) return 'D+';
    if (percentage >= 45) return 'D';
    if (percentage >= 40) return 'D-';
    return 'F';
  }

  /**
   * Создает прогресс-бар
   */
  static createProgressBar(percentage: number, width = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    const getColor = (p: number) => {
      if (p >= 90) return ColorUtils.colors.green;
      if (p >= 70) return ColorUtils.colors.yellow;
      if (p >= 50) return ColorUtils.colors.magenta;
      return ColorUtils.colors.red;
    };

    const color = getColor(percentage);
    const reset = ColorUtils.colors.reset;
    const gray = ColorUtils.colors.gray;

    return `${gray}[${color}${'█'.repeat(filled)}${gray}${'░'.repeat(empty)}]${reset}`;
  }

  /**
   * Получает цвет для процента
   */
  static getPercentageColor(percentage: number): keyof typeof ColorUtils.colors {
    if (percentage >= 90) return 'green';
    if (percentage >= 70) return 'yellow';
    if (percentage >= 50) return 'magenta';
    return 'red';
  }
}
