/**
 * Интеграционный тест для AI Enhanced EAP анализатора
 * Проверяет работу всего пайплайна: анализ + AI + отчеты
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { AIEnhancedAnalyzer } from './index.js';
import { AIReportGenerator } from './report-generator.js';

describe('AI Enhanced EAP - Интеграционные тесты', () => {
  const testProjectPath = join(tmpdir(), 'eap-ai-test-project');

  beforeEach(() => {
    // Создаем тестовый проект
    try {
      rmSync(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Игнорируем если директория не существует
    }

    mkdirSync(testProjectPath, { recursive: true });

    // Создаем структуру проекта
    const structure = {
      'package.json': JSON.stringify(
        {
          name: 'test-project',
          version: '1.0.0',
          scripts: {
            build: 'tsc',
            test: 'jest',
          },
          dependencies: {
            lodash: '^4.0.0',
          },
          devDependencies: {
            typescript: '^5.0.0',
            jest: '^29.0.0',
          },
        },
        null,
        2
      ),

      'tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            module: 'commonjs',
            outDir: './dist',
            rootDir: './src',
            strict: true,
          },
        },
        null,
        2
      ),

      'README.md': '# Test Project\n\nThis is a test project for EAP AI analysis.',

      'src/index.ts': `
/**
 * Main application entry point
 */

export interface User {
  id: number;
  name: string;
  email: string;
}

export class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getAllUsers(): User[] {
    return [...this.users];
  }
}

export default UserService;
`,

      'src/utils.ts': `
/**
 * Utility functions
 */

export function formatName(firstName: string, lastName: string): string {
  return \`\${firstName} \${lastName}\`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}

// Пример дублированного кода - будет найден AI
export function processData(data: any[]): any[] {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i] && typeof data[i] === 'object') {
      result.push(data[i]);
    }
  }
  return result;
}

export function filterData(items: any[]): any[] {
  const filtered = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i] && typeof items[i] === 'object') {
      filtered.push(items[i]);
    }
  }
  return filtered;
}
`,

      'tests/user.test.ts': `
import { UserService, User } from '../src/index';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  test('should add user', () => {
    const user: User = { id: 1, name: 'John', email: 'john@test.com' };
    service.addUser(user);

    expect(service.getUser(1)).toEqual(user);
  });

  test('should get all users', () => {
    const users: User[] = [
      { id: 1, name: 'John', email: 'john@test.com' },
      { id: 2, name: 'Jane', email: 'jane@test.com' }
    ];

    users.forEach(user => service.addUser(user));

    expect(service.getAllUsers()).toHaveLength(2);
  });
});
`,

      '.eslintrc.json': JSON.stringify(
        {
          extends: ['@typescript-eslint/recommended'],
          parser: '@typescript-eslint/parser',
          plugins: ['@typescript-eslint'],
          rules: {
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
          },
        },
        null,
        2
      ),
    };

    // Создаем файлы
    Object.entries(structure).forEach(([filePath, content]) => {
      const fullPath = join(testProjectPath, filePath);
      const dir = join(fullPath, '..');
      mkdirSync(dir, { recursive: true });
      writeFileSync(fullPath, content);
    });
  });

  afterEach(() => {
    try {
      rmSync(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Игнорируем ошибки удаления
    }
  });

  test('Должен выполнить полный AI анализ проекта', async () => {
    const analyzer = new AIEnhancedAnalyzer();

    const result = await analyzer.analyzeProject(testProjectPath, {
      verbosity: 'detailed',
      includeCodeSnippets: true,
      confidenceThreshold: 0.5,
    });

    // Проверяем базовые результаты
    expect(result).toBeDefined();
    expect(result.projectPath).toBe(testProjectPath);
    expect(result.summary).toBeDefined();
    expect(result.summary.percentage).toBeGreaterThan(0);
    expect(result.summary.totalChecks).toBeGreaterThan(0);

    // Проверяем AI инсайты
    expect(result.aiInsights).toBeDefined();
    expect(result.aiInsights!.qualityScore).toBeDefined();
    expect(result.aiInsights!.qualityScore.overall).toBeGreaterThan(0);
    expect(result.aiInsights!.qualityScore.overall).toBeLessThanOrEqual(100);

    // Проверяем AI рекомендации
    expect(result.aiInsights!.recommendations).toBeDefined();
    expect(Array.isArray(result.aiInsights!.recommendations)).toBe(true);

    // Проверяем анализ метаданных
    expect(result.aiInsights!.analysisMetadata).toBeDefined();
    expect(['high', 'medium', 'low']).toContain(
      result.aiInsights!.analysisMetadata.confidenceLevel
    );

    console.log('✅ AI анализ выполнен успешно');
    console.log(`   Базовая оценка: ${result.summary.percentage}/100`);
    console.log(`   AI оценка: ${result.aiInsights!.qualityScore.overall}/100`);
    console.log(`   Рекомендаций: ${result.aiInsights!.recommendations.length}`);
  }, 30000);

  test('Должен генерировать все форматы отчетов', async () => {
    const analyzer = new AIEnhancedAnalyzer();
    const reportGenerator = new AIReportGenerator();

    const result = await analyzer.analyzeProject(testProjectPath, {
      verbosity: 'normal',
      confidenceThreshold: 0.6,
    });

    // Тестируем JSON отчет
    const jsonReport = reportGenerator.generateReport(result, {
      format: 'json',
      verbose: false,
      includeCode: false,
      includeCharts: false,
    });

    expect(jsonReport).toBeDefined();
    expect(typeof jsonReport).toBe('string');
    expect(() => JSON.parse(jsonReport!)).not.toThrow();

    // Тестируем Markdown отчет
    const markdownReport = reportGenerator.generateReport(result, {
      format: 'markdown',
      verbose: false,
      includeCode: false,
      includeCharts: false,
    });

    expect(markdownReport).toBeDefined();
    expect(typeof markdownReport).toBe('string');
    expect(markdownReport!).toContain('# 🧠 Интегрированный анализ кода');

    // Тестируем HTML отчет
    const htmlReport = reportGenerator.generateReport(result, {
      format: 'html',
      verbose: false,
      includeCode: false,
      includeCharts: true,
    });

    expect(htmlReport).toBeDefined();
    expect(typeof htmlReport).toBe('string');
    expect(htmlReport!).toContain('<!DOCTYPE html>');
    expect(htmlReport!).toContain('Интегрированный анализ кода');

    console.log('✅ Все форматы отчетов сгенерированы успешно');
  }, 20000);

  test('Должен обрабатывать проекты с ошибками', async () => {
    // Создаем проект с синтаксическими ошибками
    const errorFile = join(testProjectPath, 'src/broken.ts');
    writeFileSync(
      errorFile,
      `
// Файл с ошибками
export function brokenFunction( {
  const x = undefined variable;
  return x.invalid.property;
}

class UnfinishedClass {
  method() {
    // незакрытая функция
`
    );

    const analyzer = new AIEnhancedAnalyzer();

    // Анализ должен завершиться, но с предупреждениями
    const result = await analyzer.analyzeProject(testProjectPath, {
      verbosity: 'minimal',
      confidenceThreshold: 0.3,
    });

    expect(result).toBeDefined();
    expect(result.summary.percentage).toBeGreaterThanOrEqual(0);

    // AI должен снизить уверенность из-за ошибок
    if (result.aiInsights) {
      expect(['low', 'medium']).toContain(result.aiInsights.analysisMetadata.confidenceLevel);
    }

    console.log('✅ Обработка проектов с ошибками работает корректно');
  }, 15000);

  test('Должен работать с минимальными проектами', async () => {
    // Создаем минимальный проект только с package.json
    rmSync(testProjectPath, { recursive: true, force: true });
    mkdirSync(testProjectPath, { recursive: true });

    writeFileSync(
      join(testProjectPath, 'package.json'),
      JSON.stringify(
        {
          name: 'minimal-project',
          version: '1.0.0',
        },
        null,
        2
      )
    );

    writeFileSync(
      join(testProjectPath, 'index.js'),
      `
console.log('Hello, World!');
`
    );

    const analyzer = new AIEnhancedAnalyzer();

    const result = await analyzer.analyzeProject(testProjectPath, {
      verbosity: 'minimal',
    });

    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();

    // Даже минимальный проект должен получить AI анализ
    expect(result.aiInsights).toBeDefined();

    console.log('✅ Анализ минимальных проектов работает');
  }, 10000);

  test('Должен правильно обрабатывать пустые директории', async () => {
    // Создаем пустую директорию
    const emptyProject = join(testProjectPath, 'empty');
    mkdirSync(emptyProject, { recursive: true });

    const analyzer = new AIEnhancedAnalyzer();

    const result = await analyzer.analyzeProject(emptyProject, {
      verbosity: 'minimal',
    });

    expect(result).toBeDefined();
    expect(result.summary.percentage).toBe(0);

    // AI должен выдать низкую уверенность для пустых проектов
    if (result.aiInsights) {
      expect(result.aiInsights.analysisMetadata.confidenceLevel).toBe('low');
    }

    console.log('✅ Обработка пустых директорий работает корректно');
  }, 8000);
});
