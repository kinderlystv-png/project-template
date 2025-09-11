'use strict';
/**
 * XSSAnalyzer - Анализатор XSS уязвимостей
 *
 * Обнаруживает потенциальные Cross-Site Scripting уязвимости в:
 * - Svelte компонентах ({@html})
 * - HTML файлах
 * - JavaScript коде (innerHTML, outerHTML)
 * - URL параметрах в шаблонах
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.XSSAnalyzer = void 0;
const fs_1 = require('fs');
const path_1 = require('path');
class XSSAnalyzer {
  static SCAN_EXTENSIONS = ['.svelte', '.html', '.js', '.ts', '.jsx', '.tsx'];
  static XSS_PATTERNS = {
    // Svelte {@html} без санитизации
    svelte_html: /{@html\s+([^}]+)}/g,
    // innerHTML/outerHTML присваивания
    inner_html: /\.innerHTML\s*=\s*([^;]+)/g,
    outer_html: /\.outerHTML\s*=\s*([^;]+)/g,
    // URL параметры в выводе
    url_params: /\$\{[^}]*(?:params|searchParams|query)[^}]*\}/g,
    // Динамический контент без экранирования
    dynamic_content: /\$\{[^}]*(?:req\.body|req\.query|req\.params)[^}]*\}/g,
    // Опасные DOM методы
    insert_html: /\.insertAdjacentHTML\s*\(\s*[^,]+,\s*([^)]+)\)/g,
    // document.write
    document_write: /document\.write\s*\(\s*([^)]+)\)/g,
  };
  /**
   * Анализирует проект на XSS уязвимости
   */
  async analyzeXSS(context) {
    const vulnerabilities = [];
    let filesScanned = 0;
    try {
      // Сканируем директории проекта
      await this.scanDirectory(context.projectPath, vulnerabilities, filesScanned);
      // Специальный анализ src/ папки если есть
      const srcPath = (0, path_1.join)(context.projectPath, 'src');
      if (this.directoryExists(srcPath)) {
        await this.scanDirectory(srcPath, vulnerabilities, filesScanned);
      }
      return this.createAnalysisResult(vulnerabilities, filesScanned);
    } catch (error) {
      console.error('XSSAnalyzer: Ошибка анализа:', error);
      return this.createEmptyResult();
    }
  }
  /**
   * Сканирует директорию рекурсивно
   */
  async scanDirectory(dirPath, vulnerabilities, filesScanned) {
    try {
      const items = (0, fs_1.readdirSync)(dirPath);
      for (const item of items) {
        const itemPath = (0, path_1.join)(dirPath, item);
        const stat = (0, fs_1.statSync)(itemPath);
        if (stat.isDirectory()) {
          // Пропускаем node_modules и другие служебные папки
          if (this.shouldSkipDirectory(item)) {
            continue;
          }
          await this.scanDirectory(itemPath, vulnerabilities, filesScanned);
        } else if (stat.isFile()) {
          if (this.shouldScanFile(item)) {
            await this.scanFile(itemPath, vulnerabilities);
            filesScanned++;
          }
        }
      }
    } catch (error) {
      // Игнорируем ошибки доступа к отдельным файлам
      console.warn(`XSSAnalyzer: Не удалось сканировать ${dirPath}`);
    }
  }
  /**
   * Сканирует отдельный файл на XSS уязвимости
   */
  async scanFile(filePath, vulnerabilities) {
    try {
      const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
      const lines = content.split('\n');
      // Применяем все паттерны поиска
      this.findSvelteHtmlVulnerabilities(filePath, content, lines, vulnerabilities);
      this.findInnerHTMLVulnerabilities(filePath, content, lines, vulnerabilities);
      this.findURLParamVulnerabilities(filePath, content, lines, vulnerabilities);
      this.findDOMManipulationVulnerabilities(filePath, content, lines, vulnerabilities);
    } catch (error) {
      console.warn(`XSSAnalyzer: Не удалось прочитать файл ${filePath}`);
    }
  }
  /**
   * Ищет небезопасные {@html} конструкции в Svelte
   */
  findSvelteHtmlVulnerabilities(filePath, content, lines, vulnerabilities) {
    if (!filePath.endsWith('.svelte')) return;
    let match;
    while ((match = XSSAnalyzer.XSS_PATTERNS.svelte_html.exec(content)) !== null) {
      const position = this.getLineAndColumn(content, match.index);
      const code = lines[position.line - 1]?.trim() || '';
      const variable = match[1].trim();
      // Проверяем, есть ли признаки санитизации
      const isSanitized = this.checkIfSanitized(variable, content);
      if (!isSanitized) {
        vulnerabilities.push({
          type: 'html_output',
          file: filePath,
          line: position.line,
          column: position.column,
          severity: 'critical',
          context: variable,
          code,
          description: `Небезопасный вывод HTML без санитизации: ${variable}`,
        });
      }
    }
  }
  /**
   * Ищет опасные innerHTML/outerHTML присваивания
   */
  findInnerHTMLVulnerabilities(filePath, content, lines, vulnerabilities) {
    // innerHTML
    this.findPatternVulnerabilities(
      filePath,
      content,
      lines,
      vulnerabilities,
      XSSAnalyzer.XSS_PATTERNS.inner_html,
      'inner_html',
      'high',
      'Небезопасное присваивание innerHTML'
    );
    // outerHTML
    this.findPatternVulnerabilities(
      filePath,
      content,
      lines,
      vulnerabilities,
      XSSAnalyzer.XSS_PATTERNS.outer_html,
      'outer_html',
      'high',
      'Небезопасное присваивание outerHTML'
    );
  }
  /**
   * Ищет небезопасное использование URL параметров
   */
  findURLParamVulnerabilities(filePath, content, lines, vulnerabilities) {
    this.findPatternVulnerabilities(
      filePath,
      content,
      lines,
      vulnerabilities,
      XSSAnalyzer.XSS_PATTERNS.url_params,
      'url_param',
      'medium',
      'Небезопасное использование URL параметров'
    );
    this.findPatternVulnerabilities(
      filePath,
      content,
      lines,
      vulnerabilities,
      XSSAnalyzer.XSS_PATTERNS.dynamic_content,
      'dynamic_content',
      'high',
      'Небезопасный динамический контент из запроса'
    );
  }
  /**
   * Ищет опасные DOM манипуляции
   */
  findDOMManipulationVulnerabilities(filePath, content, lines, vulnerabilities) {
    // insertAdjacentHTML
    this.findPatternVulnerabilities(
      filePath,
      content,
      lines,
      vulnerabilities,
      XSSAnalyzer.XSS_PATTERNS.insert_html,
      'inner_html',
      'high',
      'Небезопасное использование insertAdjacentHTML'
    );
    // document.write
    this.findPatternVulnerabilities(
      filePath,
      content,
      lines,
      vulnerabilities,
      XSSAnalyzer.XSS_PATTERNS.document_write,
      'inner_html',
      'critical',
      'Небезопасное использование document.write'
    );
  }
  /**
   * Универсальный поиск по паттерну
   */
  findPatternVulnerabilities(
    filePath,
    content,
    lines,
    vulnerabilities,
    pattern,
    type,
    severity,
    description
  ) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const position = this.getLineAndColumn(content, match.index);
      const code = lines[position.line - 1]?.trim() || '';
      const context = match[1]?.trim() || match[0];
      vulnerabilities.push({
        type,
        file: filePath,
        line: position.line,
        column: position.column,
        severity,
        context,
        code,
        description: `${description}: ${context}`,
      });
    }
  }
  /**
   * Проверяет, есть ли признаки санитизации
   */
  checkIfSanitized(variable, content) {
    const sanitizationKeywords = [
      'escape',
      'sanitize',
      'clean',
      'encode',
      'DOMPurify',
      'xss',
      'htmlentities',
      'escapeHtml',
      'encodeHTML',
    ];
    // Проверяем переменную на ключевые слова санитизации
    return sanitizationKeywords.some(
      keyword =>
        variable.toLowerCase().includes(keyword.toLowerCase()) ||
        content.toLowerCase().includes(`${variable.toLowerCase()}.${keyword.toLowerCase()}`) ||
        content.toLowerCase().includes(`${keyword.toLowerCase()}(${variable.toLowerCase()})`)
    );
  }
  /**
   * Получает номер строки и колонки по индексу в тексте
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
    return XSSAnalyzer.SCAN_EXTENSIONS.includes(ext);
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
  createAnalysisResult(vulnerabilities, filesScanned) {
    const summary = vulnerabilities.reduce(
      (acc, vuln) => {
        acc[vuln.severity]++;
        acc.total++;
        return acc;
      },
      { critical: 0, high: 0, medium: 0, total: 0 }
    );
    return {
      vulnerabilities,
      filesScanned,
      summary,
    };
  }
  /**
   * Создает пустой результат при ошибке
   */
  createEmptyResult() {
    return {
      vulnerabilities: [],
      filesScanned: 0,
      summary: { critical: 0, high: 0, medium: 0, total: 0 },
    };
  }
}
exports.XSSAnalyzer = XSSAnalyzer;
//# sourceMappingURL=XSSAnalyzer.js.map
