"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImprovedDuplicationDetector = void 0;
/**
 * Улучшенный детектор дублирования кода
 * Исправляет критические баги в расчете процента дублирования
 */
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
class ImprovedDuplicationDetector {
    MIN_BLOCK_SIZE = 6; // Минимальный размер блока для дубликата
    MAX_LINE_LENGTH = 200; // Максимальная длина строки для анализа
    // Паттерны для игнорирования
    IGNORE_PATTERNS = [
        /^import\s+/, // Импорты
        /^export\s+/, // Экспорты
        /^\s*\/\//, // Однострочные комментарии
        /^\s*[\*\/]/, // Блочные комментарии
        /^[\s\{\}\(\)\[\]]+$/, // Только скобки и пробелы
        /^\s*console\.(log|error|warn)/, // Логирование
        /^\s*(const|let|var)\s+\w+\s*=\s*require\s*\(/, // CommonJS импорты
    ];
    // Паттерны сгенерированных файлов
    GENERATED_FILE_PATTERNS = [
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
    async calculateDuplication(files) {
        console.log(`🔍 Начинаем анализ дублирования для ${files.length} файлов...`);
        // Фильтруем только исходные файлы
        const sourceFiles = files.filter(f => this.isSourceFile(f.path));
        const skippedFiles = files.length - sourceFiles.length;
        console.log(`📄 Анализируем ${sourceFiles.length} исходных файлов (пропущено ${skippedFiles} сгенерированных)`);
        if (sourceFiles.length === 0) {
            return this.getEmptyResult(files.length, skippedFiles);
        }
        const hashMap = new Map();
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
                    const existingBlocks = hashMap.get(hash);
                    // Проверяем, что это действительно дубликат из разных файлов или разных частей того же файла
                    const isDuplicate = this.isRealDuplicate(block, existingBlocks);
                    if (isDuplicate) {
                        duplicatedLines += block.lines;
                        existingBlocks.push(block);
                    }
                }
                else {
                    hashMap.set(hash, [block]);
                    uniqueBlocks++;
                }
            }
        }
        // Корректный расчет процента (гарантированно не больше 100%)
        const percentage = totalLines > 0
            ? Math.min(100, Math.round((duplicatedLines / totalLines) * 100 * 100) / 100)
            : 0;
        const duplicateBlocks = this.extractDuplicateBlocks(hashMap);
        console.log(`✅ Анализ завершен: ${percentage}% дублирования (${duplicatedLines}/${totalLines} строк)`);
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
    isSourceFile(filePath) {
        // Сначала проверяем, что это не сгенерированный файл
        if (this.isGeneratedFile(filePath)) {
            return false;
        }
        // Проверяем расширение файла
        const ext = path.extname(filePath).toLowerCase();
        const sourceExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.mjs', '.cjs'];
        return sourceExtensions.includes(ext);
    }
    isGeneratedFile(filePath) {
        const normalizedPath = filePath.replace(/\\/g, '/');
        return this.GENERATED_FILE_PATTERNS.some(pattern => pattern.test(normalizedPath));
    }
    extractCodeBlocks(filePath, content) {
        const lines = content.split('\n');
        const blocks = [];
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
    shouldIgnoreBlock(lines) {
        // Игнорируем блоки, состоящие в основном из игнорируемых паттернов
        const meaningfulLines = lines.filter(line => {
            const trimmed = line.trim();
            // Пустые строки
            if (trimmed.length === 0)
                return false;
            // Паттерны игнорирования
            if (this.IGNORE_PATTERNS.some(pattern => pattern.test(line)))
                return false;
            return true;
        });
        // Если осталось меньше половины значимых строк, игнорируем блок
        return meaningfulLines.length < lines.length / 2;
    }
    normalizeCode(code) {
        return (code
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
            .toLowerCase());
    }
    hashBlock(normalizedContent) {
        return crypto.createHash('md5').update(normalizedContent, 'utf8').digest('hex');
    }
    isRealDuplicate(newBlock, existingBlocks) {
        return existingBlocks.some(existing => {
            // Разные файлы - это дубликат
            if (existing.filePath !== newBlock.filePath) {
                return true;
            }
            // Один файл - проверяем, что блоки не перекрываются
            const noOverlap = existing.endLine < newBlock.startLine || newBlock.endLine < existing.startLine;
            return noOverlap;
        });
    }
    countMeaningfulLines(content) {
        const lines = content.split('\n');
        return lines.filter(line => {
            const trimmed = line.trim();
            // Пустые строки
            if (trimmed.length === 0)
                return false;
            // Комментарии
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
                return false;
            // Только скобки
            if (/^[\s\{\}\(\)\[\]]+$/.test(trimmed))
                return false;
            return true;
        }).length;
    }
    extractDuplicateBlocks(hashMap) {
        const duplicateBlocks = [];
        for (const [hash, blocks] of hashMap.entries()) {
            if (blocks.length > 1) {
                const duplicateBlock = {
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
    getEmptyResult(totalFiles, skippedFiles) {
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
exports.ImprovedDuplicationDetector = ImprovedDuplicationDetector;
//# sourceMappingURL=duplication-detector.js.map