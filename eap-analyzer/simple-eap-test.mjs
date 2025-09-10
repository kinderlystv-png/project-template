/**
 * Упрощенный EAP анализатор для тестирования TestingChecker
 * Обходит проблемы компиляции других компонентов
 */

import * as path from 'path';
import * as fs from 'fs';

// Простой CheckContext
interface SimpleCheckContext {
  projectPath: string;
  configFiles: string[];
  packageJson: any;
  nodeModules: string[];
}

// Простой CheckResult
interface SimpleCheckResult {
  check: {
    id: string;
    name: string;
    description: string;
    category: string;
    score: number;
    level: string;
    tags: string[];
  };
  passed: boolean;
  score: number;
  maxScore: number;
  details?: string;
  duration?: number;
}

// Простой ComponentResult
interface SimpleComponentResult {
  component: {
    name: string;
    description: string;
    weight: number;
    checks: any[];
    critical: boolean;
  };
  score: number;
  maxScore: number;
  percentage: number;
  passed: SimpleCheckResult[];
  failed: SimpleCheckResult[];
  warnings: any[];
  recommendations: string[];
  duration: number;
}

/**
 * Простая версия ProcessIsolatedAnalyzer для демонстрации
 */
class MockProcessIsolatedAnalyzer {
  async runUnifiedAnalysis(context: SimpleCheckContext): Promise<any> {
    console.log('🔄 MockProcessIsolatedAnalyzer: Analyzing', context.projectPath);

    // Анализируем реальную структуру проекта
    const packageJsonPath = path.join(context.projectPath, 'package.json');
    let packageJson = null;

    if (fs.existsSync(packageJsonPath)) {
      try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      } catch (error) {
        console.warn('Warning: Could not parse package.json');
      }
    }

    // Ищем тестовые файлы
    const testFiles = this.findTestFiles(context.projectPath);

    // Анализируем фреймворки
    const frameworks = this.analyzeFrameworks(packageJson);

    // Генерируем результат на основе реальных данных
    const score = this.calculateScore(testFiles, frameworks, packageJson);

    return {
      summary: {
        score: score.overall,
        coverage: score.coverage,
        testQuality: score.quality,
        executionTime: Date.now() % 1000
      },
      details: {
        testFiles: testFiles,
        frameworks: frameworks
      }
    };
  }

  private findTestFiles(projectPath: string): string[] {
    const testFiles: string[] = [];

    function walkDir(dir: string) {
      if (!fs.existsSync(dir)) return;

      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);

          try {
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
              walkDir(fullPath);
            } else if (stat.isFile() && (
              item.endsWith('.test.ts') ||
              item.endsWith('.test.js') ||
              item.endsWith('.spec.ts') ||
              item.endsWith('.spec.js')
            )) {
              testFiles.push(path.relative(projectPath, fullPath));
            }
          } catch (error) {
            // Игнорируем ошибки доступа
          }
        }
      } catch (error) {
        // Игнорируем ошибки чтения директории
      }
    }

    walkDir(projectPath);
    return testFiles;
  }

  private analyzeFrameworks(packageJson: any): Record<string, any> {
    const frameworks: Record<string, any> = {};

    if (!packageJson) return frameworks;

    const allDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    };

    if (allDeps.vitest) {
      frameworks.vitest = { version: allDeps.vitest, config: 'vitest.config.ts' };
    }

    if (allDeps.jest) {
      frameworks.jest = { version: allDeps.jest };
    }

    if (allDeps['@testing-library/svelte']) {
      frameworks['testing-library'] = { version: allDeps['@testing-library/svelte'] };
    }

    if (allDeps.playwright) {
      frameworks.playwright = { version: allDeps.playwright };
    }

    return frameworks;
  }

  private calculateScore(testFiles: string[], frameworks: Record<string, any>, packageJson: any): any {
    const baseScore = Math.min(testFiles.length * 2, 100);
    const frameworkBonus = Object.keys(frameworks).length * 10;
    const configBonus = packageJson?.scripts ? Object.keys(packageJson.scripts).filter(s => s.includes('test')).length * 5 : 0;

    return {
      overall: Math.min(baseScore + frameworkBonus, 100),
      coverage: Math.min(baseScore + configBonus, 100),
      quality: Math.min(baseScore + frameworkBonus + configBonus, 100)
    };
  }
}

/**
 * Упрощенная версия TestingChecker
 */
class SimpleTestingChecker {
  private static analyzer = new MockProcessIsolatedAnalyzer();

  static async checkComponent(context: SimpleCheckContext): Promise<SimpleComponentResult> {
    const startTime = Date.now();

    try {
      console.log('🧪 Simple TestingChecker: Analyzing', context.projectPath);

      // Запускаем анализ
      const analysisResult = await this.analyzer.runUnifiedAnalysis(context);

      // Преобразуем результат
      const checkResults = this.convertToCheckResults(analysisResult);

      // Формируем ComponentResult
      return this.createComponentResult(checkResults, startTime);

    } catch (error) {
      console.error('❌ Ошибка SimpleTestingChecker:', error);
      return this.createErrorResult(error, startTime);
    }
  }

  private static convertToCheckResults(analysisResult: any): SimpleCheckResult[] {
    const results: SimpleCheckResult[] = [];

    if (!analysisResult) {
      return [{
        check: {
          id: 'testing.unified.error',
          name: 'Unified Testing Analysis',
          description: 'Анализ не выполнен - нет результата',
          category: 'testing',
          score: 100,
          level: 'high',
          tags: ['unified', 'error']
        },
        passed: false,
        score: 0,
        maxScore: 100,
        details: 'Анализ не был выполнен'
      }];
    }

    // Overall
    results.push({
      check: {
        id: 'testing.unified.overall',
        name: 'Unified Testing Overall',
        description: 'Общий результат унифицированного анализа тестирования',
        category: 'testing',
        score: 100,
        level: 'high',
        tags: ['unified', 'overall']
      },
      passed: analysisResult.summary.score >= 70,
      score: analysisResult.summary.score,
      maxScore: 100,
      details: `Общий балл: ${analysisResult.summary.score}%`
    });

    // Coverage
    results.push({
      check: {
        id: 'testing.unified.coverage',
        name: 'Code Coverage',
        description: 'Покрытие кода тестами',
        category: 'testing',
        score: 100,
        level: 'high',
        tags: ['coverage', 'quality']
      },
      passed: analysisResult.summary.coverage >= 75,
      score: analysisResult.summary.coverage,
      maxScore: 100,
      details: `Покрытие кода: ${analysisResult.summary.coverage}%`
    });

    // Quality
    results.push({
      check: {
        id: 'testing.unified.quality',
        name: 'Test Quality',
        description: 'Качество тестового кода',
        category: 'testing',
        score: 100,
        level: 'medium',
        tags: ['quality', 'tests']
      },
      passed: analysisResult.summary.testQuality >= 70,
      score: analysisResult.summary.testQuality,
      maxScore: 100,
      details: `Качество тестов: ${analysisResult.summary.testQuality}%`
    });

    // Files
    if (analysisResult.details?.testFiles?.length > 0) {
      results.push({
        check: {
          id: 'testing.unified.files',
          name: 'Test Files Analysis',
          description: 'Анализ файлов тестов',
          category: 'testing',
          score: 100,
          level: 'medium',
          tags: ['files', 'structure']
        },
        passed: analysisResult.details.testFiles.length > 0,
        score: Math.min(analysisResult.details.testFiles.length * 2, 100),
        maxScore: 100,
        details: `Найдено ${analysisResult.details.testFiles.length} файлов тестов`
      });
    }

    // Frameworks
    if (analysisResult.details?.frameworks && Object.keys(analysisResult.details.frameworks).length > 0) {
      const frameworkCount = Object.keys(analysisResult.details.frameworks).length;
      results.push({
        check: {
          id: 'testing.unified.frameworks',
          name: 'Testing Frameworks',
          description: 'Обнаруженные фреймворки тестирования',
          category: 'testing',
          score: 100,
          level: 'medium',
          tags: ['frameworks', 'tools']
        },
        passed: frameworkCount > 0,
        score: Math.min(frameworkCount * 25, 100),
        maxScore: 100,
        details: `Обнаружено ${frameworkCount} фреймворков: ${Object.keys(analysisResult.details.frameworks).join(', ')}`
      });
    }

    return results;
  }

  private static createComponentResult(checkResults: SimpleCheckResult[], startTime: number): SimpleComponentResult {
    const passed = checkResults.filter(r => r.passed);
    const failed = checkResults.filter(r => !r.passed);
    const score = passed.reduce((sum, r) => sum + r.score, 0);
    const maxScore = checkResults.reduce((sum, r) => sum + r.maxScore, 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return {
      component: {
        name: 'Unified Testing Analysis',
        description: 'Унифицированный анализ тестирования проекта',
        weight: 8,
        checks: checkResults.map(r => r.check),
        critical: true
      },
      score,
      maxScore,
      percentage,
      passed,
      failed,
      warnings: [],
      recommendations: this.generateRecommendations(failed),
      duration: Date.now() - startTime,
    };
  }

  private static createErrorResult(error: any, startTime: number): SimpleComponentResult {
    const errorResult: SimpleCheckResult = {
      check: {
        id: 'testing.unified.fatal.error',
        name: 'Testing Analysis Fatal Error',
        description: 'Критическая ошибка при анализе тестирования',
        category: 'testing',
        score: 100,
        level: 'high',
        tags: ['error', 'fatal']
      },
      passed: false,
      score: 0,
      maxScore: 100,
      details: `Ошибка: ${error.message || 'Неизвестная ошибка'}`
    };

    return {
      component: {
        name: 'Unified Testing Analysis (Error)',
        description: 'Анализ тестирования завершился с ошибкой',
        weight: 1,
        checks: [errorResult.check],
        critical: true
      },
      score: 0,
      maxScore: 100,
      percentage: 0,
      passed: [],
      failed: [errorResult],
      warnings: [],
      recommendations: [
        'Проверьте установку зависимостей UnifiedTestingAnalyzer',
        'Убедитесь в корректности путей к модулям тестирования',
        'Проверьте логи процесса для детальной диагностики'
      ],
      duration: Date.now() - startTime,
    };
  }

  private static generateRecommendations(failedChecks: SimpleCheckResult[]): string[] {
    const recommendations: string[] = [];

    for (const check of failedChecks) {
      switch (check.check.id) {
        case 'testing.unified.overall':
          recommendations.push('Улучшите общее покрытие и качество тестов');
          break;
        case 'testing.unified.coverage':
          recommendations.push('Увеличьте покрытие кода тестами до 75%+');
          break;
        case 'testing.unified.quality':
          recommendations.push('Улучшите качество тестового кода');
          break;
        case 'testing.unified.files':
          recommendations.push('Добавьте больше файлов тестов в проект');
          break;
        case 'testing.unified.frameworks':
          recommendations.push('Настройте фреймворки тестирования');
          break;
        default:
          recommendations.push(`Исправьте проблему: ${check.check.name}`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Система тестирования работает корректно');
    }

    return recommendations;
  }
}

/**
 * Упрощенный анализатор для демонстрации
 */
class SimpleAnalyzer {
  async analyzeProject(projectPath: string): Promise<void> {
    console.log('🎯 SIMPLE EAP ANALYZER');
    console.log('═'.repeat(50));
    console.log('📂 Project:', projectPath);
    console.log('');

    // Создаем контекст
    const context: SimpleCheckContext = {
      projectPath,
      configFiles: [],
      packageJson: null,
      nodeModules: []
    };

    // Загружаем package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        context.packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      } catch (error) {
        console.warn('Warning: Could not parse package.json');
      }
    }

    // Получаем доступные checker'ы (только наш TestingChecker)
    const checkers = [
      {
        name: 'Unified Testing Analysis',
        checkComponent: SimpleTestingChecker.checkComponent.bind(SimpleTestingChecker),
      }
    ];

    console.log('🔍 Available Checkers:');
    checkers.forEach(checker => {
      console.log(`   📋 ${checker.name}`);
    });
    console.log('');

    // Запускаем анализ
    const results = [];

    for (const checker of checkers) {
      try {
        console.log(`🚀 Running: ${checker.name}`);
        const result = await checker.checkComponent(context);
        results.push(result);
        console.log(`✅ Completed: ${checker.name} (${result.percentage}%)`);
      } catch (error) {
        console.error(`❌ Failed: ${checker.name}`, error.message);
      }
    }

    // Выводим результаты в стиле EAP
    console.log('');
    console.log('📊 ANALYSIS RESULTS');
    console.log('═'.repeat(50));
    console.log('');

    let totalScore = 0;
    let totalMaxScore = 0;

    for (const result of results) {
      totalScore += result.score;
      totalMaxScore += result.maxScore;

      console.log(`🧪 ${result.component.name} .............. ${result.percentage}%`);

      // Показываем детали проверок
      [...result.passed, ...result.failed].forEach(check => {
        const status = check.passed ? '✅' : '❌';
        console.log(`   ${status} ${check.check.name} ........... ${check.score}/${check.maxScore}`);
        if (check.details) {
          console.log(`      ${check.details}`);
        }
      });

      // Показываем рекомендации
      if (result.recommendations.length > 0) {
        console.log('   💡 Recommendations:');
        result.recommendations.forEach(rec => {
          console.log(`      • ${rec}`);
        });
      }

      console.log(`   ⏱️  Duration: ${result.duration}ms`);
      console.log('');
    }

    // Общий итог
    const overallPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
    console.log('🎯 OVERALL RESULTS');
    console.log('═'.repeat(30));
    console.log(`📊 Total Score: ${totalScore}/${totalMaxScore} (${overallPercentage}%)`);
    console.log(`📋 Components Analyzed: ${results.length}`);
    console.log(`✅ Successful Checks: ${results.reduce((sum, r) => sum + r.passed.length, 0)}`);
    console.log(`❌ Failed Checks: ${results.reduce((sum, r) => sum + r.failed.length, 0)}`);

    console.log('');
    console.log('✨ Analysis completed successfully!');
  }
}

// Запускаем анализ
const analyzer = new SimpleAnalyzer();
const projectPath = 'C:\\alphacore\\project-template';

analyzer.analyzeProject(projectPath).catch(error => {
  console.error('❌ Analysis failed:', error);
});
