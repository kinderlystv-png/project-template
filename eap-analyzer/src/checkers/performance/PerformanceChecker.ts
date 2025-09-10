import { BaseChecker } from '../../core/base/BaseChecker';
import { Project } from '../../types/Project';
import { CheckResult } from '../../types/CheckResult';
import { AnalysisCategory } from '../../types/AnalysisCategory';
import { SeverityLevel } from '../../types/SeverityLevel';

// Локальные типы для избежания проблем с импортом
export interface IPerformanceAnalyzer {
  readonly name: string;
  readonly category: string;
  analyze(projectPath: string): Promise<PerformanceResult>;
}

export interface PerformanceResult {
  score: number;
  metrics: Record<string, unknown>;
  issues: Array<{ severity: string; message: string }>;
  recommendations: string[];
  analysisTime: number;
  details?: Record<string, unknown>;
}

export interface PerformanceConfig {
  bundleSizeThreshold: number;
  loadTimeThreshold: number;
  memoryThreshold: number;
  enableRuntimeAnalysis: boolean;
  enableBundleAnalysis: boolean;
  enableDependencyAnalysis: boolean;
}

/**
 * Модульный анализатор производительности - координатор всех подчекеров
 * Заменяет монолитный performance.checker.ts на модульную архитектуру
 */
export class PerformanceChecker extends BaseChecker {
  private analyzers: IPerformanceAnalyzer[] = [];
  private performanceConfig: PerformanceConfig;

  constructor(config?: Partial<PerformanceConfig>) {
    super(
      'Performance Analysis',
      AnalysisCategory.PERFORMANCE,
      'Модульный анализатор производительности с поддержкой bundle size, runtime metrics и dependency analysis',
      'EAP-Performance-Standard-v1.0',
      SeverityLevel.HIGH,
      '1.0.0',
      { enabled: true, failOnError: false }
    );

    this.performanceConfig = {
      bundleSizeThreshold: 5 * 1024 * 1024, // 5MB
      loadTimeThreshold: 3000, // 3s
      memoryThreshold: 100 * 1024 * 1024, // 100MB
      enableRuntimeAnalysis: true,
      enableBundleAnalysis: true,
      enableDependencyAnalysis: true,
      ...config,
    };
  }

  /**
   * Регистрирует новый анализатор производительности
   */
  registerAnalyzer(analyzer: IPerformanceAnalyzer): void {
    this.analyzers.push(analyzer);
  }

  /**
   * Получает все зарегистрированные анализаторы
   */
  getAnalyzers(): IPerformanceAnalyzer[] {
    return [...this.analyzers];
  }

  /**
   * Основной метод анализа проекта
   */
  async check(project: Project): Promise<CheckResult[]> {
    const startTime = Date.now();

    try {
      // Выполняем анализ всеми зарегистрированными анализаторами
      const analyses = await Promise.allSettled(
        this.analyzers.map(analyzer => analyzer.analyze(project.path))
      );

      // Обрабатываем результаты
      const results: PerformanceResult[] = [];
      const checkResults: CheckResult[] = [];

      analyses.forEach((analysis, index) => {
        if (analysis.status === 'fulfilled') {
          results.push(analysis.value);

          // Конвертируем результаты в CheckResult
          const result = analysis.value;
          checkResults.push({
            id: `performance-analyzer-${index}`,
            name: this.analyzers[index]?.name || `Analyzer ${index}`,
            description: `Performance analysis by ${this.analyzers[index]?.name}`,
            passed: result.score >= 70, // Проходной балл 70%
            score: result.score,
            maxScore: 100,
            message: `Performance score: ${result.score}%`,
            severity: this.getResultSeverity(result.score),
            details: {
              metrics: result.metrics,
              analysisTime: result.analysisTime,
              recommendations: result.recommendations,
            },
          });
        } else {
          const analyzerName = this.analyzers[index]?.name || `Analyzer ${index}`;
          checkResults.push({
            id: `performance-analyzer-error-${index}`,
            name: analyzerName,
            description: `Performance analysis error`,
            passed: false,
            score: 0,
            maxScore: 100,
            message: `Analysis failed: ${analysis.reason}`,
            severity: SeverityLevel.HIGH,
            details: {
              error: analysis.reason,
            },
          });
        }
      });

      // Добавляем общий результат
      const overallScore = this.calculateOverallScore(results);
      checkResults.unshift({
        id: 'performance-overview',
        name: 'Performance Overview',
        description: 'Overall performance analysis summary',
        passed: overallScore >= 70,
        score: overallScore,
        maxScore: 100,
        message: `Overall performance score: ${overallScore}%`,
        severity: this.getResultSeverity(overallScore),
        details: {
          analyzersCount: this.analyzers.length,
          analysisTime: Date.now() - startTime,
          breakdown: results.map(r => ({
            analyzer: r.details?.analyzer || 'Unknown',
            score: r.score,
          })),
        },
      });

      return checkResults;
    } catch (error) {
      return [
        {
          id: 'performance-analysis-error',
          name: 'Performance Analysis',
          description: 'Performance analysis execution',
          passed: false,
          score: 0,
          maxScore: 100,
          message: `Performance analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: SeverityLevel.HIGH,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            analysisTime: Date.now() - startTime,
          },
        },
      ];
    }
  }

  /**
   * Вычисляет общий балл производительности
   */
  private calculateOverallScore(results: PerformanceResult[]): number {
    if (results.length === 0) return 0;

    const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
    return Math.round(avgScore);
  }

  /**
   * Определяет SeverityLevel по баллу
   */
  private getResultSeverity(score: number): SeverityLevel {
    if (score < 50) return SeverityLevel.HIGH;
    if (score < 70) return SeverityLevel.MEDIUM;
    return SeverityLevel.LOW;
  }

  /**
   * Обновляет конфигурацию чекера
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.performanceConfig = { ...this.performanceConfig, ...config };
  }

  /**
   * Получает текущую конфигурацию производительности
   */
  getPerformanceConfig(): PerformanceConfig {
    return { ...this.performanceConfig };
  }
}

export default PerformanceChecker;
