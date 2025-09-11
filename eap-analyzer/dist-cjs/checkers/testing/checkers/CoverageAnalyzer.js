'use strict';
/**
 * CoverageAnalyzer - анализатор покрытия кода тестами
 * Анализирует отчеты покрытия и предоставляет детальную информацию
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.CoverageAnalyzer = void 0;
const fs = __importStar(require('fs/promises'));
const path = __importStar(require('path'));
const BaseChecker_1 = require('../../../core/base/BaseChecker');
const SeverityLevel_1 = require('../../../types/SeverityLevel');
const AnalysisCategory_1 = require('../../../types/AnalysisCategory');
const ResultBuilder_1 = require('../utils/ResultBuilder');
const constants_1 = require('../constants');
/**
 * Анализатор покрытия кода
 */
class CoverageAnalyzer extends BaseChecker_1.BaseChecker {
  constructor() {
    super(
      'coverage-analyzer',
      AnalysisCategory_1.AnalysisCategory.TESTING,
      'Анализирует покрытие кода тестами и предоставляет детальные отчеты',
      'Code Coverage Analysis',
      SeverityLevel_1.SeverityLevel.MEDIUM
    );
  }
  /**
   * Выполняет анализ покрытия кода
   * @param project Проект для анализа
   * @returns Массив результатов анализа
   */
  async check(project) {
    const results = [];
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
        ResultBuilder_1.ResultBuilder.error('coverage-analysis-error', 'Ошибка анализа покрытия')
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
  async analyzeCoverage(project) {
    const result = {
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
          severity: SeverityLevel_1.SeverityLevel.MEDIUM,
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
  async findCoverageReports(project) {
    const reportPaths = [
      { path: 'coverage/lcov.info', type: 'lcov' },
      { path: 'coverage/coverage-final.json', type: 'json' },
      { path: 'coverage/coverage.json', type: 'json' },
      { path: 'coverage/clover.xml', type: 'clover' },
      { path: '.nyc_output/coverage.json', type: 'json' },
      { path: 'reports/coverage/lcov.info', type: 'lcov' },
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
  async parseCoverageReport(reportPath, type) {
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
  async parseJsonCoverageReport(reportPath) {
    const content = await fs.readFile(reportPath, 'utf-8');
    const coverage = JSON.parse(content);
    const summary = {
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
        const data = fileData;
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
        if (
          fileCoverage.lines.percentage < constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE
        ) {
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
  async parseLcovCoverageReport(reportPath) {
    const content = await fs.readFile(reportPath, 'utf-8');
    const lines = content.split('\n');
    const summary = {
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
        if (percentage < constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE) {
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
  calculateFileCoverage(lines, branches, functions, statements) {
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
  async analyzeCoverageIssues(summary) {
    const issues = [];
    // Проверяем общее покрытие
    if (summary.overall.lines < constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE) {
      issues.push({
        type: 'threshold',
        severity: SeverityLevel_1.SeverityLevel.HIGH,
        message: `Низкое покрытие строк: ${Math.round(summary.overall.lines)}%`,
        suggestion: `Увеличьте покрытие до ${constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE}% или выше`,
        metric: 'lines',
      });
    }
    if (summary.overall.branches < constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE) {
      issues.push({
        type: 'threshold',
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
        message: `Низкое покрытие веток: ${Math.round(summary.overall.branches)}%`,
        suggestion: `Добавьте тесты для покрытия условных конструкций`,
        metric: 'branches',
      });
    }
    if (summary.overall.functions < constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE) {
      issues.push({
        type: 'threshold',
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
        message: `Низкое покрытие функций: ${Math.round(summary.overall.functions)}%`,
        suggestion: `Добавьте тесты для непокрытых функций`,
        metric: 'functions',
      });
    }
    // Проверяем файлы без покрытия
    if (summary.uncoveredFiles.length > 0) {
      issues.push({
        type: 'missing',
        severity: SeverityLevel_1.SeverityLevel.HIGH,
        message: `${summary.uncoveredFiles.length} файлов без покрытия`,
        suggestion: 'Создайте тесты для непокрытых файлов',
        files: summary.uncoveredFiles.slice(0, 5), // Ограничиваем список
      });
    }
    // Проверяем файлы с низким покрытием
    if (summary.lowCoverageFiles.length > 5) {
      issues.push({
        type: 'quality',
        severity: SeverityLevel_1.SeverityLevel.MEDIUM,
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
  async analyzeCoverageTrends(project, summary) {
    try {
      // Пытаемся найти предыдущие отчеты
      const historyPath = path.join(project.path, '.coverage-history.json');
      let history = [];
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
      let change;
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
  async checkCoveragePresence(analysis) {
    if (analysis.hasReport) {
      return ResultBuilder_1.ResultBuilder.success('coverage-presence', 'Наличие отчета о покрытии')
        .message('Отчет о покрытии кода найден')
        .details({
          reportPath: analysis.summary?.reportPath,
          reportDate: analysis.summary?.reportDate,
        })
        .build();
    } else {
      return ResultBuilder_1.ResultBuilder.warning('coverage-presence', 'Наличие отчета о покрытии')
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
  async checkOverallCoverage(summary) {
    const overallCoverage = summary.overall.lines;
    return ResultBuilder_1.ResultBuilder.threshold(
      'coverage-overall',
      'Общее покрытие кода',
      overallCoverage,
      constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE
    )
      .message(`Общее покрытие кода: ${Math.round(overallCoverage)}%`)
      .details({
        lines: Math.round(summary.overall.lines),
        branches: Math.round(summary.overall.branches),
        functions: Math.round(summary.overall.functions),
        statements: Math.round(summary.overall.statements),
        threshold: constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE,
      })
      .build();
  }
  async checkLinesCoverage(summary) {
    const linesCoverage = summary.overall.lines;
    return ResultBuilder_1.ResultBuilder.threshold(
      'coverage-lines',
      'Покрытие строк кода',
      linesCoverage,
      constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE
    )
      .message(`Покрытие строк: ${Math.round(linesCoverage)}%`)
      .details({
        percentage: Math.round(linesCoverage),
        threshold: constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE,
      })
      .build();
  }
  async checkBranchesCoverage(summary) {
    const branchCoverage = summary.overall.branches;
    return ResultBuilder_1.ResultBuilder.threshold(
      'coverage-branches',
      'Покрытие веток',
      branchCoverage,
      constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE
    )
      .message(`Покрытие веток: ${Math.round(branchCoverage)}%`)
      .details({
        percentage: Math.round(branchCoverage),
        threshold: constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE,
      })
      .build();
  }
  async checkFunctionsCoverage(summary) {
    const functionCoverage = summary.overall.functions;
    return ResultBuilder_1.ResultBuilder.threshold(
      'coverage-functions',
      'Покрытие функций',
      functionCoverage,
      constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE
    )
      .message(`Покрытие функций: ${Math.round(functionCoverage)}%`)
      .details({
        percentage: Math.round(functionCoverage),
        threshold: constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE,
      })
      .build();
  }
  async checkLowCoverageFiles(summary) {
    const lowCoverageCount = summary.lowCoverageFiles.length;
    const passed = lowCoverageCount === 0;
    return ResultBuilder_1.ResultBuilder.threshold(
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
  async checkUncoveredFiles(summary) {
    const uncoveredCount = summary.uncoveredFiles.length;
    const passed = uncoveredCount === 0;
    return ResultBuilder_1.ResultBuilder.threshold(
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
  async checkCoverageConfiguration(project) {
    // Проверяем конфигурацию покрытия в различных местах
    const hasJestCoverage = await this.hasJestCoverageConfig(project);
    const hasVitestCoverage = await this.hasVitestCoverageConfig(project);
    const hasNycConfig = await this.hasNycConfig(project);
    const configFound = hasJestCoverage || hasVitestCoverage || hasNycConfig;
    return ResultBuilder_1.ResultBuilder.threshold(
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
  async createCoverageSummary(analysis) {
    if (!analysis.hasReport || !analysis.summary) {
      return ResultBuilder_1.ResultBuilder.warning('coverage-summary', 'Сводка покрытия')
        .message('Не удается создать сводку - отсутствует отчет о покрытии')
        .build();
    }
    const summary = analysis.summary;
    const overallScore = this.calculateCoverageScore(summary);
    const passed = overallScore >= 0.7;
    return ResultBuilder_1.ResultBuilder.threshold(
      'coverage-summary',
      'Сводка покрытия кода',
      overallScore,
      0.7
    )
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
  calculateCoverageScore(summary) {
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
  async hasJestCoverageConfig(project) {
    try {
      const packageJsonPath = path.join(project.path, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      return !!(pkg.jest?.collectCoverage || pkg.jest?.coverageThreshold);
    } catch {
      return false;
    }
  }
  async hasVitestCoverageConfig(project) {
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
  async hasNycConfig(project) {
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
  generateCoverageRecommendations(analysis) {
    const recommendations = [];
    if (!analysis.hasReport) {
      recommendations.push('Настройте сбор покрытия кода в тестовом фреймворке');
      recommendations.push('Запустите тесты с флагом --coverage');
      return recommendations;
    }
    if (!analysis.summary) {
      return recommendations;
    }
    const summary = analysis.summary;
    if (summary.overall.lines < constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE) {
      recommendations.push(
        `Увеличьте покрытие строк до ${constants_1.TESTING_THRESHOLDS.MIN_COVERAGE_PERCENTAGE}% или выше`
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
exports.CoverageAnalyzer = CoverageAnalyzer;
//# sourceMappingURL=CoverageAnalyzer.js.map
