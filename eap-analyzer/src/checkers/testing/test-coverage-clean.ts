/**
 * Тест CoverageAnalyzerAdapter - анализатор покрытия кода
 */

import { CoverageAnalyzerAdapter } from './checkers/CoverageAnalyzerAdapter.js';
import { SimpleOrchestrator } from './SimpleOrchestrator.js';

interface TestResult {
  name: string;
  passed: boolean;
  score: number;
  message: string;
  details?: any;
  recommendations?: string[];
}

/**
 * Тестирует CoverageAnalyzerAdapter напрямую и через SimpleOrchestrator
 */
async function testCoverageAnalyzer() {
  console.log('\n🔍 Тестирование CoverageAnalyzerAdapter...\n');

  const projectPath = 'C:/alphacore/project-template';
  const analyzer = new CoverageAnalyzerAdapter();

  // Создаем контекст для тестирования
  const context = {
    projectPath,
    additionalData: {},
  };

  let directResult: TestResult;
  let orchestratorResult: TestResult;

  // Тест 1: Прямой вызов анализатора
  console.log('🧪 Тест 1: Прямой вызов CoverageAnalyzerAdapter');
  try {
    const result = await analyzer.check(context);
    directResult = {
      name: 'CoverageAnalyzer Direct',
      passed: result.passed,
      score: result.score,
      message: result.message,
      details: result.details,
      recommendations: result.recommendations,
    };

    console.log(`✅ Результат: ${result.passed ? 'УСПЕХ' : 'НЕУДАЧА'}`);
    console.log(`📊 Оценка: ${result.score}/100`);
    console.log(`📝 Сообщение: ${result.message}`);

    if (result.details) {
      console.log('📋 Детали:');
      console.log(`   • Отчет найден: ${result.details.hasReport ? 'да' : 'нет'}`);
      if (result.details.hasReport) {
        console.log(`   • Тип отчета: ${result.details.reportType}`);
        console.log(`   • Общее покрытие: ${result.details.overall}%`);
        console.log(`   • Покрытие строк: ${result.details.lines}%`);
        console.log(`   • Покрытие веток: ${result.details.branches}%`);
        console.log(`   • Покрытие функций: ${result.details.functions}%`);
        console.log(`   • Конфигурация: ${result.details.configPresent ? 'есть' : 'нет'}`);
      } else {
        console.log(`   • Искали в: ${result.details.searchedPaths?.join(', ')}`);
        console.log(`   • Причина: ${result.details.reason}`);
      }
    }

    if (result.recommendations && result.recommendations.length > 0) {
      console.log('💡 Рекомендации:');
      result.recommendations.forEach((rec: string) => console.log(`   • ${rec}`));
    }
  } catch (error) {
    directResult = {
      name: 'CoverageAnalyzer Direct',
      passed: false,
      score: 0,
      message: `Ошибка: ${error instanceof Error ? error.message : String(error)}`,
    };
    console.log(`❌ Ошибка при прямом вызове: ${directResult.message}`);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Тест 2: Вызов через SimpleOrchestrator
  console.log('🧪 Тест 2: Вызов через SimpleOrchestrator');
  try {
    const orchestrator = new SimpleOrchestrator();

    // Регистрируем только CoverageAnalyzerAdapter
    orchestrator.registerChecker('coverage-analyzer', analyzer);

    console.log('📋 Зарегистрированные чекеры:', orchestrator.getRegisteredCheckers());

    const result = await orchestrator.analyzeProject(projectPath);

    if (Object.keys(result.checks).length === 0) {
      orchestratorResult = {
        name: 'CoverageAnalyzer Orchestrator',
        passed: false,
        score: 0,
        message: 'Результаты не получены от оркестратора',
      };
    } else {
      const checkResult = result.checks['coverage-analyzer']; // Берем результат coverage-analyzer
      orchestratorResult = {
        name: 'CoverageAnalyzer Orchestrator',
        passed: checkResult.passed,
        score: checkResult.score,
        message: checkResult.message,
        details: checkResult.details,
        recommendations: checkResult.recommendations,
      };
    }
    console.log(`✅ Результат: ${orchestratorResult.passed ? 'УСПЕХ' : 'НЕУДАЧА'}`);
    console.log(`📊 Оценка: ${orchestratorResult.score}/100`);
    console.log(`📝 Сообщение: ${orchestratorResult.message}`);

    if (orchestratorResult.details) {
      console.log('📋 Детали через оркестратор:');
      console.log(`   • Отчет найден: ${orchestratorResult.details.hasReport ? 'да' : 'нет'}`);
      if (orchestratorResult.details.hasReport) {
        console.log(`   • Тип отчета: ${orchestratorResult.details.reportType}`);
        console.log(`   • Общее покрытие: ${orchestratorResult.details.overall}%`);
      }
    }
  } catch (error) {
    orchestratorResult = {
      name: 'CoverageAnalyzer Orchestrator',
      passed: false,
      score: 0,
      message: `Ошибка оркестратора: ${error instanceof Error ? error.message : String(error)}`,
    };
    console.log(`❌ Ошибка в оркестраторе: ${orchestratorResult.message}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Сравнение результатов
  console.log('📊 СРАВНЕНИЕ РЕЗУЛЬТАТОВ:');
  console.log('─'.repeat(60));
  console.log(`Метод                  | Успех | Оценка | Совпадение`);
  console.log('─'.repeat(60));
  console.log(
    `Прямой вызов          | ${directResult.passed ? '✅' : '❌'}    | ${directResult.score.toString().padStart(3)}    | -`
  );
  console.log(
    `Через оркестратор     | ${orchestratorResult.passed ? '✅' : '❌'}    | ${orchestratorResult.score.toString().padStart(3)}    | ${directResult.score === orchestratorResult.score ? '✅' : '❌'}`
  );
  console.log('─'.repeat(60));

  // Проверка совпадения
  const scoresMatch = directResult.score === orchestratorResult.score;
  const statusMatch = directResult.passed === orchestratorResult.passed;

  if (scoresMatch && statusMatch) {
    console.log('🎉 РЕЗУЛЬТАТ: Полное совпадение - интеграция работает корректно!');
  } else {
    console.log('⚠️  РЕЗУЛЬТАТ: Есть расхождения в результатах');
    if (!scoresMatch) {
      console.log(`   • Оценки не совпадают: ${directResult.score} vs ${orchestratorResult.score}`);
    }
    if (!statusMatch) {
      console.log(
        `   • Статусы не совпадают: ${directResult.passed} vs ${orchestratorResult.passed}`
      );
    }
  }

  console.log('\n🔍 АНАЛИЗ ПОКРЫТИЯ:');
  if (directResult.details?.hasReport) {
    console.log('✅ Отчеты покрытия найдены и проанализированы');
    console.log(
      `📈 Метрики покрытия: общее ${directResult.details.overall}%, строки ${directResult.details.lines}%, ветки ${directResult.details.branches}%`
    );
  } else {
    console.log('⚠️  Отчеты покрытия не найдены');
    console.log('💡 Для генерации отчетов запустите: npm run test:coverage');
  }

  return {
    directResult,
    orchestratorResult,
    scoresMatch,
    statusMatch,
    success: scoresMatch && statusMatch,
  };
}

// Запуск тестирования
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  testCoverageAnalyzer()
    .then(results => {
      console.log(`\n🏁 Тестирование завершено: ${results.success ? 'УСПЕХ' : 'ОШИБКА'}`);
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Критическая ошибка тестирования:', error);
      process.exit(1);
    });
}

export { testCoverageAnalyzer };
