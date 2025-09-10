/**
 * Code Structure Analyzer
 * Анализатор структуры кода проекта
 */

import { BaseAnalyzer } from '../interfaces';
import { Project } from '../../types/Project';
import { StructureAnalysisResult } from '../../types/analysis-results';

export class CodeStructureAnalyzer extends BaseAnalyzer<StructureAnalysisResult> {
  private readonly LARGE_FILE_THRESHOLD = 1000000; // 1MB в байтах
  private readonly MAX_DIRECTORY_FILES = 50; // Максимальное количество файлов в директории

  constructor() {
    super(
      'CodeStructureAnalyzer',
      'Анализирует структуру кода, распределение файлов и модульность проекта'
    );
  }

  async analyze(project: Project): Promise<StructureAnalysisResult> {
    console.log(`[${this.name}] Начинаем анализ структуры проекта...`);

    try {
      // Получаем список всех файлов
      const allFiles = await this.safeGetFileList(project);
      const sourceFiles = allFiles.filter(
        file => this.isSourceCodeFile(file) && !this.isIgnoredDirectory(file)
      );

      // Анализируем размеры файлов
      const fileSizes = await this.analyzeFileSizes(project, sourceFiles);

      // Анализируем типы файлов
      const fileTypes = this.analyzeFileTypes(sourceFiles);

      // Анализируем структуру директорий
      const directoryAnalysis = this.analyzeDirectoryStructure(sourceFiles);

      // Вычисляем показатель модульности
      const modularity = await this.calculateModularity(project, sourceFiles);

      // Находим большие файлы
      const largeFiles = this.findLargeFiles(fileSizes);

      // Находим "тяжелые" директории
      const heaviestDirectories = this.findHeaviestDirectories(sourceFiles);

      // Вычисляем статистику
      const totalSize = Object.values(fileSizes).reduce((sum, size) => sum + size, 0);
      const averageFileSize = sourceFiles.length > 0 ? totalSize / sourceFiles.length : 0;
      const largeFilesCount = largeFiles.length;

      const result: StructureAnalysisResult = {
        fileCount: sourceFiles.length,
        directoryDepth: directoryAnalysis.maxDepth,
        fileSizes,
        fileTypes,
        modularity,
        averageFileSize,
        largeFilesCount,
        largeFiles,
        heaviestDirectories,
      };

      console.log(
        `[${this.name}] Анализ завершен. Найдено ${sourceFiles.length} файлов исходного кода`
      );
      return result;
    } catch (error) {
      console.error(`[${this.name}] Ошибка при анализе:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Ошибка анализа структуры кода: ${errorMessage}`);
    }
  }

  /**
   * Анализирует размеры файлов
   */
  private async analyzeFileSizes(
    project: Project,
    files: string[]
  ): Promise<Record<string, number>> {
    const fileSizes: Record<string, number> = {};

    for (const file of files) {
      try {
        const content = await this.safeReadFile(project, file);
        if (content !== null) {
          fileSizes[file] = this.getFileSize(content);
        }
      } catch (error) {
        console.warn(`Не удалось получить размер файла ${file}:`, error);
        fileSizes[file] = 0;
      }
    }

    return fileSizes;
  }

  /**
   * Анализирует типы файлов
   */
  private analyzeFileTypes(files: string[]): Record<string, number> {
    const fileTypes: Record<string, number> = {};

    for (const file of files) {
      const extension = this.getFileExtension(file);
      fileTypes[extension] = (fileTypes[extension] || 0) + 1;
    }

    return fileTypes;
  }

  /**
   * Анализирует структуру директорий
   */
  private analyzeDirectoryStructure(files: string[]): {
    maxDepth: number;
    directoryCounts: Record<string, number>;
  } {
    let maxDepth = 0;
    const directoryCounts: Record<string, number> = {};

    for (const file of files) {
      const parts = file.split('/').filter(part => part.length > 0);
      maxDepth = Math.max(maxDepth, parts.length - 1); // -1 потому что последний элемент - имя файла

      // Считаем файлы в каждой директории
      if (parts.length > 1) {
        const dir = parts.slice(0, -1).join('/');
        directoryCounts[dir] = (directoryCounts[dir] || 0) + 1;
      }
    }

    return { maxDepth, directoryCounts };
  }

  /**
   * Вычисляет показатель модульности проекта
   */
  private async calculateModularity(project: Project, files: string[]): Promise<number> {
    let modularity = 0;
    let totalChecks = 0;

    // Проверяем наличие index файлов в директориях
    const directories = new Set<string>();
    files.forEach(file => {
      const dir = file.split('/').slice(0, -1).join('/');
      if (dir) directories.add(dir);
    });

    for (const dir of directories) {
      totalChecks++;
      const indexFiles = [
        `${dir}/index.js`,
        `${dir}/index.ts`,
        `${dir}/index.jsx`,
        `${dir}/index.tsx`,
      ];

      for (const indexFile of indexFiles) {
        if (await project.exists(indexFile)) {
          modularity++;
          break;
        }
      }
    }

    // Проверяем единообразие структуры
    const fileExtensions = files.map(file => this.getFileExtension(file));
    const uniqueExtensions = new Set(fileExtensions);
    const extensionConsistency = 1 - (uniqueExtensions.size - 1) / Math.max(files.length, 1);

    // Проверяем глубину вложенности
    const depths = files.map(file => file.split('/').length - 1);
    const maxDepth = Math.max(...depths);
    const depthConsistency = Math.max(0, 1 - (maxDepth - 3) / 10); // Идеальная глубина <= 3

    // Общий показатель модульности
    const indexModularity = totalChecks > 0 ? modularity / totalChecks : 1;
    const overallModularity = (indexModularity + extensionConsistency + depthConsistency) / 3;

    return Math.max(0, Math.min(1, overallModularity));
  }

  /**
   * Находит файлы больше порогового размера
   */
  private findLargeFiles(fileSizes: Record<string, number>): Array<{ path: string; size: number }> {
    return Object.entries(fileSizes)
      .filter(([_, size]) => size > this.LARGE_FILE_THRESHOLD)
      .map(([path, size]) => ({ path, size }))
      .sort((a, b) => b.size - a.size);
  }

  /**
   * Находит директории с наибольшим количеством файлов
   */
  private findHeaviestDirectories(files: string[]): Array<{ path: string; fileCount: number }> {
    const directoryCounts: Record<string, number> = {};

    for (const file of files) {
      const parts = file.split('/');
      if (parts.length > 1) {
        const dir = parts.slice(0, -1).join('/');
        directoryCounts[dir] = (directoryCounts[dir] || 0) + 1;
      }
    }

    return Object.entries(directoryCounts)
      .filter(([_, count]) => count > this.MAX_DIRECTORY_FILES)
      .map(([path, fileCount]) => ({ path, fileCount }))
      .sort((a, b) => b.fileCount - a.fileCount)
      .slice(0, 10); // Топ 10 самых "тяжелых" директорий
  }

  /**
   * Получает расширение файла
   */
  private getFileExtension(filePath: string): string {
    const parts = filePath.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : 'no-extension';
  }

  /**
   * Проверяет применимость анализатора
   */
  async isApplicable(project: Project): Promise<boolean> {
    const files = await this.safeGetFileList(project);
    const sourceFiles = files.filter(file => this.isSourceCodeFile(file));
    return sourceFiles.length > 0;
  }
}
