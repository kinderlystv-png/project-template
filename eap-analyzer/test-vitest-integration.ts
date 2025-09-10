/**
 * Тестирование интеграции VitestChecker с AnalysisOrchestrator
 */

import { AnalysisOrchestrator } from './src/core/orchestrator.js';
import { VitestChecker } from './src/checkers/testing/checkers/VitestChecker.js';
import { Project } from './src/types/Project.js';

async function testVitestIntegration() {
  console.log('🔍 Тестирование интеграции VitestChecker с AnalysisOrchestrator\n');

  // 1. Создаем AnalysisOrchestrator
  const orchestrator = new AnalysisOrchestrator(2); // 2 потока

  // 2. Создаем и регистрируем VitestChecker
  const vitestChecker = new VitestChecker();
  orchestrator.registerChecker('vitest-testing', vitestChecker);

  console.log('✅ VitestChecker зарегистрирован в AnalysisOrchestrator\n');

  // 3. Создаем тестовый проект
  const testProject: Project = {
    name: 'test-project',
    path: process.cwd(), // Текущий проект
    version: '1.0.0',
    dependencies: {},
    devDependencies: {},
    files: [],
  };

  try {
    // 4. Тестируем прямой вызов VitestChecker
    console.log('🧪 Тестирование прямого вызова VitestChecker...');
    const directResults = await vitestChecker.check(testProject);

    console.log(`📊 Получено результатов: ${directResults.length}`);
    directResults.forEach((result, index) => {
      console.log(
        `   ${index + 1}. ${result.name}: ${result.passed ? '✅' : '❌'} (${result.score}/${result.maxScore})`
      );
      console.log(`      ${result.description}`);
      if (result.details?.recommendations && result.details.recommendations.length > 0) {
        console.log(`      💡 Рекомендации: ${result.details.recommendations.join(', ')}`);
      }
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // 5. Тестируем через AnalysisOrchestrator
    console.log('🎭 Тестирование через AnalysisOrchestrator...');
    const fullAnalysis = await orchestrator.analyzeProject(testProject.path, false);

    console.log(`📋 Общее количество результатов: ${fullAnalysis.checkResults.length}`);

    // Фильтруем результаты от VitestChecker
    const vitestResults = fullAnalysis.checkResults.filter(
      result => result.id?.startsWith('vitest-') || result.category === 'Testing'
    );

    console.log(`🔧 Результаты от VitestChecker: ${vitestResults.length}`);
    vitestResults.forEach((result, index) => {
      console.log(
        `   ${index + 1}. ${result.name}: ${result.passed ? '✅' : '❌'} (${result.score}/${result.maxScore})`
      );
      console.log(`      Категория: ${result.category}, Важность: ${result.severity}`);
    });

    // 6. Проверяем совместимость результатов
    console.log('\n📊 Анализ совместимости:');
    console.log(`   - Прямой вызов: ${directResults.length} результатов`);
    console.log(`   - Через Orchestrator: ${vitestResults.length} результатов`);

    const compatible = directResults.length === vitestResults.length;
    console.log(`   - Совместимость: ${compatible ? '✅ Да' : '❌ Нет'}`);

    if (compatible) {
      console.log('\n🎉 УСПЕХ: VitestChecker успешно интегрирован с AnalysisOrchestrator!');
    } else {
      console.log('\n⚠️  ВНИМАНИЕ: Обнаружены различия в результатах');
    }

    // 7. Тестируем типы результатов
    console.log('\n🔍 Анализ типов результатов:');
    const resultTypes = new Set(directResults.map(r => typeof r.passed));
    const severityTypes = new Set(directResults.map(r => r.severity));

    console.log(`   - Типы passed: ${Array.from(resultTypes).join(', ')}`);
    console.log(`   - Уровни важности: ${Array.from(severityTypes).join(', ')}`);

    // Проверяем обязательные поля
    const hasRequiredFields = directResults.every(
      r =>
        r.id &&
        r.name &&
        r.description !== undefined &&
        typeof r.passed === 'boolean' &&
        typeof r.score === 'number' &&
        typeof r.maxScore === 'number'
    );

    console.log(`   - Все обязательные поля: ${hasRequiredFields ? '✅' : '❌'}`);
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
    if (error instanceof Error) {
      console.error('   Сообщение:', error.message);
      console.error('   Стек:', error.stack);
    }
  }
}

// Запускаем тест
testVitestIntegration().catch(console.error);
