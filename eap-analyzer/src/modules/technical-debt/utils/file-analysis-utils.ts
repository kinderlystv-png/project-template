/**
 * Утилиты для работы с файлами в анализаторах технического долга
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FileAnalysisOptions {
  extensions: string[];
  excludeDirs: string[];
  maxFiles?: number;
}

export interface FileMetrics {
  path: string;
  lines: number;
  complexity: number;
  duplicationRatio: number;
  hasTests: boolean;
  size: number;
}

export class FileAnalysisUtils {
  private static readonly DEFAULT_OPTIONS: FileAnalysisOptions = {
    extensions: ['.ts', '.js', '.tsx', '.jsx', '.vue', '.svelte'],
    excludeDirs: ['node_modules', 'dist', 'build', '.git', 'coverage'],
    maxFiles: 100,
  };

  /**
   * Сканирует директорию и возвращает список файлов для анализа
   */
  static async getCodeFiles(
    projectPath: string,
    options: Partial<FileAnalysisOptions> = {}
  ): Promise<string[]> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const files: string[] = [];

    const scanDir = async (dir: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(dir);

        for (const item of items) {
          if (opts.excludeDirs.includes(item) || item.startsWith('.')) {
            continue;
          }

          const fullPath = path.join(dir, item);

          try {
            const stat = await fs.promises.stat(fullPath);

            if (stat.isDirectory()) {
              await scanDir(fullPath);
            } else if (opts.extensions.some(ext => item.endsWith(ext))) {
              files.push(fullPath);

              // Ограничиваем количество файлов для производительности
              if (opts.maxFiles && files.length >= opts.maxFiles) {
                return;
              }
            }
          } catch (error) {
            // Игнорируем ошибки доступа к отдельным файлам
            // console.debug(`Cannot access file ${fullPath}:`, error);
          }
        }
      } catch (error) {
        // console.debug(`Cannot read directory ${dir}:`, error);
      }
    };

    await scanDir(projectPath);
    return files;
  }

  /**
   * Анализирует один файл и возвращает метрики
   */
  static async analyzeFile(filePath: string, allFiles: string[]): Promise<FileMetrics | null> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const stat = await fs.promises.stat(filePath);

      return {
        path: filePath,
        lines: this.countLines(content),
        complexity: this.calculateComplexity(content),
        duplicationRatio: this.calculateDuplicationRatio(content),
        hasTests: this.hasTestFile(filePath, allFiles),
        size: stat.size,
      };
    } catch (error) {
      // console.debug(`Cannot analyze file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Подсчитывает количество строк кода (без пустых и комментариев)
   */
  private static countLines(content: string): number {
    return content.split('\n').filter(line => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith('//') &&
        !trimmed.startsWith('*') &&
        !trimmed.startsWith('/*')
      );
    }).length;
  }

  /**
   * Вычисляет цикломатическую сложность
   */
  private static calculateComplexity(content: string): number {
    const complexityPatterns = [
      /\bif\b/g,
      /\belse\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\btry\b/g,
      /\bdo\b/g,
      /\?/g, // тернарный оператор
      /&&/g,
      /\|\|/g,
    ];

    return complexityPatterns.reduce((total, pattern) => {
      const matches = content.match(pattern);
      return total + (matches ? matches.length : 0);
    }, 1); // Базовая сложность = 1
  }

  /**
   * Вычисляет коэффициент дублирования кода
   */
  private static calculateDuplicationRatio(content: string): number {
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    const uniqueLines = new Set(lines);

    if (lines.length === 0) return 0;
    return Math.max(0, 1 - uniqueLines.size / lines.length);
  }

  /**
   * Проверяет наличие тестового файла
   */
  private static hasTestFile(filePath: string, allFiles: string[]): boolean {
    const fileName = path.basename(filePath, path.extname(filePath));
    const testPatterns = [
      `${fileName}.test.`,
      `${fileName}.spec.`,
      `.test/${fileName}`,
      `.spec/${fileName}`,
      `__tests__/${fileName}`,
    ];

    return allFiles.some(file => testPatterns.some(pattern => file.includes(pattern)));
  }
}
