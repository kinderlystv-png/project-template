/**
 * Тест Enhanced CoverageAnalyzer
 */

const path = require('path');
const fs = require('fs').promises;

// Упрощенная версия CoverageAnalyzer для тестирования
class CoverageAnalyzer {
  constructor(projectPath) {
    this.projectPath = projectPath;
  }

  async analyzeProject() {
    console.log('🧪 Тестирование Enhanced CoverageAnalyzer на проекте kinderly-events');
    console.log('============================================================');

    const result = {
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
      let packageJson = {};

      if (await this.fileExists(packageJsonPath)) {
        const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      }

      // 2. Поиск инструментов тестирования
      result.testingTools = this.findTestingTools(packageJson);
      console.log(`✅ Найдено инструментов тестирования: ${result.testingTools.length}`);

      // 3. Поиск скриптов тестирования
      result.testScripts = this.findTestScripts(packageJson);
      console.log(`✅ Найдено тестовых скриптов: ${result.testScripts.length}`);

      // 4. Поиск отчетов покрытия
      const coverageFiles = await this.findCoverageReports();
      console.log(`✅ Найдено файлов покрытия: ${coverageFiles.length}`);

      // 5. Анализ покрытия
      if (coverageFiles.length > 0) {
        result.hasValidCoverage = true;
        result.summary = await this.analyzeCoverageData();
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

  findTestingTools(packageJson) {
    const tools = [];
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

  findTestScripts(packageJson) {
    const scripts = packageJson.scripts || {};
    const testScripts = [];

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

  async findCoverageReports() {
    const coverageFiles = [];

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

  async analyzeCoverageData() {
    const summary = {
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

        console.log('✅ Найден coverage-final.json, анализирую подробно...');

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
            const fd = fileData;

            // Подсчет метрик для файла
            const fileStatements = Object.keys(fd.s || {}).length;
            const fileCoveredStatements = Object.values(fd.s || {}).filter(
              v => Number(v) > 0
            ).length;

            const fileBranches = Object.keys(fd.b || {}).length;
            const fileCoveredBranches = Object.values(fd.b || {}).filter(
              v => Array.isArray(v) && v.some(x => Number(x) > 0)
            ).length;

            const fileFunctions = Object.keys(fd.f || {}).length;
            const fileCoveredFunctions = Object.values(fd.f || {}).filter(
              v => Number(v) > 0
            ).length;

            const fileLines = Object.keys(fd.s || {}).length; // Упрощение
            const fileCoveredLines = Object.values(fd.s || {}).filter(v => Number(v) > 0).length;

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
            if (fileStatements > 0 || fileBranches > 0 || fileFunctions > 0) {
              summary.filesCoverage.push({
                filePath: relativePath,
                statements: fileStatements > 0 ? (fileCoveredStatements / fileStatements) * 100 : 0,
                branches: fileBranches > 0 ? (fileCoveredBranches / fileBranches) * 100 : 0,
                functions: fileFunctions > 0 ? (fileCoveredFunctions / fileFunctions) * 100 : 0,
                lines: fileLines > 0 ? (fileCoveredLines / fileLines) * 100 : 0,
              });
            }
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
        console.log(`📈 Покрытых файлов: ${summary.coveredFiles}`);
        console.log(
          `📉 Общее покрытие строк: ${summary.overallCoverage.statements.percentage.toFixed(2)}%`
        );
        console.log(
          `🌿 Покрытие веток: ${summary.overallCoverage.branches.percentage.toFixed(2)}%`
        );
        console.log(
          `⚡ Покрытие функций: ${summary.overallCoverage.functions.percentage.toFixed(2)}%`
        );

        // Топ непокрытых файлов
        const lowCoverageFiles = summary.filesCoverage
          .filter(f => f.statements < 50)
          .sort((a, b) => a.statements - b.statements)
          .slice(0, 10);

        if (lowCoverageFiles.length > 0) {
          console.log(`\n🔍 Файлы с низким покрытием (<50%):`);
          lowCoverageFiles.forEach(file => {
            console.log(`  - ${file.filePath}: ${file.statements.toFixed(1)}%`);
          });
        }

        // Топ хорошо покрытых файлов
        const highCoverageFiles = summary.filesCoverage
          .filter(f => f.statements >= 80)
          .sort((a, b) => b.statements - a.statements)
          .slice(0, 5);

        if (highCoverageFiles.length > 0) {
          console.log(`\n✅ Файлы с отличным покрытием (>=80%):`);
          highCoverageFiles.forEach(file => {
            console.log(`  - ${file.filePath}: ${file.statements.toFixed(1)}%`);
          });
        }
      } catch (error) {
        console.error('❌ Ошибка при анализе coverage-final.json:', error);
      }
    }

    return summary;
  }

  calculateScore(result) {
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
      const { statements, branches, functions } = result.summary.overallCoverage;
      const avgCoverage = (statements.percentage + branches.percentage + functions.percentage) / 3;

      if (avgCoverage >= 80) score += 10;
      else if (avgCoverage >= 60) score += 8;
      else if (avgCoverage >= 40) score += 6;
      else if (avgCoverage >= 20) score += 4;
      else if (avgCoverage >= 10) score += 2;
    }

    return Math.min(score, 100);
  }

  determineGrade(score) {
    if (score >= 95) return 'ПРЕВОСХОДНО';
    if (score >= 90) return 'ОТЛИЧНО';
    if (score >= 75) return 'ХОРОШО';
    if (score >= 60) return 'УДОВЛЕТВОРИТЕЛЬНО';
    if (score >= 40) return 'ТРЕБУЕТ УЛУЧШЕНИЯ';
    return 'КРИТИЧНО';
  }

  generateRecommendations(result) {
    const recommendations = [];

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

      // Рекомендации по качеству покрытия
      if (overallCoverage.statements.percentage < 20) {
        recommendations.push('Критически низкое покрытие! Требуется срочное добавление тестов');
      }
    }

    if (result.testScripts.length === 0) {
      recommendations.push('Добавьте npm скрипты для запуска тестов');
    }

    return recommendations;
  }

  printResults(result) {
    console.log('\n📊 ДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ АНАЛИЗА ПОКРЫТИЯ:');
    console.log('========================================');

    console.log(`\n🛠️ Инструменты тестирования (${result.testingTools.length}):`);
    result.testingTools.forEach(tool => console.log(`  ✅ ${tool}`));

    console.log(`\n📝 Тестовые скрипты (${result.testScripts.length}):`);
    result.testScripts.slice(0, 8).forEach(script => console.log(`  ✅ ${script}`));
    if (result.testScripts.length > 8) {
      console.log(`  ... и еще ${result.testScripts.length - 8} скриптов`);
    }

    if (result.summary) {
      console.log(`\n📈 СТАТИСТИКА ПОКРЫТИЯ КОДА:`);
      console.log(`  📁 Всего файлов: ${result.summary.totalFiles}`);
      console.log(`  📄 Покрытых файлов: ${result.summary.coveredFiles}`);
      console.log(
        `  📊 Покрытие строк: ${result.summary.overallCoverage.statements.percentage.toFixed(1)}% (${result.summary.overallCoverage.statements.covered}/${result.summary.overallCoverage.statements.total})`
      );
      console.log(
        `  🌿 Покрытие веток: ${result.summary.overallCoverage.branches.percentage.toFixed(1)}% (${result.summary.overallCoverage.branches.covered}/${result.summary.overallCoverage.branches.total})`
      );
      console.log(
        `  ⚡ Покрытие функций: ${result.summary.overallCoverage.functions.percentage.toFixed(1)}% (${result.summary.overallCoverage.functions.covered}/${result.summary.overallCoverage.functions.total})`
      );
    }

    console.log(`\n🎯 ИТОГОВАЯ ОЦЕНКА: ${result.coverageScore}/100 - ${result.grade}`);

    if (result.recommendations.length > 0) {
      console.log(`\n💡 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ:`);
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Запуск анализа
async function runAnalysis() {
  const analyzer = new CoverageAnalyzer('C:\\kinderly-events');
  const result = await analyzer.analyzeProject();

  console.log('\n🎉 Анализ завершен!');
  return result;
}

runAnalysis().catch(console.error);
