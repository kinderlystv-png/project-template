/**
 * Базовый класс для всех анализаторов системы
 */

export interface AnalyzerMetadata {
  name: string;
  version: string;
  description: string;
  supportedFileTypes: string[];
}

export interface AnalysisResult {
  success: boolean;
  data?: any;
  errors?: string[];
  warnings?: string[];
  metadata: {
    analyzer: string;
    timestamp: Date;
    duration: number;
    filesAnalyzed: number;
  };
}

export abstract class BaseAnalyzer {
  abstract readonly metadata: AnalyzerMetadata;

  /**
   * Выполняет анализ проекта
   */
  abstract analyze(projectPath: string): Promise<AnalysisResult>;

  /**
   * Проверяет, поддерживается ли данный проект
   */
  isSupported(projectPath: string): boolean {
    return true; // По умолчанию поддерживается везде
  }

  /**
   * Возвращает список файлов для анализа
   */
  protected async getFilesToAnalyze(projectPath: string): Promise<string[]> {
    const fs = require('fs').promises;
    const path = require('path');
    const files: string[] = [];

    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(projectPath, entry.name);

        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          const subFiles = await this.getFilesToAnalyze(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && this.shouldAnalyzeFile(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Не удалось прочитать директорию ${projectPath}:`, error);
    }

    return files;
  }

  /**
   * Определяет, нужно ли пропустить директорию
   */
  protected shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
      'logs',
      'tmp',
    ];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  /**
   * Определяет, нужно ли анализировать файл
   */
  protected shouldAnalyzeFile(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return this.metadata.supportedFileTypes.includes(ext || '');
  }

  /**
   * Создает базовый результат анализа
   */
  protected createResult(
    success: boolean,
    data?: any,
    errors?: string[],
    warnings?: string[],
    filesAnalyzed: number = 0
  ): AnalysisResult {
    return {
      success,
      data,
      errors,
      warnings,
      metadata: {
        analyzer: this.metadata.name,
        timestamp: new Date(),
        duration: 0, // Будет установлено оркестратором
        filesAnalyzed,
      },
    };
  }
}
