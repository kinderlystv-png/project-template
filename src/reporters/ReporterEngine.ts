/**
 * 🎯 EAP ANALYZER v6.0 - REPORTER ENGINE
 * Центральный координатор системы отчетов
 */

import type {
  ReportData,
  ReportConfig,
  IReporter,
  ReporterOptions,
  ProjectSummary,
  CategoryReport,
  ComponentStatus,
} from './types.js';

import { HTMLReporter } from './HTMLReporter.js';
import { MarkdownReporter } from './MarkdownReporter.js';

// Временный интерфейс для результатов анализа
interface AnalysisResult {
  recommendations?: Array<{
    id: string;
    category: string;
    priority: string;
    title: string;
    description: string;
  }>;
  issues?: Array<{
    severity: string;
    type: string;
    message: string;
  }>;
  security?: {
    readiness?: number;
    xssStatus?: { readiness?: number; filesAnalyzed?: number; linesOfCode?: number };
    csrfStatus?: { readiness?: number; filesAnalyzed?: number; linesOfCode?: number };
    vulnerabilities?: unknown[];
    score?: number;
    csp?: string;
    https?: string;
    auth?: string;
    dataProtection?: string;
  };
  testing?: {
    readiness?: number;
    unitTests?: { readiness?: number; filesCount?: number; testsCount?: number; coverage?: number };
    coverage?: { lines: number; functions: number; branches: number; statements: number };
    results?: { total: number; passed: number; failed: number; skipped: number; duration: number };
    files?: unknown[];
    mocking?: string;
    e2e?: string;
  };
  performance?: {
    readiness?: number;
    bundleAnalysis?: { readiness?: number; filesCount?: number; dependencies?: string[] };
    bundleSize?: { total?: number; gzipped?: number; assets?: unknown[] };
    buildTime?: number;
    memoryUsage?: number;
  };
  analysisTime?: number;
  configPath?: string;
}

export class ReporterEngine {
  private reporters = new Map<string, IReporter>();

  constructor() {
    // Регистрируем базовые репортеры при инициализации
    this.registerDefaultReporters();
  }

  /**
   * Регистрация репортера
   */
  registerReporter(format: string, reporter: IReporter): void {
    this.reporters.set(format, reporter);
  }

  /**
   * Генерация отчета в указанном формате
   */
  async generateReport(
    data: ReportData,
    format: string,
    config?: Partial<ReportConfig>
  ): Promise<string> {
    const reporter = this.reporters.get(format);

    if (!reporter) {
      throw new Error(`Unsupported report format: ${format}`);
    }

    const fullConfig: ReportConfig = {
      ...reporter.getDefaultConfig(),
      ...config,
      format: format as ReportConfig['format'],
    };

    return await reporter.generate(data, fullConfig);
  }

  /**
   * Генерация множественных отчетов
   */
  async generateMultipleReports(
    data: ReportData,
    formats: string[],
    options: ReporterOptions
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const format of formats) {
      try {
        const config: Partial<ReportConfig> = {
          outputPath: options.outputDir,
          includeDetails: true,
          includeRecommendations: true,
          interactive: format === 'html',
        };

        const result = await this.generateReport(data, format, config);
        results.set(format, result);

        // eslint-disable-next-line no-console
        console.log(`✅ ${format.toUpperCase()} отчет сгенерирован`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`❌ Ошибка генерации ${format} отчета:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.set(format, `Error: ${errorMessage}`);
      }
    }

    return results;
  }

  /**
   * Преобразование данных анализатора в ReportData
   */
  static createReportData(analysisResult: AnalysisResult, projectPath: string): ReportData {
    const timestamp = new Date().toISOString();

    // Преобразуем результаты анализа в структурированные данные
    const categories = this.extractCategories(analysisResult);
    const summary = this.calculateSummary(categories, analysisResult);

    return {
      timestamp,
      projectPath,
      summary,
      categories,
      recommendations:
        analysisResult.recommendations?.map(rec => ({
          id: rec.id,
          category: rec.category || 'general',
          component: rec.category || 'general',
          priority: rec.priority as 'critical' | 'high' | 'medium' | 'low',
          title: rec.title || rec.description,
          description: rec.description || rec.title,
          action: rec.description || rec.title,
          estimatedTime: '2-4 hours',
          impact: rec.priority || 'medium',
        })) || [],
      performance: this.extractPerformanceMetrics(analysisResult),
      security: this.extractSecurityReport(analysisResult),
      testing: this.extractTestingReport(analysisResult),
      metadata: {
        version: '6.0.0',
        analyzer: 'EAP-Analyzer',
        nodeVersion: process.version,
        os: process.platform,
        totalAnalysisTime: analysisResult.analysisTime || 0,
        configUsed: analysisResult.configPath || 'default',
      },
    };
  }

  /**
   * Извлечение категорий из результатов анализа
   */
  private static extractCategories(analysisResult: AnalysisResult): CategoryReport[] {
    const categories = [];

    // Security категория
    if (analysisResult.security) {
      categories.push({
        name: 'Security',
        slug: 'security',
        readiness: analysisResult.security.readiness || 0,
        status: this.getStatusFromReadiness(analysisResult.security.readiness || 0),
        description: 'Анализ безопасности кода и конфигураций',
        components: this.extractSecurityComponents(analysisResult.security),
      });
    }

    // Testing категория
    if (analysisResult.testing) {
      categories.push({
        name: 'Testing',
        slug: 'testing',
        readiness: analysisResult.testing.readiness || 0,
        status: this.getStatusFromReadiness(analysisResult.testing.readiness || 0),
        description: 'Система тестирования и покрытие кода',
        components: this.extractTestingComponents(analysisResult.testing),
      });
    }

    // Performance категория
    if (analysisResult.performance) {
      categories.push({
        name: 'Performance',
        slug: 'performance',
        readiness: analysisResult.performance.readiness || 0,
        status: this.getStatusFromReadiness(analysisResult.performance.readiness || 0),
        description: 'Производительность и оптимизация',
        components: this.extractPerformanceComponents(analysisResult.performance),
      });
    }

    return categories;
  }

  /**
   * Расчет общей сводки проекта
   */
  private static calculateSummary(
    categories: CategoryReport[],
    analysisResult: AnalysisResult
  ): ProjectSummary {
    const totalReadiness =
      categories.length > 0
        ? Math.round(categories.reduce((sum, cat) => sum + cat.readiness, 0) / categories.length)
        : 0;

    const componentsCount = categories.reduce((sum, cat) => sum + cat.components.length, 0);
    const issuesCount = analysisResult.issues?.length || 0;
    const recommendationsCount = analysisResult.recommendations?.length || 0;
    const criticalIssues =
      analysisResult.issues?.filter(issue => issue.severity === 'critical').length || 0;

    return {
      totalReadiness,
      componentsCount,
      issuesCount,
      recommendationsCount,
      criticalIssues,
      status: this.getStatusFromReadiness(totalReadiness),
    };
  }

  /**
   * Определение статуса по готовности
   */
  private static getStatusFromReadiness(readiness: number): ComponentStatus {
    if (readiness >= 85) return 'excellent';
    if (readiness >= 70) return 'good';
    if (readiness >= 50) return 'warning';
    return 'critical';
  }

  /**
   * Получение списка доступных форматов
   */
  getSupportedFormats(): string[] {
    return Array.from(this.reporters.keys());
  }

  /**
   * Регистрация базовых репортеров
   */
  private registerDefaultReporters(): void {
    // Регистрируем HTML репортер
    this.registerReporter('html', new HTMLReporter());

    // Регистрируем Markdown репортер
    this.registerReporter('markdown', new MarkdownReporter());
    this.registerReporter('md', new MarkdownReporter());

    // eslint-disable-next-line no-console
    console.log('📋 ReporterEngine инициализирован с репортерами: HTML, Markdown');
  }

  // Вспомогательные методы для извлечения данных
  private static extractSecurityComponents(security: AnalysisResult['security']) {
    return [
      {
        name: 'XSS Protection',
        readiness: security?.xssStatus?.readiness || 0,
        status: this.getStatusFromReadiness(security?.xssStatus?.readiness || 0),
        issues: [],
        recommendations: [],
        details: {
          filesAnalyzed: security?.xssStatus?.filesAnalyzed || 0,
          linesOfCode: security?.xssStatus?.linesOfCode || 0,
          testsCount: 0,
          lastUpdated: new Date().toISOString(),
          dependencies: [],
        },
      },
      {
        name: 'CSRF Protection',
        readiness: security?.csrfStatus?.readiness || 0,
        status: this.getStatusFromReadiness(security?.csrfStatus?.readiness || 0),
        issues: [],
        recommendations: [],
        details: {
          filesAnalyzed: security?.csrfStatus?.filesAnalyzed || 0,
          linesOfCode: security?.csrfStatus?.linesOfCode || 0,
          testsCount: 0,
          lastUpdated: new Date().toISOString(),
          dependencies: [],
        },
      },
    ];
  }

  private static extractTestingComponents(testing: AnalysisResult['testing']) {
    return [
      {
        name: 'Unit Tests',
        readiness: testing?.unitTests?.readiness || 0,
        status: this.getStatusFromReadiness(testing?.unitTests?.readiness || 0),
        issues: [],
        recommendations: [],
        details: {
          filesAnalyzed: testing?.unitTests?.filesCount || 0,
          linesOfCode: 0,
          testsCount: testing?.unitTests?.testsCount || 0,
          coverage: testing?.unitTests?.coverage || 0,
          lastUpdated: new Date().toISOString(),
          dependencies: [],
        },
      },
    ];
  }

  private static extractPerformanceComponents(performance: AnalysisResult['performance']) {
    return [
      {
        name: 'Bundle Analysis',
        readiness: performance?.bundleAnalysis?.readiness || 0,
        status: this.getStatusFromReadiness(performance?.bundleAnalysis?.readiness || 0),
        issues: [],
        recommendations: [],
        details: {
          filesAnalyzed: performance?.bundleAnalysis?.filesCount || 0,
          linesOfCode: 0,
          testsCount: 0,
          lastUpdated: new Date().toISOString(),
          dependencies: performance?.bundleAnalysis?.dependencies || [],
        },
      },
    ];
  }

  private static extractPerformanceMetrics(analysisResult: AnalysisResult) {
    return {
      bundleSize: {
        total: analysisResult.performance?.bundleSize?.total || 0,
        gzipped: analysisResult.performance?.bundleSize?.gzipped || 0,
        assets: (analysisResult.performance?.bundleSize?.assets || []).map((asset: unknown) => ({
          name: (asset as any)?.name || 'unknown',
          size: (asset as any)?.size || 0,
          gzipped: (asset as any)?.gzipped || 0,
          type: (asset as any)?.type || ('other' as 'js' | 'css' | 'image' | 'font' | 'other'),
        })),
      },
      buildTime: analysisResult.performance?.buildTime || 0,
      memoryUsage: analysisResult.performance?.memoryUsage || 0,
    };
  }

  private static extractSecurityReport(analysisResult: AnalysisResult) {
    return {
      vulnerabilities: (analysisResult.security?.vulnerabilities || []).map((vuln: unknown) => ({
        type:
          (vuln as any)?.type ||
          ('other' as 'xss' | 'csrf' | 'sql-injection' | 'path-traversal' | 'other'),
        severity: (vuln as any)?.severity || ('medium' as 'critical' | 'high' | 'medium' | 'low'),
        file: (vuln as any)?.file || 'unknown',
        line: (vuln as any)?.line || 0,
        description: (vuln as any)?.description || 'Security vulnerability',
        recommendation: (vuln as any)?.recommendation || 'Review and fix security issue',
        cve: (vuln as any)?.cve,
      })),
      securityScore: analysisResult.security?.score || 0,
      cspStatus: analysisResult.security?.csp || 'unknown',
      httpsStatus: analysisResult.security?.https || 'unknown',
      authenticationStatus: analysisResult.security?.auth || 'unknown',
      dataProtectionStatus: analysisResult.security?.dataProtection || 'unknown',
    };
  }

  private static extractTestingReport(analysisResult: AnalysisResult) {
    return {
      coverage: analysisResult.testing?.coverage || {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
      testResults: analysisResult.testing?.results || {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      },
      testFiles: (analysisResult.testing?.files || []).map(file => {
        const testFile = file as {
          name?: string;
          path?: string;
          tests?: number;
          passed?: number;
          failed?: number;
          coverage?: number;
        };
        return {
          path: testFile.path || testFile.name || 'unknown',
          tests: testFile.tests || 0,
          passed: testFile.passed || 0,
          failed: testFile.failed || 0,
          coverage: testFile.coverage || 0,
        };
      }),
      mockingStatus: analysisResult.testing?.mocking || 'unknown',
      e2eStatus: analysisResult.testing?.e2e || 'unknown',
    };
  }
}
