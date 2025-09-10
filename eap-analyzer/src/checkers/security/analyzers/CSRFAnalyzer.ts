/**
 * CSRFAnalyzer - Анализатор CSRF уязвимостей
 *
 * Обнаруживает отсутствие защиты от Cross-Site Request Forgery в:
 * - HTML формах
 * - Svelte формах и actions
 * - API endpoints
 * - Cookie настройках
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { CheckContext } from '../../../types/index.js';

export interface CSRFIssue {
  type: 'form_no_token' | 'api_no_protection' | 'cookie_no_samesite' | 'missing_middleware';
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium';
  context: string;
  code: string;
  description: string;
  suggestion: string;
}

export interface CSRFAnalysisResult {
  issues: CSRFIssue[];
  filesScanned: number;
  formsFound: number;
  protectedForms: number;
  summary: {
    critical: number;
    high: number;
    medium: number;
    total: number;
  };
}

export class CSRFAnalyzer {
  private static readonly SCAN_EXTENSIONS = ['.svelte', '.html', '.js', '.ts', '.jsx', '.tsx'];

  private static readonly CSRF_PATTERNS = {
    // HTML формы
    html_form: /<form[^>]*>/gi,

    // Svelte формы и actions
    svelte_form: /<form[^>]*use:enhance[^>]*>/gi,
    svelte_action: /export\s+const\s+\w+\s*:\s*Action/g,

    // API endpoints с методами изменения состояния
    api_post: /\.(post|put|patch|delete)\s*\(/gi,
    express_route: /(app|router)\.(post|put|patch|delete)/gi,

    // CSRF токены
    csrf_token: /csrf[_-]?token/gi,

    // SameSite cookies
    same_site: /sameSite/gi,

    // CSRF middleware
    csrf_middleware: /csrf|csurf/gi,
  };

  /**
   * Анализирует проект на CSRF уязвимости
   */
  async analyzeCSRF(context: CheckContext): Promise<CSRFAnalysisResult> {
    const issues: CSRFIssue[] = [];
    let filesScanned = 0;
    let formsFound = 0;
    let protectedForms = 0;

    try {
      // Сканируем основные директории
      await this.scanDirectory(
        context.projectPath,
        issues,
        filesScanned,
        formsFound,
        protectedForms
      );

      // Специальный анализ src/ папки
      const srcPath = join(context.projectPath, 'src');
      if (this.directoryExists(srcPath)) {
        await this.scanDirectory(srcPath, issues, filesScanned, formsFound, protectedForms);
      }

      return this.createAnalysisResult(issues, filesScanned, formsFound, protectedForms);
    } catch (error) {
      console.error('CSRFAnalyzer: Ошибка анализа:', error);
      return this.createEmptyResult();
    }
  }

  /**
   * Сканирует директорию рекурсивно
   */
  private async scanDirectory(
    dirPath: string,
    issues: CSRFIssue[],
    filesScanned: number,
    formsFound: number,
    protectedForms: number
  ): Promise<void> {
    try {
      const items = readdirSync(dirPath);

      for (const item of items) {
        const itemPath = join(dirPath, item);
        const stat = statSync(itemPath);

        if (stat.isDirectory()) {
          if (this.shouldSkipDirectory(item)) {
            continue;
          }

          await this.scanDirectory(itemPath, issues, filesScanned, formsFound, protectedForms);
        } else if (stat.isFile()) {
          if (this.shouldScanFile(item)) {
            const formCounts = await this.scanFile(itemPath, issues);
            formsFound += formCounts.total;
            protectedForms += formCounts.protected;
            filesScanned++;
          }
        }
      }
    } catch (error) {
      console.warn(`CSRFAnalyzer: Не удалось сканировать ${dirPath}`);
    }
  }

  /**
   * Сканирует отдельный файл на CSRF проблемы
   */
  private async scanFile(
    filePath: string,
    issues: CSRFIssue[]
  ): Promise<{ total: number; protected: number }> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      let totalForms = 0;
      let protectedForms = 0;

      // Анализируем формы
      const formAnalysis = this.analyzeForms(filePath, content, lines, issues);
      totalForms += formAnalysis.total;
      protectedForms += formAnalysis.protected;

      // Анализируем API endpoints
      this.analyzeAPIEndpoints(filePath, content, lines, issues);

      // Анализируем cookies
      this.analyzeCookies(filePath, content, lines, issues);

      return { total: totalForms, protected: protectedForms };
    } catch (error) {
      console.warn(`CSRFAnalyzer: Не удалось прочитать файл ${filePath}`);
      return { total: 0, protected: 0 };
    }
  }

  /**
   * Анализирует формы на наличие CSRF защиты
   */
  private analyzeForms(
    filePath: string,
    content: string,
    lines: string[],
    issues: CSRFIssue[]
  ): { total: number; protected: number } {
    let totalForms = 0;
    let protectedForms = 0;

    // HTML формы
    let match;
    while ((match = CSRFAnalyzer.CSRF_PATTERNS.html_form.exec(content)) !== null) {
      totalForms++;
      const position = this.getLineAndColumn(content, match.index);
      const formTag = match[0];
      const code = lines[position.line - 1]?.trim() || '';

      // Проверяем метод формы
      const methodMatch = formTag.match(/method\s*=\s*["']?(post|put|patch|delete)["']?/i);
      if (methodMatch) {
        // Это форма с методом изменения - проверяем CSRF защиту
        const hasCSRFToken = this.checkForCSRFToken(content, position.line);

        if (!hasCSRFToken) {
          issues.push({
            type: 'form_no_token',
            file: filePath,
            line: position.line,
            severity: 'high',
            context: formTag,
            code,
            description: `Форма с методом ${methodMatch[1].toUpperCase()} не имеет CSRF защиты`,
            suggestion: 'Добавьте CSRF токен в форму или используйте SvelteKit form actions',
          });
        } else {
          protectedForms++;
        }
      }
    }

    // Svelte формы с use:enhance
    CSRFAnalyzer.CSRF_PATTERNS.svelte_form.lastIndex = 0;
    while ((match = CSRFAnalyzer.CSRF_PATTERNS.svelte_form.exec(content)) !== null) {
      protectedForms++; // SvelteKit forms имеют встроенную CSRF защиту
    }

    return { total: totalForms, protected: protectedForms };
  }

  /**
   * Анализирует API endpoints на CSRF защиту
   */
  private analyzeAPIEndpoints(
    filePath: string,
    content: string,
    lines: string[],
    issues: CSRFIssue[]
  ): void {
    // Express/Fastify роуты
    let match;
    while ((match = CSRFAnalyzer.CSRF_PATTERNS.express_route.exec(content)) !== null) {
      const position = this.getLineAndColumn(content, match.index);
      const code = lines[position.line - 1]?.trim() || '';
      const method = match[2].toUpperCase();

      // Проверяем наличие CSRF middleware
      const hasCSRFMiddleware = this.checkForCSRFMiddleware(content, filePath);

      if (!hasCSRFMiddleware) {
        issues.push({
          type: 'api_no_protection',
          file: filePath,
          line: position.line,
          severity: 'medium',
          context: match[0],
          code,
          description: `API endpoint ${method} не защищен от CSRF`,
          suggestion: 'Добавьте CSRF middleware или проверку Origin/Referer заголовков',
        });
      }
    }
  }

  /**
   * Анализирует настройки cookies
   */
  private analyzeCookies(
    filePath: string,
    content: string,
    lines: string[],
    issues: CSRFIssue[]
  ): void {
    const cookieSetters = [
      /\.cookie\s*\(/gi,
      /res\.cookie/gi,
      /document\.cookie\s*=/gi,
      /setCookie/gi,
    ];

    for (const pattern of cookieSetters) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const position = this.getLineAndColumn(content, match.index);
        const code = lines[position.line - 1]?.trim() || '';

        // Проверяем SameSite настройку
        const lineStart = Math.max(0, position.line - 3);
        const lineEnd = Math.min(lines.length, position.line + 3);
        const contextLines = lines.slice(lineStart, lineEnd).join('\n');

        const hasSameSite = CSRFAnalyzer.CSRF_PATTERNS.same_site.test(contextLines);

        if (!hasSameSite) {
          issues.push({
            type: 'cookie_no_samesite',
            file: filePath,
            line: position.line,
            severity: 'medium',
            context: match[0],
            code,
            description: 'Cookie установлен без SameSite атрибута',
            suggestion: 'Добавьте sameSite: "strict" или "lax" для защиты от CSRF',
          });
        }
      }
    }
  }

  /**
   * Проверяет наличие CSRF токена около формы
   */
  private checkForCSRFToken(content: string, formLine: number): boolean {
    const lines = content.split('\n');

    // Проверяем несколько строк до и после формы
    const checkRange = 10;
    const startLine = Math.max(0, formLine - checkRange);
    const endLine = Math.min(lines.length, formLine + checkRange);

    const contextContent = lines.slice(startLine, endLine).join('\n');

    return CSRFAnalyzer.CSRF_PATTERNS.csrf_token.test(contextContent);
  }

  /**
   * Проверяет наличие CSRF middleware в файле или проекте
   */
  private checkForCSRFMiddleware(content: string, filePath: string): boolean {
    // Проверяем в текущем файле
    if (CSRFAnalyzer.CSRF_PATTERNS.csrf_middleware.test(content)) {
      return true;
    }

    // Можно расширить проверку на весь проект
    // пока ограничимся текущим файлом
    return false;
  }

  /**
   * Получает номер строки и колонки по индексу
   */
  private getLineAndColumn(content: string, index: number): { line: number; column: number } {
    const beforeIndex = content.substring(0, index);
    const lines = beforeIndex.split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    };
  }

  /**
   * Проверяет, нужно ли пропустить директорию
   */
  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      '.svelte-kit',
      'dist',
      'build',
      'coverage',
      '.next',
      '.nuxt',
      'vendor',
    ];
    return skipDirs.includes(name) || name.startsWith('.');
  }

  /**
   * Проверяет, нужно ли сканировать файл
   */
  private shouldScanFile(fileName: string): boolean {
    const ext = extname(fileName);
    return CSRFAnalyzer.SCAN_EXTENSIONS.includes(ext);
  }

  /**
   * Проверяет существование директории
   */
  private directoryExists(path: string): boolean {
    try {
      return statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Создает результат анализа
   */
  private createAnalysisResult(
    issues: CSRFIssue[],
    filesScanned: number,
    formsFound: number,
    protectedForms: number
  ): CSRFAnalysisResult {
    const summary = issues.reduce(
      (acc, issue) => {
        acc[issue.severity]++;
        acc.total++;
        return acc;
      },
      { critical: 0, high: 0, medium: 0, total: 0 }
    );

    return {
      issues,
      filesScanned,
      formsFound,
      protectedForms,
      summary,
    };
  }

  /**
   * Создает пустой результат при ошибке
   */
  private createEmptyResult(): CSRFAnalysisResult {
    return {
      issues: [],
      filesScanned: 0,
      formsFound: 0,
      protectedForms: 0,
      summary: { critical: 0, high: 0, medium: 0, total: 0 },
    };
  }
}
