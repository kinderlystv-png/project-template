'use strict';
/**
 * CSRFAnalyzer - Анализатор CSRF уязвимостей
 *
 * Обнаруживает отсутствие защиты от Cross-Site Request Forgery в:
 * - HTML формах
 * - Svelte формах и actions
 * - API endpoints
 * - Cookie настройках
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.CSRFAnalyzer = void 0;
const fs_1 = require('fs');
const path_1 = require('path');
class CSRFAnalyzer {
  static SCAN_EXTENSIONS = ['.svelte', '.html', '.js', '.ts', '.jsx', '.tsx'];
  static CSRF_PATTERNS = {
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
  async analyzeCSRF(context) {
    const issues = [];
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
      const srcPath = (0, path_1.join)(context.projectPath, 'src');
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
  async scanDirectory(dirPath, issues, filesScanned, formsFound, protectedForms) {
    try {
      const items = (0, fs_1.readdirSync)(dirPath);
      for (const item of items) {
        const itemPath = (0, path_1.join)(dirPath, item);
        const stat = (0, fs_1.statSync)(itemPath);
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
  async scanFile(filePath, issues) {
    try {
      const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
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
  analyzeForms(filePath, content, lines, issues) {
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
  analyzeAPIEndpoints(filePath, content, lines, issues) {
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
  analyzeCookies(filePath, content, lines, issues) {
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
  checkForCSRFToken(content, formLine) {
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
  checkForCSRFMiddleware(content, filePath) {
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
  getLineAndColumn(content, index) {
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
  shouldSkipDirectory(name) {
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
  shouldScanFile(fileName) {
    const ext = (0, path_1.extname)(fileName);
    return CSRFAnalyzer.SCAN_EXTENSIONS.includes(ext);
  }
  /**
   * Проверяет существование директории
   */
  directoryExists(path) {
    try {
      return (0, fs_1.statSync)(path).isDirectory();
    } catch {
      return false;
    }
  }
  /**
   * Создает результат анализа
   */
  createAnalysisResult(issues, filesScanned, formsFound, protectedForms) {
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
  createEmptyResult() {
    return {
      issues: [],
      filesScanned: 0,
      formsFound: 0,
      protectedForms: 0,
      summary: { critical: 0, high: 0, medium: 0, total: 0 },
    };
  }
}
exports.CSRFAnalyzer = CSRFAnalyzer;
//# sourceMappingURL=CSRFAnalyzer.js.map
