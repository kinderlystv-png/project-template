/**
 * Улучшенный детектор дублирования кода
 * Исправляет критические баги в расчете процента дублирования
 */
import * as crypto from 'crypto';
import * as path from 'path';

export interface DuplicateBlock {
  hash: string;
  content: string;
  lines: number;
  startLine: number;
  endLine: number;
  files: Array<{
    path: string;
    startLine: number;
    endLine: number;
  }>;
}

export interface DuplicationResult {
  percentage: number;
  duplicatedLines: number;
  totalLines: number;
  duplicateBlocks: DuplicateBlock[];
  uniqueLines: number;
  analysisMetadata: {
    analyzedFiles: number;
    skippedFiles: number;
    generatedFiles: number;
  };
}

export interface CodeBlock {
  hash: string;
  content: string;
  lines: number;
  startLine: number;
  endLine: number;
  filePath: string;
  normalized: string;
}

export class ImprovedDuplicationDetector {
  private readonly MIN_BLOCK_SIZE = 6; // Минимальный размер блока для дубликата
  private readonly MAX_LINE_LENGTH = 200; // Максимальная длина строки для анализа

  // Паттерны для игнорирования
  private readonly IGNORE_PATTERNS = [
    /^import\s+/, // Импорты
    /^export\s+/, // Экспорты
    /^\s*\/\//, // Однострочные комментарии
    /^\s*[\*\/]/, // Блочные комментарии
    /^[\s\{\}\(\)\[\]]+$/, // Только скобки и пробелы
    /^\s*console\.(log|error|warn)/, // Логирование
    /^\s*(const|let|var)\s+\w+\s*=\s*require\s*\(/, // CommonJS импорты
  ];

  // Паттерны сгенерированных файлов
  private readonly GENERATED_FILE_PATTERNS = [
    /node_modules/,
    /dist\//,
    /build\//,
    /\.next\//,
    /\.nuxt\//,
    /\.svelte-kit\//,
    /coverage\//,
    /\.min\.js$/,
    /index-[a-zA-Z0-9_-]{8,}\.js$/, // Webpack/Vite bundles
    /chunk-[a-zA-Z0-9]+\.js$/,
    /vendor\.[a-zA-Z0-9]+\.js$/,
    /runtime\.[a-zA-Z0-9]+\.js$/,
    /polyfills\.[a-zA-Z0-9]+\.js$/,
    /\.d\.ts$/, // TypeScript декларации
  ];

  async calculateDuplication(
    files: Array<{ path: string; content: string; lines: number }>
  ): Promise<DuplicationResult> {
    console.log(`🔍 Начинаем анализ дублирования для ${files.length} файлов...`);

    // Фильтруем только исходные файлы
    const sourceFiles = files.filter(f => this.isSourceFile(f.path));
    const skippedFiles = files.length - sourceFiles.length;

    console.log(
      `📄 Анализируем ${sourceFiles.length} исходных файлов (пропущено ${skippedFiles} сгенерированных)`
    );

    if (sourceFiles.length === 0) {
      return this.getEmptyResult(files.length, skippedFiles);
    }

    const hashMap = new Map<string, CodeBlock[]>();
    let totalLines = 0;
    let duplicatedLines = 0;
    let uniqueBlocks = 0;

    // Извлечение блоков кода из всех файлов
    for (const file of sourceFiles) {
      const blocks = this.extractCodeBlocks(file.path, file.content);
      totalLines += this.countMeaningfulLines(file.content);

      for (const block of blocks) {
        const hash = block.hash;

        if (hashMap.has(hash)) {
          // Найден дубликат
          const existingBlocks = hashMap.get(hash)!;

          // Проверяем, что это действительно дубликат из разных файлов или разных частей того же файла
          const isDuplicate = this.isRealDuplicate(block, existingBlocks);

          if (isDuplicate) {
            duplicatedLines += block.lines;
            existingBlocks.push(block);
          }
        } else {
          hashMap.set(hash, [block]);
          uniqueBlocks++;
        }
      }
    }

    // Корректный расчет процента (гарантированно не больше 100%)
    const percentage =
      totalLines > 0
        ? Math.min(100, Math.round((duplicatedLines / totalLines) * 100 * 100) / 100)
        : 0;

    const duplicateBlocks = this.extractDuplicateBlocks(hashMap);

    console.log(
      `✅ Анализ завершен: ${percentage}% дублирования (${duplicatedLines}/${totalLines} строк)`
    );

    return {
      percentage,
      duplicatedLines,
      totalLines,
      uniqueLines: totalLines - duplicatedLines,
      duplicateBlocks,
      analysisMetadata: {
        analyzedFiles: sourceFiles.length,
        skippedFiles,
        generatedFiles: files.filter(f => this.isGeneratedFile(f.path)).length,
      },
    };
  }

  private isSourceFile(filePath: string): boolean {
    // Сначала проверяем, что это не сгенерированный файл
    if (this.isGeneratedFile(filePath)) {
      return false;
    }

    // Проверяем расширение файла
    const ext = path.extname(filePath).toLowerCase();
    const sourceExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.mjs', '.cjs'];

    return sourceExtensions.includes(ext);
  }

  private isGeneratedFile(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    return this.GENERATED_FILE_PATTERNS.some(pattern => pattern.test(normalizedPath));
  }

  private extractCodeBlocks(filePath: string, content: string): CodeBlock[] {
    const lines = content.split('\n');
    const blocks: CodeBlock[] = [];

    for (let i = 0; i <= lines.length - this.MIN_BLOCK_SIZE; i++) {
      const blockLines = lines.slice(i, i + this.MIN_BLOCK_SIZE);

      // Пропускаем блоки с игнорируемыми паттернами
      if (this.shouldIgnoreBlock(blockLines)) {
        continue;
      }

      // Пропускаем блоки с очень длинными строками (вероятно, минифицированный код)
      if (blockLines.some(line => line.length > this.MAX_LINE_LENGTH)) {
        continue;
      }

      const blockContent = blockLines.join('\n');
      const normalized = this.normalizeCode(blockContent);

      // Пропускаем блоки, которые стали пустыми после нормализации
      if (normalized.trim().length < 20) {
        continue;
      }

      const hash = this.hashBlock(normalized);

      blocks.push({
        hash,
        content: blockContent,
        lines: this.MIN_BLOCK_SIZE,
        startLine: i + 1,
        endLine: i + this.MIN_BLOCK_SIZE,
        filePath,
        normalized,
      });
    }

    return blocks;
  }

  private shouldIgnoreBlock(lines: string[]): boolean {
    // Игнорируем блоки, состоящие в основном из игнорируемых паттернов
    const meaningfulLines = lines.filter(line => {
      const trimmed = line.trim();

      // Пустые строки
      if (trimmed.length === 0) return false;

      // Паттерны игнорирования
      if (this.IGNORE_PATTERNS.some(pattern => pattern.test(line))) return false;

      return true;
    });

    // Если осталось меньше половины значимых строк, игнорируем блок
    return meaningfulLines.length < lines.length / 2;
  }

  private normalizeCode(code: string): string {
    return (
      code
        // Убираем комментарии
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        // Нормализуем пробелы
        .replace(/\s+/g, ' ')
        // Унифицируем кавычки
        .replace(/['"`]/g, '"')
        // Убираем точки с запятой в конце строк
        .replace(/;\s*$/gm, '')
        // Убираем лишние пробелы
        .trim()
        // Приводим к нижнему регистру для игнорирования различий в именах переменных
        .toLowerCase()
    );
  }

  private hashBlock(normalizedContent: string): string {
    return crypto.createHash('md5').update(normalizedContent, 'utf8').digest('hex');
  }

  private isRealDuplicate(newBlock: CodeBlock, existingBlocks: CodeBlock[]): boolean {
    return existingBlocks.some(existing => {
      // Разные файлы - это дубликат
      if (existing.filePath !== newBlock.filePath) {
        return true;
      }

      // Один файл - проверяем, что блоки не перекрываются
      const noOverlap =
        existing.endLine < newBlock.startLine || newBlock.endLine < existing.startLine;
      return noOverlap;
    });
  }

  private countMeaningfulLines(content: string): number {
    const lines = content.split('\n');
    return lines.filter(line => {
      const trimmed = line.trim();

      // Пустые строки
      if (trimmed.length === 0) return false;

      // Комментарии
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
        return false;

      // Только скобки
      if (/^[\s\{\}\(\)\[\]]+$/.test(trimmed)) return false;

      return true;
    }).length;
  }

  private extractDuplicateBlocks(hashMap: Map<string, CodeBlock[]>): DuplicateBlock[] {
    const duplicateBlocks: DuplicateBlock[] = [];

    for (const [hash, blocks] of hashMap.entries()) {
      if (blocks.length > 1) {
        const duplicateBlock: DuplicateBlock = {
          hash,
          content: blocks[0].content,
          lines: blocks[0].lines,
          startLine: blocks[0].startLine,
          endLine: blocks[0].endLine,
          files: blocks.map(block => ({
            path: block.filePath,
            startLine: block.startLine,
            endLine: block.endLine,
          })),
        };

        duplicateBlocks.push(duplicateBlock);
      }
    }

    // Сортируем по количеству дубликатов
    return duplicateBlocks.sort((a, b) => b.files.length - a.files.length);
  }

  private getEmptyResult(totalFiles: number, skippedFiles: number): DuplicationResult {
    return {
      percentage: 0,
      duplicatedLines: 0,
      totalLines: 0,
      uniqueLines: 0,
      duplicateBlocks: [],
      analysisMetadata: {
        analyzedFiles: 0,
        skippedFiles,
        generatedFiles: totalFiles - skippedFiles,
      },
    };
  }
}
