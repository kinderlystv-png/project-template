/**
 * Тест UnifiedTestingAnalyzer - Phase 3
 * Комплексный анализ всей тестовой экосистемы проекта
 */

import { UnifiedTestingAnalyzer } from './src/checkers/testing/UnifiedTestingAnalyzerJS.js';
import * as path from 'path';

async function testUnifiedTestingAnalyzer() {
  const startTime = Date.now();

  console.log('🎯 PHASE 3: UNIFIED TESTING ANALYZER');
  console.log('=====================================');
  console.log('🔍 Запуск комплексного анализа тестовой экосистемы...');
  console.log('');

  try {
    // Путь к проекту
    const projectPath = process.cwd();
    console.log(`📁 Анализируемый проект: ${projectPath}`);
    console.log('');

    // Создаем анализатор
    const analyzer = new UnifiedTestingAnalyzer();

    // Запускаем анализ
    console.log('⚡ Начинаю анализ...');
    const analysis = await analyzer.analyze(projectPath);

    // Генерируем и выводим отчет
    const report = analyzer.generateReport(analysis);
    console.log(report);

    // Дополнительная статистика
    console.log('📊 ДОПОЛНИТЕЛЬНАЯ СТАТИСТИКА:');
    console.log(`   Общее время выполнения: ${Date.now() - startTime}ms`);
    console.log(`   Проанализировано фреймворков: ${analysis.frameworks.length}`);
    console.log(
      `   Успешных анализаторов: ${analysis.frameworks.filter(f => f.configured).length}`
    );
    console.log(
      `   Общее количество тестов: ${analysis.frameworks.reduce((sum, f) => sum + f.testsCount, 0)}`
    );
    console.log('');

    // Оценка готовности
    console.log('🎯 ОЦЕНКА ГОТОВНОСТИ К PHASE 4:');
    if (analysis.overallScore >= 70) {
      console.log('   ✅ Готов к интеграции с AnalysisOrchestrator');
      console.log('   ✅ Можно переходить к Phase 4');
    } else if (analysis.overallScore >= 50) {
      console.log('   ⚠️  Частично готов, требуются улучшения');
      console.log('   ⚠️  Рекомендуется улучшить перед Phase 4');
    } else {
      console.log('   ❌ Не готов к Phase 4');
      console.log('   ❌ Требуются критические улучшения');
    }

    console.log('');
    console.log('='.repeat(80));
    console.log(
      `🏆 PHASE 3 ЗАВЕРШЕНА: ${analysis.overallScore}/100 (${analysis.overallStatus.toUpperCase()})`
    );
    console.log('='.repeat(80));

    return analysis;
  } catch (error) {
    console.error('❌ ОШИБКА Phase 3:', error);
    console.error('Стек ошибки:', error.stack);
    throw error;
  }
}

// Запуск теста
if (import.meta.url === `file://${process.argv[1]}`) {
  testUnifiedTestingAnalyzer()
    .then(result => {
      console.log('✅ Тест UnifiedTestingAnalyzer завершен успешно');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Тест UnifiedTestingAnalyzer завершен с ошибкой:', error.message);
      process.exit(1);
    });
}
