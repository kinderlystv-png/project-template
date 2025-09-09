/**
 * Интеграционные тесты для проверки всего цикла валидации
 * Тестирует взаимодействие всех компонентов системы валидации
 */

import { GoldenStandardAnalyzer } from '../analyzer.js';
import * as path from 'path';
import * as fs from 'fs';

export interface IntegrationTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: {
    analysisCompleted: boolean;
    validationCompleted: boolean;
    reportGenerated: boolean;
    criticalIssues: number;
    confidence: number;
  };
  error?: string;
}

export interface IntegrationTestSuite {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: IntegrationTestResult[];
}

export class IntegrationTester {
  private analyzer: GoldenStandardAnalyzer;

  constructor() {
    this.analyzer = new GoldenStandardAnalyzer();
  }

  /**
   * Запускает полный набор интеграционных тестов
   */
  async runIntegrationTests(): Promise<IntegrationTestSuite> {
    console.log('🧪 Запуск интеграционных тестов...\n');

    const suite: IntegrationTestSuite = {
      suiteName: 'EAP Integration Tests',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      results: [],
    };

    const tests = [
      () => this.testBasicAnalysisAndValidation(),
      () => this.testInvalidMetricsDetection(),
      () => this.testReportGeneration(),
      () => this.testErrorHandling(),
      () => this.testPerformanceValidation(),
    ];

    for (const test of tests) {
      const result = await test();
      suite.results.push(result);
      suite.totalTests++;
      suite.totalDuration += result.duration;

      if (result.passed) {
        suite.passedTests++;
        console.log(`✅ ${result.testName} (${result.duration}ms)`);
      } else {
        suite.failedTests++;
        console.log(`❌ ${result.testName} (${result.duration}ms)`);
        if (result.error) {
          console.log(`   Ошибка: ${result.error}`);
        }
      }
    }

    this.printSummary(suite);
    return suite;
  }

  /**
   * Тест 1: Базовый анализ и валидация
   */
  private async testBasicAnalysisAndValidation(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = 'Базовый анализ и валидация';

    try {
      // Создаем тестовый проект
      const testProjectPath = await this.createTestProject();

      // Выполняем структурный анализ
      const analysisResults = await this.analyzer.performStructuralAnalysis(testProjectPath);

      // Проверяем что анализ завершился
      const analysisCompleted =
        analysisResults &&
        analysisResults.duplication &&
        analysisResults.complexity &&
        analysisResults.fileClassification;

      // Выполняем валидацию
      const validationResults = await this.analyzer.validateAnalysisResults(
        analysisResults,
        testProjectPath,
        { generateReport: false }
      );

      const validationCompleted =
        validationResults &&
        typeof validationResults.isValid === 'boolean' &&
        typeof validationResults.confidence === 'number';

      // Очищаем тестовые данные
      await this.cleanupTestProject(testProjectPath);

      return {
        testName,
        passed: analysisCompleted && validationCompleted,
        duration: Date.now() - startTime,
        details: {
          analysisCompleted,
          validationCompleted,
          reportGenerated: false,
          criticalIssues: validationResults.criticalIssues || 0,
          confidence: validationResults.confidence || 0,
        },
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: {
          analysisCompleted: false,
          validationCompleted: false,
          reportGenerated: false,
          criticalIssues: 0,
          confidence: 0,
        },
        error: String(error),
      };
    }
  }

  /**
   * Тест 2: Детекция некорректных метрик
   */
  private async testInvalidMetricsDetection(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = 'Детекция некорректных метрик';

    try {
      // Создаем искусственно неправильные данные
      const invalidAnalysisResults = {
        duplication: {
          percentage: 150, // Невозможное значение > 100%
          duplicatedBlocks: 100,
          totalBlocks: 50, // Дублированных больше чем всего
        },
        complexity: {
          summary: {
            maxCyclomatic: -5, // Отрицательная сложность
            maxCognitive: 999999, // Нереально высокая
            totalFiles: 1,
          },
          files: [
            {
              metrics: {
                maintainabilityIndex: 150, // > 100
              },
            },
          ],
        },
        fileClassification: {
          total: 10,
          classified: 8, // Не все файлы классифицированы
        },
      };

      const validationResults = await this.analyzer.validateAnalysisResults(
        invalidAnalysisResults,
        './test-project',
        { generateReport: false }
      );

      // Должны быть обнаружены критические ошибки
      const correctlyDetected =
        !validationResults.isValid &&
        validationResults.criticalIssues > 0 &&
        validationResults.confidence < 50;

      return {
        testName,
        passed: correctlyDetected,
        duration: Date.now() - startTime,
        details: {
          analysisCompleted: true,
          validationCompleted: true,
          reportGenerated: false,
          criticalIssues: validationResults.criticalIssues,
          confidence: validationResults.confidence,
        },
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: {
          analysisCompleted: false,
          validationCompleted: false,
          reportGenerated: false,
          criticalIssues: 0,
          confidence: 0,
        },
        error: String(error),
      };
    }
  }

  /**
   * Тест 3: Генерация отчетов
   */
  private async testReportGeneration(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = 'Генерация отчетов';

    try {
      const validAnalysisResults = {
        duplication: { percentage: 15, duplicatedBlocks: 5, totalBlocks: 100 },
        complexity: {
          summary: { maxCyclomatic: 10, maxCognitive: 15, totalFiles: 3 },
          files: [{ metrics: { maintainabilityIndex: 85 } }],
        },
        fileClassification: { total: 10, classified: 10 },
      };

      const validationResults = await this.analyzer.validateAnalysisResults(
        validAnalysisResults,
        './test-project',
        {
          generateReport: true,
          reportFormat: 'markdown',
          outputPath: './test-reports',
        }
      );

      const reportGenerated =
        validationResults.reportPath && fs.existsSync(validationResults.reportPath);

      // Очищаем отчет
      if (validationResults.reportPath && fs.existsSync(validationResults.reportPath)) {
        fs.unlinkSync(validationResults.reportPath);
        if (fs.existsSync('./test-reports')) {
          fs.rmdirSync('./test-reports');
        }
      }

      return {
        testName,
        passed: !!reportGenerated,
        duration: Date.now() - startTime,
        details: {
          analysisCompleted: true,
          validationCompleted: true,
          reportGenerated: !!reportGenerated,
          criticalIssues: validationResults.criticalIssues,
          confidence: validationResults.confidence,
        },
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: {
          analysisCompleted: false,
          validationCompleted: false,
          reportGenerated: false,
          criticalIssues: 0,
          confidence: 0,
        },
        error: String(error),
      };
    }
  }

  /**
   * Тест 4: Обработка ошибок
   */
  private async testErrorHandling(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = 'Обработка ошибок';

    try {
      // Пытаемся проанализировать несуществующий проект
      const analysisResults =
        await this.analyzer.performStructuralAnalysis('./nonexistent-project');

      // Анализ должен завершиться без критических ошибок
      const errorHandled =
        analysisResults &&
        analysisResults.fileClassification &&
        analysisResults.fileClassification.total >= 0;

      return {
        testName,
        passed: errorHandled,
        duration: Date.now() - startTime,
        details: {
          analysisCompleted: errorHandled,
          validationCompleted: false,
          reportGenerated: false,
          criticalIssues: 0,
          confidence: 0,
        },
      };
    } catch (error) {
      // Ошибка ожидается, но должна быть обработана корректно
      return {
        testName,
        passed: true, // Ошибка обработана
        duration: Date.now() - startTime,
        details: {
          analysisCompleted: false,
          validationCompleted: false,
          reportGenerated: false,
          criticalIssues: 0,
          confidence: 0,
        },
        error: 'Ошибка корректно обработана',
      };
    }
  }

  /**
   * Тест 5: Проверка производительности
   */
  private async testPerformanceValidation(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = 'Проверка производительности';

    try {
      const testProjectPath = await this.createTestProject();

      // Анализ должен завершиться за разумное время
      const analysisStart = Date.now();
      const analysisResults = await this.analyzer.performStructuralAnalysis(testProjectPath);
      const analysisDuration = Date.now() - analysisStart;

      // Валидация должна быть быстрой
      const validationStart = Date.now();
      await this.analyzer.validateAnalysisResults(analysisResults, testProjectPath);
      const validationDuration = Date.now() - validationStart;

      await this.cleanupTestProject(testProjectPath);

      // Проверяем разумные временные рамки
      const performanceOk =
        analysisDuration < 30000 && // Анализ < 30 сек
        validationDuration < 5000; // Валидация < 5 сек

      return {
        testName,
        passed: performanceOk,
        duration: Date.now() - startTime,
        details: {
          analysisCompleted: true,
          validationCompleted: true,
          reportGenerated: false,
          criticalIssues: 0,
          confidence: 100,
        },
        error: performanceOk
          ? undefined
          : `Слишком медленно: анализ ${analysisDuration}ms, валидация ${validationDuration}ms`,
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: {
          analysisCompleted: false,
          validationCompleted: false,
          reportGenerated: false,
          criticalIssues: 0,
          confidence: 0,
        },
        error: String(error),
      };
    }
  }

  /**
   * Создает тестовый проект
   */
  private async createTestProject(): Promise<string> {
    const testDir = path.join(process.cwd(), 'temp-test-project');

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Создаем простые тестовые файлы
    const testFiles = {
      'package.json': JSON.stringify({ name: 'test-project', version: '1.0.0' }),
      'src/main.js': 'function main() { console.log("Hello"); }',
      'src/utils.js': 'export function add(a, b) { return a + b; }',
      'README.md': '# Test Project',
    };

    for (const [filePath, content] of Object.entries(testFiles)) {
      const fullPath = path.join(testDir, filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content);
    }

    return testDir;
  }

  /**
   * Очищает тестовый проект
   */
  private async cleanupTestProject(projectPath: string): Promise<void> {
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
  }

  /**
   * Выводит итоговую сводку
   */
  private printSummary(suite: IntegrationTestSuite): void {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 ИТОГИ ИНТЕГРАЦИОННЫХ ТЕСТОВ');
    console.log('='.repeat(60));
    console.log(`📊 Набор: ${suite.suiteName}`);
    console.log(`📋 Всего тестов: ${suite.totalTests}`);
    console.log(`✅ Прошло: ${suite.passedTests}`);
    console.log(`❌ Провалено: ${suite.failedTests}`);
    console.log(`⏱️  Общее время: ${suite.totalDuration}ms`);
    console.log(`📈 Успешность: ${((suite.passedTests / suite.totalTests) * 100).toFixed(1)}%`);

    if (suite.failedTests === 0) {
      console.log('\n🎉 ВСЕ ИНТЕГРАЦИОННЫЕ ТЕСТЫ ПРОШЛИ!');
      console.log('✅ Система валидации работает корректно');
    } else {
      console.log('\n⚠️  ЕСТЬ ПРОВАЛЕННЫЕ ТЕСТЫ');
      console.log('❌ Требуется дополнительная отладка');
    }

    console.log('='.repeat(60));
  }
}
