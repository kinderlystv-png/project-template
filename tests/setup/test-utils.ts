/**
 * Утилиты для тестирования
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { vi, expect } from 'vitest';

// Типы для тестирования
export interface AnalysisResult {
  fileCount: number;
  totalLines: number;
  fileTypes: Record<string, number>;
  totalSize?: number;
}

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  iterations?: number;
}

export interface ReportStructure {
  timestamp: string;
  summary: Record<string, unknown>;
  details: Record<string, unknown>;
}

export interface ExpectedLimits {
  maxExecutionTime?: number;
  maxMemoryUsage?: number;
}

/**
 * Создает временную структуру файлов для тестирования
 */
export function mockProjectStructure(files: Record<string, string>) {
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-project-'));

  Object.entries(files).forEach(([filePath, content]) => {
    const fullPath = path.join(testDir, filePath);
    const dirName = path.dirname(fullPath);

    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }

    fs.writeFileSync(fullPath, content);
  });

  return {
    path: testDir,
    cleanup: () => fs.rmSync(testDir, { recursive: true, force: true }),
    getFilePath: (relativePath: string) => path.join(testDir, relativePath),
    readFile: (relativePath: string) => fs.readFileSync(path.join(testDir, relativePath), 'utf-8'),
    exists: (relativePath: string) => fs.existsSync(path.join(testDir, relativePath)),
  };
}

/**
 * Создает моки для файловой системы
 */
export function createFileSystemMocks() {
  return {
    findFiles: vi.fn(),
    readFileContent: vi.fn(),
    writeFile: vi.fn(),
    exists: vi.fn(),
    createDirectory: vi.fn(),
  };
}

/**
 * Создает моки для анализатора
 */
export function createAnalyzerMocks() {
  return {
    fileSystem: createFileSystemMocks(),
    reporter: {
      generateReport: vi.fn(),
      generateHTMLReport: vi.fn(),
      generateJSONReport: vi.fn(),
    },
    validator: {
      validate: vi.fn(),
      validateProject: vi.fn(),
    },
  };
}

/**
 * Создает тестовые данные для анализа
 */
export function createTestAnalysisData() {
  return {
    project: {
      name: 'test-project',
      version: '1.0.0',
      path: '/test/project',
      fileCount: 10,
      totalLines: 1000,
      totalSize: 50000,
    },
    files: [
      {
        path: 'src/index.js',
        size: 1500,
        lines: 50,
        type: 'javascript',
        complexity: 'low',
      },
    ],
    metrics: {
      maintainabilityIndex: 85,
      codeComplexity: 15,
      technicalDebt: 2,
      testCoverage: 78,
    },
  };
}

/**
 * Создает мок для DOM окружения
 */
export function setupDOMMocks() {
  Object.defineProperty(global, 'document', {
    value: {
      createElement: vi.fn((tagName: string) => ({
        tagName: tagName.toUpperCase(),
        style: {},
        className: '',
        textContent: '',
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        remove: vi.fn(),
      })),
      createDocumentFragment: vi.fn(() => ({
        appendChild: vi.fn(),
        childNodes: [],
      })),
      getElementById: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    },
    configurable: true,
  });
}

/**
 * Валидатор результатов тестов
 */
export class TestResultValidator {
  static validateAnalysisResult(result: AnalysisResult) {
    expect(result).toBeDefined();
    expect(result).toHaveProperty('fileCount');
    expect(result).toHaveProperty('totalLines');
    expect(result).toHaveProperty('fileTypes');
    expect(typeof result.fileCount).toBe('number');
    expect(typeof result.totalLines).toBe('number');
    expect(typeof result.fileTypes).toBe('object');
  }

  static validatePerformanceMetrics(
    metrics: PerformanceMetrics,
    expectedLimits: ExpectedLimits = {}
  ) {
    expect(metrics).toBeDefined();
    expect(metrics).toHaveProperty('executionTime');
    expect(metrics).toHaveProperty('memoryUsage');

    if (expectedLimits.maxExecutionTime) {
      expect(metrics.executionTime).toBeLessThan(expectedLimits.maxExecutionTime);
    }

    if (expectedLimits.maxMemoryUsage) {
      expect(metrics.memoryUsage).toBeLessThan(expectedLimits.maxMemoryUsage);
    }
  }

  static validateReportStructure(report: ReportStructure) {
    expect(report).toBeDefined();
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('details');
    expect(new Date(report.timestamp)).toBeInstanceOf(Date);
  }
}
