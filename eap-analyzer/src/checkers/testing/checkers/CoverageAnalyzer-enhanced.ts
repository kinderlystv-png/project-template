/**
 * Enhanced CoverageAnalyzer - Усовершенствованный анализатор покрытия кода
 * Интегрирует в себя функциональность из тестового скрипта
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface CoverageData {
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
}

export interface FileCoverageInfo {
  filePath: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  uncoveredLines?: number[];
}

export interface ProjectCoverageSummary {
  totalFiles: number;
  coveredFiles: number;
  overallCoverage: CoverageData;
  filesCoverage: FileCoverageInfo[];
  coverageByDirectory: Record<string, CoverageData>;
}

export interface CoverageAnalysisResult {
  hasValidCoverage: boolean;
  coverageScore: number;
  summary: ProjectCoverageSummary | null;
  testingTools: string[];
  testScripts: string[];
  recommendations: string[];
  grade: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
}

export class CoverageAnalyzer {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async analyzeProject(): Promise<CoverageAnalysisResult> {
    console.log('🧪 Анализ покрытия кода с Enhanced CoverageAnalyzer');
    console.log('============================================================');

    const result: CoverageAnalysisResult = {
      hasValidCoverage: false,
      coverageScore: 0,
      summary: null,
      testingTools: [],
      testScripts: [],
      recommendations: [],
      grade: 'POOR',
    };

    try {
      // 1. Анализ конфигурации проекта
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      let packageJson: any = {};

      if (await this.fileExists(packageJsonPath)) {
        const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      }

      // 2. Поиск инструментов тестирования
      result.testingTools = this.findTestingTools(packageJson);

      // 3. Поиск скриптов тестирования
      result.testScripts = this.findTestScripts(packageJson);

      // 4. Поиск отчетов покрытия
      const coverageFiles = await this.findCoverageReports();

      // 5. Анализ покрытия
      if (coverageFiles.length > 0) {
        result.hasValidCoverage = true;
        result.summary = await this.analyzeCoverageData(coverageFiles);
      }

      // 6. Подсчет оценки
      result.coverageScore = this.calculateScore(result);

      // 7. Определение категории
      result.grade = this.determineGrade(result.coverageScore);

      // 8. Генерация рекомендаций
      result.recommendations = this.generateRecommendations(result);

      this.printResults(result);

      return result;
    } catch (error) {
      console.error('❌ Ошибка при анализе покрытия:', error);
      return result;
    }
  }

  private findTestingTools(packageJson: any): string[] {
    const tools: string[] = [];
    const allDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    const testingToolsMap = {
      jest: 'Jest testing framework',
      vitest: 'Vite testing framework',
      '@testing-library': 'Testing Library',
      mocha: 'Mocha test runner',
      chai: 'Chai assertion library',
      cypress: 'Cypress E2E testing',
      playwright: 'Playwright testing',
      nyc: 'NYC coverage tool',
      c8: 'C8 coverage tool',
    };

    for (const [tool, description] of Object.entries(testingToolsMap)) {
      const found = Object.keys(allDeps).find(dep => dep.includes(tool));
      if (found) {
        tools.push(`${tool}: ${found} - ${description}`);
      }
    }

    return tools;
  }

  private findTestScripts(packageJson: any): string[] {
    const scripts = packageJson.scripts || {};
    const testScripts: string[] = [];

    for (const [name, command] of Object.entries(scripts)) {
      if (
        name.includes('test') ||
        name.includes('coverage') ||
        (typeof command === 'string' && command.includes('test'))
      ) {
        testScripts.push(`${name}: ${command}`);
      }
    }

    return testScripts;
  }

  private async findCoverageReports(): Promise<string[]> {
    const coverageFiles: string[] = [];

    const possibleLocations = [
      'coverage',
      'nyc_output',
      '.nyc_output',
      'jest-coverage',
      'coverage-final.json',
      'lcov.info',
      'clover.xml',
    ];

    for (const location of possibleLocations) {
      const fullPath = path.join(this.projectPath, location);
      if (await this.fileExists(fullPath)) {
        coverageFiles.push(fullPath);
      }
    }

    return coverageFiles;
  }

  private async analyzeCoverageData(coverageFiles: string[]): Promise<ProjectCoverageSummary> {
    const summary: ProjectCoverageSummary = {
      totalFiles: 0,
      coveredFiles: 0,
      overallCoverage: {
        statements: { total: 0, covered: 0, percentage: 0 },
        branches: { total: 0, covered: 0, percentage: 0 },
        functions: { total: 0, covered: 0, percentage: 0 },
        lines: { total: 0, covered: 0, percentage: 0 },
      },
      filesCoverage: [],
      coverageByDirectory: {},
    };

    // Поиск coverage-final.json
    const jsonReportPath = path.join(this.projectPath, 'coverage', 'coverage-final.json');

    if (await this.fileExists(jsonReportPath)) {
      try {
        const content = await fs.readFile(jsonReportPath, 'utf-8');
        const data = JSON.parse(content);

        console.log('✅ Найден coverage-final.json, анализирую...');

        let totalStatements = 0,
          coveredStatements = 0;
        let totalBranches = 0,
          coveredBranches = 0;
        let totalFunctions = 0,
          coveredFunctions = 0;
        let totalLines = 0,
          coveredLines = 0;

        // Анализ каждого файла
        for (const [filePath, fileData] of Object.entries(data)) {
          if (typeof fileData === 'object' && fileData !== null) {
            const fd = fileData as any;

            // Подсчет метрик для файла
            const fileStatements = Object.keys(fd.s || {}).length;
            const fileCoveredStatements = Object.values(fd.s || {}).filter(v => v > 0).length;

            const fileBranches = Object.keys(fd.b || {}).length;
            const fileCoveredBranches = Object.values(fd.b || {}).filter(
              (v: any) => Array.isArray(v) && v.some(x => x > 0)
            ).length;

            const fileFunctions = Object.keys(fd.f || {}).length;
            const fileCoveredFunctions = Object.values(fd.f || {}).filter(v => v > 0).length;

            const fileLines = Object.keys(fd.s || {}).length; // Упрощение
            const fileCoveredLines = Object.values(fd.s || {}).filter(v => v > 0).length;

            // Добавление к общей статистике
            totalStatements += fileStatements;
            coveredStatements += fileCoveredStatements;
            totalBranches += fileBranches;
            coveredBranches += fileCoveredBranches;
            totalFunctions += fileFunctions;
            coveredFunctions += fileCoveredFunctions;
            totalLines += fileLines;
            coveredLines += fileCoveredLines;

            // Информация о файле
            const relativePath = path.relative(this.projectPath, filePath);
            summary.filesCoverage.push({
              filePath: relativePath,
              statements: fileStatements > 0 ? (fileCoveredStatements / fileStatements) * 100 : 0,
              branches: fileBranches > 0 ? (fileCoveredBranches / fileBranches) * 100 : 0,
              functions: fileFunctions > 0 ? (fileCoveredFunctions / fileFunctions) * 100 : 0,
              lines: fileLines > 0 ? (fileCoveredLines / fileLines) * 100 : 0,
            });
          }
        }

        // Общая статистика
        summary.totalFiles = Object.keys(data).length;
        summary.coveredFiles = summary.filesCoverage.filter(f => f.statements > 0).length;

        summary.overallCoverage = {
          statements: {
            total: totalStatements,
            covered: coveredStatements,
            percentage: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
          },
          branches: {
            total: totalBranches,
            covered: coveredBranches,
            percentage: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
          },
          functions: {
            total: totalFunctions,
            covered: coveredFunctions,
            percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
          },
          lines: {
            total: totalLines,
            covered: coveredLines,
            percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
          },
        };

        console.log(`📊 Проанализировано файлов: ${summary.totalFiles}`);
        console.log(
          `📈 Общее покрытие строк: ${summary.overallCoverage.statements.percentage.toFixed(2)}%`
        );
        console.log(
          `🌿 Покрытие веток: ${summary.overallCoverage.branches.percentage.toFixed(2)}%`
        );
        console.log(
          `⚡ Покрытие функций: ${summary.overallCoverage.functions.percentage.toFixed(2)}%`
        );
      } catch (error) {
        console.error('❌ Ошибка при анализе coverage-final.json:', error);
      }
    }

    return summary;
  }

  private calculateScore(result: CoverageAnalysisResult): number {
    let score = 0;

    // Наличие отчетов покрытия
    if (result.hasValidCoverage) {
      score += 30;
    }

    // Количество инструментов тестирования
    score += Math.min(result.testingTools.length * 10, 30);

    // Количество тестовых скриптов
    score += Math.min(result.testScripts.length * 2, 30);

    // Качество покрытия
    if (result.summary && result.summary.overallCoverage) {
      const avgCoverage =
        (result.summary.overallCoverage.statements.percentage +
          result.summary.overallCoverage.branches.percentage +
          result.summary.overallCoverage.functions.percentage +
          result.summary.overallCoverage.lines.percentage) /
        4;

      if (avgCoverage >= 80) score += 10;
      else if (avgCoverage >= 60) score += 7;
      else if (avgCoverage >= 40) score += 5;
      else if (avgCoverage >= 20) score += 3;
    }

    return Math.min(score, 100);
  }

  private determineGrade(score: number): 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 70) return 'GOOD';
    if (score >= 50) return 'NEEDS_IMPROVEMENT';
    return 'POOR';
  }

  private generateRecommendations(result: CoverageAnalysisResult): string[] {
    const recommendations: string[] = [];

    if (!result.hasValidCoverage) {
      recommendations.push('Настройте генерацию отчетов покрытия (coverage reports)');
    }

    if (result.testingTools.length < 3) {
      recommendations.push('Рассмотрите добавление дополнительных инструментов тестирования');
    }

    if (result.summary) {
      const { overallCoverage } = result.summary;

      if (overallCoverage.statements.percentage < 70) {
        recommendations.push('Увеличьте покрытие кода тестами до 70%+');
      }

      if (overallCoverage.branches.percentage < 60) {
        recommendations.push('Улучшите покрытие ветвлений кода');
      }

      if (overallCoverage.functions.percentage < 80) {
        recommendations.push('Добавьте тесты для непокрытых функций');
      }
    }

    if (result.testScripts.length === 0) {
      recommendations.push('Добавьте npm скрипты для запуска тестов');
    }

    return recommendations;
  }

  private printResults(result: CoverageAnalysisResult): void {
    console.log('\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА ПОКРЫТИЯ:');
    console.log('========================================');

    console.log(`✅ Инструменты тестирования найдены: ${result.testingTools.length}`);
    result.testingTools.forEach(tool => console.log(`  - ${tool}`));

    console.log(`\n✅ Тестовые скрипты найдены: ${result.testScripts.length}`);
    result.testScripts.slice(0, 5).forEach(script => console.log(`  - ${script}`));
    if (result.testScripts.length > 5) {
      console.log(`  ... и еще ${result.testScripts.length - 5} скриптов`);
    }

    if (result.summary) {
      console.log(`\n📈 ПОКРЫТИЕ КОДА:`);
      console.log(
        `  Файлов: ${result.summary.totalFiles} (покрыто: ${result.summary.coveredFiles})`
      );
      console.log(`  Строки: ${result.summary.overallCoverage.statements.percentage.toFixed(1)}%`);
      console.log(`  Ветки: ${result.summary.overallCoverage.branches.percentage.toFixed(1)}%`);
      console.log(`  Функции: ${result.summary.overallCoverage.functions.percentage.toFixed(1)}%`);
    }

    console.log(`\n🎯 ОБЩАЯ ОЦЕНКА: ${result.coverageScore}/100 (${result.grade})`);

    if (result.recommendations.length > 0) {
      console.log(`\n💡 РЕКОМЕНДАЦИИ:`);
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
