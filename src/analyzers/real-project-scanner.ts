/**
 * 🔍 Реальный сканер проекта для анализа файловой структуры
 * Заменяет демо-данные настоящим анализом
 */
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export interface FileInfo {
  path: string;
  extension: string;
  size: number;
  lines?: number;
  type: 'source' | 'config' | 'docs' | 'test' | 'asset';
}

export interface ProjectStructure {
  projectPath: string;
  scannedAt: Date;
  files: FileInfo[];
  directories: string[];
  summary: {
    totalFiles: number;
    totalSize: number;
    byType: Record<string, number>;
    byExtension: Record<string, number>;
  };
}

export class RealProjectScanner {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = path.resolve(projectPath);
  }

  async scanProject(): Promise<ProjectStructure> {
    console.log(`🔍 Сканирование проекта: ${this.projectPath}`);

    if (!(await fs.pathExists(this.projectPath))) {
      throw new Error(`Проект не найден: ${this.projectPath}`);
    }

    const files = await this.scanFiles();
    const directories = await this.scanDirectories();
    const summary = this.generateSummary(files);

    return {
      projectPath: this.projectPath,
      scannedAt: new Date(),
      files,
      directories,
      summary,
    };
  }

  private async scanFiles(): Promise<FileInfo[]> {
    const patterns = [
      '**/*.ts',
      '**/*.js',
      '**/*.tsx',
      '**/*.jsx',
      '**/*.svelte',
      '**/*.vue',
      '**/*.html',
      '**/*.css',
      '**/*.json',
      '**/*.md',
      '**/*.yml',
      '**/*.yaml',
      '**/*.test.*',
      '**/*.spec.*',
    ];

    const ignoredPatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/coverage/**',
      '**/*.min.*',
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const foundFiles = await glob(pattern, {
        cwd: this.projectPath,
        ignore: ignoredPatterns,
        absolute: true,
      });
      allFiles.push(...foundFiles);
    }

    const uniqueFiles = [...new Set(allFiles)];
    const fileInfos: FileInfo[] = [];

    for (const filePath of uniqueFiles) {
      try {
        const stats = await fs.stat(filePath);
        const extension = path.extname(filePath);
        const relativePath = path.relative(this.projectPath, filePath);

        const fileInfo: FileInfo = {
          path: relativePath,
          extension: extension.toLowerCase(),
          size: stats.size,
          type: this.determineFileType(relativePath, extension),
        };

        // Подсчитываем строки для исходных файлов
        if (fileInfo.type === 'source' || fileInfo.type === 'test') {
          fileInfo.lines = await this.countLines(filePath);
        }

        fileInfos.push(fileInfo);
      } catch (error) {
        console.warn(`⚠️ Не удалось обработать файл: ${filePath}`);
      }
    }

    return fileInfos;
  }

  private async scanDirectories(): Promise<string[]> {
    const directories: string[] = [];

    const traverse = async (dir: string) => {
      try {
        const items = await fs.readdir(path.join(this.projectPath, dir));

        for (const item of items) {
          const itemPath = path.join(dir, item);
          const fullPath = path.join(this.projectPath, itemPath);

          if (await fs.stat(fullPath).then(s => s.isDirectory())) {
            if (!this.shouldIgnoreDirectory(item)) {
              directories.push(itemPath);
              await traverse(itemPath);
            }
          }
        }
      } catch (error) {
        // Игнорируем ошибки доступа к папкам
      }
    };

    await traverse('');
    return directories.sort();
  }

  private shouldIgnoreDirectory(dirName: string): boolean {
    const ignoredDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.svelte-kit'];
    return ignoredDirs.includes(dirName) || dirName.startsWith('.');
  }

  private determineFileType(filePath: string, extension: string): FileInfo['type'] {
    if (
      filePath.includes('test') ||
      filePath.includes('spec') ||
      extension.includes('test') ||
      extension.includes('spec')
    ) {
      return 'test';
    }

    if (['.ts', '.js', '.tsx', '.jsx', '.svelte', '.vue'].includes(extension)) {
      return 'source';
    }

    if (['.json', '.yml', '.yaml', '.config'].some(ext => extension.includes(ext))) {
      return 'config';
    }

    if (['.md', '.txt', '.rst'].includes(extension)) {
      return 'docs';
    }

    return 'asset';
  }

  private async countLines(filePath: string): Promise<number> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.split('\n').length;
    } catch {
      return 0;
    }
  }

  private generateSummary(files: FileInfo[]) {
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    const byType: Record<string, number> = {};
    const byExtension: Record<string, number> = {};

    files.forEach(file => {
      byType[file.type] = (byType[file.type] || 0) + 1;
      byExtension[file.extension] = (byExtension[file.extension] || 0) + 1;
    });

    return { totalFiles, totalSize, byType, byExtension };
  }
}
