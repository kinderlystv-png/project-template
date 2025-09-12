/**
 * Упрощенный анализатор технического долга для интеграции
 * Версия 2.0 - Улучшенная архитектура с утилитами и конфигурацией
 */

import { BaseAnalyzer, AnalysisResult } from '../../core/analyzer.js';
import { FileAnalysisUtils, FileAnalysisOptions } from './utils/file-analysis-utils.js';
import { DebtMetricsCalculator, DebtCalculationConfig } from './utils/debt-metrics-calculator.js';
import { ErrorHandler } from './utils/error-handler.js';

export interface SimpleTechnicalDebtAnalyzerConfig {
  fileAnalysis: Partial<FileAnalysisOptions>;
  debtCalculation: Partial<DebtCalculationConfig>;
  enableCaching: boolean;
  detailedLogging: boolean;
}

export interface TechnicalDebtData {
  totalDebt: number;
  totalCost: number;
  categories: any[];
  monthlyInterest: number;
  roiAnalysis: {
    investmentRequired: number;
    expectedReturn: number;
    paybackPeriod: number;
    roi: number;
  };
  fileMetrics: number;
  errorStats: Record<string, unknown>;
}

export class SimpleTechnicalDebtAnalyzer extends BaseAnalyzer {
  private readonly config: SimpleTechnicalDebtAnalyzerConfig;
  private readonly calculator: DebtMetricsCalculator;
  private cache = new Map<string, AnalysisResult>();

  constructor(config: Record<string, unknown> = {}) {
    super();

    this.config = {
      fileAnalysis: {},
      debtCalculation: {},
      enableCaching: true,
      detailedLogging: false,
      ...config,
    };

    this.calculator = new DebtMetricsCalculator(this.config.debtCalculation);
  }

  getName(): string {
    return 'simple-technical-debt';
  }

  get metadata() {
    return {
      name: 'Simple Technical Debt Analyzer',
      version: '2.0.0',
      description: 'Улучшенная оценка технического долга с конфигурируемыми параметрами',
      supportedFileTypes: ['.ts', '.js', '.tsx', '.jsx', '.vue', '.svelte'],
    };
  }

  async analyze(projectPath: string): Promise<AnalysisResult> {
    // Очищаем ошибки перед началом анализа
    ErrorHandler.clearErrors();

    const cacheKey = `analysis_${projectPath}_${Date.now()}`;

    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    try {
      if (this.config.detailedLogging) {
        // eslint-disable-next-line no-console
        console.log('💰 Улучшенный анализ технического долга...');
      }

      // Получаем список файлов для анализа
      const files = await ErrorHandler.safeAsync(
        () => FileAnalysisUtils.getCodeFiles(projectPath, this.config.fileAnalysis),
        { operation: 'file-scan', details: { projectPath } },
        []
      );

      if (files.length === 0) {
        return this.getEmptyResult();
      }

      // Анализируем каждый файл
      const fileMetrics = await this.analyzeFiles(files);

      // Вычисляем метрики долга
      const debtMetrics = this.calculator.calculateDebt(fileMetrics);

      // Формируем данные технического долга
      const technicalDebtData: TechnicalDebtData = {
        totalDebt: debtMetrics.totalHours,
        totalCost: debtMetrics.totalCost,
        categories: debtMetrics.categories,
        monthlyInterest: this.calculator.calculateMonthlyInterest(debtMetrics.totalHours),
        roiAnalysis: this.calculator.generateROIAnalysis(debtMetrics.totalHours),
        fileMetrics: fileMetrics.length,
        errorStats: ErrorHandler.getErrorStats(),
      };

      // Формируем результат согласно базовому интерфейсу
      const result: AnalysisResult = {
        success: true,
        data: technicalDebtData,
        metadata: {
          analyzer: this.getName(),
          timestamp: new Date(),
          duration: 0, // TODO: добавить замер времени
          filesAnalyzed: files.length,
        },
      };

      // Кэшируем результат
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      ErrorHandler.handle(error as Error, {
        operation: 'analysis',
        details: { projectPath },
      });

      return this.getEmptyResult();
    }
  }

  /**
   * Анализирует список файлов и возвращает метрики
   */
  private async analyzeFiles(files: string[]) {
    const fileMetrics = [];

    for (const file of files) {
      const metrics = await ErrorHandler.safeAsync(
        () => FileAnalysisUtils.analyzeFile(file, files),
        { operation: 'file-analysis', file },
        null
      );

      if (metrics) {
        fileMetrics.push(metrics);
      }
    }

    return fileMetrics;
  }

  /**
   * Возвращает пустой результат в случае ошибки
   */
  private getEmptyResult(): AnalysisResult {
    const emptyData: TechnicalDebtData = {
      totalDebt: 0,
      totalCost: 0,
      categories: [],
      monthlyInterest: 0,
      roiAnalysis: {
        investmentRequired: 0,
        expectedReturn: 0,
        paybackPeriod: 0,
        roi: 0,
      },
      fileMetrics: 0,
      errorStats: ErrorHandler.getErrorStats(),
    };

    return {
      success: false,
      data: emptyData,
      errors: ['Analysis failed'],
      metadata: {
        analyzer: this.getName(),
        timestamp: new Date(),
        duration: 0,
        filesAnalyzed: 0,
      },
    };
  }

  /**
   * Очищает кэш анализатора
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Получает статистику кэша
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      enabled: this.config.enableCaching,
    };
  }
}
