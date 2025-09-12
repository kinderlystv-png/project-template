/**
 * Конфигурируемый калькулятор метрик технического долга
 */

import { DebtCategory, DebtMetrics } from '../../../types/index.js';
import { FileMetrics } from './file-analysis-utils.js';

export interface DebtCalculationConfig {
  // Пороговые значения
  complexityThreshold: number;
  duplicationThreshold: number;

  // Стоимость исправления (в часах)
  complexityDebtPerUnit: number;
  duplicationDebtPerLine: number;
  testDebtPerFile: number;

  // Финансовые параметры
  hourlyRate: number;
  workingHoursPerDay: number;

  // Веса важности
  complexityWeight: number;
  duplicationWeight: number;
  testWeight: number;
}

export interface DebtItem {
  file: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  recommendation: string;
}

export class DebtMetricsCalculator {
  private readonly config: DebtCalculationConfig;

  constructor(config: Partial<DebtCalculationConfig> = {}) {
    this.config = {
      // Значения по умолчанию
      complexityThreshold: 10,
      duplicationThreshold: 0.15,
      complexityDebtPerUnit: 0.5,
      duplicationDebtPerLine: 0.1,
      testDebtPerFile: 4,
      hourlyRate: 50,
      workingHoursPerDay: 8,
      complexityWeight: 1.0,
      duplicationWeight: 0.8,
      testWeight: 1.2,
      ...config,
    };
  }

  /**
   * Вычисляет метрики технического долга для массива файлов
   */
  calculateDebt(fileMetrics: FileMetrics[]): DebtMetrics {
    const categories = this.analyzeDebtCategories(fileMetrics);
    const totalHours = categories.reduce((sum, cat) => sum + cat.debt, 0);

    return {
      totalHours,
      totalCost: totalHours * this.config.hourlyRate,
      categories,
    };
  }

  /**
   * Анализирует категории технического долга
   */
  private analyzeDebtCategories(fileMetrics: FileMetrics[]): DebtCategory[] {
    const categories: DebtCategory[] = [];

    // Анализ сложности
    const complexityData = this.analyzeComplexity(fileMetrics);
    if (complexityData.debt > 0) {
      categories.push(complexityData);
    }

    // Анализ дублирования
    const duplicationData = this.analyzeDuplication(fileMetrics);
    if (duplicationData.debt > 0) {
      categories.push(duplicationData);
    }

    // Анализ тестирования
    const testData = this.analyzeTestCoverage(fileMetrics);
    if (testData.debt > 0) {
      categories.push(testData);
    }

    return categories;
  }

  /**
   * Анализирует долг сложности
   */
  private analyzeComplexity(fileMetrics: FileMetrics[]): DebtCategory {
    const items: DebtItem[] = [];
    let totalDebt = 0;

    for (const file of fileMetrics) {
      if (file.complexity > this.config.complexityThreshold) {
        const excessComplexity = file.complexity - this.config.complexityThreshold;
        const debt =
          excessComplexity * this.config.complexityDebtPerUnit * this.config.complexityWeight;

        totalDebt += debt;
        items.push({
          file: file.path,
          issue: `High cyclomatic complexity (${file.complexity})`,
          severity: this.getSeverityByComplexity(file.complexity),
          estimatedHours: debt,
          recommendation: this.getComplexityRecommendation(file.complexity),
        });
      }
    }

    return {
      name: 'High Complexity',
      debt: Math.round(totalDebt * 100) / 100,
      impact: this.getImpactLevel(totalDebt),
      items,
    };
  }

  /**
   * Анализирует долг дублирования
   */
  private analyzeDuplication(fileMetrics: FileMetrics[]): DebtCategory {
    const items: DebtItem[] = [];
    let totalDebt = 0;

    for (const file of fileMetrics) {
      if (file.duplicationRatio > this.config.duplicationThreshold) {
        const duplicatedLines = file.lines * file.duplicationRatio;
        const debt =
          duplicatedLines * this.config.duplicationDebtPerLine * this.config.duplicationWeight;

        totalDebt += debt;
        items.push({
          file: file.path,
          issue: `Code duplication (${Math.round(file.duplicationRatio * 100)}%)`,
          severity: this.getSeverityByDuplication(file.duplicationRatio),
          estimatedHours: debt,
          recommendation: this.getDuplicationRecommendation(file.duplicationRatio),
        });
      }
    }

    return {
      name: 'Code Duplication',
      debt: Math.round(totalDebt * 100) / 100,
      impact: this.getImpactLevel(totalDebt),
      items,
    };
  }

  /**
   * Анализирует долг тестирования
   */
  private analyzeTestCoverage(fileMetrics: FileMetrics[]): DebtCategory {
    const items: DebtItem[] = [];
    let totalDebt = 0;

    for (const file of fileMetrics) {
      if (!file.hasTests) {
        const debt = this.config.testDebtPerFile * this.config.testWeight;

        totalDebt += debt;
        items.push({
          file: file.path,
          issue: 'Missing test coverage',
          severity: 'high' as const,
          estimatedHours: debt,
          recommendation: 'Create comprehensive unit tests for this file',
        });
      }
    }

    return {
      name: 'Missing Tests',
      debt: Math.round(totalDebt * 100) / 100,
      impact: this.getImpactLevel(totalDebt),
      items,
    };
  }

  /**
   * Определяет уровень серьезности по сложности
   */
  private getSeverityByComplexity(complexity: number): 'low' | 'medium' | 'high' | 'critical' {
    if (complexity > 30) return 'critical';
    if (complexity > 20) return 'high';
    if (complexity > 15) return 'medium';
    return 'low';
  }

  /**
   * Определяет уровень серьезности по дублированию
   */
  private getSeverityByDuplication(ratio: number): 'low' | 'medium' | 'high' | 'critical' {
    if (ratio > 0.5) return 'critical';
    if (ratio > 0.3) return 'high';
    if (ratio > 0.2) return 'medium';
    return 'low';
  }

  /**
   * Получает рекомендацию по сложности
   */
  private getComplexityRecommendation(complexity: number): string {
    if (complexity > 30) {
      return 'Critical: Split into smaller functions, apply SOLID principles';
    }
    if (complexity > 20) {
      return 'High: Extract methods, reduce nesting levels';
    }
    if (complexity > 15) {
      return 'Medium: Consider refactoring with strategy pattern';
    }
    return 'Low: Minor cleanup needed';
  }

  /**
   * Получает рекомендацию по дублированию
   */
  private getDuplicationRecommendation(ratio: number): string {
    if (ratio > 0.5) {
      return 'Critical: Major refactoring needed, extract common utilities';
    }
    if (ratio > 0.3) {
      return 'High: Extract shared functions and constants';
    }
    if (ratio > 0.2) {
      return 'Medium: Look for opportunities to create reusable components';
    }
    return 'Low: Minor cleanup of duplicated code';
  }

  /**
   * Определяет уровень воздействия
   */
  private getImpactLevel(debt: number): string {
    if (debt > 40) return 'Critical';
    if (debt > 20) return 'High';
    if (debt > 10) return 'Medium';
    return 'Low';
  }

  /**
   * Вычисляет месячные проценты
   */
  calculateMonthlyInterest(totalDebt: number): number {
    return Math.round(totalDebt * 0.05 * 100) / 100; // 5% в месяц
  }

  /**
   * Генерирует ROI анализ
   */
  generateROIAnalysis(totalDebt: number) {
    const investmentRequired = Math.round(totalDebt * 0.7 * 100) / 100;
    const expectedReturn = Math.round(totalDebt * 1.4 * 100) / 100;

    return {
      investmentRequired,
      expectedReturn,
      paybackPeriod: Math.ceil(investmentRequired / (expectedReturn / 12)),
      roi: Math.round(((expectedReturn - investmentRequired) / investmentRequired) * 100),
    };
  }
}
