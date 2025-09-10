/**
 * Base Analyzer Interface
 * Базовый интерфейс для всех анализаторов
 */

import { Project } from '../types/Project';

export interface IAnalyzer<TResult = any> {
  /**
   * Выполнить анализ проекта
   * @param project Проект для анализа
   * @returns Результат анализа
   */
  analyze(project: Project): Promise<TResult>;

  /**
   * Получить название анализатора
   */
  getName(): string;

  /**
   * Получить описание анализатора
   */
  getDescription(): string;

  /**
   * Проверить, применим ли анализатор к данному проекту
   * @param project Проект для проверки
   */
  isApplicable(project: Project): Promise<boolean>;
}

/**
 * Базовый абстрактный класс для анализаторов
 */
export abstract class BaseAnalyzer<TResult = any> implements IAnalyzer<TResult> {
  protected readonly name: string;
  protected readonly description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  abstract analyze(project: Project): Promise<TResult>;

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  async isApplicable(project: Project): Promise<boolean> {
    // По умолчанию анализатор применим ко всем проектам
    return true;
  }

  /**
   * Безопасное чтение файла с обработкой ошибок
   */
  protected async safeReadFile(project: Project, filePath: string): Promise<string | null> {
    try {
      if (await project.exists(filePath)) {
        return await project.readFile(filePath);
      }
      return null;
    } catch (error) {
      console.warn(`Failed to read file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Безопасный парсинг JSON с обработкой ошибок
   */
  protected safeParseJSON<T = any>(content: string): T | null {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.warn('Failed to parse JSON:', error);
      return null;
    }
  }

  /**
   * Получить список файлов с безопасной обработкой ошибок
   */
  protected async safeGetFileList(project: Project, pattern?: string): Promise<string[]> {
    try {
      return await project.getFileList(pattern);
    } catch (error) {
      console.warn(`Failed to get file list with pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Безопасное получение статистики файла
   */
  protected async safeGetFileStats(project: Project, filePath: string): Promise<any | null> {
    try {
      if (await project.exists(filePath)) {
        return await project.getFileStats(filePath);
      }
      return null;
    } catch (error) {
      console.warn(`Failed to get file stats for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Вычислить размер файла в байтах
   */
  protected getFileSize(content: string): number {
    return Buffer.byteLength(content, 'utf8');
  }

  /**
   * Проверить, является ли файл исходным кодом
   */
  protected isSourceCodeFile(filePath: string): boolean {
    const sourceExtensions = [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.vue',
      '.svelte',
      '.py',
      '.java',
      '.c',
      '.cpp',
      '.cs',
      '.php',
      '.rb',
      '.go',
      '.rs',
      '.kt',
      '.scala',
      '.swift',
    ];

    return sourceExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }

  /**
   * Проверить, является ли файл конфигурационным
   */
  protected isConfigFile(filePath: string): boolean {
    const configPatterns = [
      /package\.json$/,
      /tsconfig.*\.json$/,
      /\.eslintrc/,
      /\.prettierrc/,
      /webpack\.config/,
      /vite\.config/,
      /next\.config/,
      /\.env/,
      /Dockerfile/,
      /docker-compose/,
      /\.yml$/,
      /\.yaml$/,
    ];

    return configPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Проверить, является ли директория node_modules или подобной
   */
  protected isIgnoredDirectory(dirPath: string): boolean {
    const ignoredDirs = [
      'node_modules',
      'dist',
      'build',
      '.git',
      '.svn',
      'coverage',
      '.nyc_output',
      'tmp',
      'temp',
    ];

    return ignoredDirs.some(dir => dirPath.includes(dir));
  }
}
