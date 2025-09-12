/**
 * FileSystemScanner - Модуль для сканирования файловой системы
 *
 * Предоставляет высокопроизводительное сканирование проектов
 * с интеллектуальной фильтрацией и кэшированием
 */

import * as glob from 'glob';
import { stat } from 'fs/promises';
import { relative, extname, dirname } from 'path';

export interface ScanOptions {
  includePatterns?: string[];
  excludePatterns?: string[];
  maxFiles?: number;
  maxDepth?: number;
  followSymlinks?: boolean;
}

export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
  size: number;
  extension: string;
  isDirectory: boolean;
  depth: number;
  modifiedTime: Date;
}

/**
 * Высокопроизводительный сканер файловой системы
 */
export class FileSystemScanner {
  private static readonly DEFAULT_INCLUDE_PATTERNS = [
    '**/*.{js,jsx,ts,tsx,vue,svelte}', // Frontend frameworks
    '**/*.{css,scss,sass,less,styl}', // Styles
    '**/*.{html,htm,xml}', // Markup
    '**/*.{json,yaml,yml,toml,ini}', // Configuration
    '**/*.{md,mdx,txt,rst}', // Documentation
    '**/*.{py,java,cs,cpp,c,rs,go,rb}', // Backend languages
    '**/*.{php,perl,lua,dart,kt}', // Additional languages
  ];

  private static readonly DEFAULT_EXCLUDE_PATTERNS = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.next/**',
    '**/.nuxt/**',
    '**/.svelte-kit/**',
    '**/target/**',
    '**/bin/**',
    '**/obj/**',
    '**/*.min.js',
    '**/*.min.css',
    '**/vendor/**',
    '**/__pycache__/**',
    '**/.pytest_cache/**',
    '**/test-results/**',
    '**/playwright-report/**',
  ];

  /**
   * Сканирует директорию проекта с заданными опциями
   */
  static async scanProject(projectPath: string, options: ScanOptions = {}): Promise<ScannedFile[]> {
    const {
      includePatterns = FileSystemScanner.DEFAULT_INCLUDE_PATTERNS,
      excludePatterns = FileSystemScanner.DEFAULT_EXCLUDE_PATTERNS,
      maxFiles = 10000,
      maxDepth = 20,
      followSymlinks = false,
    } = options;

    console.log(`📁 Сканирование проекта: ${projectPath}`);
    console.log(`🎯 Шаблоны включения: ${includePatterns.length}`);
    console.log(`🚫 Шаблоны исключения: ${excludePatterns.length}`);

    const allFiles: string[] = [];

    // Сканируем по каждому паттерну включения
    for (let i = 0; i < includePatterns.length; i++) {
      const pattern = includePatterns[i];

      try {
        const files = await glob.glob(pattern, {
          cwd: projectPath,
          ignore: excludePatterns,
          absolute: true,
          maxDepth,
        });

        allFiles.push(...files);

        if (i % 2 === 0) {
          console.log(
            `📊 Обработано ${i + 1}/${includePatterns.length} паттернов, найдено ${allFiles.length} файлов`
          );
        }
      } catch (error) {
        console.warn(`⚠️ Ошибка сканирования паттерна ${pattern}:`, error);
      }
    }

    // Удаляем дубликаты и ограничиваем количество
    const uniqueFiles = [...new Set(allFiles)].slice(0, maxFiles);
    console.log(`🔍 Найдено ${uniqueFiles.length} уникальных файлов`);

    // Анализируем каждый файл
    return await FileSystemScanner.analyzeFiles(uniqueFiles, projectPath);
  }

  /**
   * Анализирует список файлов и возвращает метаданные
   */
  private static async analyzeFiles(
    filePaths: string[],
    projectPath: string
  ): Promise<ScannedFile[]> {
    const scannedFiles: ScannedFile[] = [];
    const batchSize = 50; // Обрабатываем файлы порциями

    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(filePath => FileSystemScanner.analyzeFile(filePath, projectPath))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          scannedFiles.push(result.value);
        } else if (result.status === 'rejected') {
          console.warn(`⚠️ Ошибка анализа файла:`, result.reason);
        }
      }

      // Показываем прогресс для больших проектов
      if (filePaths.length > 200 && i % 200 === 0) {
        console.log(
          `📈 Проанализировано ${Math.min(i + batchSize, filePaths.length)}/${filePaths.length} файлов`
        );
      }
    }

    console.log(`✅ Анализ завершен: ${scannedFiles.length} файлов обработано`);
    return scannedFiles;
  }

  /**
   * Анализирует отдельный файл
   */
  private static async analyzeFile(
    filePath: string,
    projectPath: string
  ): Promise<ScannedFile | null> {
    try {
      const stats = await stat(filePath);
      const relativePath = relative(projectPath, filePath);
      const pathParts = relativePath.split(/[/\\]/);

      return {
        absolutePath: filePath,
        relativePath,
        size: stats.size,
        extension: extname(filePath).toLowerCase(),
        isDirectory: stats.isDirectory(),
        depth: pathParts.length - 1,
        modifiedTime: stats.mtime,
      };
    } catch (error) {
      console.warn(`⚠️ Ошибка чтения файла ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Фильтрует файлы по критериям
   */
  static filterFiles(
    files: ScannedFile[],
    criteria: {
      minSize?: number;
      maxSize?: number;
      extensions?: string[];
      excludeExtensions?: string[];
      maxDepth?: number;
      modifiedAfter?: Date;
    }
  ): ScannedFile[] {
    return files.filter(file => {
      // Фильтр по размеру
      if (criteria.minSize !== undefined && file.size < criteria.minSize) return false;
      if (criteria.maxSize !== undefined && file.size > criteria.maxSize) return false;

      // Фильтр по расширениям
      if (criteria.extensions && !criteria.extensions.includes(file.extension)) return false;
      if (criteria.excludeExtensions && criteria.excludeExtensions.includes(file.extension))
        return false;

      // Фильтр по глубине
      if (criteria.maxDepth !== undefined && file.depth > criteria.maxDepth) return false;

      // Фильтр по дате изменения
      if (criteria.modifiedAfter && file.modifiedTime < criteria.modifiedAfter) return false;

      return true;
    });
  }

  /**
   * Группирует файлы по директориям
   */
  static groupByDirectory(files: ScannedFile[]): Map<string, ScannedFile[]> {
    const grouped = new Map<string, ScannedFile[]>();

    for (const file of files) {
      const directory = dirname(file.relativePath);
      const existing = grouped.get(directory) || [];
      existing.push(file);
      grouped.set(directory, existing);
    }

    return grouped;
  }

  /**
   * Группирует файлы по расширениям
   */
  static groupByExtension(files: ScannedFile[]): Map<string, ScannedFile[]> {
    const grouped = new Map<string, ScannedFile[]>();

    for (const file of files) {
      const extension = file.extension || 'no-extension';
      const existing = grouped.get(extension) || [];
      existing.push(file);
      grouped.set(extension, existing);
    }

    return grouped;
  }

  /**
   * Получает статистику сканирования
   */
  static getScanStatistics(files: ScannedFile[]): {
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    extensionCounts: Record<string, number>;
    directoryCounts: Record<string, number>;
    depthDistribution: Record<number, number>;
    largestFiles: ScannedFile[];
    oldestFiles: ScannedFile[];
    newestFiles: ScannedFile[];
  } {
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;

    // Подсчет по расширениям
    const extensionCounts: Record<string, number> = {};
    for (const file of files) {
      const ext = file.extension || 'no-extension';
      extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
    }

    // Подсчет по директориям
    const directoryCounts: Record<string, number> = {};
    for (const file of files) {
      const dir = dirname(file.relativePath);
      directoryCounts[dir] = (directoryCounts[dir] || 0) + 1;
    }

    // Распределение по глубине
    const depthDistribution: Record<number, number> = {};
    for (const file of files) {
      depthDistribution[file.depth] = (depthDistribution[file.depth] || 0) + 1;
    }

    // Самые большие файлы
    const largestFiles = [...files].sort((a, b) => b.size - a.size).slice(0, 10);

    // Самые старые файлы
    const oldestFiles = [...files]
      .sort((a, b) => a.modifiedTime.getTime() - b.modifiedTime.getTime())
      .slice(0, 10);

    // Самые новые файлы
    const newestFiles = [...files]
      .sort((a, b) => b.modifiedTime.getTime() - a.modifiedTime.getTime())
      .slice(0, 10);

    return {
      totalFiles,
      totalSize,
      averageSize,
      extensionCounts,
      directoryCounts,
      depthDistribution,
      largestFiles,
      oldestFiles,
      newestFiles,
    };
  }
}

export default FileSystemScanner;
