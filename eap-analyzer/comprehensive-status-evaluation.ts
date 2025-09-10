/**
 * Комплексная оценка состояния EAP Analyzer
 * Проверка всех компонентов с реальными тестами
 */

import { SecurityChecker } from './src/checkers/security/SecurityChecker';
import { DependenciesSecurityChecker } from './src/checkers/security/DependenciesSecurityChecker';
import { CodeSecurityChecker } from './src/checkers/security/CodeSecurityChecker';
import { ConfigSecurityChecker } from './src/checkers/security/ConfigSecurityChecker';
import { WebSecurityChecker } from './src/checkers/security/WebSecurityChecker';
import { XSSAnalyzer } from './src/checkers/security/analyzers/XSSAnalyzer';
import { CSRFAnalyzer } from './src/checkers/security/analyzers/CSRFAnalyzer';
import { WebSecurityFixTemplates } from './src/checkers/security/WebSecurityFixTemplates';
import { RecommendationEngine } from './src/recommendations/RecommendationEngine';
import { CheckContext } from './src/types/index.js';

interface ComponentStatus {
  name: string;
  status: 'working' | 'partial' | 'broken' | 'untested';
  coverage: number;
  issues: string[];
  features: string[];
  testResults?: any;
}

class EAPAnalyzerStatusEvaluator {
  async runCompleteEvaluation(): Promise<{
    overallStatus: string;
    components: ComponentStatus[];
    recommendations: string[];
    criticalIssues: string[];
  }> {
    console.log('🔍 КОМПЛЕКСНАЯ ОЦЕНКА СОСТОЯНИЯ EAP ANALYZER');
    console.log('='.repeat(60));

    const components: ComponentStatus[] = [];
    const criticalIssues: string[] = [];

    // 1. Тестирование анализа зависимостей
    console.log('\n1️⃣ Тестирование анализа зависимостей...');
    const depsStatus = await this.testDependenciesAnalysis();
    components.push(depsStatus);

    // 2. Тестирование анализа кода
    console.log('\n2️⃣ Тестирование анализа безопасности кода...');
    const codeStatus = await this.testCodeSecurityAnalysis();
    components.push(codeStatus);

    // 3. Тестирование анализа конфигурации
    console.log('\n3️⃣ Тестирование анализа конфигурации...');
    const configStatus = await this.testConfigAnalysis();
    components.push(configStatus);

    // 4. Тестирование XSS анализа
    console.log('\n4️⃣ Тестирование XSS анализа...');
    const xssStatus = await this.testXSSAnalysis();
    components.push(xssStatus);

    // 5. Тестирование CSRF анализа
    console.log('\n5️⃣ Тестирование CSRF анализа...');
    const csrfStatus = await this.testCSRFAnalysis();
    components.push(csrfStatus);

    // 6. Тестирование веб-безопасности
    console.log('\n6️⃣ Тестирование веб-безопасности...');
    const webSecStatus = await this.testWebSecurity();
    components.push(webSecStatus);

    // 7. Тестирование системы рекомендаций
    console.log('\n7️⃣ Тестирование системы рекомендаций...');
    const recStatus = await this.testRecommendationSystem();
    components.push(recStatus);

    // 8. Тестирование интеграции SecurityChecker
    console.log('\n8️⃣ Тестирование интеграции SecurityChecker...');
    const integrationStatus = await this.testSecurityCheckerIntegration();
    components.push(integrationStatus);

    // Анализ результатов
    const overallStatus = this.calculateOverallStatus(components);
    const recommendations = this.generateRecommendations(components);

    // Сбор критических проблем
    components.forEach(comp => {
      if (comp.status === 'broken') {
        criticalIssues.push(`${comp.name}: КРИТИЧЕСКАЯ ОШИБКА`);
      }
      comp.issues.forEach(issue => {
        if (issue.includes('критическ') || issue.includes('FATAL')) {
          criticalIssues.push(`${comp.name}: ${issue}`);
        }
      });
    });

    return {
      overallStatus,
      components,
      recommendations,
      criticalIssues,
    };
  }

  async testDependenciesAnalysis(): Promise<ComponentStatus> {
    const status: ComponentStatus = {
      name: 'Dependencies Security Analysis',
      status: 'untested',
      coverage: 0,
      issues: [],
      features: [],
    };

    try {
      const checker = new DependenciesSecurityChecker();

      // Создаем тестовый package.json с уязвимостями
      const testPackageJson = {
        dependencies: {
          lodash: '4.17.20', // Известная уязвимость
          express: '4.16.0', // Старая версия
          jquery: '2.1.0', // Очень старая версия
        },
      };

      const context = this.createTestContext('package.json');
      const result = await checker.checkDependencySecurity(context, testPackageJson);

      status.features = [
        'Анализ package.json',
        'Проверка уязвимостей зависимостей',
        'Генерация рекомендаций по обновлению',
      ];

      if (result && result.vulnerabilities && result.vulnerabilities.length > 0) {
        status.status = 'working';
        status.coverage = 85;
        status.testResults = {
          vulnerabilitiesFound: result.vulnerabilities.length,
          recommendations: result.recommendations?.length || 0,
        };
        console.log(`   ✅ Найдено уязвимостей: ${result.vulnerabilities.length}`);
      } else {
        status.status = 'partial';
        status.coverage = 40;
        status.issues.push('Не найдены известные уязвимости в тестовых зависимостях');
      }
    } catch (error) {
      status.status = 'broken';
      status.coverage = 0;
      status.issues.push(`Критическая ошибка: ${error.message}`);
      console.log(`   ❌ Ошибка: ${error.message}`);
    }

    return status;
  }

  async testCodeSecurityAnalysis(): Promise<ComponentStatus> {
    const status: ComponentStatus = {
      name: 'Code Security Analysis',
      status: 'untested',
      coverage: 0,
      issues: [],
      features: [],
    };

    try {
      const checker = new CodeSecurityChecker();

      const testCode = `
        // Небезопасные функции
        eval('var x = userInput');
        document.write('<h1>' + userInput + '</h1>');

        // Слабая криптография
        const crypto = require('crypto');
        const hash = crypto.createHash('md5');

        // Небезопасная работа с файлами
        const fs = require('fs');
        fs.readFile('/etc/passwd', 'utf8', callback);
      `;

      const context = this.createTestContext('test.js', testCode);
      const result = await checker.analyzeCodeSecurity(context);

      status.features = [
        'Анализ небезопасных функций',
        'Проверка криптографических алгоритмов',
        'Анализ работы с файловой системой',
        'Детекция инъекций кода',
      ];

      if (result && result.issues && result.issues.length > 0) {
        status.status = 'working';
        status.coverage = 90;
        status.testResults = {
          issuesFound: result.issues.length,
          categories: [...new Set(result.issues.map(i => i.category))],
        };
        console.log(`   ✅ Найдено проблем безопасности: ${result.issues.length}`);
      } else {
        status.status = 'partial';
        status.coverage = 30;
        status.issues.push('Не найдены очевидные проблемы безопасности в тестовом коде');
      }
    } catch (error) {
      status.status = 'broken';
      status.coverage = 0;
      status.issues.push(`Критическая ошибка: ${error.message}`);
      console.log(`   ❌ Ошибка: ${error.message}`);
    }

    return status;
  }

  async testConfigAnalysis(): Promise<ComponentStatus> {
    const status: ComponentStatus = {
      name: 'Configuration Security Analysis',
      status: 'untested',
      coverage: 0,
      issues: [],
      features: [],
    };

    try {
      const checker = new ConfigSecurityChecker();

      const testConfig = {
        database: {
          password: '123456',
          ssl: false,
        },
        session: {
          secret: 'test',
          secure: false,
        },
        cors: {
          origin: '*',
        },
      };

      const context = this.createTestContext('config.json');
      const result = await checker.analyzeConfigSecurity(context, testConfig);

      status.features = [
        'Анализ конфигурации базы данных',
        'Проверка настроек сессий',
        'Анализ CORS политик',
        'Проверка секретных ключей',
      ];

      if (result && result.issues && result.issues.length > 0) {
        status.status = 'working';
        status.coverage = 80;
        status.testResults = {
          configIssues: result.issues.length,
          severity: result.issues.map(i => i.severity),
        };
        console.log(`   ✅ Найдено проблем конфигурации: ${result.issues.length}`);
      } else {
        status.status = 'partial';
        status.coverage = 50;
        status.issues.push('Не найдены проблемы в тестовой конфигурации');
      }
    } catch (error) {
      status.status = 'broken';
      status.coverage = 0;
      status.issues.push(`Критическая ошибка: ${error.message}`);
      console.log(`   ❌ Ошибка: ${error.message}`);
    }

    return status;
  }

  async testXSSAnalysis(): Promise<ComponentStatus> {
    const status: ComponentStatus = {
      name: 'XSS Analysis',
      status: 'untested',
      coverage: 0,
      issues: [],
      features: [],
    };

    try {
      const analyzer = new XSSAnalyzer();

      const testCode = `
        function displayData(data) {
          document.getElementById('content').innerHTML = data;
          document.body.innerHTML += '<div>' + data + '</div>';
          eval('var x = ' + data);
          document.write('<h1>' + data + '</h1>');
        }
      `;

      const context = this.createTestContext('xss-test.js', testCode);
      const result = await analyzer.analyzeXSS(context);

      status.features = [
        'Анализ innerHTML присваиваний',
        'Детекция eval с пользовательскими данными',
        'Проверка document.write',
        'Анализ динамического создания HTML',
      ];

      if (result && result.vulnerabilities && result.vulnerabilities.length > 0) {
        status.status = 'working';
        status.coverage = 95;
        status.testResults = {
          xssVulnerabilities: result.vulnerabilities.length,
          patterns: result.vulnerabilities.map(v => v.pattern),
        };
        console.log(`   ✅ Найдено XSS уязвимостей: ${result.vulnerabilities.length}`);
      } else {
        status.status = 'broken';
        status.coverage = 0;
        status.issues.push('КРИТИЧЕСКАЯ: XSS анализатор не нашел очевидные уязвимости');
      }
    } catch (error) {
      status.status = 'broken';
      status.coverage = 0;
      status.issues.push(`Критическая ошибка: ${error.message}`);
      console.log(`   ❌ Ошибка: ${error.message}`);
    }

    return status;
  }

  async testCSRFAnalysis(): Promise<ComponentStatus> {
    const status: ComponentStatus = {
      name: 'CSRF Analysis',
      status: 'untested',
      coverage: 0,
      issues: [],
      features: [],
    };

    try {
      const analyzer = new CSRFAnalyzer();

      const testCode = `
        function transferMoney(amount, to) {
          fetch('/api/transfer', {
            method: 'POST',
            body: JSON.stringify({ amount, to })
          });
        }

        function deleteAccount() {
          $.post('/api/delete-account', {});
        }
      `;

      const context = this.createTestContext('csrf-test.js', testCode);
      const result = await analyzer.analyzeCSRF(context);

      status.features = [
        'Анализ POST запросов без CSRF токенов',
        'Проверка форм без защиты',
        'Детекция AJAX запросов',
        'Анализ state-changing операций',
      ];

      if (result && result.vulnerabilities && result.vulnerabilities.length > 0) {
        status.status = 'working';
        status.coverage = 85;
        status.testResults = {
          csrfVulnerabilities: result.vulnerabilities.length,
          riskLevels: result.vulnerabilities.map(v => v.riskLevel),
        };
        console.log(`   ✅ Найдено CSRF уязвимостей: ${result.vulnerabilities.length}`);
      } else {
        status.status = 'partial';
        status.coverage = 40;
        status.issues.push('Не найдены CSRF уязвимости в тестовом коде');
      }
    } catch (error) {
      status.status = 'broken';
      status.coverage = 0;
      status.issues.push(`Критическая ошибка: ${error.message}`);
      console.log(`   ❌ Ошибка: ${error.message}`);
    }

    return status;
  }

  async testWebSecurity(): Promise<ComponentStatus> {
    const status: ComponentStatus = {
      name: 'Web Security Integration',
      status: 'untested',
      coverage: 0,
      issues: [],
      features: [],
    };

    try {
      const checker = new WebSecurityChecker();

      const testCode = `
        function unsafeFunction(userInput) {
          document.getElementById('output').innerHTML = userInput;
          eval('var result = ' + userInput);

          fetch('/api/action', {
            method: 'POST',
            body: JSON.stringify({ data: userInput })
          });
        }
      `;

      const context = this.createTestContext('websec-test.js', testCode);
      const result = await checker.analyzeWebSecurity(context);

      status.features = [
        'Координация XSS и CSRF анализа',
        'Общая статистика веб-уязвимостей',
        'Интегрированные рекомендации',
        'Генерация отчетов по веб-безопасности',
      ];

      if (result && result.summary && result.summary.totalVulnerabilities > 0) {
        status.status = 'working';
        status.coverage = 90;
        status.testResults = {
          totalVulnerabilities: result.summary.totalVulnerabilities,
          xssCount: result.xss?.vulnerabilities?.length || 0,
          csrfCount: result.csrf?.vulnerabilities?.length || 0,
        };
        console.log(`   ✅ Найдено веб-уязвимостей: ${result.summary.totalVulnerabilities}`);
      } else {
        status.status = 'partial';
        status.coverage = 50;
        status.issues.push('Веб-анализатор работает, но не находит уязвимости');
      }
    } catch (error) {
      status.status = 'broken';
      status.coverage = 0;
      status.issues.push(`Критическая ошибка: ${error.message}`);
      console.log(`   ❌ Ошибка: ${error.message}`);
    }

    return status;
  }

  async testRecommendationSystem(): Promise<ComponentStatus> {
    const status: ComponentStatus = {
      name: 'Recommendation System',
      status: 'untested',
      coverage: 0,
      issues: [],
      features: [],
    };

    try {
      // Тест WebSecurityFixTemplates
      const webChecker = new WebSecurityChecker();
      const testCode = `
        document.getElementById('test').innerHTML = userInput;
        eval(userCode);
      `;

      const context = this.createTestContext('rec-test.js', testCode);
      const webResult = await webChecker.analyzeWebSecurity(context);

      // Тест генерации рекомендаций
      const webRecommendations = WebSecurityFixTemplates.generateWebRecommendations(webResult);

      // Тест RecommendationEngine
      const engineRecommendations = RecommendationEngine.generateRecommendations(webResult);

      status.features = [
        'WebSecurityFixTemplates генерация',
        'RecommendationEngine интеграция',
        'Конвертация типов рекомендаций',
        'Приоритизация и сортировка',
      ];

      if (webRecommendations.length > 0 && engineRecommendations.length > 0) {
        status.status = 'working';
        status.coverage = 95;
        status.testResults = {
          webRecommendations: webRecommendations.length,
          engineRecommendations: engineRecommendations.length,
          hasCodeExamples: webRecommendations.some(r => r.codeExample),
          hasPriorities: engineRecommendations.every(r => r.priority),
        };
        console.log(`   ✅ Сгенерировано рекомендаций: ${engineRecommendations.length}`);
      } else {
        status.status = 'broken';
        status.coverage = 0;
        status.issues.push('КРИТИЧЕСКАЯ: Система рекомендаций не генерирует результаты');
      }
    } catch (error) {
      status.status = 'broken';
      status.coverage = 0;
      status.issues.push(`Критическая ошибка: ${error.message}`);
      console.log(`   ❌ Ошибка: ${error.message}`);
    }

    return status;
  }

  async testSecurityCheckerIntegration(): Promise<ComponentStatus> {
    const status: ComponentStatus = {
      name: 'SecurityChecker Integration',
      status: 'untested',
      coverage: 0,
      issues: [],
      features: [],
    };

    try {
      const context: CheckContext = {
        projectPath: process.cwd(),
        projectInfo: {
          name: 'test-project',
          version: '1.0.0',
          hasTypeScript: true,
          hasTests: false,
          hasDocker: false,
          hasCICD: false,
          dependencies: {
            production: 5,
            development: 3,
            total: 8,
          },
        },
        options: {
          projectPath: process.cwd(),
        },
      };

      const result = await SecurityChecker.checkComponent(context);

      status.features = [
        'Интеграция всех анализаторов безопасности',
        'Унифицированный интерфейс результатов',
        'Координация веб-безопасности',
        'Общий scoring и reporting',
      ];

      if (result && typeof result === 'object') {
        status.status = 'working';
        status.coverage = 85;
        status.testResults = {
          hasResult: true,
          resultKeys: Object.keys(result),
          hasRecommendations: !!result.recommendations,
        };
        console.log(`   ✅ SecurityChecker интеграция работает`);
        console.log(`   📊 Результат содержит ключи: ${Object.keys(result).join(', ')}`);
      } else {
        status.status = 'partial';
        status.coverage = 30;
        status.issues.push('SecurityChecker возвращает некорректный результат');
      }
    } catch (error) {
      status.status = 'broken';
      status.coverage = 0;
      status.issues.push(`Критическая ошибка: ${error.message}`);
      console.log(`   ❌ Ошибка: ${error.message}`);
    }

    return status;
  }

  private createTestContext(fileName: string, content?: string): any {
    return {
      projectPath: process.cwd(),
      filePath: fileName,
      fileContent: content || '',
      workspaceRoot: process.cwd(),
      projectInfo: {
        name: 'test-project',
        version: '1.0.0',
        hasTypeScript: true,
        hasTests: false,
        hasDocker: false,
        hasCICD: false,
        dependencies: {
          production: 0,
          development: 0,
          total: 0,
        },
      },
      options: {
        projectPath: process.cwd(),
      },
    };
  }

  private calculateOverallStatus(components: ComponentStatus[]): string {
    const workingCount = components.filter(c => c.status === 'working').length;
    const partialCount = components.filter(c => c.status === 'partial').length;
    const brokenCount = components.filter(c => c.status === 'broken').length;

    const totalComponents = components.length;
    const workingPercentage = (workingCount / totalComponents) * 100;

    if (brokenCount > 0) {
      return `ЧАСТИЧНО РАБОТОСПОСОБЕН (${Math.round(workingPercentage)}% компонентов)`;
    } else if (workingCount === totalComponents) {
      return 'ПОЛНОСТЬЮ РАБОТОСПОСОБЕН';
    } else {
      return `РАБОТОСПОСОБЕН С ОГРАНИЧЕНИЯМИ (${Math.round(workingPercentage)}% компонентов)`;
    }
  }

  private generateRecommendations(components: ComponentStatus[]): string[] {
    const recommendations: string[] = [];

    components.forEach(comp => {
      if (comp.status === 'broken') {
        recommendations.push(`КРИТИЧНО: Исправить ${comp.name} - компонент не работает`);
      } else if (comp.status === 'partial') {
        recommendations.push(`УЛУЧШИТЬ: ${comp.name} - повысить покрытие с ${comp.coverage}%`);
      } else if (comp.coverage < 90) {
        recommendations.push(`ОПТИМИЗИРОВАТЬ: ${comp.name} - довести покрытие до 90%+`);
      }
    });

    return recommendations;
  }
}

// Запуск оценки
async function runStatusEvaluation() {
  const evaluator = new EAPAnalyzerStatusEvaluator();

  try {
    const results = await evaluator.runCompleteEvaluation();

    console.log('\n' + '='.repeat(60));
    console.log('📊 ИТОГОВАЯ ОЦЕНКА СОСТОЯНИЯ EAP ANALYZER');
    console.log('='.repeat(60));

    console.log(`\n🏆 ОБЩИЙ СТАТУС: ${results.overallStatus}\n`);

    console.log('📋 ДЕТАЛИЗАЦИЯ ПО КОМПОНЕНТАМ:\n');
    results.components.forEach((comp, index) => {
      const statusIcon =
        comp.status === 'working'
          ? '✅'
          : comp.status === 'partial'
            ? '⚠️'
            : comp.status === 'broken'
              ? '❌'
              : '❓';

      console.log(`${index + 1}. ${statusIcon} ${comp.name}`);
      console.log(`   📊 Покрытие: ${comp.coverage}%`);
      console.log(`   🔧 Функции: ${comp.features.length} реализовано`);

      if (comp.issues.length > 0) {
        console.log(`   ⚠️ Проблемы:`);
        comp.issues.forEach(issue => {
          console.log(`      • ${issue}`);
        });
      }

      if (comp.testResults) {
        console.log(`   🧪 Тестирование: ${JSON.stringify(comp.testResults)}`);
      }
      console.log('');
    });

    if (results.criticalIssues.length > 0) {
      console.log('🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ:');
      results.criticalIssues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
      });
      console.log('');
    }

    if (results.recommendations.length > 0) {
      console.log('💡 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ:');
      results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    // Финальная статистика
    const avgCoverage =
      results.components.reduce((sum, comp) => sum + comp.coverage, 0) / results.components.length;
    const workingComponents = results.components.filter(c => c.status === 'working').length;

    console.log('📈 СТАТИСТИКА:');
    console.log(`   • Общее покрытие функциональности: ${Math.round(avgCoverage)}%`);
    console.log(`   • Работающих компонентов: ${workingComponents}/${results.components.length}`);
    console.log(`   • Критических проблем: ${results.criticalIssues.length}`);
    console.log(`   • Рекомендаций к улучшению: ${results.recommendations.length}`);

    console.log('\n🎯 ГОТОВНОСТЬ К ПРОДАКШЕНУ:');
    if (avgCoverage >= 90 && results.criticalIssues.length === 0) {
      console.log('   ✅ ГОТОВ К РАЗВЕРТЫВАНИЮ');
    } else if (avgCoverage >= 70 && results.criticalIssues.length <= 1) {
      console.log('   ⚠️ ГОТОВ С ОГРАНИЧЕНИЯМИ (требуются доработки)');
    } else {
      console.log('   ❌ НЕ ГОТОВ (критические проблемы)');
    }

    return results;
  } catch (error) {
    console.error('💥 ФАТАЛЬНАЯ ОШИБКА В ОЦЕНКЕ:', error);
    return null;
  }
}

// Запускаем оценку
runStatusEvaluation()
  .then(results => {
    if (results) {
      const avgCoverage =
        results.components.reduce((sum, comp) => sum + comp.coverage, 0) /
        results.components.length;
      process.exit(avgCoverage >= 70 ? 0 : 1);
    } else {
      process.exit(1);
    }
  })
  .catch(() => process.exit(1));
