/**
 * Code Security Checker
 * Статический анализ кода на предмет проблем безопасности
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import {
  RecommendationEngine,
  SecurityRecommendation,
  IssueContext,
} from '../../recommendations/RecommendationEngine';

export interface CodeSecurityIssue {
  file: string;
  line: number;
  type: 'secret' | 'hardcoded-credential' | 'unsafe-function' | 'sql-injection' | 'xss-risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  code: string;
  recommendation: string;
}

export interface CodeSecurityResult {
  issues: CodeSecurityIssue[];
  scannedFiles: number;
  summary: {
    secrets: number;
    hardcodedCredentials: number;
    unsafeFunctions: number;
    sqlInjection: number;
    xssRisks: number;
  };
}

export class CodeSecurityChecker {
  constructor() {
    // RecommendationEngine используется как статический класс
  }

  /**
   * Выполняет статический анализ безопасности кода
   */
  async checkCodeSecurity(projectPath: string): Promise<CodeSecurityResult> {
    const result: CodeSecurityResult = {
      issues: [],
      scannedFiles: 0,
      summary: {
        secrets: 0,
        hardcodedCredentials: 0,
        unsafeFunctions: 0,
        sqlInjection: 0,
        xssRisks: 0,
      },
    };

    try {
      // Получаем список файлов для анализа
      const files = await this.getFilesToScan(projectPath);
      result.scannedFiles = files.length;

      // Анализируем каждый файл
      for (const file of files) {
        const issues = await this.scanFile(file, projectPath);
        result.issues.push(...issues);
      }

      // Подсчитываем статистику
      result.summary = this.calculateSummary(result.issues);
    } catch (error) {
      console.warn('CodeSecurityChecker: Error during analysis:', error);
    }

    return result;
  }

  /**
   * Получает список файлов для сканирования
   */
  private async getFilesToScan(projectPath: string): Promise<string[]> {
    const patterns = [
      '**/*.{js,ts,jsx,tsx,svelte,vue}',
      '**/*.{json,env}',
      '**/*.{py,php,java,go,rb}',
    ];

    const ignorePatterns = [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.svelte-kit/**',
      '.next/**',
      'coverage/**',
      '**/*.min.js',
      '**/*.d.ts',
    ];

    try {
      const files: string[] = [];

      for (const pattern of patterns) {
        const matches = await glob(pattern, {
          cwd: projectPath,
          ignore: ignorePatterns,
          absolute: true,
        });
        files.push(...matches);
      }

      return files.filter((file, index, arr) => arr.indexOf(file) === index); // Remove duplicates
    } catch (error) {
      console.warn('Failed to get files for scanning:', error);
      return [];
    }
  }

  /**
   * Сканирует отдельный файл
   */
  private async scanFile(filePath: string, projectPath: string): Promise<CodeSecurityIssue[]> {
    const issues: CodeSecurityIssue[] = [];

    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const relativePath = filePath.replace(projectPath, '').replace(/^[\\/]/, '');

      lines.forEach((line, index) => {
        const lineNumber = index + 1;

        // Проверяем на секреты и credentials
        issues.push(...this.checkForSecrets(relativePath, lineNumber, line));

        // Проверяем на небезопасные функции
        issues.push(...this.checkForUnsafeFunctions(relativePath, lineNumber, line));

        // Проверяем на SQL injection риски
        issues.push(...this.checkForSqlInjection(relativePath, lineNumber, line));

        // Проверяем на XSS риски
        issues.push(...this.checkForXssRisks(relativePath, lineNumber, line));
      });
    } catch (error) {
      // Игнорируем ошибки чтения файлов (binary files, permissions, etc.)
    }

    return issues;
  }

  /**
   * Проверяет на наличие секретов и API ключей
   */
  private checkForSecrets(file: string, line: number, code: string): CodeSecurityIssue[] {
    const issues: CodeSecurityIssue[] = [];

    const secretPatterns = [
      // API ключи
      { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]([a-zA-Z0-9]{20,})['"]/, type: 'API Key' },
      {
        pattern: /(?:secret[_-]?key|secretkey)\s*[:=]\s*['"]([a-zA-Z0-9]{20,})['"]/,
        type: 'Secret Key',
      },

      // AWS ключи
      { pattern: /AKIA[0-9A-Z]{16}/, type: 'AWS Access Key' },
      {
        pattern: /(?:aws[_-]?secret|aws[_-]?key)\s*[:=]\s*['"]([a-zA-Z0-9\/+]{40})['"]/,
        type: 'AWS Secret',
      },

      // GitHub токены
      { pattern: /ghp_[a-zA-Z0-9]{36}/, type: 'GitHub Token' },

      // Общие паттерны
      {
        pattern: /(?:password|pwd|pass)\s*[:=]\s*['"](?!(\$\{|\{\{|<%))([^'"]{8,})['"]/,
        type: 'Hardcoded Password',
      },
      {
        pattern: /(?:token|auth[_-]?token)\s*[:=]\s*['"]([a-zA-Z0-9]{20,})['"]/,
        type: 'Auth Token',
      },
    ];

    secretPatterns.forEach(({ pattern, type }) => {
      const match = code.match(pattern);
      if (match && !this.isLikelyFalsePositive(code)) {
        issues.push({
          file,
          line,
          type: 'secret',
          severity: 'critical',
          description: `Potential ${type} found in code`,
          code: code.trim(),
          recommendation: `Move ${type} to environment variables or secure configuration`,
        });
      }
    });

    return issues;
  }

  /**
   * Проверяет на небезопасные функции
   */
  private checkForUnsafeFunctions(file: string, line: number, code: string): CodeSecurityIssue[] {
    const issues: CodeSecurityIssue[] = [];

    const unsafeFunctions = [
      { pattern: /eval\s*\(/, name: 'eval()', risk: 'Code injection' },
      { pattern: /document\.write\s*\(/, name: 'document.write()', risk: 'XSS vulnerability' },
      { pattern: /innerHTML\s*=/, name: 'innerHTML assignment', risk: 'XSS vulnerability' },
      {
        pattern: /dangerouslySetInnerHTML/,
        name: 'dangerouslySetInnerHTML',
        risk: 'XSS vulnerability',
      },
      { pattern: /Function\s*\(.*\)/, name: 'Function() constructor', risk: 'Code injection' },
    ];

    unsafeFunctions.forEach(({ pattern, name, risk }) => {
      if (pattern.test(code) && !this.isLikelyFalsePositive(code)) {
        issues.push({
          file,
          line,
          type: 'unsafe-function',
          severity: 'high',
          description: `Unsafe function ${name} detected - ${risk}`,
          code: code.trim(),
          recommendation: `Avoid using ${name}. Use safer alternatives or proper sanitization`,
        });
      }
    });

    return issues;
  }

  /**
   * Проверяет на SQL injection риски
   */
  private checkForSqlInjection(file: string, line: number, code: string): CodeSecurityIssue[] {
    const issues: CodeSecurityIssue[] = [];

    // Простые паттерны для обнаружения потенциальных SQL injection
    const sqlPatterns = [
      /query\s*\+\s*['"`]/, // String concatenation in queries
      /SELECT.*\+.*FROM/, // String concatenation in SELECT
      /INSERT.*\+.*VALUES/, // String concatenation in INSERT
      /UPDATE.*SET.*\+/, // String concatenation in UPDATE
    ];

    sqlPatterns.forEach(pattern => {
      if (pattern.test(code) && code.toLowerCase().includes('sql')) {
        issues.push({
          file,
          line,
          type: 'sql-injection',
          severity: 'high',
          description: 'Potential SQL injection vulnerability from string concatenation',
          code: code.trim(),
          recommendation: 'Use parameterized queries or ORM to prevent SQL injection',
        });
      }
    });

    return issues;
  }

  /**
   * Проверяет на XSS риски
   */
  private checkForXssRisks(file: string, line: number, code: string): CodeSecurityIssue[] {
    const issues: CodeSecurityIssue[] = [];

    const xssPatterns = [
      { pattern: /\$\{.*\}.*innerHTML/, risk: 'Template literal in innerHTML' },
      { pattern: /location\.href\s*=\s*[^'"]/, risk: 'Unvalidated redirect' },
      { pattern: /window\.open\s*\(\s*[^'"]/, risk: 'Unvalidated window.open' },
    ];

    xssPatterns.forEach(({ pattern, risk }) => {
      if (pattern.test(code)) {
        issues.push({
          file,
          line,
          type: 'xss-risk',
          severity: 'medium',
          description: `Potential XSS risk: ${risk}`,
          code: code.trim(),
          recommendation: 'Sanitize user input and validate all data before using in DOM',
        });
      }
    });

    return issues;
  }

  /**
   * Проверяет, является ли найденное совпадение ложным срабатыванием
   */
  private isLikelyFalsePositive(code: string): boolean {
    const falsePositiveIndicators = [
      '// TODO',
      '// FIXME',
      '// NOTE',
      'example',
      'placeholder',
      'dummy',
      'test',
      'mock',
      'fake',
      'console.log',
      'console.warn',
    ];

    const lowerCode = code.toLowerCase();
    return falsePositiveIndicators.some(indicator => lowerCode.includes(indicator.toLowerCase()));
  }

  /**
   * Подсчитывает статистику по типам проблем
   */
  private calculateSummary(issues: CodeSecurityIssue[]): CodeSecurityResult['summary'] {
    const summary = {
      secrets: 0,
      hardcodedCredentials: 0,
      unsafeFunctions: 0,
      sqlInjection: 0,
      xssRisks: 0,
    };

    issues.forEach(issue => {
      switch (issue.type) {
        case 'secret':
        case 'hardcoded-credential':
          summary.secrets++;
          break;
        case 'unsafe-function':
          summary.unsafeFunctions++;
          break;
        case 'sql-injection':
          summary.sqlInjection++;
          break;
        case 'xss-risk':
          summary.xssRisks++;
          break;
      }
    });

    return summary;
  }

  /**
   * Генерирует детальные рекомендации для найденных проблем безопасности кода
   */
  generateDetailedRecommendations(issues: CodeSecurityIssue[]): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];

    for (const issue of issues) {
      const context: IssueContext = {
        type: issue.type,
        severity: issue.severity,
        file: issue.file,
        line: issue.line,
        code: issue.code,
        details: {
          description: issue.description,
          issueType: 'code-security',
          category: this.getCategoryFromType(issue.type),
        },
      };

      const recommendation = RecommendationEngine.generateRecommendation(context);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  /**
   * Генерирует быстрые рекомендации для критических проблем
   */
  generateQuickRecommendations(issues: CodeSecurityIssue[]): SecurityRecommendation[] {
    const criticalIssues = issues.filter(
      issue => issue.severity === 'critical' || issue.severity === 'high'
    );

    return this.generateDetailedRecommendations(criticalIssues);
  }

  /**
   * Генерирует рекомендации по типам проблем
   */
  generateRecommendationsByType(
    issues: CodeSecurityIssue[]
  ): Map<string, SecurityRecommendation[]> {
    const recommendationsByType = new Map<string, SecurityRecommendation[]>();

    const groupedIssues = this.groupIssuesByType(issues);

    groupedIssues.forEach((typeIssues, type) => {
      const recommendations = this.generateDetailedRecommendations(typeIssues);
      recommendationsByType.set(type, recommendations);
    });

    return recommendationsByType;
  }

  /**
   * Группирует проблемы по типам
   */
  private groupIssuesByType(issues: CodeSecurityIssue[]): Map<string, CodeSecurityIssue[]> {
    const grouped = new Map<string, CodeSecurityIssue[]>();

    for (const issue of issues) {
      const existing = grouped.get(issue.type) || [];
      existing.push(issue);
      grouped.set(issue.type, existing);
    }

    return grouped;
  }

  /**
   * Определяет категорию по типу проблемы
   */
  private getCategoryFromType(type: string): string {
    const categoryMap: Record<string, string> = {
      secret: 'secrets',
      'hardcoded-credential': 'credentials',
      'unsafe-function': 'unsafe-code',
      'sql-injection': 'injection',
      'xss-risk': 'xss',
    };

    return categoryMap[type] || 'general';
  }
}
