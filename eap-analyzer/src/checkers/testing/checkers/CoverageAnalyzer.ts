/**
 * CoverageAnalyzer - анализатор покрытия кода тестами
 * Анализирует отчеты покрытия и предоставляет детальную информацию
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseChecker } from '../../../core/base/BaseChecker';
import { CheckResult } from '../../../types/CheckResult';
import { Project } from '../../../types/Project';
import { SeverityLevel } from '../../../types/SeverityLevel';
import { AnalysisCategory } from '../../../types/AnalysisCategory';
import { ResultBuilder } from '../utils/ResultBuilder';
import { TESTING_THRESHOLDS } from '../constants';
import { CoverageData, CoverageConfig } from '../types/TestingTypes';

/**
 * Детальная информация о покрытии файла
 */
export interface FileCoverageInfo {
  /** Путь к файлу */
  path: string;
  /** Покрытие строк */
  lines: {
    total: number;
    covered: number;
    percentage: number;
    uncovered: number[];
  };
  /** Покрытие веток */
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  /** Покрытие функций */
  functions: {
    total: number;
    covered: number;
    percentage: number;
    uncovered: string[];
  };
  /** Покрытие выражений */
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
}

/**
 * Сводка покрытия проекта
 */
export interface ProjectCoverageSummary {
  /** Общие метрики */
  overall: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  /** Файлы с низким покрытием */
  lowCoverageFiles: FileCoverageInfo[];
  /** Файлы без покрытия */
  uncoveredFiles: string[];
  /** Конфигурация покрытия */
  config?: CoverageConfig;
  /** Путь к отчету */
  reportPath?: string;
  /** Дата генерации отчета */
  reportDate?: Date;
}

/**
 * Результат анализа покрытия
 */
export interface CoverageAnalysisResult {
  /** Найден ли отчет о покрытии */
  hasReport: boolean;
  /** Сводка покрытия */
  summary?: ProjectCoverageSummary;
  /** Проблемы покрытия */
  issues: CoverageIssue[];
  /** Рекомендации */
  recommendations: string[];
  /** Тренды покрытия */
  trends?: CoverageTrends;
}

/**
 * Проблема покрытия
 */
export interface CoverageIssue {
  type: 'threshold' | 'config' | 'missing' | 'quality';
  severity: SeverityLevel;
  message: string;
  suggestion: string;
  files?: string[];
  metric?: 'lines' | 'branches' | 'functions' | 'statements';
}

/**
 * Тренды покрытия
 */
export interface CoverageTrends {
  /** Изменение с прошлого запуска */
  change?: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  /** История покрытия */
  history?: Array<{
    date: Date;
    coverage: number;
  }>;
}

/**
 * Анализатор покрытия кода
 */
export class CoverageAnalyzer extends BaseChecker {
  constructor() {
    super(
      'coverage-analyzer',
      AnalysisCategory.TESTING,
      'Анализирует покрытие кода тестами и предоставляет детальные отчеты',
      'Code Coverage Analysis',
      SeverityLevel.MEDIUM
    );
  }

  /**
   * Выполняет анализ покрытия кода
   * @param project Проект для анализа
   * @returns Массив результатов анализа
   */
  async check(project: Project): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    try {
      // Анализируем покрытие
      const analysis = await this.analyzeCoverage(project);

      // Основные проверки
      results.push(await this.checkCoveragePresence(analysis));

      if (analysis.hasReport && analysis.summary) {
        results.push(await this.checkOverallCoverage(analysis.summary));
        results.push(await this.checkLinesCoverage(analysis.summary));
        results.push(await this.checkBranchesCoverage(analysis.summary));
        results.push(await this.checkFunctionsCoverage(analysis.summary));
        results.push(await this.checkLowCoverageFiles(analysis.summary));
        results.push(await this.checkUncoveredFiles(analysis.summary));
      }

      // Анализ конфигурации
      results.push(await this.checkCoverageConfiguration(project));

      // Общая оценка покрытия
      results.push(await this.createCoverageSummary(analysis));
    } catch (error) {
      results.push(
        ResultBuilder.error('coverage-analysis-error', 'Ошибка анализа покрытия')
          .message(`Произошла ошибка при анализе покрытия: ${error}`)
          .details({ error: String(error) })
          .build()
      );
    }

    return results;
  }

  /**
   * Анализирует покрытие кода в проекте
   * @param project Проект
   * @returns Результат анализа покрытия
   */
  private async analyzeCoverage(project: Project): Promise<CoverageAnalysisResult> {
    const result: CoverageAnalysisResult = {
      hasReport: false,
      issues: [],
      recommendations: [],
    };

    // Ищем отчеты о покрытии
    const reportInfo = await this.findCoverageReports(project);
    result.hasReport = reportInfo.found;

    if (reportInfo.found && reportInfo.path && reportInfo.type) {
      try {
        // Парсим отчет о покрытии
        result.summary = await this.parseCoverageReport(reportInfo.path, reportInfo.type);

        // Анализируем проблемы
        result.issues = await this.analyzeCoverageIssues(result.summary);

        // Анализируем тренды
        result.trends = await this.analyzeCoverageTrends(project, result.summary);
      } catch (error) {
        result.issues.push({
          type: 'missing',
          severity: SeverityLevel.MEDIUM,
          message: `Ошибка парсинга отчета покрытия: ${error}`,
          suggestion: 'Проверьте формат отчета о покрытии',
        });
      }
    }

    // Генерируем рекомендации
    result.recommendations = this.generateCoverageRecommendations(result);

    return result;
  }

  /**
   * Ищет отчеты о покрытии в проекте
   * @param project Проект
   * @returns Информация о найденных отчетах
   */
  private async findCoverageReports(project: Project): Promise<{
    found: boolean;
    path?: string;
    type?: 'lcov' | 'json' | 'clover' | 'istanbul';
  }> {
    const reportPaths = [
      { path: 'coverage/lcov.info', type: 'lcov' as const },
      { path: 'coverage/coverage-final.json', type: 'json' as const },
      { path: 'coverage/coverage.json', type: 'json' as const },
      { path: 'coverage/clover.xml', type: 'clover' as const },
      { path: '.nyc_output/coverage.json', type: 'json' as const },
      { path: 'reports/coverage/lcov.info', type: 'lcov' as const },
    ];

    for (const report of reportPaths) {
      const fullPath = path.join(project.path, report.path);

      try {
        await fs.access(fullPath);
        return {
          found: true,
          path: fullPath,
          type: report.type,
        };
      } catch {
        continue;
      }
    }

    return { found: false };
  }

  /**
   * Парсит отчет о покрытии
   * @param reportPath Путь к отчету
   * @param type Тип отчета
   * @returns Сводка покрытия
   */
  private async parseCoverageReport(
    reportPath: string,
    type: 'lcov' | 'json' | 'clover' | 'istanbul'
  ): Promise<ProjectCoverageSummary> {
    switch (type) {
      case 'json':
        return await this.parseJsonCoverageReport(reportPath);
      case 'lcov':
        return await this.parseLcovCoverageReport(reportPath);
      default:
        throw new Error(`Неподдерживаемый тип отчета: ${type}`);
    }
  }

  /**
   * Парсит JSON отчет о покрытии (Istanbul/NYC)
   * @param reportPath Путь к отчету
   * @returns Сводка покрытия
   */
  private async parseJsonCoverageReport(reportPath: string): Promise<ProjectCoverageSummary> {
    const content = await fs.readFile(reportPath, 'utf-8');
    const coverage = JSON.parse(content);

    const summary: ProjectCoverageSummary = {
      overall: { lines: 0, branches: 0, functions: 0, statements: 0 },
      lowCoverageFiles: [],
      uncoveredFiles: [],
      reportPath,
      reportDate: new Date(),
    };

    let totalLines = 0,
      coveredLines = 0;
    let totalBranches = 0,
      coveredBranches = 0;
    let totalFunctions = 0,
      coveredFunctions = 0;
    let totalStatements = 0,
      coveredStatements = 0;

    for (const [filePath, fileData] of Object.entries(coverage)) {
      if (typeof fileData === 'object' && fileData !== null) {
        const data = fileData as any;

        // Обрабатываем метрики файла
        const fileLines = data.l || {};
        const fileBranches = data.b || {};
        const fileFunctions = data.f || {};
        const fileStatements = data.s || {};

        // Подсчитываем покрытие для файла
        const fileCoverage = this.calculateFileCoverage(
          fileLines,
          fileBranches,
          fileFunctions,
          fileStatements
        );

        // Добавляем к общим метрикам
        totalLines += fileCoverage.lines.total;
        coveredLines += fileCoverage.lines.covered;
        totalBranches += fileCoverage.branches.total;
        coveredBranches += fileCoverage.branches.covered;
        totalFunctions += fileCoverage.functions.total;
        coveredFunctions += fileCoverage.functions.covered;
        totalStatements += fileCoverage.statements.total;
        coveredStatements += fileCoverage.statements.covered;

        // Проверяем низкое покрытие
        if (fileCoverage.lines.percentage < TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE) {
          summary.lowCoverageFiles.push({
            path: filePath,
            ...fileCoverage,
          });
        }

        // Проверяем отсутствие покрытия
        if (fileCoverage.lines.percentage === 0) {
          summary.uncoveredFiles.push(filePath);
        }
      }
    }

    // Вычисляем общие проценты
    summary.overall = {
      lines: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
      branches: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      functions: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
      statements: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
    };

    return summary;
  }

  /**
   * Парсит LCOV отчет о покрытии
   * @param reportPath Путь к отчету
   * @returns Сводка покрытия
   */
  private async parseLcovCoverageReport(reportPath: string): Promise<ProjectCoverageSummary> {
    const content = await fs.readFile(reportPath, 'utf-8');
    const lines = content.split('\n');

    const summary: ProjectCoverageSummary = {
      overall: { lines: 0, branches: 0, functions: 0, statements: 0 },
      lowCoverageFiles: [],
      uncoveredFiles: [],
      reportPath,
      reportDate: new Date(),
    };

    let totalLines = 0,
      hitLines = 0;
    let totalBranches = 0,
      hitBranches = 0;
    let totalFunctions = 0,
      hitFunctions = 0;

    let currentFile = '';
    let fileLines = 0,
      fileHitLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('SF:')) {
        // Начало нового файла
        currentFile = trimmed.substring(3);
        fileLines = 0;
        fileHitLines = 0;
      } else if (trimmed.startsWith('LF:')) {
        // Общее количество строк в файле
        fileLines = parseInt(trimmed.substring(3));
        totalLines += fileLines;
      } else if (trimmed.startsWith('LH:')) {
        // Количество покрытых строк в файле
        fileHitLines = parseInt(trimmed.substring(3));
        hitLines += fileHitLines;

        // Проверяем покрытие файла
        const percentage = fileLines > 0 ? (fileHitLines / fileLines) * 100 : 0;
        if (percentage < TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE) {
          summary.lowCoverageFiles.push({
            path: currentFile,
            lines: {
              total: fileLines,
              covered: fileHitLines,
              percentage,
              uncovered: [],
            },
            branches: { total: 0, covered: 0, percentage: 0 },
            functions: { total: 0, covered: 0, percentage: 0, uncovered: [] },
            statements: { total: 0, covered: 0, percentage: 0 },
          });
        }

        if (percentage === 0) {
          summary.uncoveredFiles.push(currentFile);
        }
      } else if (trimmed.startsWith('BRF:')) {
        totalBranches += parseInt(trimmed.substring(4));
      } else if (trimmed.startsWith('BRH:')) {
        hitBranches += parseInt(trimmed.substring(4));
      } else if (trimmed.startsWith('FNF:')) {
        totalFunctions += parseInt(trimmed.substring(4));
      } else if (trimmed.startsWith('FNH:')) {
        hitFunctions += parseInt(trimmed.substring(4));
      }
    }

    // Вычисляем общие проценты
    summary.overall = {
      lines: totalLines > 0 ? (hitLines / totalLines) * 100 : 0,
      branches: totalBranches > 0 ? (hitBranches / totalBranches) * 100 : 0,
      functions: totalFunctions > 0 ? (hitFunctions / totalFunctions) * 100 : 0,
      statements: 0, // LCOV не всегда содержит информацию о statements
    };

    return summary;
  }

  /**
   * Вычисляет покрытие для отдельного файла
   * @param lines Данные о строках
   * @param branches Данные о ветках
   * @param functions Данные о функциях
   * @param statements Данные о выражениях
   * @returns Информация о покрытии файла
   */
  private calculateFileCoverage(
    lines: any,
    branches: any,
    functions: any,
    statements: any
  ): Omit<FileCoverageInfo, 'path'> {
    // Обрабатываем строки
    const lineNumbers = Object.keys(lines || {});
    const coveredLines = lineNumbers.filter(num => lines[num] > 0);
    const uncoveredLines = lineNumbers.filter(num => lines[num] === 0).map(Number);

    // Обрабатываем ветки
    const branchKeys = Object.keys(branches || {});
    const coveredBranches = branchKeys.filter(key => {
      const branchData = branches[key];
      return Array.isArray(branchData) && branchData.some(hit => hit > 0);
    });

    // Обрабатываем функции
    const functionKeys = Object.keys(functions || {});
    const coveredFunctions = functionKeys.filter(key => functions[key] > 0);
    const uncoveredFunctions = functionKeys.filter(key => functions[key] === 0);

    // Обрабатываем выражения
    const statementKeys = Object.keys(statements || {});
    const coveredStatements = statementKeys.filter(key => statements[key] > 0);

    return {
      lines: {
        total: lineNumbers.length,
        covered: coveredLines.length,
        percentage: lineNumbers.length > 0 ? (coveredLines.length / lineNumbers.length) * 100 : 0,
        uncovered: uncoveredLines,
      },
      branches: {
        total: branchKeys.length,
        covered: coveredBranches.length,
        percentage: branchKeys.length > 0 ? (coveredBranches.length / branchKeys.length) * 100 : 0,
      },
      functions: {
        total: functionKeys.length,
        covered: coveredFunctions.length,
        percentage:
          functionKeys.length > 0 ? (coveredFunctions.length / functionKeys.length) * 100 : 0,
        uncovered: uncoveredFunctions,
      },
      statements: {
        total: statementKeys.length,
        covered: coveredStatements.length,
        percentage:
          statementKeys.length > 0 ? (coveredStatements.length / statementKeys.length) * 100 : 0,
      },
    };
  }

  /**
   * Анализирует проблемы покрытия
   * @param summary Сводка покрытия
   * @returns Массив проблем
   */
  private async analyzeCoverageIssues(summary: ProjectCoverageSummary): Promise<CoverageIssue[]> {
    const issues: CoverageIssue[] = [];

    // Проверяем общее покрытие
    if (summary.overall.lines < TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE) {
      issues.push({
        type: 'threshold',
        severity: SeverityLevel.HIGH,
        message: `Низкое покрытие строк: ${Math.round(summary.overall.lines)}%`,
        suggestion: `Увеличьте покрытие до ${TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE}% или выше`,
        metric: 'lines',
      });
    }

    if (summary.overall.branches < TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE) {
      issues.push({
        type: 'threshold',
        severity: SeverityLevel.MEDIUM,
        message: `Низкое покрытие веток: ${Math.round(summary.overall.branches)}%`,
        suggestion: `Добавьте тесты для покрытия условных конструкций`,
        metric: 'branches',
      });
    }

    if (summary.overall.functions < TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE) {
      issues.push({
        type: 'threshold',
        severity: SeverityLevel.MEDIUM,
        message: `Низкое покрытие функций: ${Math.round(summary.overall.functions)}%`,
        suggestion: `Добавьте тесты для непокрытых функций`,
        metric: 'functions',
      });
    }

    // Проверяем файлы без покрытия
    if (summary.uncoveredFiles.length > 0) {
      issues.push({
        type: 'missing',
        severity: SeverityLevel.HIGH,
        message: `${summary.uncoveredFiles.length} файлов без покрытия`,
        suggestion: 'Создайте тесты для непокрытых файлов',
        files: summary.uncoveredFiles.slice(0, 5), // Ограничиваем список
      });
    }

    // Проверяем файлы с низким покрытием
    if (summary.lowCoverageFiles.length > 5) {
      issues.push({
        type: 'quality',
        severity: SeverityLevel.MEDIUM,
        message: `${summary.lowCoverageFiles.length} файлов с низким покрытием`,
        suggestion: 'Улучшите покрытие в файлах с низкими показателями',
        files: summary.lowCoverageFiles.slice(0, 5).map(f => f.path),
      });
    }

    return issues;
  }

  /**
   * Анализирует тренды покрытия
   * @param project Проект
   * @param summary Текущая сводка
   * @returns Тренды покрытия
   */
  private async analyzeCoverageTrends(
    project: Project,
    summary: ProjectCoverageSummary
  ): Promise<CoverageTrends | undefined> {
    try {
      // Пытаемся найти предыдущие отчеты
      const historyPath = path.join(project.path, '.coverage-history.json');

      let history: Array<{ date: Date; coverage: number }> = [];

      try {
        const historyContent = await fs.readFile(historyPath, 'utf-8');
        history = JSON.parse(historyContent);
      } catch {
        // История не найдена, создаем новую
      }

      // Добавляем текущий результат
      const currentCoverage = summary.overall.lines;
      history.push({
        date: new Date(),
        coverage: currentCoverage,
      });

      // Сохраняем историю (ограничиваем последними 30 записями)
      history = history.slice(-30);
      await fs.writeFile(historyPath, JSON.stringify(history, null, 2));

      // Вычисляем изменения
      let change: CoverageTrends['change'];
      if (history.length > 1) {
        const previous = history[history.length - 2];
        change = {
          lines: currentCoverage - previous.coverage,
          branches: 0, // Пока не отслеживаем
          functions: 0,
          statements: 0,
        };
      }

      return {
        change,
        history: history.map(h => ({ ...h, date: new Date(h.date) })),
      };
    } catch {
      return undefined;
    }
  }

  // Методы проверок

  private async checkCoveragePresence(analysis: CoverageAnalysisResult): Promise<CheckResult> {
    if (analysis.hasReport) {
      return ResultBuilder.success('coverage-presence', 'Наличие отчета о покрытии')
        .message('Отчет о покрытии кода найден')
        .details({
          reportPath: analysis.summary?.reportPath,
          reportDate: analysis.summary?.reportDate,
        })
        .build();
    } else {
      return ResultBuilder.warning('coverage-presence', 'Наличие отчета о покрытии')
        .message('Отчет о покрытии кода не найден')
        .details({
          suggestion: 'Запустите тесты с включенным сбором покрытия',
          expectedPaths: [
            'coverage/lcov.info',
            'coverage/coverage-final.json',
            '.nyc_output/coverage.json',
          ],
        })
        .build();
    }
  }

  private async checkOverallCoverage(summary: ProjectCoverageSummary): Promise<CheckResult> {
    const overallCoverage = summary.overall.lines;

    return ResultBuilder.threshold(
      'coverage-overall',
      'Общее покрытие кода',
      overallCoverage,
      TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE
    )
      .message(`Общее покрытие кода: ${Math.round(overallCoverage)}%`)
      .details({
        lines: Math.round(summary.overall.lines),
        branches: Math.round(summary.overall.branches),
        functions: Math.round(summary.overall.functions),
        statements: Math.round(summary.overall.statements),
        threshold: TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE,
      })
      .build();
  }

  private async checkLinesCoverage(summary: ProjectCoverageSummary): Promise<CheckResult> {
    const linesCoverage = summary.overall.lines;

    return ResultBuilder.threshold(
      'coverage-lines',
      'Покрытие строк кода',
      linesCoverage,
      TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE
    )
      .message(`Покрытие строк: ${Math.round(linesCoverage)}%`)
      .details({
        percentage: Math.round(linesCoverage),
        threshold: TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE,
      })
      .build();
  }

  private async checkBranchesCoverage(summary: ProjectCoverageSummary): Promise<CheckResult> {
    const branchCoverage = summary.overall.branches;

    return ResultBuilder.threshold(
      'coverage-branches',
      'Покрытие веток',
      branchCoverage,
      TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE
    )
      .message(`Покрытие веток: ${Math.round(branchCoverage)}%`)
      .details({
        percentage: Math.round(branchCoverage),
        threshold: TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE,
      })
      .build();
  }

  private async checkFunctionsCoverage(summary: ProjectCoverageSummary): Promise<CheckResult> {
    const functionCoverage = summary.overall.functions;

    return ResultBuilder.threshold(
      'coverage-functions',
      'Покрытие функций',
      functionCoverage,
      TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE
    )
      .message(`Покрытие функций: ${Math.round(functionCoverage)}%`)
      .details({
        percentage: Math.round(functionCoverage),
        threshold: TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE,
      })
      .build();
  }

  private async checkLowCoverageFiles(summary: ProjectCoverageSummary): Promise<CheckResult> {
    const lowCoverageCount = summary.lowCoverageFiles.length;
    const passed = lowCoverageCount === 0;

    return ResultBuilder.threshold(
      'coverage-low-files',
      'Файлы с низким покрытием',
      lowCoverageCount,
      0,
      false // Меньше = лучше
    )
      .message(
        passed
          ? 'Все файлы имеют достаточное покрытие'
          : `${lowCoverageCount} файлов с низким покрытием`
      )
      .details({
        count: lowCoverageCount,
        files: summary.lowCoverageFiles.slice(0, 5).map(f => ({
          path: f.path,
          coverage: Math.round(f.lines.percentage),
        })),
      })
      .build();
  }

  private async checkUncoveredFiles(summary: ProjectCoverageSummary): Promise<CheckResult> {
    const uncoveredCount = summary.uncoveredFiles.length;
    const passed = uncoveredCount === 0;

    return ResultBuilder.threshold(
      'coverage-uncovered-files',
      'Файлы без покрытия',
      uncoveredCount,
      0,
      false // Меньше = лучше
    )
      .message(passed ? 'Все файлы имеют покрытие' : `${uncoveredCount} файлов без покрытия`)
      .details({
        count: uncoveredCount,
        files: summary.uncoveredFiles.slice(0, 5),
      })
      .build();
  }

  private async checkCoverageConfiguration(project: Project): Promise<CheckResult> {
    // Проверяем конфигурацию покрытия в различных местах
    const hasJestCoverage = await this.hasJestCoverageConfig(project);
    const hasVitestCoverage = await this.hasVitestCoverageConfig(project);
    const hasNycConfig = await this.hasNycConfig(project);

    const configFound = hasJestCoverage || hasVitestCoverage || hasNycConfig;

    return ResultBuilder.threshold(
      'coverage-configuration',
      'Конфигурация покрытия',
      configFound ? 1 : 0,
      1
    )
      .message(configFound ? 'Конфигурация покрытия настроена' : 'Конфигурация покрытия не найдена')
      .details({
        jest: hasJestCoverage,
        vitest: hasVitestCoverage,
        nyc: hasNycConfig,
      })
      .build();
  }

  private async createCoverageSummary(analysis: CoverageAnalysisResult): Promise<CheckResult> {
    if (!analysis.hasReport || !analysis.summary) {
      return ResultBuilder.warning('coverage-summary', 'Сводка покрытия')
        .message('Не удается создать сводку - отсутствует отчет о покрытии')
        .build();
    }

    const summary = analysis.summary;
    const overallScore = this.calculateCoverageScore(summary);
    const passed = overallScore >= 0.7;

    return ResultBuilder.threshold('coverage-summary', 'Сводка покрытия кода', overallScore, 0.7)
      .message(`Общая оценка покрытия: ${Math.round(overallScore * 100)}%`)
      .details({
        score: Math.round(overallScore * 100),
        metrics: {
          lines: Math.round(summary.overall.lines),
          branches: Math.round(summary.overall.branches),
          functions: Math.round(summary.overall.functions),
        },
        issues: analysis.issues.length,
        recommendations: analysis.recommendations,
        trends: analysis.trends?.change,
      })
      .build();
  }

  // Вспомогательные методы

  private calculateCoverageScore(summary: ProjectCoverageSummary): number {
    // Взвешенная оценка различных метрик покрытия
    const linesWeight = 0.4;
    const branchesWeight = 0.3;
    const functionsWeight = 0.3;

    const linesScore = summary.overall.lines / 100;
    const branchesScore = summary.overall.branches / 100;
    const functionsScore = summary.overall.functions / 100;

    return (
      linesScore * linesWeight + branchesScore * branchesWeight + functionsScore * functionsWeight
    );
  }

  private async hasJestCoverageConfig(project: Project): Promise<boolean> {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);

      return !!(pkg.jest?.collectCoverage || pkg.jest?.coverageThreshold);
    } catch {
      return false;
    }
  }

  private async hasVitestCoverageConfig(project: Project): Promise<boolean> {
    const configFiles = ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts'];

    for (const configFile of configFiles) {
      try {
        const configPath = path.join(project.path, configFile);
        const content = await fs.readFile(configPath, 'utf-8');

        if (content.includes('coverage') || content.includes('c8')) {
          return true;
        }
      } catch {
        continue;
      }
    }

    return false;
  }

  private async hasNycConfig(project: Project): Promise<boolean> {
    const configFiles = ['.nycrc', '.nycrc.json', '.nycrc.yml', '.nycrc.yaml'];

    for (const configFile of configFiles) {
      try {
        await fs.access(path.join(project.path, configFile));
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  private generateCoverageRecommendations(analysis: CoverageAnalysisResult): string[] {
    const recommendations: string[] = [];

    if (!analysis.hasReport) {
      recommendations.push('Настройте сбор покрытия кода в тестовом фреймворке');
      recommendations.push('Запустите тесты с флагом --coverage');
      return recommendations;
    }

    if (!analysis.summary) {
      return recommendations;
    }

    const summary = analysis.summary;

    if (summary.overall.lines < TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE) {
      recommendations.push(
        `Увеличьте покрытие строк до ${TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE}% или выше`
      );
    }

    if (summary.overall.branches < 60) {
      recommendations.push('Добавьте тесты для покрытия условных конструкций (if, switch)');
    }

    if (summary.uncoveredFiles.length > 0) {
      recommendations.push('Создайте тесты для файлов без покрытия');
    }

    if (summary.lowCoverageFiles.length > 3) {
      recommendations.push('Улучшите покрытие в файлах с низкими показателями');
    }

    if (summary.overall.functions < 80) {
      recommendations.push('Добавьте тесты для непокрытых функций');
    }

    // Рекомендации по трендам
    if (analysis.trends?.change && analysis.trends.change.lines < -5) {
      recommendations.push('Покрытие снизилось - добавьте тесты для новых изменений');
    }

    return recommendations;
  }
}
