'use strict';
/**
 * Code Security Checker - Enhanced for Task 2.3
 * Статический анализ кода на предмет проблем безопасности
 * Интегрирован с AdvancedSecurityAnalyzer для достижения целей Task 2.3
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.CodeSecurityChecker = void 0;
const fs_1 = require('fs');
const glob_1 = require('glob');
const RecommendationEngine_1 = require('../../recommendations/RecommendationEngine');
const AdvancedSecurityAnalyzer_1 = require('./AdvancedSecurityAnalyzer');
class CodeSecurityChecker {
  advancedAnalyzer;
  constructor() {
    // RecommendationEngine используется как статический класс
    this.advancedAnalyzer = new AdvancedSecurityAnalyzer_1.AdvancedSecurityAnalyzer();
  }
  /**
   * Выполняет статический анализ безопасности кода - ENHANCED для Task 2.3
   * Теперь включает расширенный анализ с +10 новыми типами угроз
   */
  async checkCodeSecurity(projectPath) {
    const result = {
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
      // Анализируем каждый файл (традиционный анализ)
      for (const file of files) {
        const issues = await this.scanFile(file, projectPath);
        result.issues.push(...issues);
      }
      // Task 2.3: Расширенный анализ безопасности (+10 новых типов угроз)
      const advancedResult = await this.advancedAnalyzer.analyze(projectPath);
      // Интегрируем результаты расширенного анализа
      this.integrateAdvancedResults(result, advancedResult);
      // Подсчитываем статистику
      result.summary = this.calculateSummary(result.issues);
    } catch (error) {
      // Error during security analysis - log silently and continue
    }
    return result;
  }
  /**
   * Получает список файлов для сканирования
   */
  async getFilesToScan(projectPath) {
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
      const files = [];
      for (const pattern of patterns) {
        const matches = await (0, glob_1.glob)(pattern, {
          cwd: projectPath,
          ignore: ignorePatterns,
          absolute: true,
        });
        files.push(...matches);
      }
      return files.filter((file, index, arr) => arr.indexOf(file) === index); // Remove duplicates
    } catch (error) {
      // Failed to get files for scanning
      return [];
    }
  }
  /**
   * Сканирует отдельный файл
   */
  async scanFile(filePath, projectPath) {
    const issues = [];
    try {
      const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
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
  checkForSecrets(file, line, code) {
    const issues = [];
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
        pattern: /(?:aws[_-]?secret|aws[_-]?key)\s*[:=]\s*['"]([a-zA-Z0-9/+]{40})['"]/,
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
  checkForUnsafeFunctions(file, line, code) {
    const issues = [];
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
  checkForSqlInjection(file, line, code) {
    const issues = [];
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
  checkForXssRisks(file, line, code) {
    const issues = [];
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
  isLikelyFalsePositive(code) {
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
  calculateSummary(issues) {
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
  generateDetailedRecommendations(issues) {
    const recommendations = [];
    for (const issue of issues) {
      const context = {
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
      const recommendation =
        RecommendationEngine_1.RecommendationEngine.generateRecommendation(context);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }
    return recommendations;
  }
  /**
   * Генерирует быстрые рекомендации для критических проблем
   */
  generateQuickRecommendations(issues) {
    const criticalIssues = issues.filter(
      issue => issue.severity === 'critical' || issue.severity === 'high'
    );
    return this.generateDetailedRecommendations(criticalIssues);
  }
  /**
   * Генерирует рекомендации по типам проблем
   */
  generateRecommendationsByType(issues) {
    const recommendationsByType = new Map();
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
  groupIssuesByType(issues) {
    const grouped = new Map();
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
  getCategoryFromType(type) {
    const categoryMap = {
      secret: 'secrets',
      'hardcoded-credential': 'credentials',
      'unsafe-function': 'unsafe-code',
      'sql-injection': 'injection',
      'xss-risk': 'xss',
    };
    return categoryMap[type] || 'general';
  }
  /**
   * Task 2.3: Интегрирует результаты расширенного анализа безопасности
   * Преобразует новые типы угроз в формат CodeSecurityIssue
   */
  integrateAdvancedResults(result, advancedResult) {
    // Преобразуем advanced security issues в формат CodeSecurityIssue
    for (const issue of advancedResult.issues || []) {
      const mappedIssue = {
        file: 'project-wide', // Общие проблемы проекта
        line: 0,
        type: this.mapAdvancedIssueType(issue.type),
        severity: issue.severity,
        description: `[Advanced Security] ${issue.message}`,
        code: '',
        recommendation: 'Apply security best practices and follow recommendations',
        context: {
          snippet: issue.message,
          before: '',
          after: '',
        },
      };
      result.issues.push(mappedIssue);
    }
    // Добавляем метрики расширенного анализа в контекст
    if (advancedResult.metrics) {
      const enhancedResult = result;
      enhancedResult.advancedMetrics = advancedResult.metrics;
      enhancedResult.advancedScore = advancedResult.score;
      enhancedResult.advancedRecommendations = advancedResult.recommendations;
    }
  } /**
   * Мапинг типов угроз из AdvancedSecurityAnalyzer в типы CodeSecurityChecker
   */
  mapAdvancedIssueType(advancedType) {
    const typeMap = {
      'crypto-weakness': 'unsafe-function',
      'hardcoded-crypto-key': 'secret',
      'insecure-randomness': 'unsafe-function',
      'weak-hash-function': 'unsafe-function',
      'weak-password-policy': 'hardcoded-credential',
      'insecure-session-management': 'unsafe-function',
      'insecure-token': 'secret',
      'missing-mfa': 'hardcoded-credential',
      'sensitive-data-in-logs': 'secret',
      'data-in-comments': 'secret',
      'debug-info-leak': 'unsafe-function',
      'env-data-leak': 'secret',
      'docker-security': 'unsafe-function',
      'dockerfile-secrets': 'secret',
      'docker-compose-security': 'unsafe-function',
      'container-root-user': 'unsafe-function',
      'unsafe-deserialization': 'unsafe-function',
      'dangerous-eval': 'unsafe-function',
      'unsafe-json-parsing': 'unsafe-function',
      'race-condition': 'unsafe-function',
      'unsafe-shared-state': 'unsafe-function',
      toctou: 'unsafe-function',
      'command-injection': 'sql-injection', // Логически похоже на инъекции
      'unsafe-shell-execution': 'unsafe-function',
      'path-injection': 'sql-injection',
      'insecure-cors': 'xss-risk', // Связано с XSS
      'missing-csp': 'xss-risk',
      'weak-csp': 'xss-risk',
      'open-redirect': 'xss-risk',
      'path-traversal': 'unsafe-function',
      'unsafe-file-operation': 'unsafe-function',
      'directory-traversal': 'unsafe-function',
      'sensitive-data-logging': 'secret',
      'log-injection': 'sql-injection',
      'excessive-logging': 'unsafe-function',
      'unsafe-log-destination': 'unsafe-function',
      'analysis-error': 'unsafe-function',
    };
    return typeMap[advancedType] || 'unsafe-function';
  }
}
exports.CodeSecurityChecker = CodeSecurityChecker;
//# sourceMappingURL=CodeSecurityChecker.js.map
